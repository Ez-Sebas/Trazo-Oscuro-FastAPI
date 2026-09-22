# Comparativa técnica: FastAPI vs Django REST Framework

**Proyecto:** Trazo Oscuro — Estudio de Tatuajes
**Aprendiz:** Sebastián Zuleta Echavarría · Ficha 3406211

Este documento compara los dos frameworks de Python más usados para construir
APIs REST, aplicando la comparación a decisiones concretas que se tomaron en
este proyecto. No es una comparación teórica: cada apartado cita el archivo
donde se ve la diferencia.

---

## 1. Resumen ejecutivo

| Criterio | FastAPI | Django REST Framework | Elegido |
|---|---|---|---|
| Curva de aprendizaje | Baja: función + decorador | Media-alta: ViewSets, routers, serializers | FastAPI |
| Validación | Pydantic, integrada en la firma | Serializers, clase aparte | FastAPI |
| Documentación automática | Incluida (OpenAPI, Swagger, ReDoc) | Requiere `drf-spectacular` | FastAPI |
| Asincronía | Nativa (`async def`, ASGI) | Parcial, ORM síncrono | FastAPI |
| Panel de administración | No trae | `django.contrib.admin`, muy completo | DRF |
| Migraciones | Externas (Alembic) o manuales | `makemigrations` / `migrate` | DRF |
| Autenticación lista para usar | Se construye | Sistema de usuarios y permisos incluido | DRF |
| Rendimiento | Mayor (Starlette + ASGI) | Menor (WSGI por defecto) | FastAPI |
| Tamaño del proyecto | Ligero, se arma por piezas | "Baterías incluidas" | Según el caso |

**Decisión:** FastAPI, por las razones que se detallan abajo.

---

## 2. Definición de un endpoint

### FastAPI — lo que se usa en este proyecto

La validación, la documentación y los tipos viven en la propia firma de la
función. Un solo bloque describe todo el contrato.

```python
# backend/app/routes/productos.py
@router.get("/{id_producto}")
def obtener_producto(
    id_producto: Annotated[int, Path(ge=1, description="Identificador del producto")],
    db: Session = Depends(get_db),
):
    producto = db.query(Producto).filter(Producto.id_producto == id_producto).first()
    if not producto:
        raise HTTPException(status_code=404, detail="Producto no encontrado.")
    return {"success": True, "producto": _producto_a_dict(producto)}
```

De ahí FastAPI deduce solo: que `id_producto` es un entero ≥ 1, que si llega
`0` debe responder un error de validación, y cómo documentar la ruta en
`/docs`.

### Django REST Framework — equivalente

```python
# views.py
class ProductoViewSet(viewsets.ModelViewSet):
    queryset = Producto.objects.all()
    serializer_class = ProductoSerializer
    permission_classes = [IsAuthenticated]

# serializers.py
class ProductoSerializer(serializers.ModelSerializer):
    class Meta:
        model = Producto
        fields = '__all__'

# urls.py
router = DefaultRouter()
router.register(r'productos', ProductoViewSet)
```

**Diferencia:** DRF genera las cinco operaciones CRUD con tres líneas, lo cual
es muy rápido cuando el CRUD es estándar. Pero en cuanto una operación se sale
de lo normal hay que sobrescribir métodos (`get_queryset`, `perform_create`,
`list`) y la lógica se reparte entre varios archivos. En FastAPI cada endpoint
es una función independiente y se lee de arriba abajo.

**En este proyecto** casi ningún endpoint es un CRUD plano: la reserva de citas
sube una imagen y manda un correo, el cobro tiene reglas propias, el dashboard
agrega datos de varias tablas. Escribir esa lógica como funciones sueltas
resultó más claro que sobrescribir métodos de un `ModelViewSet`.

---

## 3. Validación de datos

### FastAPI — Pydantic v2

El esquema de entrada es una clase de datos con validadores propios:

