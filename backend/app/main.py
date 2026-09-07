from fastapi import FastAPI
from .database import Base, engine
from .routes import auth, usuarios

Base.metadata.create_all(bind=engine)

app = FastAPI(title="API Trazo Oscuro", version="1.0.0")

app.include_router(auth.router)
app.include_router(usuarios.router)


@app.get("/")
def inicio():
    return {"success": True, "message": "API Trazo Oscuro funcionando correctamente."}