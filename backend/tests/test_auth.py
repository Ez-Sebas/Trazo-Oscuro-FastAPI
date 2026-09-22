def test_registro_exitoso(client):
    payload = {
        "nombres": "Ana", "apellidos": "Gómez", "tipo_documento": "CC",
        "numero_documento": "1029384756", "direccion": "Calle 50 #20-10",
        "telefono": "3009998877", "email": "ana@test.com", "password": "Clave1234",
    }
    respuesta = client.post("/api/usuarios/registro", json=payload)

    assert respuesta.status_code == 201
    data = respuesta.json()
    assert data["email"] == "ana@test.com"
    assert "password" not in data
    assert "password_hash" not in data


def test_registro_correo_duplicado(client, usuario_registrado):
    respuesta = client.post("/api/usuarios/registro", json=usuario_registrado["payload"])
    assert respuesta.status_code == 409


def test_registro_documento_invalido(client):
    payload = {
        "nombres": "Ana", "apellidos": "Gómez", "tipo_documento": "CC",
        "numero_documento": "abc123", "direccion": "Calle 50 #20-10",
        "telefono": "3009998877", "email": "ana2@test.com", "password": "Clave1234",
    }
    respuesta = client.post("/api/usuarios/registro", json=payload)
    assert respuesta.status_code == 400


def test_login_exitoso(client, usuario_registrado):
    respuesta = client.post("/api/auth/login", json={
        "email": usuario_registrado["payload"]["email"],
        "password": usuario_registrado["payload"]["password"],
    })
    assert respuesta.status_code == 200
    data = respuesta.json()
    assert data["token"]
    assert data["usuario"]["rol"] == "Cliente"


def test_login_correo_inexistente(client):
    respuesta = client.post("/api/auth/login", json={
        "email": "noexiste@test.com", "password": "Clave1234",
    })
    assert respuesta.status_code == 401


def test_login_password_incorrecta(client, usuario_registrado):
    respuesta = client.post("/api/auth/login", json={
        "email": usuario_registrado["payload"]["email"], "password": "ClaveMala1",
    })
    assert respuesta.status_code == 401