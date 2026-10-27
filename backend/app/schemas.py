from datetime import date, datetime
from decimal import Decimal
from typing import Literal

from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator

from app.models import BookingStatus, Role

Currency = Literal["USD", "LKR"]


class ORM(BaseModel):
    model_config = ConfigDict(from_attributes=True)


# --- Tours -----------------------------------------------------------------


class TourBase(BaseModel):
    slug: str = Field(min_length=2, max_length=120, pattern=r"^[a-z0-9]+(?:-[a-z0-9]+)*$")
    title: str = Field(min_length=2, max_length=200)
    summary: str = Field(max_length=500)
    description: str = Field(max_length=10_000)
    region: str = Field(min_length=2, max_length=100)
    duration_days: int = Field(ge=1, le=60)
    price_usd: int = Field(ge=0)
    price_lkr: int = Field(ge=0)
    highlights: list[str] = Field(default_factory=list, max_length=20)
    image_url: str = Field(max_length=500)
    featured: bool = False


class TourIn(TourBase):
    published: bool = True


class TourOut(TourBase, ORM):
    id: int


class TourAdminOut(TourOut):
    published: bool


# --- Vehicles --------------------------------------------------------------


class VehicleBase(BaseModel):
    name: str = Field(min_length=2, max_length=120)
    category: str = Field(min_length=2, max_length=50)
    seats: int = Field(ge=1, le=100)
    air_conditioned: bool = True
    description: str = Field(max_length=2_000)
    image_url: str = Field(max_length=500)


class VehicleIn(VehicleBase):
    active: bool = True


class VehicleOut(VehicleBase, ORM):
    id: int


class VehicleAdminOut(VehicleOut):
    active: bool


# --- Guides ----------------------------------------------------------------


class GuideIn(BaseModel):
    name: str = Field(min_length=2, max_length=120)
    phone: str = Field(min_length=6, max_length=30)
    languages: list[str] = Field(default_factory=lambda: ["English"], max_length=10)
    notes: str = Field(default="", max_length=2_000)
    active: bool = True


class GuideOut(GuideIn, ORM):
    id: int


# --- Bookings --------------------------------------------------------------


class BookingCreate(BaseModel):
    tour_slug: str = Field(max_length=120)
    customer_name: str = Field(min_length=2, max_length=120)
    customer_email: EmailStr
    customer_phone: str = Field(min_length=6, max_length=30, pattern=r"^[0-9+()\- ]+$")
    country: str = Field(min_length=2, max_length=80)
    travel_date: date
    travellers: int = Field(ge=1, le=50)
    currency: Currency
    special_requests: str = Field(default="", max_length=2_000)

    @field_validator("travel_date")
    @classmethod
    def not_in_past(cls, value: date) -> date:
        if value < date.today():
            raise ValueError("Travel date can't be in the past")
        return value


class PayHereCheckout(BaseModel):
    """Fields the browser posts to PayHere's hosted checkout page."""

    action: str
    fields: dict[str, str]


class BookingCreated(BaseModel):
    reference: str
    status: BookingStatus
    amount: Decimal
    currency: str
    payment: PayHereCheckout | None


class BookingPublic(BaseModel):
    """What anyone holding the booking reference may see. No contact details."""

    reference: str
    status: BookingStatus
    tour_title: str
    travel_date: date
    travellers: int
    amount: Decimal
    currency: str


class PaymentOut(ORM):
    id: int
    provider: str
    provider_payment_id: str
    amount: Decimal
    currency: str
    status_code: int
    method: str
    created_at: datetime


class BookingAdminOut(ORM):
    id: int
    reference: str
    tour_id: int
    tour_title: str
    customer_name: str
    customer_email: str
    customer_phone: str
    country: str
    travel_date: date
    travellers: int
    currency: str
    amount: Decimal
    status: BookingStatus
    special_requests: str
    staff_notes: str
    guide_id: int | None
    vehicle_id: int | None
    created_at: datetime
    payments: list[PaymentOut]


class BookingUpdate(BaseModel):
    status: BookingStatus | None = None
    guide_id: int | None = None
    vehicle_id: int | None = None
    staff_notes: str | None = Field(default=None, max_length=5_000)


# --- Staff accounts --------------------------------------------------------


class LoginIn(BaseModel):
    email: EmailStr
    password: str = Field(max_length=200)


class UserOut(ORM):
    id: int
    email: str
    name: str
    role: Role
    active: bool


class UserCreate(BaseModel):
    email: EmailStr
    name: str = Field(min_length=2, max_length=120)
    password: str = Field(min_length=12, max_length=200)
    role: Role = Role.staff


class UserUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=2, max_length=120)
    role: Role | None = None
    active: bool | None = None
    password: str | None = Field(default=None, min_length=12, max_length=200)
