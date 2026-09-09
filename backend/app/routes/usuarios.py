import re
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload

from ..database import get_db
from ..models import Usuario, Rol
from ..schemas import (
    UsuarioCreate,
    UsuarioAdminCreate,
    UsuarioUpdate,
    UsuarioPerfilUpdate,
    UsuarioEstadoUpdate,
    UsuarioRolUpdate,
    UsuarioResponse,
    UsuarioConRol,
)
from ..auth import hash_password, obtener_usuario_actual, requerir_roles

router = APIRouter(prefix="/api/usuarios", tags=["Usuarios"])

REGEX_SOLO_NUMEROS = re.compile(r"^[0-9]+$")
REGEX_TELEFONO = re.compile(r"^[0-9]{7,10}$")


def _con_rol(usuario: Usuario) -> dict:
    data = UsuarioResponse.model_validate(usuario).model_dump()
    data["rol"] = usuario.rol.nombre if usuario.rol else None
    return data


# ============================
# REGISTRO PÚBLICO (Cliente)
# ============================

@router.post("/registro", response_model=UsuarioResponse, status_code=201)
def registrar_usuario(usuario: UsuarioCreate, db: Session = Depends(get_db)):

    if not REGEX_SOLO_NUMEROS.match(usuario.numero_documento):
        raise HTTPException(
            status_code=400,
            detail="El número de documento solo puede contener números.",
        )

    if not REGEX_TELEFONO.match(usuario.telefono):
        raise HTTPException(
            status_code=400,
            detail="El teléfono debe tener entre 7 y 10 dígitos numéricos.",
        )

    email_normalizado = usuario.email.lower().strip()

    if db.query(Usuario).filter(Usuario.email == email_normalizado).first():
        raise HTTPException(
            status_code=409, detail="El correo electrónico ya está registrado."
        )

    if (
        db.query(Usuario)
        .filter(Usuario.numero_documento == usuario.numero_documento)
        .first()
    ):
        raise HTTPException(
            status_code=409, detail="El número de documento ya está registrado."
        )

    rol_cliente = db.query(Rol).filter(Rol.nombre == "Cliente").first()
    if not rol_cliente:
        raise HTTPException(
            status_code=500, detail="El rol Cliente no existe en la base de datos."
        )

    try:
        password_hash = hash_password(usuario.password)
    except ValueError as error:
        raise HTTPException(status_code=400, detail=str(error))

    nuevo_usuario = Usuario(
        id_rol=rol_cliente.id_rol,
        nombres=usuario.nombres.strip(),
        apellidos=usuario.apellidos.strip(),
        tipo_documento=usuario.tipo_documento,
        numero_documento=usuario.numero_documento.strip(),
        direccion=usuario.direccion.strip(),
        telefono=usuario.telefono.strip(),
        email=email_normalizado,
        password_hash=password_hash,
        estado="activo",
    )

    db.add(nuevo_usuario)
    db.commit()
    db.refresh(nuevo_usuario)

    return nuevo_usuario


# ============================
# PERFIL PROPIO (cualquier usuario autenticado)
# ============================

@router.get("/perfil/me")
def obtener_mi_perfil(
    usuario_actual: Usuario = Depends(obtener_usuario_actual),
    db: Session = Depends(get_db),
):
    usuario = (
        db.query(Usuario)
        .options(joinedload(Usuario.rol))
        .filter(Usuario.id_usuario == usuario_actual.id_usuario)
        .first()
    )
    return {"success": True, "usuario": _con_rol(usuario)}


