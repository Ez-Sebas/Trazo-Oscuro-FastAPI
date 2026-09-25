import os
import smtplib
from html import escape
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

SMTP_HOST = os.getenv("SMTP_HOST")
SMTP_PORT = int(os.getenv("SMTP_PORT", 587))
SMTP_USER = os.getenv("SMTP_USER")
SMTP_PASSWORD = (os.getenv("SMTP_PASSWORD") or "").replace(" ", "")
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:5173")


def construir_enlace_recuperacion(token: str) -> str:
    return f"{FRONTEND_URL}/restablecer-password?token={token}"


def _crear_mensaje(destinatario: str, asunto: str, cuerpo_texto: str, contenido: str) -> MIMEMultipart:
    cuerpo_html = f"""
    <!doctype html>
    <html lang="es">
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>{escape(asunto)}</title>
    </head>
    <body style="margin:0;padding:0;background:#f2f0ee;font-family:Arial,Helvetica,sans-serif;color:#292524;">
        <div style="display:none;max-height:0;overflow:hidden;opacity:0;">{escape(cuerpo_texto.splitlines()[0])}</div>
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#f2f0ee;padding:32px 16px;">
            <tr><td align="center">
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width:600px;background:#ffffff;border:1px solid #ded9d5;">
                    <tr>
                        <td style="background:#0a0a0a;padding:24px 32px;">
                            <p style="margin:0;color:#f5f5f4;font-family:Georgia,serif;font-size:22px;letter-spacing:2px;">TRAZO OSCURO</p>
                            <p style="margin:7px 0 0;color:#d97979;font-size:10px;letter-spacing:3px;text-transform:uppercase;">Estudio de tatuajes</p>
                        </td>
                    </tr>
                    <tr><td style="padding:36px 32px 32px;">{contenido}</td></tr>
                    <tr>
                        <td style="border-top:1px solid #ebe7e4;padding:20px 32px;background:#faf9f8;">
                            <p style="margin:0;color:#78716c;font-size:12px;line-height:1.6;">Este correo fue enviado automáticamente. Si necesitas ayuda, responde a este mensaje o contacta al estudio.</p>
                            <p style="margin:10px 0 0;color:#a8a29e;font-size:11px;">Trazo Oscuro · Medellín, Colombia</p>
                        </td>
                    </tr>
                </table>
            </td></tr>
        </table>
    </body>
    </html>
    """
    mensaje = MIMEMultipart("alternative")
    mensaje["Subject"] = asunto
    mensaje["From"] = SMTP_USER
    mensaje["To"] = destinatario
    mensaje.attach(MIMEText(cuerpo_texto, "plain", "utf-8"))
    mensaje.attach(MIMEText(cuerpo_html, "html", "utf-8"))
    return mensaje


