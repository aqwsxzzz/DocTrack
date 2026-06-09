# DocTrack — Project Status & Next Steps

> Start-here doc for continuing work. Read alongside [domain-model.md](domain-model.md).

## Where things stand

**Scaffold complete and verified** (FE `npm run web:build` passes):

- **Monorepo** — npm workspaces. `apps/web` (React) + `apps/api` (FastAPI). Root
  scripts: `web:dev`, `web:build`, `web:lint`, `api:up`, `api:down`, `dev`.
- **apps/web** — React 19, TS strict, Vite, TanStack Router + Query, Zustand,
  Tailwind v4, shadcn/ui (New York, neutral), ESLint with design-system guardrails.
  A placeholder index route renders.
- **apps/api** — FastAPI, SQLAlchemy async, Alembic (env wired to `Base.metadata`),
  Docker + docker-compose (Postgres 16), Ruff/mypy config, `/health` endpoint.
  Config via pydantic-settings. **No domain models yet.**
- **Git** initialized. **No husky/commitlint** (removed by request).
- `.npmrc` has `strict-ssl=false` (needed for installs on this machine).

## Domain model

Locked and documented in [domain-model.md](domain-model.md). Summary:
- **User** (login) vs **Client** (insured party), many-to-many via `UserClient`.
  Access comes ONLY from `UserClient`.
- **Feature 1 — Library:** generic docs (Póliza/Factura/Certificado) the admin
  publishes; clients download.
- **Feature 2 — Original Vault:** fianza originals with append-only custody ledger
  + cloud backup copy. `tender_type`, `tender_number`, `external_owner_id`,
  `contract_expiration_date`.

## Build plan (slices)

1. **Auth spine** ← next. BE: `User` + migration, bcrypt, `register`/`login` (JWT) /
   `me`, seeded admin. FE: login + register, Zustand auth store, protected shell,
   placeholder dashboard.
2. **Client + UserClient** + admin panel (create clients, wire members).
3. **Library** (upload/list/download) — forces storage-provider pick.
4. **Original Vault** + custody ledger.

## ⚠️ Open decisions — answer these before building Slice 1

1. **JWT delivery** — Bearer token (recommended, simplest) vs httpOnly cookies.
2. **Admin seed** — name + email + starting password for the admin (you), or use a
   placeholder (`admin@doctrack.local` / `changeme`) to edit later.
3. **Language** — Spanish-only vs bilingual (ES/EN). `i18next` is installed either
   way; this decides whether to set up translation files now or hardcode Spanish.

## Deferred

- Storage provider (Cloudflare R2 / Supabase / Backblaze — free tiers).
- Hosting for app + Postgres (Neon / Render / Fly / Supabase — free tiers).
