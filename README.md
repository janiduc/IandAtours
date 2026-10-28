# I&A Tours

Website for I&A Tours, a Sri Lankan tour agency serving both foreign visitors and local travellers.
See [docs/PLAN.md](docs/PLAN.md) for the roadmap, [CONTRIBUTING.md](CONTRIBUTING.md) for the branching
strategy, [SECURITY.md](SECURITY.md) for security rules and [docs/DEPLOY.md](docs/DEPLOY.md) to put the
site online.

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

The API applies database migrations (Alembic) when it starts, and adds sample tours and vehicles
when those tables are empty. After changing `app/models.py`, create a migration with
`alembic revision --autogenerate -m "describe the change"` and review it before committing.

**First admin account** (then add other staff from the admin area):

```bash
python -m app.cli create-admin --email you@example.com --name "Your Name"
```

Sign in at http://localhost:5173/admin.

**Frontend** (http://localhost:5173, proxies `/api` to the backend):

```bash
cd frontend
cp .env.example .env   # optional: change VITE_WHATSAPP_NUMBERS
npm install
npm run dev
npm test
```

## Payments (PayHere)

Bookings work without a payment gateway: they arrive in the admin area as "Enquiry received" and staff
follow up. To take card payments online, create a PayHere merchant account and set the `PAYHERE_*`
values in `backend/.env`:

1. Start with a sandbox account at https://sandbox.payhere.lk and keep `PAYHERE_SANDBOX=true`.
2. In PayHere, add your website domain and copy the merchant ID and merchant secret.
3. `API_URL` must be reachable from the internet so PayHere can send payment notifications to
   `/api/payments/payhere/notify` (for local testing, use a tunnel such as ngrok).
4. For go-live, switch to the live merchant account and set `PAYHERE_SANDBOX=false`.

A booking is marked **Paid** only after PayHere's signed notification is verified and the amount and
currency match the booking. Card details never reach this server.

## AI assistant (free models)

Two agents share one small tool-calling runtime (`backend/app/agents/`):

- **Trip planner** (`/plan` on the website): suggests real I&A Tours packages, fleet options and prices.
  It can only read published tours, vehicles and prices: it has no access to bookings or customers.
- **Staff assistant** (inside each booking in the admin area): drafts a reply to the customer and
  suggests a free guide and a vehicle that fits the group. Its tools only see the booking that's open.
  Nothing is sent or saved until a staff member edits the draft and clicks to send or save.

It works with any OpenAI-compatible chat API, so switching provider is a config change. Free choices:

| Option | When | Setup |
| --- | --- | --- |
| [Ollama](https://ollama.com) on your computer | Development | `ollama pull qwen2.5:7b`, then `LLM_MODEL=qwen2.5:7b` |
| [Groq](https://console.groq.com) free tier | Live site | Create an API key, `LLM_BASE_URL=https://api.groq.com/openai/v1`, `LLM_MODEL=llama-3.3-70b-versatile` |
| [Google Gemini](https://aistudio.google.com) free tier | Live site | Create an API key, `LLM_BASE_URL=https://generativelanguage.googleapis.com/v1beta/openai`, `LLM_MODEL=gemini-2.5-flash` |

Pick a model that supports tool calling. Free tiers have daily limits, and some free plans may use
prompts to train models, which is one reason the trip planner never sees customer data. With
`LLM_MODEL` empty, the "Plan my trip" link and the admin assistant are hidden.

## Adding your photos and logo

Put files in `frontend/public/images/`. The site shows a styled placeholder until each file exists.

- Logo: `logo.png`
- Fleet photos are in `fleet/` (Allion, three HiAce vans, Coaster)
- Tours: `tours/cultural-triangle.jpg`, `tours/hill-country.jpg`, `tours/yala.jpg`,
  `tours/south-coast.jpg`, `tours/colombo.jpg`, `tours/grand-tour.jpg`

Tour prices and vehicle details in `backend/app/seed.py` are placeholders to replace.
