import os
import stripe

stripe.api_key = os.getenv("STRIPE_SECRET_KEY")
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:5173")
STRIPE_WEBHOOK_SECRET = os.getenv("STRIPE_WEBHOOK_SECRET")


def crear_checkout_session(id_venta: int, detalles: list):
    """
    Crea una sesión de Stripe Checkout en modo TEST.
    Nota sobre moneda: COP se envía como monto entero (sin centavos),
    consistente con la forma en que Stripe trata a este tipo de moneda.
    Al usar Checkout alojado por Stripe, el frontend NO necesita cargar
    el SDK de Stripe.js: solo redirige al 'url' que devuelve este método.
    """
    line_items = [
        {
            "price_data": {
                "currency": "cop",
                "product_data": {"name": d["nombre_item"]},
                "unit_amount": int(round(float(d["precio_unitario"]))),
            },
            "quantity": d["cantidad"],
        }
        for d in detalles
    ]

    session = stripe.checkout.Session.create(
        mode="payment",
        payment_method_types=["card"],
        line_items=line_items,
        success_url=f"{FRONTEND_URL}/checkout/exito?session_id={{CHECKOUT_SESSION_ID}}",
        cancel_url=f"{FRONTEND_URL}/checkout/cancelado",
        metadata={"id_venta": str(id_venta)},
    )
    return session


def obtener_sesion(session_id: str):
    return stripe.checkout.Session.retrieve(session_id)


def construir_evento_webhook(payload: bytes, firma: str):
    return stripe.Webhook.construct_event(payload, firma, STRIPE_WEBHOOK_SECRET)

def crear_reembolso(payment_intent_id: str):
    return stripe.Refund.create(payment_intent=payment_intent_id)   