import secrets
from decimal import Decimal

from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app import payhere
from app.config import settings
from app.db import get_db
from app.models import Booking, BookingStatus, Tour
from app.schemas import BookingCreate, BookingCreated, BookingPublic, PayHereCheckout
from app.security import booking_limiter, client_ip

router = APIRouter(prefix="/api/bookings", tags=["bookings"])


def new_reference() -> str:
    # e.g. IA-7KQ2M9XD: short enough to read out on the phone, too random to guess.
    alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"
    return "IA-" + "".join(secrets.choice(alphabet) for _ in range(8))


def checkout_for(booking: Booking) -> PayHereCheckout:
    first, _, last = booking.customer_name.partition(" ")
    amount = payhere.format_amount(booking.amount)
    fields = {
        "merchant_id": settings.payhere_merchant_id,
        "return_url": f"{settings.site_url}/booking/{booking.reference}",
        "cancel_url": f"{settings.site_url}/booking/{booking.reference}?cancelled=1",
        "notify_url": f"{settings.api_url}/api/payments/payhere/notify",
        "order_id": booking.reference,
        "items": booking.tour.title,
        "currency": booking.currency,
        "amount": amount,
        "first_name": first,
        "last_name": last or first,
        "email": booking.customer_email,
        "phone": booking.customer_phone,
        "address": "-",
        "city": "-",
        "country": booking.country,
        "hash": payhere.checkout_hash(booking.reference, booking.amount, booking.currency),
    }
    return PayHereCheckout(action=payhere.checkout_url(), fields=fields)


@router.post("", response_model=BookingCreated, status_code=status.HTTP_201_CREATED)
def create_booking(body: BookingCreate, request: Request, db: Session = Depends(get_db)):
    if not booking_limiter.hit(client_ip(request)):
        raise HTTPException(status.HTTP_429_TOO_MANY_REQUESTS, "Too many bookings from this connection. Please contact us on WhatsApp.")
    tour = db.scalar(select(Tour).where(Tour.slug == body.tour_slug, Tour.published))
    if tour is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Tour not found")

    unit_price = tour.price_usd if body.currency == "USD" else tour.price_lkr
    booking = Booking(
        reference=new_reference(),
        tour=tour,
        customer_name=body.customer_name.strip(),
        customer_email=body.customer_email.lower(),
        customer_phone=body.customer_phone.strip(),
        country=body.country.strip(),
        travel_date=body.travel_date,
        travellers=body.travellers,
        currency=body.currency,
        amount=Decimal(unit_price) * body.travellers,
        special_requests=body.special_requests.strip(),
        status=BookingStatus.pending_payment if settings.payments_enabled else BookingStatus.enquiry,
    )
    db.add(booking)
    db.commit()

    return BookingCreated(
        reference=booking.reference,
        status=booking.status,
        amount=booking.amount,
        currency=booking.currency,
        payment=checkout_for(booking) if settings.payments_enabled else None,
    )


@router.get("/options")
def booking_options():
    """Tells the booking form whether to send travellers to online payment."""
    return {"online_payment": settings.payments_enabled}


@router.get("/{reference}", response_model=BookingPublic)
def get_booking(reference: str, db: Session = Depends(get_db)):
    booking = db.scalar(select(Booking).where(Booking.reference == reference.upper()))
    if booking is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Booking not found")
    return BookingPublic(
        reference=booking.reference,
        status=booking.status,
        tour_title=booking.tour.title,
        travel_date=booking.travel_date,
        travellers=booking.travellers,
        amount=booking.amount,
        currency=booking.currency,
    )
