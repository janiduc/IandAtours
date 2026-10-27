"""Admin area API. Every route needs a signed-in staff member; staff accounts need an admin."""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.db import Base, get_db
from app.models import Booking, BookingStatus, Guide, Tour, User, Vehicle
from app.schemas import (
    BookingAdminOut,
    BookingUpdate,
    GuideIn,
    GuideOut,
    TourAdminOut,
    TourIn,
    UserCreate,
    UserOut,
    UserUpdate,
    VehicleAdminOut,
    VehicleIn,
)
from app.security import hash_password, require_admin, require_staff

router = APIRouter(prefix="/api/admin", tags=["admin"], dependencies=[Depends(require_staff)])


def get_or_404[T: Base](db: Session, model: type[T], id: int) -> T:
    item = db.get(model, id)
    if item is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, f"{model.__name__} not found")
    return item


def save(db: Session, item):
    db.add(item)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(status.HTTP_409_CONFLICT, "That conflicts with an existing record")
    db.refresh(item)
    return item


# --- Tours -----------------------------------------------------------------


@router.get("/tours", response_model=list[TourAdminOut])
def list_tours(db: Session = Depends(get_db)):
    return db.scalars(select(Tour).order_by(Tour.title)).all()


@router.post("/tours", response_model=TourAdminOut, status_code=status.HTTP_201_CREATED)
def create_tour(body: TourIn, db: Session = Depends(get_db)):
    return save(db, Tour(**body.model_dump()))


@router.put("/tours/{tour_id}", response_model=TourAdminOut)
def update_tour(tour_id: int, body: TourIn, db: Session = Depends(get_db)):
    tour = get_or_404(db, Tour, tour_id)
    for key, value in body.model_dump().items():
        setattr(tour, key, value)
    return save(db, tour)


# Tours and vehicles are unpublished rather than deleted, so past bookings keep their history.


# --- Vehicles --------------------------------------------------------------


@router.get("/vehicles", response_model=list[VehicleAdminOut])
def list_vehicles(db: Session = Depends(get_db)):
    return db.scalars(select(Vehicle).order_by(Vehicle.seats)).all()


@router.post("/vehicles", response_model=VehicleAdminOut, status_code=status.HTTP_201_CREATED)
def create_vehicle(body: VehicleIn, db: Session = Depends(get_db)):
    return save(db, Vehicle(**body.model_dump()))


@router.put("/vehicles/{vehicle_id}", response_model=VehicleAdminOut)
def update_vehicle(vehicle_id: int, body: VehicleIn, db: Session = Depends(get_db)):
    vehicle = get_or_404(db, Vehicle, vehicle_id)
    for key, value in body.model_dump().items():
        setattr(vehicle, key, value)
    return save(db, vehicle)


# --- Guides ----------------------------------------------------------------


@router.get("/guides", response_model=list[GuideOut])
def list_guides(db: Session = Depends(get_db)):
    return db.scalars(select(Guide).order_by(Guide.name)).all()


@router.post("/guides", response_model=GuideOut, status_code=status.HTTP_201_CREATED)
def create_guide(body: GuideIn, db: Session = Depends(get_db)):
    return save(db, Guide(**body.model_dump()))


@router.put("/guides/{guide_id}", response_model=GuideOut)
def update_guide(guide_id: int, body: GuideIn, db: Session = Depends(get_db)):
    guide = get_or_404(db, Guide, guide_id)
    for key, value in body.model_dump().items():
        setattr(guide, key, value)
    return save(db, guide)


# --- Bookings --------------------------------------------------------------


@router.get("/bookings", response_model=list[BookingAdminOut])
def list_bookings(booking_status: BookingStatus | None = None, db: Session = Depends(get_db)):
    query = select(Booking).order_by(Booking.travel_date, Booking.id)
    if booking_status:
        query = query.where(Booking.status == booking_status)
    return db.scalars(query).all()


@router.get("/bookings/{booking_id}", response_model=BookingAdminOut)
def get_booking(booking_id: int, db: Session = Depends(get_db)):
    return get_or_404(db, Booking, booking_id)


@router.patch("/bookings/{booking_id}", response_model=BookingAdminOut)
def update_booking(booking_id: int, body: BookingUpdate, db: Session = Depends(get_db)):
    booking = get_or_404(db, Booking, booking_id)
    changes = body.model_dump(exclude_unset=True)
    if changes.get("guide_id") is not None:
        get_or_404(db, Guide, changes["guide_id"])
    if changes.get("vehicle_id") is not None:
        get_or_404(db, Vehicle, changes["vehicle_id"])
    for key, value in changes.items():
        setattr(booking, key, value)
    return save(db, booking)


# --- Staff accounts (admins only) -------------------------------------------


@router.get("/users", response_model=list[UserOut], dependencies=[Depends(require_admin)])
def list_users(db: Session = Depends(get_db)):
    return db.scalars(select(User).order_by(User.name)).all()


@router.post("/users", response_model=UserOut, status_code=status.HTTP_201_CREATED, dependencies=[Depends(require_admin)])
def create_user(body: UserCreate, db: Session = Depends(get_db)):
    user = User(email=body.email.lower(), name=body.name, role=body.role, password_hash=hash_password(body.password))
    return save(db, user)


@router.patch("/users/{user_id}", response_model=UserOut)
def update_user(
    user_id: int, body: UserUpdate, db: Session = Depends(get_db), admin: User = Depends(require_admin)
):
    user = get_or_404(db, User, user_id)
    changes = body.model_dump(exclude_unset=True)
    if user.id == admin.id and (changes.get("active") is False or changes.get("role", user.role) != user.role):
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "You can't deactivate or demote your own account")
    if "password" in changes:
        user.password_hash = hash_password(changes.pop("password"))
    for key, value in changes.items():
        setattr(user, key, value)
    return save(db, user)
