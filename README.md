# Kira Initiative

A private men's health companion. Anonymous AI guidance for patients, with secure escalation to verified doctors.

## Stack

- **Frontend:** React 18 + Vite + Tailwind + Framer Motion (built in phase 2)
- **Backend:** Node 20+ / Express / Socket.io / Prisma
- **DB:** PostgreSQL 16
- **AI:** Anthropic Claude (Sonnet 4.6 chat + classifier + summary; Vision for scans)

## Local setup

```bash
# 1. Install
npm install

# 2. Start Postgres
docker compose up -d postgres

# 3. Copy env
cp .env.example .env
# Fill in ANTHROPIC_API_KEY and adjust other values

# 4. Migrate + seed DB
npm run db:migrate
npm run db:seed

# 5. Run backend
npm run dev:server

# Backend on http://localhost:4000
```

## Project structure

```
kira-initiative/
├── server/    # Express API, Claude service, Socket.io, Prisma
└── client/    # React app (patient + doctor) - phase 2
```

## API surface

See `server/routes/` — each file maps to its `/api/<name>` mount point.

| Mount | Auth | Purpose |
|-------|------|---------|
| `/api/auth` | none / JWT | Doctor signup, login, 2FA |
| `/api/sessions` | none | Anonymous patient sessions |
| `/api/ai` | session token | Claude chat, classifier, vision, summary |
| `/api/safety` | session token | Server-side policy checks |
| `/api/scans` | session token | Image upload + Vision |
| `/api/escalations` | session token / JWT | Patient → doctor handoff |
| `/api/doctors` | mixed | Doctor directory + profile |
| `/api/consultations` | mixed | Real-time consult, messages, SOAP, notes |
| `/api/prescriptions` | JWT | Upload + retrieve prescriptions |
| `/api/appointments` | mixed | Booking |
| `/api/hospitals` | none | Public hospital directory |
| `/api/feed` | none | "Others have asked" anonymised feed |
| `/api/admin` | JWT (admin) | Verification + security logs |

## Safety invariants

These are enforced server-side and can NEVER be bypassed by the client:

1. All Claude calls happen server-side. The API key never reaches the browser.
2. Anonymous session tokens are stored in client React state only — no localStorage, no cookies.
3. `isSexualHealth` and `scanLocked` are permanent per session once set true.
4. Internal doctor notes (`InternalNote`) are never returned by any patient endpoint.
5. The anonymous AI chat transcript is NEVER shared with doctors — only the AI-generated `symptomSummary` is.
6. Escalation requires `consentConfirmed: true` in the request body.
7. Scan image files are deleted from disk after Vision analysis completes; only the text result is retained.
8. Rate limit: 30 AI requests per session per hour.