```python
# backend/app/schemas.py
class UsuarioCreate(BaseModel):
    nombres: str = Field(min_length=2, max_length=50)
    numero_documento: str = Field(min_length=6, max_length=15)
    email: EmailStr
    password: str = Field(min_length=8, max_length=72)

    @field_validator("password")
    @classmethod
    def password_segura(cls, valor):
        if not any(c.isalpha() for c in valor) or not any(c.isdigit() for c in valor):
            raise ValueError("La contraseña debe combinar letras y números.")
        return valor
```

### DRF — Serializers

```python
class UsuarioCreateSerializer(serializers.ModelSerializer):
    password = serializers.CharField(min_length=8, max_length=72, write_only=True)

    def validate_password(self, valor):
        if not any(c.isalpha() for c in valor) or not any(c.isdigit() for c in valor):
            raise serializers.ValidationError("La contraseña debe combinar letras y números.")
        return valor
```

**Diferencia:** son muy parecidos en intención. Las ventajas reales de Pydantic
son que los mismos modelos sirven como anotaciones de tipo (el editor autocompleta
y avisa de errores antes de ejecutar) y que la validación se compila en Rust
(`pydantic-core`), por lo que es más rápida. La ventaja de DRF es que el
`ModelSerializer` deduce los campos del modelo y evita repetirlos.

**En este proyecto** se usaron esquemas separados para entrada y salida
(`UsuarioCreate`, `UsuarioUpdate`, `UsuarioResponse`), precisamente para que la
contraseña nunca pueda salir por accidente en una respuesta.

---

## 4. Asincronía

Esta fue la diferencia decisiva.

El chatbot llama a la API de Groq, que tarda entre uno y tres segundos. Con
FastAPI esa espera no bloquea al servidor: mientras una petición aguarda la
respuesta de la IA, el proceso atiende otras.

```python
# backend/app/routes/chat.py
@router.post("/mensaje")
async def enviar_mensaje(datos: MensajeChatCreate, ...):
    respuesta_cruda, proveedor = await obtener_respuesta_ia(mensajes_para_ia)
```

Además, el correo de confirmación de una cita se manda en segundo plano, de
modo que el cliente recibe la respuesta de inmediato:

```python
# backend/app/routes/citas.py
background_tasks.add_task(
    enviar_correo_confirmacion_cita,
    usuario_actual.email, nueva_cita.id_cita, token, ...
)
```

En DRF esto es posible desde la versión 3.14 con vistas asíncronas, pero el ORM
de Django sigue siendo síncrono en la práctica y las tareas en segundo plano
normalmente exigen montar **Celery** con **Redis** como intermediario: dos
servicios más que instalar, configurar y desplegar. FastAPI trae
`BackgroundTasks` incluido y sin dependencias externas.

---

## 5. Documentación automática

FastAPI genera la especificación OpenAPI a partir del propio código. Sin
instalar nada aparece Swagger en `/docs` y ReDoc en `/redoc`, y se personaliza
desde la creación de la aplicación:

```python
# backend/app/main.py
tags_metadata = [
    {"name": "Citas", "description": "Reserva, confirmación y gestión de citas."},
    {"name": "Chatbot", "description": "Asistente virtual impulsado por IA (Groq, compatible con OpenAI)."},
]

app = FastAPI(title="API Trazo Oscuro", version="1.0.0", openapi_tags=tags_metadata)
```

En DRF hay que instalar y configurar `drf-spectacular` o `drf-yasg`, y decorar
las vistas con `@extend_schema` para que la documentación quede completa.

---

## 6. ORM y migraciones

Aquí gana Django con claridad.

| | FastAPI + SQLAlchemy | Django ORM |
|---|---|---|
| Definición del modelo | `Column(String(50), nullable=False)` | `models.CharField(max_length=50)` |
| Crear migración | Alembic, configuración aparte | `python manage.py makemigrations` |
| Aplicar migración | `alembic upgrade head` | `python manage.py migrate` |
| Detectar cambios | Manual o con `--autogenerate` | Automático |

**Consecuencia real en este proyecto:** al añadir la columna `estado_pago` a la
tabla `citas` hubo que escribir el SQL a mano, porque
`Base.metadata.create_all()` crea tablas nuevas pero **no** altera las que ya
existen:

