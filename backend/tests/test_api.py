def test_health(client):
    assert client.get("/api/health").json() == {"status": "ok"}


def test_list_tours_puts_featured_first(client):
    tours = client.get("/api/tours").json()
    assert len(tours) == 6
    flags = [t["featured"] for t in tours]
    assert flags == sorted(flags, reverse=True)


def test_filter_tours(client):
    assert {t["region"] for t in client.get("/api/tours", params={"region": "South"}).json()} == {"South"}
    assert all(t["duration_days"] <= 3 for t in client.get("/api/tours", params={"max_days": 3}).json())
    assert all(t["featured"] for t in client.get("/api/tours", params={"featured": True}).json())


def test_get_tour_by_slug(client):
    tour = client.get("/api/tours/yala-safari").json()
    assert tour["title"] == "Yala Wildlife Safari"
    assert tour["price_usd"] > 0 and tour["price_lkr"] > 0


def test_unknown_tour_returns_404(client):
    assert client.get("/api/tours/nope").status_code == 404


def test_list_vehicles_sorted_by_seats(client):
    seats = [v["seats"] for v in client.get("/api/vehicles").json()]
    assert seats == sorted(seats) and len(seats) == 4


def test_seed_is_idempotent(client):
    from app.main import SessionLocal  # patched test session
    from app.seed import seed

    with SessionLocal() as session:
        seed(session)
    assert len(client.get("/api/tours").json()) == 6
