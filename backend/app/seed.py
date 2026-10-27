"""Sample tours and fleet so the site has content before the admin area exists.

Prices are placeholders for the agency to replace. Image paths point at
frontend/public/images/; the site shows a styled placeholder until the
real photos are added there.
"""

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models import Tour, Vehicle

TOURS = [
    {
        "slug": "cultural-triangle",
        "title": "Cultural Triangle Explorer",
        "summary": "Climb Sigiriya Rock, explore the Dambulla cave temples and the ancient city of Polonnaruwa.",
        "description": (
            "Three days in the heart of Sri Lanka's ancient kingdoms. Watch sunrise from Pidurangala, "
            "climb the Sigiriya rock fortress, visit the golden Dambulla cave temples and cycle through "
            "the ruins of Polonnaruwa, with an optional village experience in Habarana."
        ),
        "region": "Cultural Triangle",
        "duration_days": 3,
        "price_usd": 320,
        "price_lkr": 75000,
        "highlights": ["Sigiriya Rock Fortress", "Dambulla Cave Temple", "Polonnaruwa", "Habarana village tour"],
        "image_url": "/images/tours/cultural-triangle.jpg",
        "featured": True,
    },
    {
        "slug": "hill-country-escape",
        "title": "Kandy & Hill Country Escape",
        "summary": "Temple of the Tooth, tea estates in Nuwara Eliya and the famous train ride to Ella.",
        "description": (
            "From the sacred city of Kandy into the misty hills. Visit the Temple of the Tooth and the "
            "Peradeniya gardens, tour a working tea factory in Nuwara Eliya, then take the scenic train "
            "to Ella for Nine Arch Bridge and Little Adam's Peak."
        ),
        "region": "Hill Country",
        "duration_days": 4,
        "price_usd": 450,
        "price_lkr": 110000,
        "highlights": ["Temple of the Tooth", "Tea factory visit", "Kandy to Ella train", "Nine Arch Bridge"],
        "image_url": "/images/tours/hill-country.jpg",
        "featured": True,
    },
    {
        "slug": "yala-safari",
        "title": "Yala Wildlife Safari",
        "summary": "Jeep safaris in Yala National Park, home to leopards, elephants and sloth bears.",
        "description": (
            "Two days on the south-east coast with morning and afternoon jeep safaris in Yala, which has "
            "one of the highest leopard densities in the world. Includes a stop at Kataragama."
        ),
        "region": "South",
        "duration_days": 2,
        "price_usd": 280,
        "price_lkr": 65000,
        "highlights": ["Two jeep safaris", "Leopards and elephants", "Kataragama temple"],
        "image_url": "/images/tours/yala.jpg",
        "featured": True,
    },
    {
        "slug": "south-coast-beaches",
        "title": "Galle & South Coast Beaches",
        "summary": "Galle Fort, whale watching in Mirissa and relaxed days on the southern beaches.",
        "description": (
            "Walk the ramparts of Galle Fort, a UNESCO World Heritage site, go whale watching from Mirissa "
            "in season, visit a sea turtle hatchery and spend time on Unawatuna and Hiriketiya beaches."
        ),
        "region": "South Coast",
        "duration_days": 3,
        "price_usd": 300,
        "price_lkr": 70000,
        "highlights": ["Galle Fort", "Mirissa whale watching", "Turtle hatchery", "Beach time"],
        "image_url": "/images/tours/south-coast.jpg",
        "featured": False,
    },
    {
        "slug": "colombo-city-tour",
        "title": "Colombo City Day Tour",
        "summary": "A day around Colombo's markets, temples, colonial landmarks and Galle Face Green.",
        "description": (
            "A relaxed full-day tour of Colombo: Gangaramaya Temple, Pettah market, the Red Mosque, "
            "Independence Square and sunset at Galle Face Green. Ideal on arrival or departure day."
        ),
        "region": "Colombo",
        "duration_days": 1,
        "price_usd": 60,
        "price_lkr": 15000,
        "highlights": ["Gangaramaya Temple", "Pettah market", "Galle Face Green"],
        "image_url": "/images/tours/colombo.jpg",
        "featured": False,
    },
    {
        "slug": "grand-sri-lanka",
        "title": "Grand Sri Lanka Round Tour",
        "summary": "Ten days covering the ancient cities, hill country, wildlife and southern beaches.",
        "description": (
            "The complete island in ten days with a private driver-guide: the Cultural Triangle, Kandy, "
            "Nuwara Eliya, Ella, a Yala safari and the south coast, finishing in Colombo."
        ),
        "region": "Island-wide",
        "duration_days": 10,
        "price_usd": 1250,
        "price_lkr": 290000,
        "highlights": ["Sigiriya", "Kandy", "Ella train", "Yala safari", "Galle Fort"],
        "image_url": "/images/tours/grand-tour.jpg",
        "featured": True,
    },
]

VEHICLES = [
    {
        "name": "Toyota Allion",
        "category": "Car",
        "seats": 3,
        "air_conditioned": True,
        "description": "Comfortable sedan for couples and small families, ideal for airport transfers and day tours.",
        "image_url": "/images/fleet/car.jpg",
    },
    {
        "name": "Toyota HiAce KDH",
        "category": "Van",
        "seats": 8,
        "air_conditioned": True,
        "description": "Popular choice for families and small groups, with room for luggage on round tours.",
        "image_url": "/images/fleet/van-kdh.jpg",
    },
    {
        "name": "Toyota HiAce Grand Cabin",
        "category": "Van",
        "seats": 10,
        "air_conditioned": True,
        "description": "High-roof luxury van with extra headroom and comfortable seating for longer journeys.",
        "image_url": "/images/fleet/van-grandcabin.jpg",
    },
    {
        "name": "Toyota HiAce High Roof",
        "category": "Van",
        "seats": 12,
        "air_conditioned": True,
        "description": "Spacious high-roof van for larger families and groups travelling together.",
        "image_url": "/images/fleet/van-highroof.jpg",
    },
    {
        "name": "Toyota Coaster",
        "category": "Coach",
        "seats": 25,
        "air_conditioned": True,
        "description": "Mini coach for larger groups, school trips and corporate outings.",
        "image_url": "/images/fleet/coach.jpg",
    },
]


def seed(db: Session) -> None:
    """Insert sample data into empty tables only, so agency edits are never overwritten."""
    if db.scalar(select(Tour.id).limit(1)) is None:
        db.add_all(Tour(**tour) for tour in TOURS)
    if db.scalar(select(Vehicle.id).limit(1)) is None:
        db.add_all(Vehicle(**vehicle) for vehicle in VEHICLES)
    db.commit()
