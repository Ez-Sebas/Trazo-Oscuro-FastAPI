# Trazo Oscuro — Estudio de Tatuajes

Aplicación web Full Stack para la gestión de un estudio de tatuajes: catálogo de
productos y servicios, reserva de citas, ventas, facturación, reportes, PQR,
dashboards por rol y un asistente virtual con Inteligencia Artificial.

**Arquitectura:** React + Vite → FastAPI → PostgreSQL

**Sitio desplegado:** [trazo-oscuro-fast-api.vercel.app](https://trazo-oscuro-fast-api.vercel.app/)

| | |
|---|---|
| **Aprendiz** | Sebastián Zuleta Echavarría |
| **Ficha** | 3406211 — Tecnólogo en Análisis y Desarrollo de Software |
| **Programa** | SENA — Centro de Servicios y Gestión Empresarial |
| **Avance** | Quinto — Gestión comercial, analítica, despliegue e IA |

---

## Tabla de contenido

1. [Stack tecnológico](#stack-tecnológico)
2. [Estructura del proyecto](#estructura-del-proyecto)
3. [Requisitos previos](#requisitos-previos)
4. [Instalación paso a paso](#instalación-paso-a-paso)
5. [Variables de entorno](#variables-de-entorno)
6. [Ejecución](#ejecución)
7. [Pruebas](#pruebas)
8. [Módulos y endpoints](#módulos-y-endpoints)
9. [Roles y permisos](#roles-y-permisos)
10. [Asistente virtual con IA](#asistente-virtual-con-ia)
11. [Seguridad](#seguridad)
12. [Despliegue](#despliegue)

---

## Stack tecnológico

### Backend

| Tecnología | Uso |
|---|---|
| FastAPI 0.141 | Framework de la API REST |
| SQLAlchemy 2.0 | ORM y modelos de base de datos |
| Pydantic v2 | Validación de entrada y salida |
| PostgreSQL | Base de datos relacional |
| python-jose | Firma y verificación de JWT |
| bcrypt | Hashing de contraseñas |
| ReportLab | Generación de PDF (facturas y reportes) |
| openpyxl | Generación de Excel (reportes) |
| Stripe | Pasarela de pago de productos |
| Pytest + TestClient | Pruebas automatizadas |

### Frontend

| Tecnología | Uso |
|---|---|
| React 19 | Librería de interfaz |
| Vite | Servidor de desarrollo y empaquetado |
| React Router 7 | Enrutamiento y rutas protegidas |
| Tailwind CSS 4 | Estilos |
| Recharts | Gráficos de barras y líneas |

---

## Estructura del proyecto

```
Trazo-Oscuro/
├── backend/
│   ├── app/
│   │   ├── main.py            # Punto de entrada, CORS, routers, manejo de errores
│   │   ├── database.py        # Motor de SQLAlchemy y sesión
│   │   ├── models.py          # Modelos ORM (12 entidades relacionadas)
│   │   ├── schemas.py         # Esquemas Pydantic (Create / Update / Response)
│   │   ├── auth.py            # JWT, hashing, dependencias de rol
│   │   ├── ai_utils.py        # Cliente de IA del chatbot
│   │   ├── pdf_utils.py       # Facturas y reportes en PDF
│   │   ├── excel_utils.py     # Reportes en Excel
│   │   ├── email_utils.py     # Correos (confirmación de cita, recuperación)
│   │   ├── stripe_utils.py    # Checkout de Stripe
│   │   └── routes/            # 11 routers: auth, usuarios, productos, servicios,
│   │                          # citas, ventas, facturas, reportes, dashboard,
│   │                          # pqr, chat
│   ├── scripts/
│   │   ├── bd_trazo_oscuro.sql             # Script completo de la base de datos
│   │   └── migracion_01_estado_pago_citas.sql
│   ├── tests/                 # Pytest: CRUD y autenticación
│   ├── docs/                  # Documentación técnica y comparativas
│   ├── postman/               # Colección de pruebas de la API
│   ├── requirements.txt
│   └── .env.example
│
└── frontend/
    ├── src/
    │   ├── main.jsx           # Punto de entrada
    │   ├── App.jsx            # Definición de rutas
    │   ├── index.css          # Tokens de diseño y clases reutilizables
    │   ├── components/        # Componentes reutilizables (ui/, admin/, empleado/, cliente/)
    │   ├── pages/             # Páginas públicas, de cliente, admin y empleado
    │   ├── context/           # AuthContext y CartContext
    │   └── services/          # Cliente HTTP centralizado y servicios por módulo
    ├── package.json
    └── .env.example
```

---

## Requisitos previos

| Software | Versión mínima | Comprobar con |
|---|---|---|
| Python | 3.11 | `python --version` |
| Node.js | 18 | `node --version` |
| PostgreSQL | 14 | `psql --version` |

---

## Instalación paso a paso

### 1. Clonar el repositorio

```bash
git clone <url-del-repositorio>
```

### 2. Crear la base de datos

Desde `psql` o pgAdmin:

```sql
CREATE DATABASE bd_trazo_oscuro;
```

Luego cargar el script, que crea las tablas, las restricciones y los datos
iniciales (roles, permisos y categorías):

```bash
psql -U postgres -d bd_trazo_oscuro -f backend/scripts/bd_trazo_oscuro.sql
```

> Si la base de datos ya existía de un avance anterior, aplicar además la
> migración incremental:
>
> ```bash
> psql -U postgres -d bd_trazo_oscuro -f backend/scripts/migracion_01_estado_pago_citas.sql
> ```

### 3. Backend

```bash
cd backend
python -m venv venv
```

Activar el entorno virtual — en Windows:

```bash
venv\Scripts\activate
```

En Linux o macOS:

```bash
source venv/bin/activate
```

Instalar las dependencias:

```bash
pip install -r requirements.txt
```

Crear el archivo de variables de entorno a partir de la plantilla:

```bash
copy .env.example .env
```

### 4. Frontend

```bash
cd frontend
npm install
copy .env.example .env
```

---

## Variables de entorno

Ninguna clave se escribe en el código fuente: todas se leen del archivo `.env`,
que está excluido del repositorio mediante `.gitignore`.

### `backend/.env`

| Variable | Descripción |
|---|---|
| `DATABASE_URL` | Cadena de conexión a PostgreSQL |
| `SECRET_KEY` | Clave para firmar los JWT (larga y aleatoria) |
| `ALGORITHM` | Algoritmo de firma, `HS256` |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | Vigencia del token en minutos |
| `CORS_ORIGINS` | Orígenes autorizados, separados por coma |
| `SMTP_HOST` / `SMTP_PORT` / `SMTP_USER` / `SMTP_PASSWORD` | Envío de correos |
| `FRONTEND_URL` | URL del frontend, usada en los enlaces de los correos. En producción: `https://trazo-oscuro-fast-api.vercel.app` |
| `IVA_PORCENTAJE` | Porcentaje de impuesto aplicado a las ventas |
| `EMPRESA_NIT` | NIT mostrado en las facturas y los reportes descargables |
| `STRIPE_SECRET_KEY` / `STRIPE_PUBLISHABLE_KEY` / `STRIPE_WEBHOOK_SECRET` | Pagos |
| `GROQ_API_KEY` / `GROQ_MODEL` / `GROQ_BASE_URL` | Asistente virtual con IA |

### `frontend/.env`

| Variable | Descripción |
|---|---|
| `VITE_API_URL` | URL base de la API, por ejemplo `http://127.0.0.1:8000/api` |

---

## Ejecución

### Backend

Desde la carpeta `backend`, con el entorno virtual activo:

```bash
uvicorn app.main:app --reload
```

| Recurso | URL |
|---|---|
| API | http://127.0.0.1:8000 |
| Documentación Swagger | http://127.0.0.1:8000/docs |
| Documentación ReDoc | http://127.0.0.1:8000/redoc |

### Frontend

Desde la carpeta `frontend`:

```bash
npm run dev
```

Disponible en http://localhost:5173

---

## Pruebas

### Automatizadas

Las pruebas usan Pytest con el `TestClient` de FastAPI y una base de datos
SQLite en memoria, de modo que no tocan los datos reales.

```bash
cd backend
python -m pytest -v
```

Cubren el registro de usuarios, el control de duplicados, la validación de
datos, el inicio de sesión (correcto y fallido), el CRUD completo de usuarios
con control de roles y la privacidad del historial del chatbot entre cuentas.

### Manuales con Postman

En `backend/postman/` está la colección con las peticiones de todos los
módulos. Para usarla:

1. Importar `Trazo-Oscuro.postman_collection.json` en Postman.
2. Ejecutar la petición **Autenticación → Login**; el token se guarda solo en
   la variable de colección `token`.
3. El resto de peticiones ya lo envían en la cabecera `Authorization`.

---

## Módulos y endpoints

La API expone 73 operaciones agrupadas en 11 routers. Todas están documentadas
en `/docs` con sus etiquetas, descripciones y ejemplos.

| Router | Prefijo | Contenido |
|---|---|---|
| Autenticación | `/api/auth` | Login, recuperación y restablecimiento de contraseña |
| Usuarios | `/api/usuarios` | Registro público, perfil propio y CRUD administrativo |
| Productos | `/api/productos` | Catálogo y CRUD completo |
| Servicios | `/api/servicios` | Catálogo y CRUD completo |
| Citas | `/api/citas` | Reserva, confirmación por correo, estado y cobro |
| Ventas | `/api/ventas` | Checkout con Stripe, mostrador e historial con filtros |
| Facturas | `/api/facturas` | Generación, consulta, descarga en PDF con logo y NIT, y anulación |
| Reportes | `/api/reportes` | Reporte diario de ventas en JSON, PDF y Excel, con total e IVA recaudado |
| Dashboard | `/api/dashboard` | Indicadores y series para los gráficos, por rol |
| PQR | `/api/pqr` | Registro, respuesta y seguimiento de solicitudes |
| Chatbot | `/api/chat` | Conversación con IA e historial privado por usuario; diagnóstico público |

---

## Roles y permisos

| | Administrador | Empleado | Cliente |
|---|:---:|:---:|:---:|
| Dashboard general | ✅ | — | — |
| Dashboard propio | ✅ | ✅ | ✅ |
| Gestionar usuarios | ✅ | — | — |
| Gestionar productos y servicios | ✅ | ✅ | — |
| Ver todas las citas | ✅ | — | — |
| Ver sus citas asignadas | ✅ | ✅ | — |
| Asignar empleado a una cita | ✅ | — | — |
| Cambiar estado y cobro de una cita | ✅ | Solo las suyas | — |
| Reservar y confirmar una cita | — | — | ✅ |
| Historial de ventas y facturas | ✅ | ✅ | Solo las suyas |
| Reportes en PDF y Excel | ✅ | ✅ | — |
| Responder PQR | ✅ | — | — |
| Registrar PQR | — | — | ✅ |

El alcance de cada consulta lo impone el servidor mediante las dependencias
`obtener_usuario_actual` y `requerir_roles`, nunca el frontend.

### Flujo de una cita

```
Cliente reserva  →  pendiente
                        │  el cliente pulsa el enlace del correo
                        ▼
                   confirmada  ──────────────┐
                        │                    │
     el empleado atiende │                    │ se cancela
                        ▼                    ▼
                    realizada            cancelada

Cobro (independiente del estado):  pendiente  ⇄  pagada
```

Los servicios se cobran presencialmente en el estudio, por eso `citas` tiene su
propia columna `estado_pago` y no generan una fila en `ventas`.

### Panel del cliente

El cliente cuenta con un panel independiente y responsivo, con barra lateral en
escritorio y menú desplegable en móvil. Desde allí puede administrar su perfil,
citas, compras, facturas y solicitudes PQR. Las consultas siempre quedan
limitadas a la información del usuario autenticado.

---

## Asistente virtual con IA

El chatbot integrado en el sitio responde con un modelo de lenguaje real, no
con respuestas predefinidas.

- **Proveedor:** [Groq](https://console.groq.com) — capa gratuita permanente,
  sin tarjeta de crédito. El límite es por minuto y por día, y se reinicia; no
  es un saldo que se agote.
- **Modelo por defecto:** `openai/gpt-oss-20b`
- **Integración:** desde FastAPI, en `app/ai_utils.py`, usando el formato
  estándar *OpenAI Chat Completions*. Cambiar de proveedor es cambiar tres
  variables de entorno.

El *system prompt* se construye dinámicamente en cada petición con los
servicios y productos **activos** de la base de datos, de modo que el asistente
nunca ofrece algo que ya no existe ni inventa precios.

### Privacidad de las conversaciones

El chat está disponible únicamente para usuarios que hayan iniciado sesión.
Cada conversación se vincula al identificador de su propietario y los
endpoints de envío e historial validan esa propiedad con el JWT. Por ello una
cuenta no puede leer, continuar ni reutilizar la conversación de otra cuenta.

En el navegador, el identificador de sesión del chat se almacena por usuario y
el widget se desmonta al cerrar sesión; sin autenticación no se muestra ningún
historial. Las conversaciones antiguas sin propietario tampoco se exponen.

Para comprobar la configuración sin abrir el chat:

```bash
curl http://127.0.0.1:8000/api/chat/estado
```

### Obtener la clave de Groq

1. Entrar a https://console.groq.com y crear la cuenta con correo o Google.
2. Ir a **API Keys** → **Create API Key**.
3. Copiar la clave (empieza por `gsk_`) y pegarla en `GROQ_API_KEY` del archivo
   `backend/.env`. Solo se muestra una vez.

---

## Seguridad

| Medida | Implementación |
|---|---|
| Autenticación | JWT firmado con `SECRET_KEY`, enviado como `Bearer` |
| Chatbot | Historial vinculado a la cuenta autenticada y filtrado por propietario en la API |
| Contraseñas | Hash con bcrypt y sal aleatoria; nunca se almacenan en claro |
| Autorización | Dependencia `requerir_roles` sobre los endpoints sensibles |
| Inyección SQL | Todas las consultas pasan por el ORM de SQLAlchemy, que parametriza los valores. No hay SQL construido por concatenación |
| Enumeración de usuarios | El login responde lo mismo ante correo inexistente y contraseña incorrecta, y tarda lo mismo en ambos casos |
| Credenciales | Solo en variables de entorno; `.env` está en `.gitignore` |
| CORS | Lista blanca de orígenes configurable por entorno |
| Validación | Pydantic v2 en la entrada; los errores se devuelven como 400 con mensaje legible |
| Subida de archivos | Tipo MIME y tamaño máximo verificados; nombre aleatorio en el servidor |

---

## Despliegue

La guía completa está en [`backend/docs/DESPLIEGUE.md`](backend/docs/DESPLIEGUE.md).

Resumen: la base de datos PostgreSQL y el backend FastAPI se publican en
Railway, y el frontend en Vercel: [trazo-oscuro-fast-api.vercel.app](https://trazo-oscuro-fast-api.vercel.app/).
Las variables de entorno se configuran en el panel de cada plataforma, nunca en
el repositorio. En el backend desplegado, `FRONTEND_URL` debe apuntar a esa URL.

---

## Documentación adicional

| Documento | Contenido |
|---|---|
| [`backend/docs/DESPLIEGUE.md`](backend/docs/DESPLIEGUE.md) | Guía de despliegue paso a paso |
| [`backend/docs/COMPARATIVA_FASTAPI_DJANGO.md`](backend/docs/COMPARATIVA_FASTAPI_DJANGO.md) | Análisis comparativo entre FastAPI y Django REST Framework |
