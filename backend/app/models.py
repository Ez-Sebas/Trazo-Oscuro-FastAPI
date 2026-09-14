from sqlalchemy import (
    Column,
    Integer,
    String,
    Text,
    Enum,
    DECIMAL,
    Date,
    Time,
    DateTime,
    TIMESTAMP,
    ForeignKey,
)
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from .database import Base


class Rol(Base):
    __tablename__ = "roles"

    id_rol = Column(Integer, primary_key=True, index=True, autoincrement=True)
    nombre = Column(String(30), unique=True, nullable=False)
    descripcion = Column(String(150), nullable=True)

    usuarios = relationship("Usuario", back_populates="rol")


class Permiso(Base):
    __tablename__ = "permisos"

    id_permiso = Column(Integer, primary_key=True, index=True, autoincrement=True)
    nombre = Column(String(50), unique=True, nullable=False)
    descripcion = Column(String(150), nullable=True)


class Usuario(Base):
    __tablename__ = "usuarios"

    id_usuario = Column(Integer, primary_key=True, index=True, autoincrement=True)
    id_rol = Column(Integer, ForeignKey("roles.id_rol"), nullable=False, default=3)
    nombres = Column(String(50), nullable=False)
    apellidos = Column(String(50), nullable=False)
    tipo_documento = Column(String(5), nullable=False)
    numero_documento = Column(String(15), unique=True, nullable=False)
    direccion = Column(String(100), nullable=False)
    telefono = Column(String(15), nullable=False)
    email = Column(String(80), unique=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    foto = Column(String(255), nullable=True)
    estado = Column(Enum("activo", "inactivo"), default="activo", nullable=False)
    ultimo_acceso = Column(DateTime, nullable=True)
    fecha_creacion = Column(TIMESTAMP, server_default=func.now())
    fecha_actualizacion = Column(
        TIMESTAMP, server_default=func.now(), onupdate=func.now()
    )

    rol = relationship("Rol", back_populates="usuarios")


class CategoriaProducto(Base):
    __tablename__ = "categorias_producto"

    id_categoria_producto = Column(Integer, primary_key=True, index=True, autoincrement=True)
    nombre = Column(String(50), unique=True, nullable=False)

    productos = relationship("Producto", back_populates="categoria")


class CategoriaServicio(Base):
    __tablename__ = "categorias_servicio"

    id_categoria_servicio = Column(Integer, primary_key=True, index=True, autoincrement=True)
    nombre = Column(String(50), unique=True, nullable=False)

    servicios = relationship("Servicio", back_populates="categoria")


class Producto(Base):
    __tablename__ = "productos"

    id_producto = Column(Integer, primary_key=True, index=True, autoincrement=True)
    id_categoria_producto = Column(Integer, ForeignKey("categorias_producto.id_categoria_producto"), nullable=False)
    nombre = Column(String(60), nullable=False)
    descripcion = Column(String(255), nullable=True)
    precio = Column(DECIMAL(10, 2), nullable=False)
    stock = Column(Integer, default=0, nullable=False)
    imagen_url = Column(String(255), nullable=True)
    estado = Column(Enum("activo", "inactivo"), default="activo", nullable=False)
    fecha_creacion = Column(TIMESTAMP, server_default=func.now())

    categoria = relationship("CategoriaProducto", back_populates="productos")


class Servicio(Base):
    __tablename__ = "servicios"

    id_servicio = Column(Integer, primary_key=True, index=True, autoincrement=True)
    id_categoria_servicio = Column(Integer, ForeignKey("categorias_servicio.id_categoria_servicio"), nullable=False)
    nombre = Column(String(60), nullable=False)
    descripcion = Column(String(255), nullable=True)
    precio = Column(DECIMAL(10, 2), nullable=False)
    duracion_estimada = Column(String(30), nullable=True)
    imagen_url = Column(String(255), nullable=True)
    estado = Column(Enum("activo", "inactivo"), default="activo", nullable=False)
    fecha_creacion = Column(TIMESTAMP, server_default=func.now())

    categoria = relationship("CategoriaServicio", back_populates="servicios")


class Cita(Base):
    __tablename__ = "citas"

    id_cita = Column(Integer, primary_key=True, index=True, autoincrement=True)
    id_cliente = Column(Integer, ForeignKey("usuarios.id_usuario"), nullable=False)
    id_servicio = Column(Integer, ForeignKey("servicios.id_servicio"), nullable=False)
    id_empleado = Column(Integer, ForeignKey("usuarios.id_usuario"), nullable=True)
    fecha = Column(Date, nullable=False)
    hora = Column(Time, nullable=False)
    mensaje = Column(String(300), nullable=True)
    imagen_diseno = Column(String(255), nullable=True)
    estado = Column(
        Enum("pendiente", "confirmada", "realizada", "cancelada"),
        default="pendiente",
        nullable=False,
    )
    fecha_creacion = Column(TIMESTAMP, server_default=func.now())

    cliente = relationship("Usuario", foreign_keys=[id_cliente])
    empleado = relationship("Usuario", foreign_keys=[id_empleado])
    servicio = relationship("Servicio")


class Compra(Base):
    __tablename__ = "compras"

    id_compra = Column(Integer, primary_key=True, index=True, autoincrement=True)
    id_cliente = Column(Integer, ForeignKey("usuarios.id_usuario"), nullable=False)
    total = Column(DECIMAL(10, 2), nullable=False)
    estado = Column(
        Enum("pendiente", "pagada", "entregada", "cancelada"),
        default="pendiente",
        nullable=False,
    )
    fecha_creacion = Column(TIMESTAMP, server_default=func.now())

    cliente = relationship("Usuario")
    detalles = relationship(
        "CompraDetalle",
        back_populates="compra",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )


class CompraDetalle(Base):
    __tablename__ = "compra_detalle"

    id_detalle = Column(Integer, primary_key=True, index=True, autoincrement=True)
    id_compra = Column(Integer, ForeignKey("compras.id_compra"), nullable=False)
    id_producto = Column(Integer, ForeignKey("productos.id_producto"), nullable=False)
    cantidad = Column(Integer, nullable=False)
    precio_unitario = Column(DECIMAL(10, 2), nullable=False)

    compra = relationship("Compra", back_populates="detalles")
    producto = relationship("Producto")