@router.put("/perfil/me")
def actualizar_mi_perfil(
    datos: UsuarioPerfilUpdate,
    usuario_actual: Usuario = Depends(obtener_usuario_actual),
    db: Session = Depends(get_db),
):
    if not REGEX_SOLO_NUMEROS.match(datos.numero_documento):
        raise HTTPException(
            status_code=400, detail="El documento solo puede contener números."
        )
    if not REGEX_TELEFONO.match(datos.telefono):
        raise HTTPException(
            status_code=400,
            detail="El teléfono debe tener entre 7 y 10 dígitos numéricos.",
        )

    email_normalizado = datos.email.lower().strip()

    correo_en_uso = (
        db.query(Usuario)
        .filter(
            Usuario.email == email_normalizado,
            Usuario.id_usuario != usuario_actual.id_usuario,
        )
        .first()
    )
    if correo_en_uso:
        raise HTTPException(
            status_code=409, detail="Ese correo ya está en uso por otra cuenta."
        )

    documento_en_uso = (
        db.query(Usuario)
        .filter(
            Usuario.numero_documento == datos.numero_documento,
            Usuario.id_usuario != usuario_actual.id_usuario,
        )
        .first()
    )
    if documento_en_uso:
        raise HTTPException(
            status_code=409, detail="Ese documento ya está en uso por otra cuenta."
        )

    usuario = (
        db.query(Usuario).filter(Usuario.id_usuario == usuario_actual.id_usuario).first()
    )
    usuario.nombres = datos.nombres.strip()
    usuario.apellidos = datos.apellidos.strip()
    usuario.direccion = datos.direccion.strip()
    usuario.telefono = datos.telefono.strip()
    usuario.tipo_documento = datos.tipo_documento
    usuario.numero_documento = datos.numero_documento.strip()
    usuario.email = email_normalizado

    db.commit()
    db.refresh(usuario)

    return {"success": True, "usuario": _con_rol(usuario)}


# ============================
# ADMINISTRACIÓN (solo Administrador)
# ============================

@router.get("", dependencies=[Depends(requerir_roles("Administrador"))])
def listar_usuarios(db: Session = Depends(get_db)):
    usuarios = (
        db.query(Usuario)
        .options(joinedload(Usuario.rol))
        .order_by(Usuario.id_usuario.desc())
        .all()
    )
    return {"success": True, "usuarios": [_con_rol(u) for u in usuarios]}


@router.get("/empleados")
def listar_empleados(db: Session = Depends(get_db)):
    empleados = (
        db.query(Usuario)
        .join(Rol, Usuario.id_rol == Rol.id_rol)
        .options(joinedload(Usuario.rol))
        .filter(Rol.nombre == "Empleado")
        .order_by(Usuario.id_usuario.desc())
        .all()
    )

    return {
        "success": True,
        "empleados": [_con_rol(empleado) for empleado in empleados]
    }


@router.get("/{id_usuario}", dependencies=[Depends(requerir_roles("Administrador"))])
def obtener_usuario(id_usuario: int, db: Session = Depends(get_db)):
    usuario = (
        db.query(Usuario)
        .options(joinedload(Usuario.rol))
        .filter(Usuario.id_usuario == id_usuario)
        .first()
    )
    if not usuario:
        raise HTTPException(status_code=404, detail="Usuario no encontrado.")
    return {"success": True, "usuario": _con_rol(usuario)}


@router.post(
    "", status_code=201, dependencies=[Depends(requerir_roles("Administrador"))]
)
def crear_usuario_admin(datos: UsuarioAdminCreate, db: Session = Depends(get_db)):
    if not REGEX_SOLO_NUMEROS.match(datos.numero_documento):
        raise HTTPException(
            status_code=400, detail="El documento solo puede contener números."
        )
    if not REGEX_TELEFONO.match(datos.telefono):
        raise HTTPException(
            status_code=400,
            detail="El teléfono debe tener entre 7 y 10 dígitos numéricos.",
        )

    email_normalizado = datos.email.lower().strip()

    if db.query(Usuario).filter(Usuario.email == email_normalizado).first():
        raise HTTPException(status_code=409, detail="El correo ya está registrado.")

    if (
        db.query(Usuario)
        .filter(Usuario.numero_documento == datos.numero_documento)
        .first()
    ):
        raise HTTPException(status_code=409, detail="El documento ya está registrado.")

    rol = db.query(Rol).filter(Rol.id_rol == datos.id_rol).first()
    if not rol:
        raise HTTPException(status_code=400, detail="El rol seleccionado no existe.")

    nuevo = Usuario(
        id_rol=datos.id_rol,
        nombres=datos.nombres.strip(),
        apellidos=datos.apellidos.strip(),
        tipo_documento=datos.tipo_documento,
        numero_documento=datos.numero_documento.strip(),
        direccion=datos.direccion.strip(),
        telefono=datos.telefono.strip(),
        email=email_normalizado,
        password_hash=hash_password(datos.password),
        estado="activo",
    )
    db.add(nuevo)
    db.commit()
    db.refresh(nuevo)

    return {
        "success": True,
        "message": "Usuario creado correctamente.",
        "id_usuario": nuevo.id_usuario,
    }


