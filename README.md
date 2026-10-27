# I&A Tours

Website for I&A Tours, a Sri Lankan tour agency serving both foreign visitors and local travellers.
See [docs/PLAN.md](docs/PLAN.md) for the roadmap.

- `frontend/`: React + TypeScript (Vite)
- `backend/`: Python FastAPI + SQLAlchemy, PostgreSQL

## Run locally

**Database** (optional; without it the API uses a local SQLite file):

```bash
docker compose up -d db
cp backend/.env.example backend/.env
```

**Backend** (http://localhost:8000, API docs at `/docs`):

```bash
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements-dev.txt
uvicorn app.main:app --reload
pytest
```

Sample tours and vehicles are added automatically when the tables are empty.

**Frontend** (http://localhost:5173, proxies `/api` to the backend):

```bash
cd frontend
cp .env.example .env   # set VITE_WHATSAPP_NUMBER
npm install
npm run dev
npm test
```

## Adding your photos and logo

Put files in `frontend/public/images/`. The site shows a styled placeholder until each file exists.

- Logo: `logo.png`
- Fleet photos are in `fleet/` (Allion, three HiAce vans, Coaster)
- Tours: `tours/cultural-triangle.jpg`, `tours/hill-country.jpg`, `tours/yala.jpg`,
  `tours/south-coast.jpg`, `tours/colombo.jpg`, `tours/grand-tour.jpg`

Tour prices and vehicle details in `backend/app/seed.py` are placeholders to replace.
