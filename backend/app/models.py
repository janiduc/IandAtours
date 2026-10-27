import enum
from datetime import date, datetime, timezone

from sqlalchemy import JSON, Boolean, Date, DateTime, Enum, ForeignKey, Integer, Numeric, String, Text, true
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db import Base


def utcnow() -> datetime:
    return datetime.now(timezone.utc)


class Tour(Base):
    __tablename__ = "tours"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    slug: Mapped[str] = mapped_column(String(120), unique=True, index=True)
    title: Mapped[str] = mapped_column(String(200))
    summary: Mapped[str] = mapped_column(String(500))
    description: Mapped[str] = mapped_column(Text)
    region: Mapped[str] = mapped_column(String(100), index=True)
    duration_days: Mapped[int] = mapped_column(Integer)
    # Foreign visitors pay in USD, locals in LKR; both prices are set by the agency.
    price_usd: Mapped[int] = mapped_column(Integer)
    price_lkr: Mapped[int] = mapped_column(Integer)
    highlights: Mapped[list[str]] = mapped_column(JSON, default=list)
    image_url: Mapped[str] = mapped_column(String(500))
    featured: Mapped[bool] = mapped_column(Boolean, default=False)
    # Unpublished tours stay in the admin area but are hidden from the public site.
    published: Mapped[bool] = mapped_column(Boolean, default=True, server_default=true())


class Vehicle(Base):
    __tablename__ = "vehicles"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    name: Mapped[str] = mapped_column(String(120))
    category: Mapped[str] = mapped_column(String(50))
    seats: Mapped[int] = mapped_column(Integer)
    air_conditioned: Mapped[bool] = mapped_column(Boolean, default=True)
    description: Mapped[str] = mapped_column(Text)
    image_url: Mapped[str] = mapped_column(String(500))
    active: Mapped[bool] = mapped_column(Boolean, default=True, server_default=true())


class Guide(Base):
    __tablename__ = "guides"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    name: Mapped[str] = mapped_column(String(120))
    phone: Mapped[str] = mapped_column(String(30))
    languages: Mapped[list[str]] = mapped_column(JSON, default=list)
    notes: Mapped[str] = mapped_column(Text, default="")
    active: Mapped[bool] = mapped_column(Boolean, default=True)


class Role(str, enum.Enum):
    admin = "admin"  # everything, including staff accounts
    staff = "staff"  # tours, fleet, guides and bookings


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True)
    name: Mapped[str] = mapped_column(String(120))
    password_hash: Mapped[str] = mapped_column(String(255))
    role: Mapped[Role] = mapped_column(Enum(Role, native_enum=False, length=20))
    active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)


class BookingStatus(str, enum.Enum):
    pending_payment = "pending_payment"  # created, waiting for the traveller to pay
    enquiry = "enquiry"  # online payment off; staff follow up manually
    paid = "paid"  # payment verified with the gateway
    confirmed = "confirmed"  # staff assigned guide and vehicle
    completed = "completed"
    cancelled = "cancelled"
    payment_failed = "payment_failed"


class Booking(Base):
    __tablename__ = "bookings"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    # Random, unguessable reference shown to the traveller and used as the payment order ID.
    reference: Mapped[str] = mapped_column(String(32), unique=True, index=True)
    tour_id: Mapped[int] = mapped_column(ForeignKey("tours.id"))
    customer_name: Mapped[str] = mapped_column(String(120))
    customer_email: Mapped[str] = mapped_column(String(255))
    customer_phone: Mapped[str] = mapped_column(String(30))
    country: Mapped[str] = mapped_column(String(80))
    travel_date: Mapped[date] = mapped_column(Date)
    travellers: Mapped[int] = mapped_column(Integer)
    currency: Mapped[str] = mapped_column(String(3))
    # Calculated on the server from the tour price; never taken from the browser.
    amount: Mapped[float] = mapped_column(Numeric(12, 2))
    status: Mapped[BookingStatus] = mapped_column(
        Enum(BookingStatus, native_enum=False, length=20), default=BookingStatus.pending_payment, index=True
    )
    special_requests: Mapped[str] = mapped_column(Text, default="")
    staff_notes: Mapped[str] = mapped_column(Text, default="")
    guide_id: Mapped[int | None] = mapped_column(ForeignKey("guides.id"), nullable=True)
    vehicle_id: Mapped[int | None] = mapped_column(ForeignKey("vehicles.id"), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow, onupdate=utcnow)

    tour: Mapped[Tour] = relationship()
    guide: Mapped[Guide | None] = relationship()
    vehicle: Mapped[Vehicle | None] = relationship()
    payments: Mapped[list["Payment"]] = relationship(back_populates="booking", order_by="Payment.id")

    @property
    def tour_title(self) -> str:
        return self.tour.title


class Payment(Base):
    """One verified notification from the payment gateway. Card details are never stored."""

    __tablename__ = "payments"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    booking_id: Mapped[int] = mapped_column(ForeignKey("bookings.id"), index=True)
    provider: Mapped[str] = mapped_column(String(30))
    provider_payment_id: Mapped[str] = mapped_column(String(64), default="")
    amount: Mapped[float] = mapped_column(Numeric(12, 2))
    currency: Mapped[str] = mapped_column(String(3))
    status_code: Mapped[int] = mapped_column(Integer)
    method: Mapped[str] = mapped_column(String(30), default="")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)

    booking: Mapped[Booking] = relationship(back_populates="payments")
