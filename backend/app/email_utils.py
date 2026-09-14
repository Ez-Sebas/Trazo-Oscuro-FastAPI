import os
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

SMTP_HOST = os.getenv("SMTP_HOST")
SMTP_PORT = int(os.getenv("SMTP_PORT", 587))
SMTP_USER = os.getenv("SMTP_USER")
SMTP_PASSWORD = (os.getenv("SMTP_PASSWORD") or "").replace(" ", "")
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:5173")


def construir_enlace_recuperacion(token: str) -> str:
    return f"{FRONTEND_URL}/restablecer-password?token={token}"


def enviar_correo_recuperacion(destinatario: str, token: str) -> bool:
    enlace = construir_enlace_recuperacion(token)

    cuerpo_html = f"""
    <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; color: #1E293B;">
        <h2 style="color:#B91C1C;">Trazo Oscuro</h2>
        <p>Recibimos una solicitud para restablecer tu contraseña.</p>
        <p>Haz clic en el siguiente botón para continuar (el enlace es válido por 30 minutos):</p>
        <a href="{enlace}"
            style="display:inline-block;background:#B91C1C;color:#ffffff;
                padding:12px 24px;border-radius:6px;text-decoration:none;margin:16px 0;">
            Restablecer contraseña
        </a>
        <p style="color:#64748B;font-size:13px;">
            Si tú no solicitaste este cambio, puedes ignorar este correo con tranquilidad.
        </p>
    </div>
    """

    mensaje = MIMEMultipart("alternative")
    mensaje["Subject"] = "Recupera tu contraseña - Trazo Oscuro"
    mensaje["From"] = SMTP_USER
    mensaje["To"] = destinatario
    mensaje.attach(MIMEText(cuerpo_html, "html"))

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