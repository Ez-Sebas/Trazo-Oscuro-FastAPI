from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload

from ..database import get_db
from ..models import Usuario
from ..schemas import (
    LoginRequest,
    TokenResponse,
    SolicitarRecuperacion,
    RestablecerPassword,
)
from ..auth import (
    verify_password,
    hash_password,
    crear_access_token,
    crear_token_recuperacion,
    verificar_token_recuperacion,
)
from ..email_utils import enviar_correo_recuperacion, construir_enlace_recuperacion

from datetime import datetime

router = APIRouter(prefix="/api/auth", tags=["Autenticación"])


@router.post("/login", response_model=TokenResponse)
def iniciar_sesion(credenciales: LoginRequest, db: Session = Depends(get_db)
):
    email_normalizado = credenciales.email.lower().strip()

    usuario = (
        db.query(Usuario)
        .options(joinedload(Usuario.rol))
        .filter(Usuario.email == email_normalizado)
        .first()
    )

    if not usuario:
        raise HTTPException(
            status_code=401, detail="No existe una cuenta con este correo."
        )

    if usuario.estado == "inactivo":
        raise HTTPException(
            status_code=403,
            detail="Esta cuenta se encuentra inactiva. Contacta al estudio.",
        )

    if not verify_password(credenciales.password, usuario.password_hash):
        raise HTTPException(status_code=401, detail="Contraseña incorrecta.")

    token = crear_access_token(
        data={
            "sub": str(usuario.id_usuario),
            "email": usuario.email,
            "role": usuario.rol.nombre,
        }
    )

    usuario.ultimo_acceso = datetime.utcnow()
    db.commit()

    return {
        "success": True,
        "message": "Inicio de sesión exitoso.",
        "token": token,
        "usuario": {
            "id": usuario.id_usuario,
            "nombres": usuario.nombres,
            "apellidos": usuario.apellidos,
            "email": usuario.email,
            "rol": usuario.rol.nombre,
        },
    }


@router.post("/recuperar-password")
def solicitar_recuperacion(
    datos: SolicitarRecuperacion, db: Session = Depends(get_db)
):    
    email_normalizado = datos.email.lower().strip()
    usuario = db.query(Usuario).filter(Usuario.email == email_normalizado).first()

    respuesta_generica = {
        "success": True,
        "message": "Si el correo está registrado, recibirás instrucciones para restablecer tu contraseña.",
    }

    if not usuario or usuario.estado == "inactivo":
        return respuesta_generica

    token = crear_token_recuperacion(usuario.email)

    # Se registra en la consola del servidor para poder probar el flujo
    # aunque el envío real de correo falle momentáneamente. Nunca se expone
    # este enlace en la respuesta al frontend, solo queda en el log local.
    print(f"[EMAIL] Enlace de recuperación para {usuario.email}: {construir_enlace_recuperacion(token)}")

    enviado = enviar_correo_recuperacion(usuario.email, token)

    if not enviado:
        raise HTTPException(
            status_code=500,
            detail="No fue posible enviar el correo en este momento. Intenta más tarde.",
        )

    return respuesta_generica


@router.post("/restablecer-password")
def restablecer_password(datos: RestablecerPassword, db: Session = Depends(get_db)
):    
    email = verificar_token_recuperacion(datos.token)

    usuario = db.query(Usuario).filter(Usuario.email == email).first()
    if not usuario:
        raise HTTPException(status_code=404, detail="Usuario no encontrado.")

    usuario.password_hash = hash_password(datos.password)
    db.commit()

    return {"success": True, "message": "Tu contraseña fue actualizada correctamente."}