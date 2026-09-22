from sqlalchemy import (
    Column, Integer, String, DECIMAL, Date, Time, DateTime,
    TIMESTAMP, ForeignKey,
)
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from .database import Base


class Rol(Base):
    __tablename__ = "roles"

    id_rol = Column(Integer, primary_key=True, index=True)
    nombre = Column(String(30), unique=True, nullable=False)
    descripcion = Column(String(150), nullable=True)

    usuarios = relationship("Usuario", back_populates="rol")


class Permiso(Base):
    __tablename__ = "permisos"

    id_permiso = Column(Integer, primary_key=True, index=True)
    nombre = Column(String(50), unique=True, nullable=False)
    descripcion = Column(String(150), nullable=True)


class Usuario(Base):
    __tablename__ = "usuarios"

    id_usuario = Column(Integer, primary_key=True, index=True)
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
    estado = Column(String(10), default="activo", nullable=False)
    ultimo_acceso = Column(DateTime, nullable=True)
    fecha_creacion = Column(TIMESTAMP, server_default=func.now())
    fecha_actualizacion = Column(TIMESTAMP, server_default=func.now())

    rol = relationship("Rol", back_populates="usuarios")


class CategoriaProducto(Base):
    __tablename__ = "categorias_producto"

    id_categoria_producto = Column(Integer, primary_key=True, index=True)
    nombre = Column(String(50), unique=True, nullable=False)

    productos = relationship("Producto", back_populates="categoria")


class CategoriaServicio(Base):
    __tablename__ = "categorias_servicio"

    id_categoria_servicio = Column(Integer, primary_key=True, index=True)
    nombre = Column(String(50), unique=True, nullable=False)

    servicios = relationship("Servicio", back_populates="categoria")


class Producto(Base):
    __tablename__ = "productos"

    id_producto = Column(Integer, primary_key=True, index=True)
    id_categoria_producto = Column(Integer, ForeignKey("categorias_producto.id_categoria_producto"), nullable=False)
    nombre = Column(String(60), nullable=False)
    descripcion = Column(String(255), nullable=True)
    precio = Column(DECIMAL(10, 2), nullable=False)
    stock = Column(Integer, default=0, nullable=False)
    imagen_url = Column(String(255), nullable=True)
    estado = Column(String(10), default="activo", nullable=False)
    fecha_creacion = Column(TIMESTAMP, server_default=func.now())

    categoria = relationship("CategoriaProducto", back_populates="productos")


class Servicio(Base):
    __tablename__ = "servicios"

    id_servicio = Column(Integer, primary_key=True, index=True)
    id_categoria_servicio = Column(Integer, ForeignKey("categorias_servicio.id_categoria_servicio"), nullable=False)
    nombre = Column(String(60), nullable=False)
    descripcion = Column(String(255), nullable=True)
    precio = Column(DECIMAL(10, 2), nullable=False)
    duracion_estimada = Column(String(30), nullable=True)
    imagen_url = Column(String(255), nullable=True)
    estado = Column(String(10), default="activo", nullable=False)
    fecha_creacion = Column(TIMESTAMP, server_default=func.now())

    categoria = relationship("CategoriaServicio", back_populates="servicios")


class Cita(Base):
    __tablename__ = "citas"

    id_cita = Column(Integer, primary_key=True, index=True)
    id_cliente = Column(Integer, ForeignKey("usuarios.id_usuario"), nullable=False)
    id_servicio = Column(Integer, ForeignKey("servicios.id_servicio"), nullable=False)
    id_empleado = Column(Integer, ForeignKey("usuarios.id_usuario"), nullable=True)
    fecha = Column(Date, nullable=False)
    hora = Column(Time, nullable=False)
    mensaje = Column(String(300), nullable=True)
    imagen_diseno = Column(String(255), nullable=True)
    estado = Column(String(15), default="pendiente", nullable=False)
    # Estado del cobro del servicio, independiente del avance de la cita:
    # una cita puede estar 'realizada' y todavía 'pendiente' de pago.
    estado_pago = Column(String(15), default="pendiente", nullable=False)
    fecha_creacion = Column(TIMESTAMP, server_default=func.now())

    cliente = relationship("Usuario", foreign_keys=[id_cliente])
    empleado = relationship("Usuario", foreign_keys=[id_empleado])
    servicio = relationship("Servicio")


