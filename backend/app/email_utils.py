import os
import smtplib
from dotenv import load_dotenv
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

load_dotenv()

SMTP_HOST = os.getenv("SMTP_HOST")
SMTP_PORT = int(os.getenv("SMTP_PORT", 587))
SMTP_USER = os.getenv("SMTP_USER")
SMTP_PASSWORD = os.getenv("SMTP_PASSWORD")
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:5173")


def enviar_correo_recuperacion(destinatario: str, token: str) -> bool:
    enlace = f"{FRONTEND_URL}/restablecer-password?token={token}"

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
        with smtplib.SMTP(SMTP_HOST, SMTP_PORT) as servidor:
            servidor.starttls()
            servidor.login(SMTP_USER, SMTP_PASSWORD)
            servidor.sendmail(SMTP_USER, destinatario, mensaje.as_string())
        return True
    except Exception as error:
        print(f"Error enviando correo de recuperación: {error}")
        return False