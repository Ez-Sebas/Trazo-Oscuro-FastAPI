from datetime import datetime, date, time
from typing import Optional, List
from pydantic import BaseModel, EmailStr, Field, ConfigDict, field_validator, model_validator


# ============================
# USUARIO
# ============================

class UsuarioCreate(BaseModel):
    nombres: str = Field(min_length=2, max_length=50)
    apellidos: str = Field(min_length=2, max_length=50)
    tipo_documento: str = Field(min_length=2, max_length=5)
    numero_documento: str = Field(min_length=6, max_length=15)
    direccion: str = Field(min_length=5, max_length=100)
    telefono: str = Field(min_length=7, max_length=15)
    email: EmailStr
    password: str = Field(min_length=8, max_length=72)

    model_config = ConfigDict(json_schema_extra={
        "example": {
            "nombres": "Ana", "apellidos": "Gómez", "tipo_documento": "CC",
            "numero_documento": "1029384756", "direccion": "Calle 50 #20-10",
            "telefono": "3009998877", "email": "ana@ejemplo.com", "password": "Clave1234",
        }
    })

    @field_validator("numero_documento")
    @classmethod
    def documento_solo_numeros(cls, valor):
        if not valor.isdigit():
            raise ValueError("El número de documento solo puede contener dígitos.")
        return valor

    @field_validator("telefono")
    @classmethod
    def telefono_valido(cls, valor):
        if not (valor.isdigit() and 7 <= len(valor) <= 10):
            raise ValueError("El teléfono debe tener entre 7 y 10 dígitos numéricos.")
        return valor

    @field_validator("password")
    @classmethod
    def password_segura(cls, valor):
        if not any(c.isalpha() for c in valor) or not any(c.isdigit() for c in valor):
            raise ValueError("La contraseña debe combinar letras y números.")
        return valor


class UsuarioAdminCreate(UsuarioCreate):
    id_rol: int = Field(ge=1, le=3)


class UsuarioUpdate(BaseModel):
    nombres: str = Field(min_length=2, max_length=50)
    apellidos: str = Field(min_length=2, max_length=50)
    tipo_documento: str = Field(min_length=2, max_length=5)
    numero_documento: str = Field(min_length=6, max_length=15)
    direccion: str = Field(min_length=5, max_length=100)
    telefono: str = Field(min_length=7, max_length=15)


class UsuarioPerfilUpdate(UsuarioUpdate):
    email: EmailStr


class UsuarioEstadoUpdate(BaseModel):
    estado: str = Field(pattern="^(activo|inactivo)$")


class UsuarioRolUpdate(BaseModel):
    id_rol: int = Field(ge=1, le=3)


class UsuarioResponse(BaseModel):
    id_usuario: int
    id_rol: int
    nombres: str
    apellidos: str
    tipo_documento: str
    numero_documento: str
    direccion: str
    telefono: str
    email: EmailStr
    foto: Optional[str] = None
    estado: str
    ultimo_acceso: Optional[datetime] = None
    fecha_creacion: Optional[datetime] = None
    fecha_actualizacion: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


class UsuarioConRol(UsuarioResponse):
    rol: Optional[str] = None


# ============================
# AUTH
# ============================

class LoginRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=1, max_length=72)

    model_config = ConfigDict(json_schema_extra={
        "example": {"email": "cliente@ejemplo.com", "password": "Clave1234"}
    })


class TokenResponse(BaseModel):
    success: bool
    message: str
    token: str
    usuario: dict


class SolicitarRecuperacion(BaseModel):
    email: EmailStr


class RestablecerPassword(BaseModel):
    token: str
    password: str = Field(min_length=8, max_length=72)


# ============================
# PRODUCTO
# ============================

class ProductoBase(BaseModel):
    id_categoria_producto: int
    nombre: str = Field(min_length=2, max_length=60)
    descripcion: str = Field(min_length=5, max_length=255)
    precio: float = Field(gt=0)
    stock: int = Field(ge=0)
    imagen_url: Optional[str] = Field(default=None, max_length=255)


class ProductoCreate(ProductoBase):
    pass


class ProductoUpdate(ProductoBase):
    pass


class ProductoEstadoUpdate(BaseModel):
    estado: str = Field(pattern="^(activo|inactivo)$")


class ProductoResponse(BaseModel):
    id_producto: int
    id_categoria_producto: int
    categoria: Optional[str] = None
    nombre: str
    descripcion: str
    precio: float
    stock: int
    imagen_url: Optional[str] = None
    estado: str
    fecha_creacion: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


# ============================
# SERVICIO
# ============================

