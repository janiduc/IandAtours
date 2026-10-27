from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db import get_db
from app.models import Tour
from app.schemas import TourOut

router = APIRouter(prefix="/api/tours", tags=["tours"])


@router.get("", response_model=list[TourOut])
def list_tours(
    region: str | None = None,
    featured: bool | None = None,
    max_days: int | None = None,
    db: Session = Depends(get_db),
):
    query = select(Tour).order_by(Tour.featured.desc(), Tour.duration_days)
    if region:
        query = query.where(Tour.region == region)
    if featured is not None:
        query = query.where(Tour.featured == featured)
    if max_days:
        query = query.where(Tour.duration_days <= max_days)
    return db.scalars(query).all()


@router.get("/{slug}", response_model=TourOut)
def get_tour(slug: str, db: Session = Depends(get_db)):
    tour = db.scalar(select(Tour).where(Tour.slug == slug))
    if tour is None:
        raise HTTPException(status_code=404, detail="Tour not found")
    return tour
