from pydantic import BaseModel, ConfigDict


class TourOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    slug: str
    title: str
    summary: str
    description: str
    region: str
    duration_days: int
    price_usd: int
    price_lkr: int
    highlights: list[str]
    image_url: str
    featured: bool


class VehicleOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    category: str
    seats: int
    air_conditioned: bool
    description: str
    image_url: str
