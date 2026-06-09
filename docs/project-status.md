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

1. **Auth spine** ✅ **built** (2026-06-09). BE: `User` model + migration, bcrypt,
   `register`/`login` (JWT Bearer) / `me`, admin seeded on startup. FE: login +
   register pages, Zustand auth store (persisted), axios Bearer interceptor,
   protected `_authenticated` shell, placeholder dashboard. FE verified
   (typecheck + build + lint clean). **BE not yet run** — needs `npm run api:up`
   (Docker) to apply the migration, seed admin, and smoke-test endpoints.
2. **Client + UserClient** ← next. Admin panel (create clients, wire members).
3. **Library** (upload/list/download) — forces storage-provider pick.
4. **Original Vault** + custody ledger.

## Decisions (resolved 2026-06-09)

1. **JWT delivery** = Bearer token (access token in `Authorization` header).
2. **Admin seed** = real values, hardcoded as config defaults (overridable by env):
   `Jorge Barreto` / `jbarretolarrosa@gmail.com` / `123456789` (throwaway — change
   once a change-password flow exists).
3. **Language** = Spanish-only. `i18next` installed but UI strings hardcoded in
   Spanish for now; no translation files yet.

## ⚠️ Before first BE run

- `access_token_ttl_minutes` is **15** and there is **no refresh-token flow yet**, so
  sessions expire after 15 min. Either bump the TTL in `.env` for now or add refresh
  tokens in a later pass.

## Deferred

- Storage provider (Cloudflare R2 / Supabase / Backblaze — free tiers).
- Hosting for app + Postgres (Neon / Render / Fly / Supabase — free tiers).
