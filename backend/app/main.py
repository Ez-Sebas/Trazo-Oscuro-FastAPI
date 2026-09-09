from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from .database import Base, engine
from .routes import auth, usuarios, productos, servicios, citas, compras

Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="API Trazo Oscuro",
    description="Backend desarrollado con FastAPI y Python para el proyecto Trazo Oscuro.",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.mount("/static", StaticFiles(directory="static"), name="static")

app.include_router(auth.router)
app.include_router(usuarios.router)
app.include_router(productos.router)
app.include_router(servicios.router)
app.include_router(citas.router)
app.include_router(compras.router)


@app.get("/")
def inicio():
    return {"success": True, "message": "API Trazo Oscuro funcionando correctamente."}