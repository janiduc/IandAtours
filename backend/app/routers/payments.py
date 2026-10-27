import logging
from decimal import Decimal, InvalidOperation

from fastapi import APIRouter, Depends, Form, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app import payhere
from app.db import get_db
from app.models import Booking, BookingStatus, Payment

router = APIRouter(prefix="/api/payments", tags=["payments"])
log = logging.getLogger(__name__)

# Statuses a payment notification may move a booking out of. Staff decisions are never overwritten.
UPDATABLE = {BookingStatus.pending_payment, BookingStatus.payment_failed, BookingStatus.paid}


@router.post("/payhere/notify", status_code=status.HTTP_200_OK)
def payhere_notify(
    merchant_id: str = Form(...),
    order_id: str = Form(...),
    payhere_amount: str = Form(...),
    payhere_currency: str = Form(...),
    status_code: str = Form(...),
    md5sig: str = Form(...),
    payment_id: str = Form(""),
    method: str = Form(""),
    db: Session = Depends(get_db),
):
    if not payhere.notification_is_valid(merchant_id, order_id, payhere_amount, payhere_currency, status_code, md5sig):
        log.warning("Rejected PayHere notification with a bad signature for order %s", order_id)
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Invalid signature")

    booking = db.scalar(select(Booking).where(Booking.reference == order_id))
    if booking is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Unknown order")

    try:
        amount = Decimal(payhere_amount)
        code = int(status_code)
    except (InvalidOperation, ValueError):
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Malformed notification")

    db.add(
        Payment(
            booking=booking,
            provider="payhere",
            provider_payment_id=payment_id[:64],
            amount=amount,
            currency=payhere_currency,
            status_code=code,
            method=method[:30],
        )
    )

    # Only a payment of the full amount, in the booked currency, counts as paid.
    matches_booking = payhere_currency == booking.currency and amount == Decimal(booking.amount)
    if booking.status in UPDATABLE:
        if code == payhere.SUCCESS and matches_booking:
            booking.status = BookingStatus.paid
        elif code == payhere.SUCCESS:
            log.error("PayHere amount mismatch for %s: got %s %s", order_id, payhere_amount, payhere_currency)
        elif code in (payhere.FAILED, payhere.CANCELLED) and booking.status != BookingStatus.paid:
            booking.status = BookingStatus.payment_failed
        elif code == payhere.CHARGED_BACK:
            booking.status = BookingStatus.payment_failed
    db.commit()
    return {"ok": True}
