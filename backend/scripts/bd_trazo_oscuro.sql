-- ============================================================
-- FUNCIÓN AUXILIAR: actualizar fecha_actualizacion automáticamente
-- (PostgreSQL no tiene "ON UPDATE CURRENT_TIMESTAMP" como MySQL)
-- ============================================================
CREATE OR REPLACE FUNCTION trigger_set_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.fecha_actualizacion = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;


-- ============================================================
-- ROLES Y PERMISOS
-- ============================================================
CREATE TABLE roles (
    id_rol SERIAL PRIMARY KEY,
    nombre VARCHAR(30) NOT NULL UNIQUE,
    descripcion VARCHAR(150)
);

INSERT INTO roles (nombre, descripcion) VALUES
('Administrador', 'Control total del sistema: usuarios, productos, servicios, ventas, facturación, PQR y chatbot'),
('Empleado', 'Gestiona servicios, productos, sus propias citas asignadas y ventas de mostrador'),
('Cliente', 'Usuario final que agenda citas, compra productos y registra PQR');

CREATE TABLE permisos (
    id_permiso SERIAL PRIMARY KEY,
    nombre VARCHAR(50) NOT NULL UNIQUE,
    descripcion VARCHAR(150)
);

INSERT INTO permisos (nombre, descripcion) VALUES
('gestionar_usuarios', 'Crear, editar, cambiar estado y eliminar usuarios'),
('gestionar_productos', 'Crear, editar y eliminar productos'),
('gestionar_servicios', 'Crear, editar y eliminar servicios'),
('gestionar_citas', 'Administrar todas las citas del sistema'),
('gestionar_citas_propias', 'Administrar únicamente las citas asignadas al propio usuario'),
('gestionar_ventas', 'Registrar y consultar todas las ventas'),
('gestionar_facturas', 'Generar y consultar facturas'),
('gestionar_pqr', 'Gestionar y responder PQR de clientes'),
('ver_dashboards', 'Acceder a dashboards e indicadores'),
('ver_perfil_propio', 'Ver y editar la información de su propio perfil');

CREATE TABLE rol_permisos (
    id_rol INT NOT NULL REFERENCES roles(id_rol) ON DELETE CASCADE,
    id_permiso INT NOT NULL REFERENCES permisos(id_permiso) ON DELETE CASCADE,
    PRIMARY KEY (id_rol, id_permiso)
);

INSERT INTO rol_permisos (id_rol, id_permiso)
SELECT 1, id_permiso FROM permisos;

INSERT INTO rol_permisos (id_rol, id_permiso) VALUES
(2, 3), (2, 5), (2, 6), (2, 10);

INSERT INTO rol_permisos (id_rol, id_permiso) VALUES
(3, 10);


