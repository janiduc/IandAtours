# Deploying I&A Tours

The repository includes a [Render](https://render.com) Blueprint (`render.yaml`) that creates three things:

| Render resource | What it is |
| --- | --- |
| `iandatours-api` | The FastAPI backend, built from `backend/Dockerfile` |
| `iandatours-web` | The React website (static files), which forwards `/api/*` to the API |
| `iandatours-db` | PostgreSQL |

Render deploys automatically whenever `main` changes, so releases follow the branching strategy:
merge `develop` into `main` and the new version goes live.

## First deploy

1. Sign in to Render with GitHub and allow access to the `IandAtours` repository.
2. **New + → Blueprint**, choose the repository and branch `main`.
3. Render asks for the values marked `sync: false`. For the first deploy:
   - `SITE_URL`: `https://iandatours-web.onrender.com`
   - `API_URL`: `https://iandatours-api.onrender.com`
   - `CORS_ORIGINS`: `["https://iandatours-web.onrender.com"]`
   - PayHere and `LLM_*` values: leave empty for now. Bookings arrive as enquiries and the AI
     assistant stays hidden until you fill them in.
4. Click **Apply**. The first build takes a few minutes.
5. If Render gave the API a different address (for example because the name was taken), update the
   three `destination` URLs in `render.yaml`, and `SITE_URL`, `API_URL` and `CORS_ORIGINS`.
6. Create your admin account. In the Render dashboard open `iandatours-api` → **Shell** (paid instances)
   or run it locally against the Render database's external URL:

   ```bash
   cd backend
   DATABASE_URL="<External Database URL from Render>" python -m app.cli create-admin --email you@example.com --name "Your Name"
   ```

7. Visit the website, sign in at `/admin`, and replace the sample tour prices and photos.

The database schema is created automatically on startup (Alembic migrations). The six sample tours and
the fleet are added only when those tables are empty.

## Before taking real bookings

The free plans are good for trying the site, but not for real customers:

- **Database:** free Render Postgres expires after 30 days and has no backups. Upgrade `iandatours-db`
  to a paid plan, which includes daily backups.
- **API:** free instances sleep after 15 minutes without traffic and take about a minute to wake up.
  Upgrade `iandatours-api` to a paid instance so customers and PayHere notifications never wait.
- The website (static site) is free.

See [Render's free tier limits](https://render.com/docs/free) for details.

## Your own domain

1. Buy a domain (for example `iandatours.lk` from the LK Domain Registry, or a `.com`).
2. In Render, open `iandatours-web` → **Settings → Custom Domains**, add `www.yourdomain` and the bare
   domain, and add the DNS records Render shows you. HTTPS certificates are automatic.
3. Update `SITE_URL` and `CORS_ORIGINS` on `iandatours-api` to the new address.

## Turning on payments (PayHere)

1. Create a PayHere merchant account and add your domain under **Integrations**.
2. Set `PAYHERE_MERCHANT_ID` and `PAYHERE_MERCHANT_SECRET` on `iandatours-api`.
3. Test with a sandbox account first (`PAYHERE_SANDBOX=true`), then switch to your live account and set
   `PAYHERE_SANDBOX=false`. The API refuses to start in production with sandbox mode and live keys mixed up.
4. `API_URL` must be the public API address: PayHere sends payment confirmations to
   `API_URL/api/payments/payhere/notify`.

## Turning on the AI assistant

Set `LLM_BASE_URL`, `LLM_MODEL` and `LLM_API_KEY` on `iandatours-api` (see the README for free options
such as Groq or Gemini). Try it on `/plan` and in a booking in the admin area before announcing it.

## Launch checklist

- [ ] Real tour prices, descriptions and photos entered in the admin area
- [ ] Logo added at `frontend/public/images/logo.png`
- [ ] Blue van photo replaced (dealer watermark)
- [ ] Privacy policy (`/privacy`) reviewed, ideally by a lawyer
- [ ] Database and API on paid plans
- [ ] PayHere tested in sandbox, then switched to live
- [ ] AI assistant tested with the chosen free model
- [ ] Staff accounts created; everyone uses a password manager
- [ ] GitHub branch protection on `main` and `develop`
- [ ] Site submitted to Google Search Console with `/sitemap.xml`
- [ ] Release tagged on GitHub (for example `v1.0.0`)
