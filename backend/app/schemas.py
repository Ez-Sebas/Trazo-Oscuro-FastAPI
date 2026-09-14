from datetime import datetime, date, time
from typing import Optional, List
from pydantic import BaseModel, EmailStr, Field, ConfigDict


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


class CitaAsignarEmpleado(BaseModel):
    id_empleado: int
    

# ============================
# COMPRA
# ============================

class ItemCompra(BaseModel):
    id_producto: int
    nombre: str
    precio: float
    cantidad: int = Field(gt=0)


class CompraCreate(BaseModel):
    items: List[ItemCompra]
    total: float = Field(gt=0)


class CompraEstadoUpdate(BaseModel):
    estado: str = Field(pattern="^(pendiente|pagada|entregada|cancelada)$")