@router.put("/{id_usuario}", dependencies=[Depends(requerir_roles("Administrador"))])
def editar_usuario(id_usuario: int, datos: UsuarioUpdate, db: Session = Depends(get_db)):
    if not REGEX_SOLO_NUMEROS.match(datos.numero_documento):
        raise HTTPException(
            status_code=400, detail="El documento solo puede contener números."
        )
    if not REGEX_TELEFONO.match(datos.telefono):
        raise HTTPException(
            status_code=400,
            detail="El teléfono debe tener entre 7 y 10 dígitos numéricos.",
        )

    usuario = db.query(Usuario).filter(Usuario.id_usuario == id_usuario).first()
    if not usuario:
        raise HTTPException(status_code=404, detail="Usuario no encontrado.")

    usuario.nombres = datos.nombres.strip()
    usuario.apellidos = datos.apellidos.strip()
    usuario.direccion = datos.direccion.strip()
    usuario.telefono = datos.telefono.strip()
    usuario.tipo_documento = datos.tipo_documento
    usuario.numero_documento = datos.numero_documento.strip()

    db.commit()

    return {"success": True, "message": "Usuario actualizado correctamente."}


@router.patch(
    "/{id_usuario}/estado", dependencies=[Depends(requerir_roles("Administrador"))]
)
def cambiar_estado_usuario(
    id_usuario: int, datos: UsuarioEstadoUpdate, db: Session = Depends(get_db)
):
    usuario = db.query(Usuario).filter(Usuario.id_usuario == id_usuario).first()
    if not usuario:
        raise HTTPException(status_code=404, detail="Usuario no encontrado.")

    usuario.estado = datos.estado
    db.commit()

    return {
        "success": True,
        "message": f"Usuario marcado como {datos.estado} correctamente.",
    }


@router.patch(
    "/{id_usuario}/rol", dependencies=[Depends(requerir_roles("Administrador"))]
)
def cambiar_rol_usuario(
    id_usuario: int, datos: UsuarioRolUpdate, db: Session = Depends(get_db)
):
    usuario = db.query(Usuario).filter(Usuario.id_usuario == id_usuario).first()
    if not usuario:
        raise HTTPException(status_code=404, detail="Usuario no encontrado.")

    rol = db.query(Rol).filter(Rol.id_rol == datos.id_rol).first()
    if not rol:
        raise HTTPException(status_code=400, detail="El rol seleccionado no existe.")

    usuario.id_rol = datos.id_rol
    db.commit()

    return {"success": True, "message": "Rol actualizado correctamente."}


@router.delete("/{id_usuario}", dependencies=[Depends(requerir_roles("Administrador"))])
def eliminar_usuario(id_usuario: int, db: Session = Depends(get_db)):
    usuario = db.query(Usuario).filter(Usuario.id_usuario == id_usuario).first()
    if not usuario:
        raise HTTPException(status_code=404, detail="Usuario no encontrado.")

    db.delete(usuario)
    db.commit()

    return {"success": True, "message": "Usuario eliminado correctamente."}