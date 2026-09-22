import os

# Se fija ANTES de importar cualquier módulo de la app: dotenv (usado en
# database.py) no sobreescribe variables que ya existen en el entorno, así
# que esta línea garantiza que las pruebas usen SQLite en memoria, nunca la
# base de datos real de PostgreSQL.
os.environ["DATABASE_URL"] = "sqlite:///:memory:"
os.environ["SECRET_KEY"] = "clave_secreta_para_pruebas"
os.environ["ALGORITHM"] = "HS256"
os.environ["ACCESS_TOKEN_EXPIRE_MINUTES"] = "60"

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.pool import StaticPool
from sqlalchemy.orm import sessionmaker

from app.database import Base, get_db
from app.main import app
from app.models import Rol

engine = create_engine(
    "sqlite:///:memory:",
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


@pytest.fixture()
def db_session():
    Base.metadata.create_all(bind=engine)
    session = TestingSessionLocal()

    session.add_all([
        Rol(id_rol=1, nombre="Administrador"),
        Rol(id_rol=2, nombre="Empleado"),
        Rol(id_rol=3, nombre="Cliente"),
    ])
    session.commit()

    yield session

    session.close()
    Base.metadata.drop_all(bind=engine)


@pytest.fixture()
def client(db_session):
    def _override_get_db():
        try:
            yield db_session
        finally:
            pass

    app.dependency_overrides[get_db] = _override_get_db
    with TestClient(app) as c:
        yield c
    app.dependency_overrides.clear()


@pytest.fixture()
def usuario_registrado(client):
    payload = {
        "nombres": "Juan", "apellidos": "Pérez", "tipo_documento": "CC",
        "numero_documento": "1234567890", "direccion": "Calle 1 #2-3",
        "telefono": "3001234567", "email": "juan@test.com", "password": "Clave1234",
    }
    respuesta = client.post("/api/usuarios/registro", json=payload)
    return {"payload": payload, "respuesta": respuesta.json()}


@pytest.fixture()
def token_cliente(client, usuario_registrado):
    respuesta = client.post("/api/auth/login", json={
        "email": usuario_registrado["payload"]["email"],
        "password": usuario_registrado["payload"]["password"],
    })
    return respuesta.json()["token"]


@pytest.fixture()
def token_admin(client, usuario_registrado, db_session):
    from app.models import Usuario
    usuario = db_session.query(Usuario).filter(
        Usuario.email == usuario_registrado["payload"]["email"]
    ).first()
    usuario.id_rol = 1
    db_session.commit()

    respuesta = client.post("/api/auth/login", json={
        "email": usuario_registrado["payload"]["email"],
        "password": usuario_registrado["payload"]["password"],
    })
    return respuesta.json()["token"]