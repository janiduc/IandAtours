from datetime import date, timedelta

from tests.conftest import PASSWORD


def test_admin_routes_need_sign_in(client):
    assert client.get("/api/admin/bookings").status_code == 401
    assert client.get("/api/auth/me").status_code == 401


def test_login_sets_secure_cookie(client):
    response = client.post("/api/auth/login", json={"email": "Staff@iandatours.lk", "password": PASSWORD})
    assert response.status_code == 200
    cookie = response.headers["set-cookie"].lower()
    assert "httponly" in cookie and "samesite=strict" in cookie
    assert client.get("/api/auth/me").json()["role"] == "staff"


def test_wrong_password_is_rejected(client):
    response = client.post("/api/auth/login", json={"email": "staff@iandatours.lk", "password": "nope"})
    assert response.status_code == 401
    assert client.get("/api/auth/me").status_code == 401


def test_login_is_rate_limited(client):
    for _ in range(5):
        client.post("/api/auth/login", json={"email": "staff@iandatours.lk", "password": "wrong"})
    response = client.post("/api/auth/login", json={"email": "staff@iandatours.lk", "password": PASSWORD})
    assert response.status_code == 429


def test_logout_ends_session(staff_client):
    staff_client.post("/api/auth/logout")
    assert staff_client.get("/api/auth/me").status_code == 401


def test_tampered_token_is_rejected(client):
    client.cookies.set("iandatours_session", "not.a.jwt", path="/api")
    assert client.get("/api/auth/me").status_code == 401


def test_staff_cannot_manage_accounts(staff_client):
    assert staff_client.get("/api/admin/users").status_code == 403
    assert staff_client.post(
        "/api/admin/users", json={"email": "x@y.lk", "name": "X", "password": "a" * 12}
    ).status_code == 403


def test_admin_creates_staff_and_cannot_lock_self_out(admin_client):
    created = admin_client.post(
        "/api/admin/users", json={"email": "New@iandatours.lk", "name": "New", "password": "long-enough-pass"}
    )
    assert created.status_code == 201 and created.json()["email"] == "new@iandatours.lk"
    assert "password_hash" not in created.json()
    me = admin_client.get("/api/auth/me").json()
    assert admin_client.patch(f"/api/admin/users/{me['id']}", json={"active": False}).status_code == 400


def test_deactivated_user_loses_access(admin_client, client):
    users = {u["email"]: u for u in admin_client.get("/api/admin/users").json()}
    admin_client.patch(f"/api/admin/users/{users['staff@iandatours.lk']['id']}", json={"active": False})
    admin_client.post("/api/auth/logout")
    response = client.post("/api/auth/login", json={"email": "staff@iandatours.lk", "password": PASSWORD})
    assert response.status_code == 401


def test_unpublished_tour_disappears_from_public_site(staff_client):
    tour = next(t for t in staff_client.get("/api/admin/tours").json() if t["slug"] == "yala-safari")
    tour["published"] = False
    assert staff_client.put(f"/api/admin/tours/{tour['id']}", json={k: v for k, v in tour.items() if k != "id"}).status_code == 200
    assert staff_client.get("/api/tours/yala-safari").status_code == 404
    assert "yala-safari" not in [t["slug"] for t in staff_client.get("/api/tours").json()]


def test_duplicate_slug_conflicts(staff_client):
    tour = staff_client.get("/api/admin/tours").json()[0]
    body = {k: v for k, v in tour.items() if k != "id"}
    assert staff_client.post("/api/admin/tours", json=body).status_code == 409


def test_staff_manages_guides_and_assigns_booking(staff_client):
    guide = staff_client.post(
        "/api/admin/guides", json={"name": "Nimal Perera", "phone": "+94771234567", "languages": ["English", "German"]}
    ).json()
    booking = staff_client.post(
        "/api/bookings",
        json={
            "tour_slug": "yala-safari",
            "customer_name": "Anna Schmidt",
            "customer_email": "anna@example.com",
            "customer_phone": "+49 151 2345678",
            "country": "Germany",
            "travel_date": str(date.today() + timedelta(days=30)),
            "travellers": 2,
            "currency": "USD",
        },
    ).json()
    listed = staff_client.get("/api/admin/bookings").json()
    booking_id = next(b["id"] for b in listed if b["reference"] == booking["reference"])

    updated = staff_client.patch(
        f"/api/admin/bookings/{booking_id}",
        json={"guide_id": guide["id"], "vehicle_id": 2, "status": "confirmed", "staff_notes": "Pickup at airport"},
    )
    assert updated.status_code == 200
    assert updated.json()["status"] == "confirmed" and updated.json()["guide_id"] == guide["id"]
    assert staff_client.patch(f"/api/admin/bookings/{booking_id}", json={"guide_id": 999}).status_code == 404
