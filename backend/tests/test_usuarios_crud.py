def test_perfil_propio_requiere_autenticacion(client):
    respuesta = client.get("/api/usuarios/perfil/me")
    assert respuesta.status_code == 401


def test_perfil_propio_exitoso(client, token_cliente):
    respuesta = client.get(
        "/api/usuarios/perfil/me",
        headers={"Authorization": f"Bearer {token_cliente}"},
    )
    assert respuesta.status_code == 200
    assert respuesta.json()["usuario"]["email"] == "juan@test.com"


def test_listar_usuarios_prohibido_para_cliente(client, token_cliente):
    respuesta = client.get(
        "/api/usuarios",
        headers={"Authorization": f"Bearer {token_cliente}"},
    )
    assert respuesta.status_code == 403


def test_listar_usuarios_permitido_para_admin(client, token_admin):
    respuesta = client.get(
        "/api/usuarios",
        headers={"Authorization": f"Bearer {token_admin}"},
    )
    assert respuesta.status_code == 200
    assert len(respuesta.json()["usuarios"]) >= 1


def test_crud_completo_usuario_como_admin(client, token_admin):
    headers = {"Authorization": f"Bearer {token_admin}"}

    # CREATE
    payload = {
        "nombres": "Carlos", "apellidos": "Ruiz", "tipo_documento": "CC",
        "numero_documento": "5566778899", "direccion": "Cra 10 #5-5",
        "telefono": "3005556677", "email": "carlos@test.com", "password": "Clave1234",
        "id_rol": 3,
    }
    respuesta_crear = client.post("/api/usuarios", json=payload, headers=headers)
    assert respuesta_crear.status_code == 201
    id_usuario = respuesta_crear.json()["id_usuario"]

    # READ
    respuesta_leer = client.get(f"/api/usuarios/{id_usuario}", headers=headers)
    assert respuesta_leer.status_code == 200
    assert respuesta_leer.json()["usuario"]["nombres"] == "Carlos"

    # UPDATE
    payload_editado = {
        "nombres": "Carlos Andrés", "apellidos": "Ruiz", "tipo_documento": "CC",
        "numero_documento": "5566778899", "direccion": "Nueva dirección 123", "telefono": "3005556677",
    }
    respuesta_editar = client.put(f"/api/usuarios/{id_usuario}", json=payload_editado, headers=headers)
    assert respuesta_editar.status_code == 200

    # CAMBIAR ESTADO
    respuesta_estado = client.patch(
        f"/api/usuarios/{id_usuario}/estado", json={"estado": "inactivo"}, headers=headers
    )
    assert respuesta_estado.status_code == 200

    # DELETE
    respuesta_eliminar = client.delete(f"/api/usuarios/{id_usuario}", headers=headers)
    assert respuesta_eliminar.status_code == 200

    respuesta_verificar = client.get(f"/api/usuarios/{id_usuario}", headers=headers)
    assert respuesta_verificar.status_code == 404