class Venta(Base):
    __tablename__ = "ventas"

    id_venta = Column(Integer, primary_key=True, index=True)
    id_cliente = Column(Integer, ForeignKey("usuarios.id_usuario"), nullable=False)
    id_usuario_registra = Column(Integer, ForeignKey("usuarios.id_usuario"), nullable=True)
    origen = Column(String(15), default="web_cliente", nullable=False)
    subtotal = Column(DECIMAL(10, 2), default=0, nullable=False)
    descuento = Column(DECIMAL(10, 2), default=0, nullable=False)
    iva = Column(DECIMAL(10, 2), default=0, nullable=False)
    total = Column(DECIMAL(10, 2), default=0, nullable=False)
    estado = Column(String(15), default="pendiente", nullable=False)
    estado_pago = Column(String(15), default="no_aplica", nullable=False)
    stripe_checkout_session_id = Column(String(255), nullable=True)
    stripe_payment_intent_id = Column(String(255), nullable=True)
    fecha_creacion = Column(TIMESTAMP, server_default=func.now())

    cliente = relationship("Usuario", foreign_keys=[id_cliente])
    usuario_registra = relationship("Usuario", foreign_keys=[id_usuario_registra])
    detalles = relationship("DetalleVenta", back_populates="venta")
    factura = relationship("Factura", back_populates="venta", uselist=False)


class DetalleVenta(Base):
    __tablename__ = "detalle_ventas"

    id_detalle = Column(Integer, primary_key=True, index=True)
    id_venta = Column(Integer, ForeignKey("ventas.id_venta"), nullable=False)
    tipo_item = Column(String(10), nullable=False)
    id_producto = Column(Integer, ForeignKey("productos.id_producto"), nullable=True)
    id_servicio = Column(Integer, ForeignKey("servicios.id_servicio"), nullable=True)
    nombre_item = Column(String(60), nullable=False)
    cantidad = Column(Integer, nullable=False)
    precio_unitario = Column(DECIMAL(10, 2), nullable=False)
    subtotal_item = Column(DECIMAL(10, 2), nullable=False)

    venta = relationship("Venta", back_populates="detalles")
    producto = relationship("Producto")
    servicio = relationship("Servicio")


class Factura(Base):
    __tablename__ = "facturas"

    id_factura = Column(Integer, primary_key=True, index=True)
    id_venta = Column(Integer, ForeignKey("ventas.id_venta"), unique=True, nullable=False)
    numero_factura = Column(String(20), unique=True, nullable=False)
    subtotal = Column(DECIMAL(10, 2), nullable=False)
    descuento = Column(DECIMAL(10, 2), default=0, nullable=False)
    iva = Column(DECIMAL(10, 2), nullable=False)
    total = Column(DECIMAL(10, 2), nullable=False)
    estado = Column(String(10), default="emitida", nullable=False)
    fecha_generacion = Column(TIMESTAMP, server_default=func.now())

    venta = relationship("Venta", back_populates="factura")
    detalles = relationship("DetalleFactura", back_populates="factura")


class DetalleFactura(Base):
    __tablename__ = "detalle_facturas"

    id_detalle_factura = Column(Integer, primary_key=True, index=True)
    id_factura = Column(Integer, ForeignKey("facturas.id_factura"), nullable=False)
    nombre_item = Column(String(60), nullable=False)
    cantidad = Column(Integer, nullable=False)
    precio_unitario = Column(DECIMAL(10, 2), nullable=False)
    subtotal_item = Column(DECIMAL(10, 2), nullable=False)

    factura = relationship("Factura", back_populates="detalles")


class PQR(Base):
    __tablename__ = "pqr"

    id_pqr = Column(Integer, primary_key=True, index=True)
    id_cliente = Column(Integer, ForeignKey("usuarios.id_usuario"), nullable=False)
    id_usuario_responde = Column(Integer, ForeignKey("usuarios.id_usuario"), nullable=True)
    tipo = Column(String(15), nullable=False)
    asunto = Column(String(100), nullable=False)
    descripcion = Column(String(500), nullable=False)
    respuesta = Column(String(500), nullable=True)
    estado = Column(String(15), default="pendiente", nullable=False)
    fecha_creacion = Column(TIMESTAMP, server_default=func.now())
    fecha_respuesta = Column(DateTime, nullable=True)

    cliente = relationship("Usuario", foreign_keys=[id_cliente])
    usuario_responde = relationship("Usuario", foreign_keys=[id_usuario_responde])


class Conversacion(Base):
    __tablename__ = "conversaciones"

    id_conversacion = Column(Integer, primary_key=True, index=True)
    id_cliente = Column(Integer, ForeignKey("usuarios.id_usuario"), nullable=True)
    session_id = Column(String(100), nullable=False)
    fecha_inicio = Column(TIMESTAMP, server_default=func.now())
    fecha_ultima_actividad = Column(TIMESTAMP, server_default=func.now())

    cliente = relationship("Usuario")
    mensajes = relationship("Mensaje", back_populates="conversacion")


class Mensaje(Base):
    __tablename__ = "mensajes"

    id_mensaje = Column(Integer, primary_key=True, index=True)
    id_conversacion = Column(Integer, ForeignKey("conversaciones.id_conversacion"), nullable=False)
    remitente = Column(String(10), nullable=False)
    contenido = Column(String(2000), nullable=False)
    fecha_creacion = Column(TIMESTAMP, server_default=func.now())

    conversacion = relationship("Conversacion", back_populates="mensajes")