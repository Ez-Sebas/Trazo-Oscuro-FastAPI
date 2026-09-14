CREATE DATABASE IF NOT EXISTS bd_trazo_oscuro_fastapi
CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE bd_trazo_oscuro_fastapi;

-- ============================
-- TABLA: roles
-- ============================
CREATE TABLE roles (
    id_rol INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(30) NOT NULL UNIQUE,
    descripcion VARCHAR(150)
);

INSERT INTO roles (nombre, descripcion) VALUES
('Administrador', 'Control total del sistema: usuarios, productos, servicios, citas y compras'),
('Empleado', 'Gestiona servicios, productos y sus propias citas asignadas'),
('Cliente', 'Usuario final que agenda citas y compra productos');

-- ============================
-- TABLA: permisos
-- ============================
CREATE TABLE permisos (
    id_permiso INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(50) NOT NULL UNIQUE,
    descripcion VARCHAR(150)
);

INSERT INTO permisos (nombre, descripcion) VALUES
('gestionar_usuarios', 'Crear, editar, cambiar estado y eliminar usuarios'),
('gestionar_productos', 'Crear, editar y eliminar productos'),
('gestionar_servicios', 'Crear, editar y eliminar servicios'),
('gestionar_citas', 'Administrar todas las citas del sistema'),
('gestionar_citas_propias', 'Administrar únicamente las citas asignadas al propio usuario'),
('gestionar_compras', 'Consultar y administrar todas las compras'),
('ver_perfil_propio', 'Ver y editar la información de su propio perfil');

-- ============================
-- TABLA: rol_permisos
-- ============================
CREATE TABLE rol_permisos (
    id_rol INT NOT NULL,
    id_permiso INT NOT NULL,
    PRIMARY KEY (id_rol, id_permiso),
    FOREIGN KEY (id_rol) REFERENCES roles(id_rol) ON DELETE CASCADE,
    FOREIGN KEY (id_permiso) REFERENCES permisos(id_permiso) ON DELETE CASCADE
);

INSERT INTO rol_permisos (id_rol, id_permiso)
SELECT 1, id_permiso FROM permisos;

INSERT INTO rol_permisos (id_rol, id_permiso) VALUES
(2, 3), (2, 5), (2, 7);

INSERT INTO rol_permisos (id_rol, id_permiso) VALUES
(3, 7);

-- ============================
-- TABLA: usuarios
-- ============================
CREATE TABLE usuarios (
    id_usuario INT AUTO_INCREMENT PRIMARY KEY,
    id_rol INT NOT NULL DEFAULT 3,
    nombres VARCHAR(50) NOT NULL,
    apellidos VARCHAR(50) NOT NULL,
    tipo_documento VARCHAR(5) NOT NULL,
    numero_documento VARCHAR(15) NOT NULL UNIQUE,
    direccion VARCHAR(100) NOT NULL,
    telefono VARCHAR(15) NOT NULL,
    email VARCHAR(80) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    foto VARCHAR(255) DEFAULT NULL,
    estado ENUM('activo', 'inactivo') NOT NULL DEFAULT 'activo',
    ultimo_acceso DATETIME DEFAULT NULL,
    fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (id_rol) REFERENCES roles(id_rol)
);

-- ============================
-- TABLA: categorias_producto
-- ============================
CREATE TABLE categorias_producto (
    id_categoria_producto INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(50) NOT NULL UNIQUE
);

INSERT INTO categorias_producto (nombre) VALUES
('Cuidado y Cicatrización'),
('Higiene y Bioseguridad'),
('Accesorios de Tatuaje'),
('Ropa y Mercancía'),
('Equipos y Suministros');

-- ============================
-- TABLA: categorias_servicio
-- ============================
CREATE TABLE categorias_servicio (
    id_categoria_servicio INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(50) NOT NULL UNIQUE
);

INSERT INTO categorias_servicio (nombre) VALUES
('Tatuaje'),
('Piercing'),
('Retoque'),
('Cobertura'),
('Diseño Personalizado');

-- ============================
-- TABLA: productos
-- ============================
CREATE TABLE productos (
    id_producto INT AUTO_INCREMENT PRIMARY KEY,
    id_categoria_producto INT NOT NULL,
    nombre VARCHAR(60) NOT NULL,
    descripcion VARCHAR(255),
    precio DECIMAL(10,2) NOT NULL,
    stock INT NOT NULL DEFAULT 0,
    imagen_url VARCHAR(255) DEFAULT NULL,
    estado ENUM('activo', 'inactivo') NOT NULL DEFAULT 'activo',
    fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_categoria_producto) REFERENCES categorias_producto(id_categoria_producto)
);

