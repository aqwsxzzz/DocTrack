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
2. **Client + UserClient** ✅ **built** (2026-06-09). BE: `Client` + `UserClient`
   models + migration, paged/searchable `GET /clients` (admin sees all, members
   see only wired), client CRUD (admin), member wiring (`GET/POST/DELETE
   /clients/{id}/members`), `GET /auth/users` (admin picker). Access enforced via
   `UserClient` only. FE: admin-guarded `/admin/clients` list (search + paginate +
   create dialog), client detail with member management, admin nav link. Verified
   (curl access-control matrix + FE typecheck/build/lint).
3. **Library** (upload/list/download) ✅ **built** (2026-06-09). Storage behind a
   `StorageBackend` interface with a **Cloudinary** adapter (authenticated `raw`
   uploads, time-limited signed download URLs; `public_id = <uuid>/<filename>` so
   downloads keep the original name). `StoredFile` + `LibraryDocument` models +
   migration `0003`. Endpoints: upload / list / download-url / delete, all gated by
   the `UserClient` rule (delete is admin-only). FE: client documents view
   (`/clients/:id`) for admins + wired members, dashboard client cards. Verified
   e2e (real upload → signed download round-trip + access matrix) and FE
   typecheck/build/lint.
4. **Original Vault** + custody ledger ✅ **built** (2026-06-09). `OriginalDocument`
   (filed-under `client_id` controls access; `external_owner_id` is a reference
   only) + append-only `CustodyEvent` ledger + `TenderType` enum, migration `0004`.
   Optional Cloudinary backup copy reuses `StoredFile`. Endpoints: originals
   create/list/get/delete, backup download, custody add/list — current holder =
   latest event by `occurred_at`; holder is an app user or a free label. All gated
   by `UserClient` (delete admin-only). FE: originals list + create dialog on the
   client page, custody detail route (`/clients/:id/originals/:oid`) with timeline,
   add-movement form, and backup download. Verified e2e (custody ordering, holder
   resolution, backup round-trip, access matrix) and FE typecheck/build/lint.

**All four planned slices are built.**

### Library redesign ✅ built (2026-06-12)

The domain model was refined (see [domain-model.md](domain-model.md) → *Insurance types*)
and the flat Library was re-sliced into a typed Seguro hierarchy.

- BE: **`Seguro`** parent (`insurance_type`, `numero_poliza`, `vigencia_desde/hasta`,
  `estado`, per-type `attributes` JSONB) + **`SeguroDocument`** child (1 seguro → N docs,
  `doc_kind`), replacing `LibraryDocument`. Per-type attribute schemas validated in code
  (`attributes.py`, `extra="forbid"`); only Vehículos (matrícula/chasis/motor/padrón) and
  Fianzas (licitación nº/tipo/duración) populate the bag. Endpoints: seguro
  create/list+filter/get/delete + document upload/list/download/delete, gated by the
  `UserClient` rule (delete admin-only). Filtering by `insurance_type`, `estado`, and a
  search over `numero_poliza` + the JSONB vehicle fields. Migration `0006` drops
  `library_documents`, creates `seguros` + `seguro_documents`.
- FE: `client-library` lists/filters seguros with a per-type create dialog; new detail
  route `/clients/:id/seguros/:seguroId` shows seguro facts + its documents
  (upload/download/delete).
- **Vault untouched** — Library and Vault stay decoupled, even for fianzas.

### Two top-level views + seguro edit ✅ built (2026-06-12)

Split the two features into their own top-level sections, each defaulting to a
cross-client "see all" list, and added seguro editing.

- BE: `PATCH /seguros/{id}` (edit fields, attributes re-validated against the final
  type, gated by client access). New cross-client lists **`GET /seguros`** and
  **`GET /originals`** — scoped to the caller's accessible clients (admin = all,
  member = wired) via `client.service.visible_client_ids_query`, with an optional
  `client_id` narrow filter; both now return `client_name`.
- FE: two fully separate sections with a **tab switcher** (`SectionTabs`:
  Documentación ↔ Bóveda) — `/seguros` and `/boveda`, each a browser over all
  accessible clients with a **Cliente (Todos / uno)** filter, a client column, and a
  create dialog with a **client picker**. Seguro detail has an **Editar** dialog
  (shared `SeguroFields` between create/edit).
- Verified: FE lint/typecheck/build clean; BE e2e (global lists with `client_name`,
  full-object PATCH switching type Vehículos→Fianzas with attribute re-validation,
  estado filter). Vault access unchanged (admins + wired members).

### IA finalized: split views, no combined page (2026-06-12)

- **Documentación (`/seguros`) is the landing** — index/login/register/brand all point
  there; the old `/dashboard` is removed.
- **Library and Vault are never combined.** The combined `/clients/:id` page and the
  member dashboard were deleted; per-client browsing now lives behind the Cliente
  filter on each section.
- **Detail pages are top-level:** `/seguros/:seguroId` and `/boveda/:originalId` (the
  record carries its client). This also fixed a latent bug — the old detail routes were
  nested under `clients/$clientId.tsx`, which had no `<Outlet/>`, so they rendered blank.
- Admin client page's "Ver documentos" now points to `/seguros`.
- Verified: FE typecheck/build/lint clean; BE e2e against `api:up` (migration `0006`
  applied, create→201 with attribute normalization, JSONB matricula filter, and the
  extra-key / bad-vigencia validators returning 422). **Still unverified:** document
  upload→download round-trip (needs a real file + Cloudinary, like the existing Library).

### Post-slice additions

- **Change-password flow** (2026-06-10). BE: `POST /auth/change-password` (auth-only,
  verifies current password via bcrypt, 400 on mismatch, 204 on success) +
  `ChangePasswordRequest` schema + `service.change_password`. FE: `/account` route
  under the `_authenticated` guard with `ChangePasswordForm` (current + new + confirm,
  zod-validated), reachable via the user's name in the header. FE verified
  (typecheck/build/lint clean). **BE not yet run** — verify on next `npm run api:up`.
  Closes the throwaway-admin-password gap.

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

- ~~Storage provider~~ — chosen: **Cloudinary** (authenticated raw assets). Creds in
  gitignored `apps/api/.env` (`CLOUDINARY_*`).
- Hosting for app + Postgres (Neon / Render / Fly / Supabase — free tiers).
- Library polish: signed-URL TTL is 300s; no inline preview/thumbnails yet.
