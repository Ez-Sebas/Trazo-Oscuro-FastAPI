from typing import Annotated, Optional
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, Query, Path
from sqlalchemy import or_
from sqlalchemy.orm import Session, joinedload

from ..database import get_db
from ..models import PQR, Usuario
from ..schemas import PQRCreate, PQRResponder
from ..auth import obtener_usuario_actual, requerir_roles

router = APIRouter(prefix="/api/pqr", tags=["PQR"])


def _pqr_a_dict(pqr: PQR) -> dict:
    return {
        "id_pqr": pqr.id_pqr,
        "cliente_nombre": f"{pqr.cliente.nombres} {pqr.cliente.apellidos}",
        "cliente_email": pqr.cliente.email,
        "usuario_responde_nombre": (
            f"{pqr.usuario_responde.nombres} {pqr.usuario_responde.apellidos}" if pqr.usuario_responde else None
        ),
        "tipo": pqr.tipo,
        "asunto": pqr.asunto,
        "descripcion": pqr.descripcion,
        "respuesta": pqr.respuesta,
        "estado": pqr.estado,
        "fecha_creacion": pqr.fecha_creacion.isoformat() if pqr.fecha_creacion else None,
        "fecha_respuesta": pqr.fecha_respuesta.isoformat() if pqr.fecha_respuesta else None,
    }


# ============================
# CLIENTE
# ============================

@router.post("", status_code=201)
def crear_pqr(datos: PQRCreate, usuario_actual: Usuario = Depends(obtener_usuario_actual), db: Session = Depends(get_db)):
    nueva = PQR(
        id_cliente=usuario_actual.id_usuario, tipo=datos.tipo,
        asunto=datos.asunto.strip(), descripcion=datos.descripcion.strip(), estado="pendiente",
    )
    db.add(nueva)
    db.commit()
    db.refresh(nueva)
    return {"success": True, "message": "Tu solicitud fue registrada. Te responderemos pronto.", "id_pqr": nueva.id_pqr}


@router.get("/mis-pqr")
def obtener_mis_pqr(usuario_actual: Usuario = Depends(obtener_usuario_actual), db: Session = Depends(get_db)):
    pqrs = (
        db.query(PQR).options(joinedload(PQR.cliente), joinedload(PQR.usuario_responde))
        .filter(PQR.id_cliente == usuario_actual.id_usuario)
        .order_by(PQR.fecha_creacion.desc()).all()
    )
    return {"success": True, "pqrs": [_pqr_a_dict(p) for p in pqrs]}


@router.patch("/{id_pqr}/cerrar")
def cerrar_mi_pqr(id_pqr: Annotated[int, Path(ge=1, description="Identificador de la PQR")], usuario_actual: Usuario = Depends(obtener_usuario_actual), db: Session = Depends(get_db)):
    pqr = db.query(PQR).filter(PQR.id_pqr == id_pqr).first()
    if not pqr:
        raise HTTPException(status_code=404, detail="PQR no encontrada.")
    if pqr.id_cliente != usuario_actual.id_usuario:
        raise HTTPException(status_code=403, detail="Esta solicitud no te pertenece.")
    if pqr.estado != "respondida":
        raise HTTPException(status_code=400, detail="Solo puedes cerrar una solicitud que ya fue respondida.")

    pqr.estado = "cerrada"
    db.commit()
    return {"success": True, "message": "Gracias, tu solicitud fue cerrada."}


# ============================
# ADMINISTRADOR
# ============================

@router.get("", dependencies=[Depends(requerir_roles("Administrador"))])
def listar_pqr(
    busqueda: Optional[str] = Query(None),
    tipo: Optional[str] = Query(None),
    estado: Optional[str] = Query(None),
    pagina: int = Query(1, ge=1),
    por_pagina: int = Query(15, ge=1, le=100),
    db: Session = Depends(get_db),
):
    query = db.query(PQR).options(joinedload(PQR.cliente), joinedload(PQR.usuario_responde))

    if busqueda:
        texto = f"%{busqueda}%"
        query = query.join(PQR.cliente).filter(
            or_(Usuario.nombres.ilike(texto), Usuario.apellidos.ilike(texto), PQR.asunto.ilike(texto))
        )
    if tipo:
        query = query.filter(PQR.tipo == tipo)
    if estado:
        query = query.filter(PQR.estado == estado)

    total = query.count()
    pqrs = query.order_by(PQR.fecha_creacion.desc()).offset((pagina - 1) * por_pagina).limit(por_pagina).all()

    return {
        "success": True, "pqrs": [_pqr_a_dict(p) for p in pqrs],
        "total": total, "pagina": pagina,
        "total_paginas": max(1, (total + por_pagina - 1) // por_pagina),
    }


@router.patch("/{id_pqr}/en-proceso", dependencies=[Depends(requerir_roles("Administrador"))])
def marcar_en_proceso(id_pqr: Annotated[int, Path(ge=1, description="Identificador de la PQR")], usuario_actual: Usuario = Depends(obtener_usuario_actual), db: Session = Depends(get_db)):
    pqr = db.query(PQR).filter(PQR.id_pqr == id_pqr).first()
    if not pqr:
        raise HTTPException(status_code=404, detail="PQR no encontrada.")
    if pqr.estado != "pendiente":
        raise HTTPException(status_code=400, detail="Solo una PQR pendiente puede pasar a 'en proceso'.")

    pqr.estado = "en_proceso"
    pqr.id_usuario_responde = usuario_actual.id_usuario
    db.commit()
    return {"success": True, "message": "PQR marcada como en proceso."}


@router.patch("/{id_pqr}/responder", dependencies=[Depends(requerir_roles("Administrador"))])
def responder_pqr(
    id_pqr: Annotated[int, Path(ge=1, description="Identificador de la PQR")], datos: PQRResponder,
    usuario_actual: Usuario = Depends(obtener_usuario_actual),
    db: Session = Depends(get_db),
):
    pqr = db.query(PQR).filter(PQR.id_pqr == id_pqr).first()
    if not pqr:
        raise HTTPException(status_code=404, detail="PQR no encontrada.")
    if pqr.estado == "cerrada":
        raise HTTPException(status_code=400, detail="No se puede responder una PQR ya cerrada.")

    pqr.respuesta = datos.respuesta.strip()
    pqr.estado = "respondida"
    pqr.id_usuario_responde = usuario_actual.id_usuario
    pqr.fecha_respuesta = datetime.utcnow()
    db.commit()
    return {"success": True, "message": "Respuesta enviada correctamente."}