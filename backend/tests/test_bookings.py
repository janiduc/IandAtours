import hashlib
from datetime import date, timedelta

import pytest

from app import payhere
from app.config import settings


def booking_body(**overrides):
    body = {
        "tour_slug": "cultural-triangle",
        "customer_name": "Kasun Silva",
        "customer_email": "kasun@example.com",
        "customer_phone": "0771234567",
        "country": "Sri Lanka",
        "travel_date": str(date.today() + timedelta(days=14)),
        "travellers": 3,
        "currency": "LKR",
    }
    return body | overrides


def md5u(value: str) -> str:
    return hashlib.md5(value.encode()).hexdigest().upper()


def notify(client, reference, amount, currency="LKR", status_code="2", secret="test-secret", merchant="1211149"):
    sig = md5u(f"{merchant}{reference}{amount}{currency}{status_code}{md5u(secret)}")
    return client.post(
        "/api/payments/payhere/notify",
        data={
            "merchant_id": merchant,
            "order_id": reference,
            "payhere_amount": amount,
            "payhere_currency": currency,
            "status_code": status_code,
            "md5sig": sig,
            "payment_id": "320025071278",
            "method": "VISA",
        },
    )


def test_booking_options(client, monkeypatch):
    assert client.get("/api/bookings/options").json() == {"online_payment": False}
    monkeypatch.setattr(settings, "payhere_merchant_id", "1")
    monkeypatch.setattr(settings, "payhere_merchant_secret", "s")
    assert client.get("/api/bookings/options").json() == {"online_payment": True}


def test_booking_without_payments_is_an_enquiry(client):
    response = client.post("/api/bookings", json=booking_body())
    assert response.status_code == 201
    data = response.json()
    assert data["status"] == "enquiry" and data["payment"] is None
    assert data["reference"].startswith("IA-")


def test_price_is_calculated_on_server(client):
    # Cultural Triangle is LKR 75,000 / USD 320 per person in the seed data.
    lkr = client.post("/api/bookings", json=booking_body(amount=1)).json()
    usd = client.post("/api/bookings", json=booking_body(currency="USD", travellers=2)).json()
    assert float(lkr["amount"]) == 225_000 and lkr["currency"] == "LKR"
    assert float(usd["amount"]) == 640 and usd["currency"] == "USD"


@pytest.mark.parametrize(
    "override",
    [
        {"travel_date": str(date.today() - timedelta(days=1))},
        {"travellers": 0},
        {"currency": "EUR"},
        {"customer_email": "not-an-email"},
        {"customer_phone": "<script>"},
    ],
)
def test_invalid_bookings_are_rejected(client, override):
    assert client.post("/api/bookings", json=booking_body(**override)).status_code == 422


def test_unknown_tour(client):
    assert client.post("/api/bookings", json=booking_body(tour_slug="nope")).status_code == 404


def test_public_booking_view_hides_contact_details(client):
    reference = client.post("/api/bookings", json=booking_body()).json()["reference"]
    data = client.get(f"/api/bookings/{reference}").json()
    assert data["tour_title"] == "Cultural Triangle Explorer"
    assert "customer_email" not in data and "customer_phone" not in data
    assert client.get("/api/bookings/IA-NOTREAL1").status_code == 404


def test_booking_returns_signed_payhere_checkout(client, payhere_enabled):
    data = client.post("/api/bookings", json=booking_body()).json()
    assert data["status"] == "pending_payment"
    fields = data["payment"]["fields"]
    assert data["payment"]["action"] == "https://sandbox.payhere.lk/pay/checkout"
    assert fields["amount"] == "225000.00" and fields["currency"] == "LKR"
    assert fields["order_id"] == data["reference"]
    assert fields["hash"] == md5u(f"1211149{data['reference']}225000.00LKR{md5u('test-secret')}")
    assert fields["notify_url"].endswith("/api/payments/payhere/notify")


def test_verified_payment_marks_booking_paid(client, payhere_enabled):
    reference = client.post("/api/bookings", json=booking_body()).json()["reference"]
    assert notify(client, reference, "225000.00").status_code == 200
    assert client.get(f"/api/bookings/{reference}").json()["status"] == "paid"


def test_forged_payment_notification_is_rejected(client, payhere_enabled):
    reference = client.post("/api/bookings", json=booking_body()).json()["reference"]
    assert notify(client, reference, "225000.00", secret="guessed").status_code == 400
    assert notify(client, reference, "225000.00", merchant="9999999").status_code == 400
    assert client.get(f"/api/bookings/{reference}").json()["status"] == "pending_payment"


def test_underpayment_does_not_mark_paid(client, payhere_enabled):
    reference = client.post("/api/bookings", json=booking_body()).json()["reference"]
    notify(client, reference, "1.00")
    assert client.get(f"/api/bookings/{reference}").json()["status"] == "pending_payment"


def test_failed_payment(client, payhere_enabled):
    reference = client.post("/api/bookings", json=booking_body()).json()["reference"]
    notify(client, reference, "225000.00", status_code="-2")
    assert client.get(f"/api/bookings/{reference}").json()["status"] == "payment_failed"


def test_payment_is_recorded_for_staff(staff_client, payhere_enabled):
    reference = staff_client.post("/api/bookings", json=booking_body()).json()["reference"]
    notify(staff_client, reference, "225000.00")
    booking = next(b for b in staff_client.get("/api/admin/bookings").json() if b["reference"] == reference)
    assert booking["payments"][0]["method"] == "VISA"


def test_booking_rate_limit(client):
    for _ in range(10):
        client.post("/api/bookings", json=booking_body())
    assert client.post("/api/bookings", json=booking_body()).status_code == 429


def test_production_requires_real_secret(monkeypatch):
    from pydantic import ValidationError

    from app.config import Settings

    monkeypatch.setenv("ENVIRONMENT", "production")
    with pytest.raises(ValidationError):
        Settings()
    monkeypatch.setenv("SECRET_KEY", "x" * 40)
    assert Settings().is_production


def test_checkout_url_switches_to_live(monkeypatch):
    monkeypatch.setattr(settings, "payhere_sandbox", False)
    assert payhere.checkout_url() == "https://www.payhere.lk/pay/checkout"
