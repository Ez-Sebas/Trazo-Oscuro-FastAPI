import os
from datetime import datetime, timedelta
from typing import Optional

import bcrypt
from jose import JWTError, jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session

from .database import get_db
from .models import Usuario

SECRET_KEY = os.getenv("SECRET_KEY")
ALGORITHM = os.getenv("ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", 480))

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/login", auto_error=False)


# ============================
# HASHING DE CONTRASEÑAS
# ============================

def hash_password(password: str) -> str:
    """
    Genera un hash seguro de la contraseña.
    bcrypt trabaja con un máximo de 72 bytes.
    """
    password_bytes = password.encode("utf-8")
    if len(password_bytes) > 72:
        raise ValueError("La contraseña no puede superar los 72 caracteres.")

    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(password_bytes, salt)
    return hashed.decode("utf-8")


def verify_password(password: str, hashed_password: str) -> bool:
    password_bytes = password.encode("utf-8")
    hashed_bytes = hashed_password.encode("utf-8")
    return bcrypt.checkpw(password_bytes, hashed_bytes)


# ============================
# JWT
# ============================

def crear_access_token(data: dict) -> str:
    to_encode = data.copy()
    expira = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expira})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


def crear_token_recuperacion(email: str) -> str:
    """Token de corta duración, solo para el flujo de recuperar contraseña."""
    to_encode = {"sub": email, "tipo": "recuperacion"}
    expira = datetime.utcnow() + timedelta(minutes=30)
    to_encode.update({"exp": expira})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


def verificar_token_recuperacion(token: str) -> str:
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        if payload.get("tipo") != "recuperacion":
            raise HTTPException(status_code=400, detail="Token inválido.")
        return payload.get("sub")
    except JWTError:
        raise HTTPException(status_code=400, detail="Token inválido o expirado.")


# ============================
# DEPENDENCIAS DE AUTENTICACIÓN
# ============================

def obtener_usuario_actual(
    token: Optional[str] = Depends(oauth2_scheme),
    db: Session = Depends(get_db),
) -> Usuario:
    credenciales_invalidas = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="No se pudo validar la sesión. Inicia sesión nuevamente.",
    )

    if token is None:
        raise credenciales_invalidas

    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        id_usuario: str = payload.get("sub")
        if id_usuario is None:
            raise credenciales_invalidas
    except JWTError:
        raise credenciales_invalidas

    usuario = db.query(Usuario).filter(Usuario.id_usuario == int(id_usuario)).first()
    if usuario is None:
        raise credenciales_invalidas

    if usuario.estado == "inactivo":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Tu cuenta se encuentra inactiva.",
        )

    return usuario


def requerir_roles(*roles_permitidos: str):
    """
    Uso: Depends(requerir_roles("Administrador"))
    Uso: Depends(requerir_roles("Administrador", "Empleado"))
    """

    def verificador(usuario: Usuario = Depends(obtener_usuario_actual)) -> Usuario:
        if usuario.rol.nombre not in roles_permitidos:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="No tienes permisos para acceder a este recurso.",
            )
        return usuario

    return verificador