```sql
-- backend/scripts/migracion_01_estado_pago_citas.sql
ALTER TABLE citas
    ADD COLUMN IF NOT EXISTS estado_pago VARCHAR(15) NOT NULL DEFAULT 'pendiente';
```

Con Django habría bastado con añadir el campo al modelo y ejecutar dos
comandos. Es el precio de la flexibilidad de SQLAlchemy.

---

## 7. Autenticación

DRF trae un sistema de usuarios, grupos y permisos completo, más un panel de
administración donde gestionarlos sin escribir una línea.

En FastAPI todo eso se construye. En este proyecto significó escribir:

- El hashing con bcrypt y su verificación (`app/auth.py`).
- La creación y validación de los JWT.
- Las dependencias `obtener_usuario_actual` y `requerir_roles`.
- Las tablas `roles`, `permisos` y `rol_permisos`.

```python
# backend/app/routes/citas.py
@router.get("", dependencies=[Depends(requerir_roles("Administrador"))])
def listar_todas_las_citas(db: Session = Depends(get_db)):
    ...
```

**Valoración honesta:** DRF habría ahorrado bastante trabajo. La contrapartida
es que al construirlo se entiende exactamente qué hace cada pieza, que era uno
de los objetivos formativos, y que el modelo de roles quedó ajustado al
negocio (administrador, empleado, cliente) en lugar de adaptarse al de Django.

---

## 8. Rendimiento

FastAPI corre sobre Starlette y el estándar **ASGI**, pensado para
concurrencia. Django usa **WSGI** por defecto, donde cada petición ocupa un
proceso o hilo hasta terminar.

En las mediciones públicas de TechEmpower, FastAPI atiende del orden de dos a
tres veces más peticiones por segundo que Django REST Framework en escenarios
con entrada/salida (llamadas a servicios externos o consultas a base de datos).

Para el tráfico de un estudio de tatuajes la diferencia es irrelevante. Sí
importa en el endpoint del chatbot, donde cada petición se queda esperando
varios segundos a la IA: sin asincronía, diez conversaciones simultáneas
bloquearían diez procesos.

---

## 9. Cuándo conviene cada uno

**Conviene FastAPI cuando:**
- El producto es una API que consume un frontend separado (React, Vue, móvil).
- Hay integraciones con servicios externos lentos, como una IA o una pasarela de pago.
- Se valora la documentación automática y el tipado estático.
- El equipo prefiere construir solo lo que necesita.

**Conviene Django REST Framework cuando:**
- Hace falta un panel de administración desde el primer día.
- El proyecto es mayoritariamente CRUD sobre muchos modelos.
- Se quiere autenticación, permisos y migraciones resueltos de fábrica.
- El proyecto también sirve páginas renderizadas en el servidor.

---

## 10. Conclusión aplicada a Trazo Oscuro

Se eligió **FastAPI** por tres razones concretas del proyecto:

1. **El frontend es React y está separado.** No se necesita renderizado en el
   servidor ni plantillas, que es buena parte de lo que aporta Django.
2. **El chatbot depende de un servicio externo lento.** La asincronía nativa y
   `BackgroundTasks` resolvieron esto sin añadir Celery ni Redis.
3. **La documentación automática en `/docs`** sirvió durante todo el desarrollo
   para probar los 73 endpoints sin escribir cliente alguno.

El costo asumido fue construir a mano la autenticación, el sistema de roles y
las migraciones. Fue un costo aceptable, y en el caso de la autenticación
resultó formativo: entender por dentro cómo se firma un JWT y por qué el login
no debe distinguir entre "correo inexistente" y "contraseña incorrecta" es
difícil de aprender cuando el framework ya lo resolvió por ti.

---

## Referencias

- Documentación de FastAPI — https://fastapi.tiangolo.com
- Documentación de Django REST Framework — https://www.django-rest-framework.org
- Documentación de Pydantic v2 — https://docs.pydantic.dev
- Documentación de SQLAlchemy 2.0 — https://docs.sqlalchemy.org
- TechEmpower Framework Benchmarks — https://www.techempower.com/benchmarks
