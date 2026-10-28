from app.config import settings


def test_robots_blocks_admin_and_points_to_sitemap(client, monkeypatch):
    monkeypatch.setattr(settings, "site_url", "https://iandatours.lk")
    text = client.get("/robots.txt").text
    assert "Disallow: /admin" in text
    assert "Sitemap: https://iandatours.lk/sitemap.xml" in text


def test_sitemap_lists_published_tours(staff_client, monkeypatch):
    monkeypatch.setattr(settings, "site_url", "https://iandatours.lk")
    tour = next(t for t in staff_client.get("/api/admin/tours").json() if t["slug"] == "yala-safari")
    staff_client.put(f"/api/admin/tours/{tour['id']}", json={k: v for k, v in tour.items() if k != "id"} | {"published": False})

    response = staff_client.get("/sitemap.xml")
    assert response.headers["content-type"].startswith("application/xml")
    assert "<loc>https://iandatours.lk/tours/cultural-triangle</loc>" in response.text
    assert "yala-safari" not in response.text
    assert "<loc>https://iandatours.lk/privacy</loc>" in response.text
