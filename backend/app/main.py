import os

from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles

from .database import Base, engine
from .routes import auth, usuarios, productos, servicios, citas, ventas, facturas, reportes, dashboard, pqr, chat

Base.metadata.create_all(bind=engine)

tags_metadata = [
    {"name": "Autenticación", "description": "Login, recuperación y restablecimiento de contraseña."},
    {"name": "Usuarios", "description": "Registro público, perfil propio y administración de usuarios."},
    {"name": "Productos", "description": "Catálogo de productos y su gestión administrativa."},
    {"name": "Servicios", "description": "Catálogo de servicios de tatuaje y su gestión administrativa."},
    {"name": "Citas", "description": "Reserva, confirmación y gestión de citas."},
    {"name": "Ventas", "description": "Checkout con Stripe, ventas de mostrador e historial."},
    {"name": "Facturas", "description": "Generación, consulta y descarga de facturas en PDF."},
    {"name": "Reportes", "description": "Reportes diarios de ventas y su exportación a PDF/Excel."},
    {"name": "Dashboard", "description": "Indicadores y gráficos diferenciados por rol."},
    {"name": "PQR", "description": "Peticiones, quejas y reclamos de clientes."},
    {"name": "Chatbot", "description": "Asistente virtual impulsado por IA (Groq, compatible con OpenAI)."},
]

app = FastAPI(
    title="API Trazo Oscuro",
    description="Backend Full Stack desarrollado con FastAPI y Python para el estudio de tatuajes Trazo Oscuro.",
    version="1.0.0",
    openapi_tags=tags_metadata,
)

# Orígenes permitidos. En local basta con el valor por defecto; en
# producción se define CORS_ORIGINS con la URL del frontend desplegado
# (varias separadas por coma). Sin esto, el navegador bloquea la API.
ORIGENES_PERMITIDOS = [
    origen.strip()
    for origen in os.getenv("CORS_ORIGINS", "http://localhost:5173,http://127.0.0.1:5173").split(",")
    if origen.strip()
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=ORIGENES_PERMITIDOS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# La carpeta se crea si no existe: en un despliegue nuevo el directorio
# todavía no está y StaticFiles reventaría en el arranque.
CARPETA_ESTATICOS = os.getenv("STATIC_DIR", "static")
os.makedirs(os.path.join(CARPETA_ESTATICOS, "uploads", "citas"), exist_ok=True)
app.mount("/static", StaticFiles(directory=CARPETA_ESTATICOS), name="static")


@app.exception_handler(RequestValidationError)
def manejar_errores_de_validacion(request: Request, exc: RequestValidationError):
    """
    Unifica los errores de validación con el resto de la API.

    Por defecto FastAPI devuelve 422 y una lista de objetos técnicos. Aquí se
    traduce a la misma forma que usan los demás endpoints —400 con un
    'detail' legible— para que el frontend muestre siempre un mensaje claro.
    """
    mensajes = []
    for error in exc.errors():
        # "Value error, El teléfono debe..." -> "El teléfono debe..."
        mensaje = str(error.get("msg", "")).removeprefix("Value error, ")
        campo = next(
            (str(parte) for parte in reversed(error.get("loc", ())) if isinstance(parte, str) and parte != "body"),
            None,
        )
        mensajes.append(f"{campo}: {mensaje}" if campo and campo not in mensaje else mensaje)

    return JSONResponse(
        status_code=400,
        content={"success": False, "detail": " ".join(mensajes) or "Los datos enviados no son válidos."},
    )

app.include_router(auth.router)
app.include_router(usuarios.router)
app.include_router(productos.router)
app.include_router(servicios.router)
app.include_router(citas.router)
app.include_router(ventas.router)
app.include_router(facturas.router)
app.include_router(reportes.router)
app.include_router(dashboard.router)
app.include_router(pqr.router)
app.include_router(chat.router)


@app.get("/")
def inicio():
    return {"success": True, "message": "API Trazo Oscuro funcionando correctamente."}