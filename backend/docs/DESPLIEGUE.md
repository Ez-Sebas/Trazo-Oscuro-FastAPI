# Guía de despliegue — Trazo Oscuro

**Proyecto:** Trazo Oscuro · **Aprendiz:** Sebastián Zuleta Echavarría · **Ficha:** 3406211

Esta guía lleva el proyecto de local a producción. Al terminar tendrás tres
URL públicas: la base de datos, la API y el sitio web.

| Componente | Plataforma | Por qué |
|---|---|---|
| PostgreSQL | Railway | Base de datos gestionada, se crea en un clic |
| Backend FastAPI | Railway | Mismo proyecto que la base de datos, red interna |
| Frontend React | Vercel | Especializado en sitios estáticos, muy rápido |

> Todo lo que se usa aquí tiene capa gratuita. Railway da 5 USD de crédito
> mensual, suficiente para una API pequeña y una base de datos.

---

## Antes de empezar

Verifica que se cumplen estas tres condiciones, o el despliegue fallará:

**1. `requirements.txt` debe estar en UTF-8.**
Si lo generaste con `pip freeze > requirements.txt` desde PowerShell, quedó en
UTF-16 y `pip` no podrá leerlo en el servidor Linux. Para comprobarlo:

```bash
python -c "print(open('backend/requirements.txt','rb').read()[:20])"
```

Debe empezar por el nombre de un paquete, no por `b'\xff\xfe'`. Si sale mal,
regenéralo así:

```bash
python -c "import io; io.open('backend/requirements.txt','w',encoding='utf-8',newline='\n').write(open('backend/requirements.txt','rb').read().decode('utf-16'))"
```

**2. El archivo `.env` NO debe estar en el repositorio.**

```bash
git ls-files | grep .env
```

Solo debe aparecer `.env.example`. Si aparece `.env`, sácalo del control de
versiones y **cambia todas las claves**, porque ya quedaron en el historial:

```bash
git rm --cached backend/.env
```

**3. El código debe estar subido a GitHub.** Railway y Vercel despliegan desde
el repositorio.

---

## Paso 1 — Subir el proyecto a GitHub

Si aún no lo has hecho:

```bash
git add .
```

```bash
git commit -m "Quinto avance: ventas, facturación, reportes, dashboards, PQR e IA"
```

```bash
git push origin master
```

---

## Paso 2 — Crear la base de datos PostgreSQL en Railway

