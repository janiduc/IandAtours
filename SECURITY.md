# Security

I&A Tours handles traveller personal data (names, contact details, nationality and travel
dates) and payments. These rules apply to every change.

## Reporting a vulnerability

Please do not open a public issue. Contact the maintainers privately on WhatsApp or by email.

## Rules

### Secrets
- Never commit secrets. API keys, database passwords and payment credentials live in `.env`
  files (git-ignored) locally and in the host's secret manager in production.
- `.env.example` files contain placeholders only.
- Rotate any secret that is ever committed, even if the commit is removed.

### Payments
- Card details never touch our servers. We use the payment gateway's hosted checkout
  (PayHere), so the gateway handles PCI DSS compliance.
- Payment confirmations are trusted only after verifying the gateway's signed server-to-server
  notification, never from the browser redirect alone.

### Personal data
- Collect only what a booking needs. Do not store passport numbers unless legally required.
- Restrict personal data to the admin area, behind authentication.
- Follow Sri Lanka's Personal Data Protection Act (PDPA, No. 9 of 2022) and, for EU visitors, GDPR:
  publish a privacy policy, allow data deletion requests, and define a retention period.
- Never send personal data to logs or third-party analytics.

### Admin area and API
- Admin accounts use strong passwords hashed with Argon2 or bcrypt, and support two-factor auth.
- Role-based access (admin, staff, guide): each role sees only what it needs.
- Rate-limit login and public form endpoints.
- Validate all input with Pydantic schemas; use the ORM, never string-built SQL.
- CORS allows only the site's own origins. HTTPS everywhere in production.
- Interactive API docs (`/docs`) are disabled in production.

### AI agents
- Agents act through a fixed set of tools with the least access they need. The traveller-facing
  planner can read tours and availability but cannot change bookings or see other customers' data.
- Anything that sends a message to a customer or changes a booking requires staff approval.
- Treat customer messages as untrusted input (prompt injection): they can never grant an agent
  extra permissions.
- Do not send unnecessary personal data to model providers. Prefer providers and plans that do not
  train on submitted data once real customer data is involved.

### Dependencies and CI
- Dependabot keeps dependencies patched; CI runs tests on every pull request.