def enviar_correo_recuperacion(destinatario: str, token: str) -> bool:
    enlace = construir_enlace_recuperacion(token)
    enlace_seguro = escape(enlace, quote=True)
    asunto = "Recupera tu contraseña - Trazo Oscuro"
    cuerpo_texto = f"""Recibimos una solicitud para restablecer tu contraseña.

Usa este enlace para continuar (es válido durante 30 minutos):
{enlace}

Si no solicitaste este cambio, puedes ignorar este correo.
"""
    contenido = f"""
        <p style="margin:0 0 10px;color:#b91c1c;font-size:11px;font-weight:bold;letter-spacing:2px;text-transform:uppercase;">Seguridad de tu cuenta</p>
        <h1 style="margin:0 0 16px;color:#292524;font-family:Georgia,serif;font-size:30px;font-weight:normal;line-height:1.2;">Restablece tu contraseña</h1>
        <p style="margin:0 0 24px;color:#57534e;font-size:15px;line-height:1.7;">Recibimos una solicitud para cambiar la contraseña de tu cuenta. Usa el botón para continuar de forma segura.</p>
        <table role="presentation" cellspacing="0" cellpadding="0" border="0"><tr><td style="background:#b91c1c;border-radius:5px;">
            <a href="{enlace_seguro}" style="display:inline-block;padding:14px 22px;color:#ffffff;font-size:14px;font-weight:bold;text-decoration:none;">Restablecer contraseña</a>
        </td></tr></table>
        <p style="margin:24px 0 0;padding:16px;border-left:3px solid #d97979;background:#faf4f3;color:#78716c;font-size:13px;line-height:1.6;"><strong style="color:#44403c;">Importante:</strong> este enlace caduca en 30 minutos y solo puede utilizarse una vez.</p>
        <p style="margin:24px 0 0;color:#a8a29e;font-size:12px;line-height:1.6;">Si el botón no funciona, copia y pega este enlace en tu navegador:<br><span style="color:#b91c1c;word-break:break-all;">{enlace_seguro}</span></p>
    """
    mensaje = _crear_mensaje(destinatario, asunto, cuerpo_texto, contenido)

    try:
        with smtplib.SMTP(SMTP_HOST, SMTP_PORT, timeout=10) as servidor:
            servidor.starttls()
            servidor.login(SMTP_USER, SMTP_PASSWORD)
            servidor.sendmail(SMTP_USER, destinatario, mensaje.as_string())
        print(f"[EMAIL] Correo de recuperación enviado correctamente a {destinatario}")
        return True

    except smtplib.SMTPAuthenticationError:
        print(
            "[EMAIL] ERROR DE AUTENTICACIÓN: revisa SMTP_USER y SMTP_PASSWORD en tu .env. "
            "La contraseña de aplicación puede haber sido revocada o tener espacios. "
            "Genera una nueva en myaccount.google.com/apppasswords."
        )
        return False

    except smtplib.SMTPRecipientsRefused:
        print(f"[EMAIL] El servidor de destino rechazó al destinatario {destinatario}.")
        return False

    except smtplib.SMTPException as error:
        print(f"[EMAIL] Error SMTP: {error}")
        return False

    except Exception as error:
        print(f"[EMAIL] Error inesperado enviando correo: {error}")
        return False

def enviar_correo_confirmacion_venta(destinatario: str, id_venta: int, total: float) -> bool:
    total_formateado = f"${total:,.0f} COP"
    asunto = f"Confirmación de compra #{id_venta} - Trazo Oscuro"
    cuerpo_texto = f"""Tu pago fue confirmado correctamente.

Pedido: #{id_venta}
Total pagado: {total_formateado}

Gracias por comprar en Trazo Oscuro. Puedes consultar el estado de tu pedido desde tu cuenta.
"""
    contenido = f"""
        <p style="margin:0 0 10px;color:#b91c1c;font-size:11px;font-weight:bold;letter-spacing:2px;text-transform:uppercase;">Pago confirmado</p>
        <h1 style="margin:0 0 16px;color:#292524;font-family:Georgia,serif;font-size:30px;font-weight:normal;line-height:1.2;">Gracias por tu compra</h1>
        <p style="margin:0 0 24px;color:#57534e;font-size:15px;line-height:1.7;">Tu pago fue confirmado correctamente. Hemos registrado tu pedido y te mantendremos informado sobre su estado.</p>
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin:8px 0 24px;background:#faf9f8;border:1px solid #ebe7e4;">
            <tr><td style="padding:18px 20px;color:#78716c;font-size:12px;text-transform:uppercase;letter-spacing:1px;">Número de pedido</td><td align="right" style="padding:18px 20px;color:#292524;font-size:16px;font-weight:bold;">#{id_venta}</td></tr>
            <tr><td style="padding:0 20px 18px;color:#78716c;font-size:12px;text-transform:uppercase;letter-spacing:1px;">Total pagado</td><td align="right" style="padding:0 20px 18px;color:#b91c1c;font-size:18px;font-weight:bold;">{escape(total_formateado)}</td></tr>
        </table>
        <p style="margin:0;padding:16px;border-left:3px solid #b91c1c;background:#faf4f3;color:#57534e;font-size:13px;line-height:1.6;">Puedes consultar el estado de tu pedido desde tu cuenta en Trazo Oscuro.</p>
    """
    mensaje = _crear_mensaje(destinatario, asunto, cuerpo_texto, contenido)

    try:
        with smtplib.SMTP(SMTP_HOST, SMTP_PORT, timeout=10) as servidor:
            servidor.starttls()
            servidor.login(SMTP_USER, SMTP_PASSWORD)
            servidor.sendmail(SMTP_USER, destinatario, mensaje.as_string())
        print(f"[EMAIL] Confirmación de venta #{id_venta} enviada a {destinatario}")
        return True
    except Exception as error:
        print(f"[EMAIL] Error enviando confirmación de venta: {error}")
        return False
    