1. Entra a [railway.app](https://railway.app) e inicia sesión con GitHub.
2. **New Project** → **Provision PostgreSQL**.
3. Espera a que el servicio quede en verde.
4. Haz clic en el servicio **Postgres** → pestaña **Variables**.
5. Copia el valor de `DATABASE_URL`. Se ve así:

```
postgresql://postgres:CLAVE@containers-us-west-123.railway.app:5432/railway
```

### Cargar el esquema y los datos iniciales

El script crea las 12 tablas, las restricciones y los datos base (roles,
permisos y categorías). Desde tu equipo, con la URL que copiaste:

```bash
psql "postgresql://postgres:CLAVE@containers-us-west-123.railway.app:5432/railway" -f backend/scripts/bd_trazo_oscuro.sql
```

> **Si tu base local ya tiene datos que quieres conservar**, en lugar del
> script anterior haz un volcado y restáuralo:
>
> ```bash
> pg_dump -U postgres -d bd_trazo_oscuro --no-owner --no-acl -f respaldo.sql
> ```
>
> ```bash
> psql "postgresql://postgres:CLAVE@host:5432/railway" -f respaldo.sql
> ```
>
> `--no-owner` y `--no-acl` evitan errores por usuarios que no existen en
> Railway.

Comprueba que las tablas quedaron creadas:

```bash
psql "postgresql://postgres:CLAVE@host:5432/railway" -c "\dt"
```

---

## Paso 3 — Desplegar el backend en Railway

1. En el **mismo proyecto** de Railway: **New** → **GitHub Repo** → elige tu
   repositorio.
2. Abre el servicio nuevo → pestaña **Settings**:

| Campo | Valor |
|---|---|
| **Root Directory** | `backend` |
| **Build Command** | `pip install -r requirements.txt` |
| **Start Command** | `uvicorn app.main:app --host 0.0.0.0 --port $PORT` |

> El `--host 0.0.0.0` y el `$PORT` son obligatorios: Railway asigna el puerto
> por variable de entorno y rechaza los servicios que solo escuchan en
> `127.0.0.1`.

3. Pestaña **Variables** → añade una por una:

| Variable | Valor |
|---|---|
| `DATABASE_URL` | `${{Postgres.DATABASE_URL}}` (referencia interna de Railway) |
| `SECRET_KEY` | Una clave larga y aleatoria — **no la misma que en local** |
| `ALGORITHM` | `HS256` |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | `480` |
| `CORS_ORIGINS` | *(se rellena en el paso 5)* |
| `FRONTEND_URL` | *(se rellena en el paso 5)* |
| `IVA_PORCENTAJE` | `19` |
| `SMTP_HOST` | `smtp.gmail.com` |
| `SMTP_PORT` | `587` |
| `SMTP_USER` | Tu correo |
| `SMTP_PASSWORD` | Tu contraseña de aplicación de Gmail |
| `GROQ_API_KEY` | Tu clave `gsk_...` de Groq |
| `GROQ_MODEL` | `openai/gpt-oss-20b` |
| `GROQ_BASE_URL` | `https://api.groq.com/openai/v1` |
| `STRIPE_SECRET_KEY` | Tu clave de Stripe |
| `STRIPE_PUBLISHABLE_KEY` | Tu clave pública de Stripe |
| `STRIPE_WEBHOOK_SECRET` | Tu secreto de webhook |

Para generar una `SECRET_KEY` nueva:

```bash
python -c "import secrets; print(secrets.token_urlsafe(64))"
```

4. Pestaña **Settings** → **Networking** → **Generate Domain**. Railway te da
   una URL del tipo `https://trazo-oscuro-api.up.railway.app`. **Anótala.**

5. Comprueba que arrancó:

```bash
curl https://TU-API.up.railway.app/
```

Debe responder `{"success":true,"message":"API Trazo Oscuro funcionando correctamente."}`.

Y la documentación en `https://TU-API.up.railway.app/docs`.

---

## Paso 4 — Desplegar el frontend en Vercel

1. Entra a [vercel.com](https://vercel.com) e inicia sesión con GitHub.
2. **Add New** → **Project** → importa el mismo repositorio.
3. Configura:

| Campo | Valor |
|---|---|
| **Framework Preset** | Vite |
| **Root Directory** | `frontend` |
| **Build Command** | `npm run build` |
| **Output Directory** | `dist` |

4. **Environment Variables** → añade:

| Variable | Valor |
|---|---|
| `VITE_API_URL` | `https://TU-API.up.railway.app/api` |

> Ojo con el `/api` al final: el cliente HTTP lo concatena con rutas como
> `/auth/login`, así que sin él todas las peticiones darían 404.

5. **Deploy**. Al terminar tendrás una URL como
   `https://trazo-oscuro.vercel.app`. **Anótala.**

### Configurar el enrutamiento de React Router

Como la aplicación usa rutas del lado del cliente, si alguien entra directo a
`/admin/citas` Vercel buscará un archivo que no existe y devolverá 404. Para
evitarlo, crea `frontend/vercel.json` con este contenido:

```json
{
  "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
}
```

Súbelo y Vercel volverá a desplegar solo.

---

## Paso 5 — Conectar las dos partes

Ahora que conoces las dos URL, vuelve a Railway → servicio del backend →
**Variables** y rellena las que quedaron pendientes:

| Variable | Valor |
|---|---|
| `CORS_ORIGINS` | `https://trazo-oscuro.vercel.app` |
| `FRONTEND_URL` | `https://trazo-oscuro.vercel.app` |

- `CORS_ORIGINS` autoriza al navegador a llamar la API desde ese dominio. Sin
  esto, todas las peticiones fallan con un error de CORS.
- `FRONTEND_URL` es la que se usa en los enlaces de los correos (confirmar una
  cita, restablecer la contraseña).

Railway reinicia el servicio solo. Espera a que vuelva a verde.

---

## Paso 6 — Comprobaciones finales

Recorre esta lista en la URL pública, no en local:

| # | Prueba | Resultado esperado |
|---|---|---|
| 1 | Abrir la web | Carga la página de inicio |
| 2 | Crear una cuenta | Registro en dos pasos, usuario creado |
| 3 | Iniciar sesión | Entra y aparece el menú de usuario |
| 4 | Entrar a `/admin` como administrador | Carga el dashboard con datos reales |
| 5 | Los gráficos muestran datos | Barras y líneas con información de la base |
| 6 | Reservar una cita | Llega el correo de confirmación |
| 7 | Cambiar el estado de una cita | Se guarda y los indicadores se actualizan |
| 8 | Generar el reporte diario en PDF | Se descarga el archivo |
| 9 | Generar el reporte en Excel | Se descarga el `.xlsx` |
| 10 | Consultar y descargar una factura | Se abre el PDF |
| 11 | Registrar una PQR y responderla | Cambia de estado |
| 12 | Escribir al chatbot | Responde con IA (no con texto fijo) |
| 13 | `GET /api/chat/estado` | `"success": true` |
| 14 | Abrir `/docs` | Swagger con los 73 endpoints |

Si algo falla, el registro está en Railway → servicio → pestaña **Deployments**
→ **View Logs**.

---

## Problemas frecuentes

### `pip: invalid start byte` al construir

`requirements.txt` está en UTF-16. Mira el apartado *Antes de empezar*.

### El frontend carga pero ninguna petición funciona

Abre la consola del navegador (F12). Si ves *blocked by CORS policy*, la
variable `CORS_ORIGINS` del backend no coincide **exactamente** con la URL del
frontend. Debe ir con `https://`, sin barra final y sin espacios.

### `Application failed to respond`

El *Start Command* no incluye `--host 0.0.0.0 --port $PORT`.

### `connection to server failed`

`DATABASE_URL` mal escrita. Usa la referencia `${{Postgres.DATABASE_URL}}` en
lugar de pegar la cadena a mano: así Railway la mantiene actualizada.

### Las imágenes de las citas desaparecen al cabo de un rato

Railway reinicia los contenedores y el disco es efímero: los archivos subidos
se pierden en cada despliegue. Para un proyecto formativo es aceptable y basta
con mencionarlo en la sustentación. Si quieres resolverlo de verdad, hay dos
caminos: montar un **volumen persistente** en Railway (Settings → Volumes,
punto de montaje `/app/static`), o subir las imágenes a un servicio externo
como Cloudinary, que tiene capa gratuita.

### El chatbot responde 503 en producción

Falta `GROQ_API_KEY` en las variables de Railway, o el modelo configurado no
está disponible en tu cuenta. Comprueba con `GET /api/chat/estado`, que dice
exactamente cuál es el problema.

---

## Seguridad en producción

Antes de entregar, revisa estos cinco puntos:

1. **`SECRET_KEY` distinta a la de local** y generada al azar. Si alguien
   conoce esa clave, puede fabricar tokens válidos de administrador.
2. **Ninguna clave en el repositorio.** Compruébalo con `git ls-files | grep .env`.
3. **Ninguna clave visible en las capturas** que entregues. El enunciado lo
   pide de forma expresa.
4. **`CORS_ORIGINS` con el dominio exacto**, nunca `*`, porque la API usa
   `allow_credentials=True`.
5. **Claves de Stripe en modo prueba** (`sk_test_`), no en modo real.

---

## Qué entregar

| Evidencia | Dónde obtenerla |
|---|---|
| URL pública del sitio | La de Vercel |
| URL pública de la API | La de Railway |
| Documentación de la API | `https://TU-API.up.railway.app/docs` |
| Capturas de los dashboards | En la URL pública, con sesión de cada rol |
| Capturas de los reportes | PDF y Excel descargados desde producción |
| Capturas de las facturas | PDF descargado desde producción |
| Conversación con el chatbot | Captura del chat respondiendo |
| Pruebas con Postman | Importar `backend/postman/Trazo-Oscuro.postman_collection.json` y capturar las respuestas |
| Variables de entorno configuradas | Captura del panel de Railway **con los valores ocultos** |
| Pruebas automatizadas | Salida de `python -m pytest -v` |