INSERT INTO productos (id_categoria_producto, nombre, descripcion, precio, stock) VALUES
(1, 'Crema cicatrizante', 'Crema especializada para el cuidado de tatuajes recién hechos.', 35000, 50),
(1, 'Espuma limpiadora', 'Espuma neutra para la limpieza diaria del tatuaje en cicatrización.', 28000, 40),
(1, 'Protector solar tatuajes', 'Protección UV especial para mantener el color del tatuaje.', 42000, 30),
(4, 'Camiseta Trazo Oscuro', 'Camiseta oficial de la marca, algodón 100%.', 55000, 25);

-- ============================
-- TABLA: servicios
-- ============================
CREATE TABLE servicios (
    id_servicio INT AUTO_INCREMENT PRIMARY KEY,
    id_categoria_servicio INT NOT NULL,
    nombre VARCHAR(60) NOT NULL,
    descripcion VARCHAR(255),
    precio DECIMAL(10,2) NOT NULL,
    duracion_estimada VARCHAR(30),
    imagen_url VARCHAR(255) DEFAULT NULL,
    estado ENUM('activo', 'inactivo') NOT NULL DEFAULT 'activo',
    fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_categoria_servicio) REFERENCES categorias_servicio(id_categoria_servicio)
);

INSERT INTO servicios (id_categoria_servicio, nombre, descripcion, precio, duracion_estimada) VALUES
(1, 'Tatuaje Realismo', 'Retratos y figuras con sombreado detallado, casi fotográfico.', 250000, '3-5 horas'),
(1, 'Tatuaje Blackwork', 'Diseños sólidos en negro, geometría y contraste fuerte.', 180000, '2-4 horas'),
(1, 'Tatuaje Fine Line', 'Líneas delgadas y delicadas, ideal para diseños minimalistas.', 120000, '1-2 horas'),
(1, 'Tatuaje Japonés', 'Tradición irezumi: dragones, olas y flores con gran detalle.', 350000, '5-8 horas'),
(3, 'Retoque', 'Sesión de retoque para tatuajes ya realizados en el estudio.', 60000, '30-60 min');

-- ============================
-- TABLA: citas
-- ============================
CREATE TABLE citas (
    id_cita INT AUTO_INCREMENT PRIMARY KEY,
    id_cliente INT NOT NULL,
    id_servicio INT NOT NULL,
    id_empleado INT DEFAULT NULL,
    fecha DATE NOT NULL,
    hora TIME NOT NULL,
    mensaje VARCHAR(300) DEFAULT NULL,
    imagen_diseno VARCHAR(255) DEFAULT NULL,
    estado ENUM('pendiente', 'confirmada', 'realizada', 'cancelada') NOT NULL DEFAULT 'pendiente',
    fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_cliente) REFERENCES usuarios(id_usuario) ON DELETE CASCADE,
    FOREIGN KEY (id_servicio) REFERENCES servicios(id_servicio),
    FOREIGN KEY (id_empleado) REFERENCES usuarios(id_usuario) ON DELETE SET NULL
);

-- ============================
-- TABLA: compras
-- ============================
CREATE TABLE compras (
    id_compra INT AUTO_INCREMENT PRIMARY KEY,
    id_cliente INT NOT NULL,
    total DECIMAL(10,2) NOT NULL,
    metodo_pago ENUM('efectivo', 'tarjeta', 'transferencia') NOT NULL DEFAULT 'efectivo',
    estado ENUM('pendiente', 'pagada', 'entregada', 'cancelada') NOT NULL DEFAULT 'pendiente',
    fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_cliente) REFERENCES usuarios(id_usuario) ON DELETE CASCADE
);

-- ============================
-- TABLA: compra_detalle
-- ============================
CREATE TABLE compra_detalle (
    id_detalle INT AUTO_INCREMENT PRIMARY KEY,
    id_compra INT NOT NULL,
    id_producto INT NOT NULL,
    cantidad INT NOT NULL,
    precio_unitario DECIMAL(10,2) NOT NULL,
    FOREIGN KEY (id_compra) REFERENCES compras(id_compra) ON DELETE CASCADE,
    FOREIGN KEY (id_producto) REFERENCES productos(id_producto)
);