class ServicioBase(BaseModel):
    id_categoria_servicio: int
    nombre: str = Field(min_length=2, max_length=60)
    descripcion: str = Field(min_length=5, max_length=255)
    precio: float = Field(gt=0)
    duracion_estimada: str = Field(min_length=2, max_length=30)
    imagen_url: Optional[str] = Field(default=None, max_length=255)


class ServicioCreate(ServicioBase):
    pass


class ServicioUpdate(ServicioBase):
    pass


class ServicioEstadoUpdate(BaseModel):
    estado: str = Field(pattern="^(activo|inactivo)$")


class ServicioResponse(BaseModel):
    id_servicio: int
    id_categoria_servicio: int
    categoria: Optional[str] = None
    nombre: str
    descripcion: str
    precio: float
    duracion_estimada: str
    imagen_url: Optional[str] = None
    estado: str
    fecha_creacion: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


# ============================
# CITA
# ============================

class CitaEstadoUpdate(BaseModel):
    estado: str = Field(pattern="^(pendiente|confirmada|realizada|cancelada)$")


class CitaPagoUpdate(BaseModel):
    estado_pago: str = Field(pattern="^(pendiente|pagada)$")


class CitaAsignarEmpleado(BaseModel):
    id_empleado: int


# ============================
# VENTAS
# ============================

class ItemVenta(BaseModel):
    tipo_item: str = Field(pattern="^(producto|servicio)$")
    id_producto: Optional[int] = None
    id_servicio: Optional[int] = None
    cantidad: int = Field(gt=0)

    @model_validator(mode="after")
    def validar_referencia_item(self):
        if self.tipo_item == "producto" and not self.id_producto:
            raise ValueError("Debes indicar id_producto cuando tipo_item es 'producto'.")
        if self.tipo_item == "servicio" and not self.id_servicio:
            raise ValueError("Debes indicar id_servicio cuando tipo_item es 'servicio'.")
        return self


class VentaCreate(BaseModel):
    id_cliente: Optional[int] = None
    origen: str = Field(default="web_cliente", pattern="^(web_cliente|mostrador)$")
    descuento: float = Field(default=0, ge=0)
    items: List[ItemVenta]

    @field_validator("items")
    @classmethod
    def items_no_vacios(cls, valor):
        if not valor:
            raise ValueError("La venta debe tener al menos un ítem.")
        return valor


class VentaEstadoUpdate(BaseModel):
    estado: str = Field(pattern="^(pendiente|pagada|entregada|cancelada)$")


class DetalleVentaResponse(BaseModel):
    id_detalle: int
    tipo_item: str
    nombre_item: str
    cantidad: int
    precio_unitario: float
    subtotal_item: float

    model_config = ConfigDict(from_attributes=True)


class VentaResponse(BaseModel):
    id_venta: int
    cliente_nombre: str
    usuario_registra_nombre: Optional[str] = None
    origen: str
    subtotal: float
    descuento: float
    iva: float
    total: float
    estado: str
    estado_pago: str
    fecha_creacion: Optional[datetime] = None
    detalles: List[DetalleVentaResponse] = []


# ============================
# FACTURAS
# ============================

class DetalleFacturaResponse(BaseModel):
    id_detalle_factura: int
    nombre_item: str
    cantidad: int
    precio_unitario: float
    subtotal_item: float

    model_config = ConfigDict(from_attributes=True)


class FacturaResponse(BaseModel):
    id_factura: int
    id_venta: int
    numero_factura: str
    cliente_nombre: str
    subtotal: float
    descuento: float
    iva: float
    total: float
    estado: str
    fecha_generacion: Optional[datetime] = None
    detalles: List[DetalleFacturaResponse] = []


# ============================
# PQR
# ============================

class PQRCreate(BaseModel):
    tipo: str = Field(pattern="^(peticion|queja|reclamo|sugerencia)$")
    asunto: str = Field(min_length=5, max_length=100)
    descripcion: str = Field(min_length=10, max_length=500)


class PQRResponder(BaseModel):
    respuesta: str = Field(min_length=5, max_length=500)


class PQREstadoUpdate(BaseModel):
    estado: str = Field(pattern="^(pendiente|en_proceso|respondida|cerrada)$")


class PQRResponse(BaseModel):
    id_pqr: int
    cliente_nombre: str
    tipo: str
    asunto: str
    descripcion: str
    respuesta: Optional[str] = None
    estado: str
    fecha_creacion: Optional[datetime] = None
    fecha_respuesta: Optional[datetime] = None


# ============================
# CHATBOT
# ============================

class MensajeChatCreate(BaseModel):
    session_id: str = Field(min_length=5, max_length=100)
    mensaje: str = Field(min_length=1, max_length=1000)


class MensajeResponse(BaseModel):
    remitente: str
    contenido: str
    fecha_creacion: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)
    

class ConfirmarCitaRequest(BaseModel):
    token: str