-- ============================================================
-- USUARIOS
-- ============================================================
CREATE TABLE usuarios (
    id_usuario SERIAL PRIMARY KEY,
    id_rol INT NOT NULL DEFAULT 3 REFERENCES roles(id_rol),
    nombres VARCHAR(50) NOT NULL,
    apellidos VARCHAR(50) NOT NULL,
    tipo_documento VARCHAR(5) NOT NULL,
    numero_documento VARCHAR(15) NOT NULL UNIQUE,
    direccion VARCHAR(100) NOT NULL,
    telefono VARCHAR(15) NOT NULL,
    email VARCHAR(80) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    foto VARCHAR(255),
    estado VARCHAR(10) NOT NULL DEFAULT 'activo' CHECK (estado IN ('activo', 'inactivo')),
    ultimo_acceso TIMESTAMP,
    fecha_creacion TIMESTAMP NOT NULL DEFAULT NOW(),
    fecha_actualizacion TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TRIGGER set_timestamp_usuarios
BEFORE UPDATE ON usuarios
FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();


-- ============================================================
-- CATEGORÍAS
-- ============================================================
CREATE TABLE categorias_producto (
    id_categoria_producto SERIAL PRIMARY KEY,
    nombre VARCHAR(50) NOT NULL UNIQUE
);

INSERT INTO categorias_producto (nombre) VALUES
('Cuidado y Cicatrización'),
('Higiene y Bioseguridad'),
('Accesorios de Tatuaje'),
('Ropa y Mercancía'),
('Equipos y Suministros');

CREATE TABLE categorias_servicio (
    id_categoria_servicio SERIAL PRIMARY KEY,
    nombre VARCHAR(50) NOT NULL UNIQUE
);

INSERT INTO categorias_servicio (nombre) VALUES
('Tatuaje'),
('Piercing'),
('Retoque'),
('Cobertura'),
('Diseño Personalizado');


-- ============================================================
-- PRODUCTOS Y SERVICIOS
-- ============================================================
CREATE TABLE productos (
    id_producto SERIAL PRIMARY KEY,
    id_categoria_producto INT NOT NULL REFERENCES categorias_producto(id_categoria_producto),
    nombre VARCHAR(60) NOT NULL,
    descripcion VARCHAR(255),
    precio DECIMAL(10,2) NOT NULL,
    stock INT NOT NULL DEFAULT 0,
    imagen_url VARCHAR(255),
    estado VARCHAR(10) NOT NULL DEFAULT 'activo' CHECK (estado IN ('activo', 'inactivo')),
    fecha_creacion TIMESTAMP NOT NULL DEFAULT NOW()
);

INSERT INTO productos (id_categoria_producto, nombre, descripcion, precio, stock) VALUES
(1, 'Crema cicatrizante', 'Crema especializada para el cuidado de tatuajes recién hechos.', 35000, 50),
(1, 'Espuma limpiadora', 'Espuma neutra para la limpieza diaria del tatuaje en cicatrización.', 28000, 40),
(1, 'Protector solar tatuajes', 'Protección UV especial para mantener el color del tatuaje.', 42000, 30),
(4, 'Camiseta Trazo Oscuro', 'Camiseta oficial de la marca, algodón 100%.', 55000, 25);

CREATE TABLE servicios (
    id_servicio SERIAL PRIMARY KEY,
    id_categoria_servicio INT NOT NULL REFERENCES categorias_servicio(id_categoria_servicio),
    nombre VARCHAR(60) NOT NULL,
    descripcion VARCHAR(255),
    precio DECIMAL(10,2) NOT NULL,
    duracion_estimada VARCHAR(30),
    imagen_url VARCHAR(255),
    estado VARCHAR(10) NOT NULL DEFAULT 'activo' CHECK (estado IN ('activo', 'inactivo')),
    fecha_creacion TIMESTAMP NOT NULL DEFAULT NOW()
);

INSERT INTO servicios (id_categoria_servicio, nombre, descripcion, precio, duracion_estimada) VALUES
(1, 'Tatuaje Realismo', 'Retratos y figuras con sombreado detallado, casi fotográfico.', 250000, '3-5 horas'),
(1, 'Tatuaje Blackwork', 'Diseños sólidos en negro, geometría y contraste fuerte.', 180000, '2-4 horas'),
(1, 'Tatuaje Fine Line', 'Líneas delgadas y delicadas, ideal para diseños minimalistas.', 120000, '1-2 horas'),
(1, 'Tatuaje Japonés', 'Tradición irezumi: dragones, olas y flores con gran detalle.', 350000, '5-8 horas'),
(3, 'Retoque', 'Sesión de retoque para tatuajes ya realizados en el estudio.', 60000, '30-60 min');


-- ============================================================
-- CITAS
-- ============================================================
CREATE TABLE citas (
    id_cita SERIAL PRIMARY KEY,
    id_cliente INT NOT NULL REFERENCES usuarios(id_usuario) ON DELETE CASCADE,
    id_servicio INT NOT NULL REFERENCES servicios(id_servicio),
    id_empleado INT REFERENCES usuarios(id_usuario) ON DELETE SET NULL,
    fecha DATE NOT NULL,
    hora TIME NOT NULL,
    mensaje VARCHAR(300),
    imagen_diseno VARCHAR(255),
    estado VARCHAR(15) NOT NULL DEFAULT 'pendiente'
        CHECK (estado IN ('pendiente', 'confirmada', 'realizada', 'cancelada')),
    -- Cobro del servicio: va aparte del avance de la cita, porque una cita
    -- puede estar 'realizada' y seguir 'pendiente' de pago (y al revés).
    estado_pago VARCHAR(15) NOT NULL DEFAULT 'pendiente'
        CHECK (estado_pago IN ('pendiente', 'pagada')),
    fecha_creacion TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_citas_fecha ON citas(fecha);
CREATE INDEX idx_citas_empleado ON citas(id_empleado);


-- ============================================================
-- VENTAS (reemplaza y amplía a "compras": productos y/o servicios,
-- iniciada por el cliente desde la web o registrada por un empleado
-- en mostrador). Incluye columnas de Stripe para pagos web.
-- ============================================================
CREATE TABLE ventas (
    id_venta SERIAL PRIMARY KEY,
    id_cliente INT NOT NULL REFERENCES usuarios(id_usuario),
    id_usuario_registra INT REFERENCES usuarios(id_usuario),
    origen VARCHAR(15) NOT NULL DEFAULT 'web_cliente'
        CHECK (origen IN ('web_cliente', 'mostrador')),
    subtotal DECIMAL(10,2) NOT NULL DEFAULT 0,
    descuento DECIMAL(10,2) NOT NULL DEFAULT 0,
    iva DECIMAL(10,2) NOT NULL DEFAULT 0,
    total DECIMAL(10,2) NOT NULL DEFAULT 0,
    estado VARCHAR(15) NOT NULL DEFAULT 'pendiente'
        CHECK (estado IN ('pendiente', 'pagada', 'entregada', 'cancelada')),
    estado_pago VARCHAR(15) NOT NULL DEFAULT 'no_aplica'
        CHECK (estado_pago IN ('no_aplica', 'pendiente', 'pagado', 'fallido', 'reembolsado')),
    stripe_checkout_session_id VARCHAR(255),
    stripe_payment_intent_id VARCHAR(255),
    fecha_creacion TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_ventas_fecha ON ventas(fecha_creacion);
CREATE INDEX idx_ventas_cliente ON ventas(id_cliente);

CREATE TABLE detalle_ventas (
    id_detalle SERIAL PRIMARY KEY,
    id_venta INT NOT NULL REFERENCES ventas(id_venta) ON DELETE CASCADE,
    tipo_item VARCHAR(10) NOT NULL CHECK (tipo_item IN ('producto', 'servicio')),
    id_producto INT REFERENCES productos(id_producto),
    id_servicio INT REFERENCES servicios(id_servicio),
    nombre_item VARCHAR(60) NOT NULL,
    cantidad INT NOT NULL,
    precio_unitario DECIMAL(10,2) NOT NULL,
    subtotal_item DECIMAL(10,2) NOT NULL
);


-- ============================================================
-- FACTURAS (generadas manualmente por el Admin desde una venta)
-- ============================================================
CREATE TABLE facturas (
    id_factura SERIAL PRIMARY KEY,
    id_venta INT NOT NULL UNIQUE REFERENCES ventas(id_venta),
    numero_factura VARCHAR(20) NOT NULL UNIQUE,
    subtotal DECIMAL(10,2) NOT NULL,
    descuento DECIMAL(10,2) NOT NULL DEFAULT 0,
    iva DECIMAL(10,2) NOT NULL,
    total DECIMAL(10,2) NOT NULL,
    estado VARCHAR(10) NOT NULL DEFAULT 'emitida' CHECK (estado IN ('emitida', 'anulada')),
    fecha_generacion TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE detalle_facturas (
    id_detalle_factura SERIAL PRIMARY KEY,
    id_factura INT NOT NULL REFERENCES facturas(id_factura) ON DELETE CASCADE,
    nombre_item VARCHAR(60) NOT NULL,
    cantidad INT NOT NULL,
    precio_unitario DECIMAL(10,2) NOT NULL,
    subtotal_item DECIMAL(10,2) NOT NULL
);


-- ============================================================
-- PQR
-- ============================================================
CREATE TABLE pqr (
    id_pqr SERIAL PRIMARY KEY,
    id_cliente INT NOT NULL REFERENCES usuarios(id_usuario) ON DELETE CASCADE,
    id_usuario_responde INT REFERENCES usuarios(id_usuario),
    tipo VARCHAR(15) NOT NULL CHECK (tipo IN ('peticion', 'queja', 'reclamo', 'sugerencia')),
    asunto VARCHAR(100) NOT NULL,
    descripcion VARCHAR(500) NOT NULL,
    respuesta VARCHAR(500),
    estado VARCHAR(15) NOT NULL DEFAULT 'pendiente'
        CHECK (estado IN ('pendiente', 'en_proceso', 'respondida', 'cerrada')),
    fecha_creacion TIMESTAMP NOT NULL DEFAULT NOW(),
    fecha_respuesta TIMESTAMP
);


-- ============================================================
-- CHATBOT
-- ============================================================
CREATE TABLE conversaciones (
    id_conversacion SERIAL PRIMARY KEY,
    id_cliente INT REFERENCES usuarios(id_usuario),
    session_id VARCHAR(100) NOT NULL,
    fecha_inicio TIMESTAMP NOT NULL DEFAULT NOW(),
    fecha_ultima_actividad TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE mensajes (
    id_mensaje SERIAL PRIMARY KEY,
    id_conversacion INT NOT NULL REFERENCES conversaciones(id_conversacion) ON DELETE CASCADE,
    remitente VARCHAR(10) NOT NULL CHECK (remitente IN ('cliente', 'asistente')),
    contenido VARCHAR(2000) NOT NULL,
    fecha_creacion TIMESTAMP NOT NULL DEFAULT NOW()
);