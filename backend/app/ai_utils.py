"""
Cliente de IA para el asistente virtual.

Se apoya en el formato *OpenAI Chat Completions*, que es el estándar que hoy
exponen prácticamente todos los proveedores. Gracias a eso cambiar de
proveedor es solo cambiar tres variables de entorno (URL, modelo y clave),
sin tocar una línea de código.

Proveedor principal: Groq (https://console.groq.com) — capa gratuita
permanente, sin tarjeta de crédito, limitada por peticiones/minuto y por día
(no por un saldo que se agota para siempre).

Opcionalmente se puede configurar un proveedor secundario: si el principal
responde 429 (límite por minuto) o falla, se reintenta con el secundario.
Ambos son IA real; el asistente nunca responde con texto enlatado.
"""

import asyncio
import json
import os
import time
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen

# Sin un User-Agent propio, urllib envía "Python-urllib/3.x" y el CDN de
# Groq responde 403 (error 1010) antes de llegar a la API. Con esta cabecera
# la petición pasa con normalidad.
USER_AGENT = "TrazoOscuro/1.0 (+asistente-virtual)"

TIEMPO_ESPERA_SEGUNDOS = 30
REINTENTOS_POR_LIMITE = 2
ESPERA_ENTRE_REINTENTOS = 2.0


class ErrorIA(RuntimeError):
    """Ningún proveedor de IA pudo responder."""


def _proveedor(prefijo: str, url_por_defecto: str = "", modelo_por_defecto: str = "") -> dict | None:
    """Lee un proveedor desde las variables de entorno con el prefijo indicado."""
    clave = os.getenv(f"{prefijo}_API_KEY", "").strip()
    if not clave:
        return None
    return {
        "nombre": prefijo.capitalize(),
        "api_key": clave,
        "base_url": os.getenv(f"{prefijo}_BASE_URL", url_por_defecto).strip().rstrip("/"),
        "modelo": os.getenv(f"{prefijo}_MODEL", modelo_por_defecto).strip(),
    }


def obtener_proveedores() -> list:
    """
    Devuelve los proveedores configurados, en orden de preferencia.
    Se ignoran silenciosamente los que no tengan clave.
    """
    candidatos = [
        # Principal: Groq (capa gratuita permanente).
        _proveedor("GROQ", "https://api.groq.com/openai/v1", "openai/gpt-oss-20b"),
        # Secundario opcional: OpenRouter, también con modelos gratuitos.
        _proveedor("OPENROUTER", "https://openrouter.ai/api/v1", "meta-llama/llama-3.3-70b-instruct:free"),
        # Compatibilidad con la configuración anterior de Grok (xAI, de pago).
        _proveedor("GROK", "https://api.x.ai/v1", "grok-3-mini"),
    ]
    return [proveedor for proveedor in candidatos if proveedor]


def _llamar_proveedor(proveedor: dict, mensajes: list) -> str:
    """Hace la petición HTTP (bloqueante) a un proveedor concreto."""
    cuerpo = json.dumps({
        "model": proveedor["modelo"],
        "messages": mensajes,
        "temperature": 0.6,
        "max_tokens": 400,
    }).encode("utf-8")

    peticion = Request(
        f"{proveedor['base_url']}/chat/completions",
        data=cuerpo,
        headers={
            "Authorization": f"Bearer {proveedor['api_key']}",
            "Content-Type": "application/json",
            "User-Agent": USER_AGENT,
            "Accept": "application/json",
        },
        method="POST",
    )

    for intento in range(REINTENTOS_POR_LIMITE + 1):
        try:
            with urlopen(peticion, timeout=TIEMPO_ESPERA_SEGUNDOS) as respuesta:
                datos = json.loads(respuesta.read().decode("utf-8"))
            return datos["choices"][0]["message"]["content"].strip()

        except HTTPError as error:
            detalle = error.read().decode("utf-8", errors="replace")[:300]
            # 429 = se superó el límite por minuto. Vale la pena esperar y reintentar.
            if error.code == 429 and intento < REINTENTOS_POR_LIMITE:
                time.sleep(ESPERA_ENTRE_REINTENTOS * (intento + 1))
                continue
            raise ErrorIA(f"{proveedor['nombre']} respondió HTTP {error.code}: {detalle}") from error

        except URLError as error:
            raise ErrorIA(f"No fue posible conectar con {proveedor['nombre']}: {error.reason}") from error

        except (KeyError, IndexError, ValueError) as error:
            raise ErrorIA(f"Respuesta inesperada de {proveedor['nombre']}: {error}") from error

    raise ErrorIA(f"{proveedor['nombre']} sigue limitando las peticiones (429).")


async def obtener_respuesta_ia(mensajes: list) -> tuple[str, str]:
    """
    Pide una respuesta a la IA recorriendo los proveedores configurados.

    'mensajes' es una lista [{"role": ..., "content": ...}, ...].
    Devuelve (respuesta, nombre_del_proveedor).
    Lanza ErrorIA si ninguno pudo responder.
    """
    proveedores = obtener_proveedores()

    if not proveedores:
        raise ErrorIA(
            "No hay ningún proveedor de IA configurado. Define GROQ_API_KEY en el archivo .env "
            "(la clave se obtiene gratis en https://console.groq.com/keys)."
        )

    fallos = []
    for proveedor in proveedores:
        try:
            respuesta = await asyncio.to_thread(_llamar_proveedor, proveedor, mensajes)
            return respuesta, proveedor["nombre"]
        except ErrorIA as error:
            fallos.append(str(error))

    raise ErrorIA(" | ".join(fallos))