def enviar_correo_confirmacion_cita(destinatario: str, id_cita: int, token: str, servicio_nombre: str, fecha: str, hora: str) -> bool:
    enlace = f"{FRONTEND_URL}/citas/confirmar?token={token}"
    enlace_seguro = escape(enlace, quote=True)
    servicio_seguro = escape(servicio_nombre)
    asunto = "Confirma tu cita - Trazo Oscuro"
    cuerpo_texto = f"""Tu solicitud de cita fue registrada.

Servicio: {servicio_nombre}
Fecha: {fecha}
Hora: {hora}

Confirma tu cita en este enlace (válido durante 48 horas):
{enlace}
"""
    contenido = f"""
        <p style="margin:0 0 10px;color:#b91c1c;font-size:11px;font-weight:bold;letter-spacing:2px;text-transform:uppercase;">Solicitud recibida</p>
        <h1 style="margin:0 0 16px;color:#292524;font-family:Georgia,serif;font-size:30px;font-weight:normal;line-height:1.2;">Confirma tu cita</h1>
        <p style="margin:0 0 24px;color:#57534e;font-size:15px;line-height:1.7;">Tu solicitud fue registrada. Revisa los detalles y confirma tu asistencia desde el siguiente botón.</p>
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin:8px 0 24px;background:#faf9f8;border:1px solid #ebe7e4;">
            <tr><td style="padding:18px 20px 8px;color:#78716c;font-size:11px;text-transform:uppercase;letter-spacing:1px;">Servicio</td></tr>
            <tr><td style="padding:0 20px 18px;color:#292524;font-family:Georgia,serif;font-size:18px;">{servicio_seguro}</td></tr>
            <tr><td style="padding:0 20px 18px;color:#57534e;font-size:14px;">{escape(fecha)} · {escape(hora)}</td></tr>
        </table>
        <table role="presentation" cellspacing="0" cellpadding="0" border="0"><tr><td style="background:#b91c1c;border-radius:5px;">
            <a href="{enlace_seguro}" style="display:inline-block;padding:14px 22px;color:#ffffff;font-size:14px;font-weight:bold;text-decoration:none;">Confirmar mi cita</a>
        </td></tr></table>
        <p style="margin:24px 0 0;padding:16px;border-left:3px solid #d97979;background:#faf4f3;color:#78716c;font-size:13px;line-height:1.6;"><strong style="color:#44403c;">Importante:</strong> este enlace es válido durante 48 horas.</p>
    """
    mensaje = _crear_mensaje(destinatario, asunto, cuerpo_texto, contenido)

    try:
        with smtplib.SMTP(SMTP_HOST, SMTP_PORT, timeout=10) as servidor:
            servidor.starttls()
            servidor.login(SMTP_USER, SMTP_PASSWORD)
            servidor.sendmail(SMTP_USER, destinatario, mensaje.as_string())
        print(f"[EMAIL] Confirmación de cita #{id_cita} enviada a {destinatario}")
        return True
    except Exception as error:
        print(f"[EMAIL] Error enviando confirmación de cita: {error}")
        return False
