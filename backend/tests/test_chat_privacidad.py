from app.models import Conversacion, Mensaje, Usuario


def _crear_segundo_cliente(client):
    payload = {
        "nombres": "Laura", "apellidos": "Ruiz", "tipo_documento": "CC",
        "numero_documento": "9876543210", "direccion": "Calle 2 #3-4",
        "telefono": "3007654321", "email": "laura@test.com", "password": "Clave1234",
    }
    client.post("/api/usuarios/registro", json=payload)
    respuesta = client.post("/api/auth/login", json={
        "email": payload["email"], "password": payload["password"],
    })
    return respuesta.json()["token"]


def test_historial_chat_requiere_sesion(client):
    respuesta = client.get("/api/chat/historial/sesion-privada")

    assert respuesta.status_code == 401


def test_historial_chat_solo_es_visible_para_su_propietario(client, db_session, token_cliente):
    cliente = db_session.query(Usuario).filter(Usuario.email == "juan@test.com").first()
    conversacion = Conversacion(id_cliente=cliente.id_usuario, session_id="sesion-privada")
    db_session.add(conversacion)
    db_session.flush()
    db_session.add(Mensaje(
        id_conversacion=conversacion.id_conversacion,
        remitente="cliente",
        contenido="Este mensaje es privado",
    ))
    db_session.commit()

    propia = client.get(
        "/api/chat/historial/sesion-privada",
        headers={"Authorization": f"Bearer {token_cliente}"},
    )
    assert propia.status_code == 200
    assert propia.json()["mensajes"][0]["contenido"] == "Este mensaje es privado"

    token_otro_cliente = _crear_segundo_cliente(client)
    ajena = client.get(
        "/api/chat/historial/sesion-privada",
        headers={"Authorization": f"Bearer {token_otro_cliente}"},
    )
    assert ajena.status_code == 200
    assert ajena.json()["mensajes"] == []
