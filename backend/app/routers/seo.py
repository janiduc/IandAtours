from xml.sax.saxutils import escape

from fastapi import APIRouter, Depends
from fastapi.responses import PlainTextResponse, Response
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.config import settings
from app.db import get_db
from app.models import Tour

router = APIRouter(tags=["seo"])

STATIC_PAGES = ["/", "/tours", "/plan", "/fleet", "/contact", "/privacy"]


@router.get("/robots.txt", response_class=PlainTextResponse)
def robots():
    return f"User-agent: *\nDisallow: /admin\nDisallow: /booking/\nDisallow: /book/\n\nSitemap: {settings.site_url}/sitemap.xml\n"


@router.get("/sitemap.xml")
def sitemap(db: Session = Depends(get_db)):
    slugs = db.scalars(select(Tour.slug).where(Tour.published).order_by(Tour.slug)).all()
    paths = STATIC_PAGES + [f"/tours/{slug}" for slug in slugs]
    urls = "".join(f"<url><loc>{escape(settings.site_url + path)}</loc></url>" for path in paths)
    xml = f'<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">{urls}</urlset>'
    return Response(xml, media_type="application/xml")
