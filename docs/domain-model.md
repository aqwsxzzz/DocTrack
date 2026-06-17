# DocTrack — Domain Model

## Purpose

DocTrack helps an insurance assessor (admin) and their clients manage two distinct
documentation needs:

1. **Library** — **seguros** the assessor publishes, each a typed record (Vehículos,
   Incendio, Fianzas, …) grouping its documents (póliza, recibos, facturas, …) that
   clients can self-serve and download any time. Type-specific fields exist mainly to
   **filter/search**; the files are the point.
2. **Original Vault** — physical original *fianza* (surety bond) documents whose
   **location/custody is tracked** over time, backed by an unofficial cloud copy.

These are two separate features with different primary value: in the Library the
**file is the point**; in the Vault the **custody record is the point** and the file
is a backup.

---

## Core distinction: User vs Client

- **User** = the human who logs in (authentication principal).
- **Client** = the insured party that documents belong to (domain subject).
- They are **many-to-many**: one user may access several clients.
- **Access comes only from the `UserClient` link table.** Referencing a client in
  any other role (e.g. as an original document's external owner) grants no access.
- The **admin** sees all clients implicitly, not through the link table.

---

## Entities

```
User            id, email, password_hash, role (admin | member), full_name
Client          id, name (required), notes
UserClient      user_id, client_id, granted_at, granted_by   ← the ONLY source of access

── Feature 1: Library (seguros) ──
Seguro                  ← typed insurance record; the filter target (1 per póliza)
  id, client_id, insurance_type, numero_poliza
  vigencia_desde (required), vigencia_hasta (nullable → "vigencia abierta")
  estado (vigente | anulada | devuelta)
  attributes (JSONB — per-type fields, see catalog; empty for most types)
  created_by, created_at
SeguroDocument          ← the files belonging to a seguro (1:N)
  id, seguro_id, doc_kind (Póliza | Recibo | Factura | Certificado | …)
  title, file → StoredFile, uploaded_by, uploaded_at

── Feature 2: Original Vault (fianzas) ──
OriginalDocument
  id
  client_id              → Client   (filed under — controls visibility)
  external_owner_id      → Client   (original owner / return target)
  tender_type            (Mantenimiento de oferta | Cumplimiento de contrato |
                          Cumplimiento de ley | …)
  tender_number
  contract_expiration_date   (nullable — not always known)
  title
  backup_file → StoredFile
  created_by, created_at

CustodyEvent    id, original_document_id,
                holder_user_id?  (→ User, when an app user holds it)
                holder_label?    (free text, e.g. "Devuelto", external party)
                occurred_at, recorded_by, note
                ── append-only; never edited ──

StoredFile      id, object_key, filename, content_type, size, uploaded_at
```

---

## Insurance types & per-type fields (Feature 1)

`insurance_type` is a **fixed code enum** (not admin-editable). A `Seguro` always
carries the **common** fields; only some types add **type-specific** fields, which
live in the `attributes` JSONB bag (validated per-type in code). Filters on common
fields are plain `WHERE`; the few hot type-specific filters get JSONB expression
indexes.

**Common to every type:** `client_id`, `numero_poliza`, `vigencia_desde`,
`vigencia_hasta?` (null → vigencia abierta), `estado`, documents.

| Tipo          | Campos extra (en `attributes`)                       | Vigencia |
|---------------|------------------------------------------------------|----------|
| **Vehículos** | matrícula, chasis, motor, padrón (todos opcionales, únicos → filtros) | desde–hasta |
| **Incendio**  | —                                                    | desde–hasta |
| **Combinado** | —                                                    | desde–hasta |
| **RC**        | —                                                    | desde–hasta |
| **RV**        | —                                                    | desde–hasta |
| **ADT**       | —                                                    | abierta (solo `desde`) |
| **Fianzas**   | nº licitación, tipo licitación, duración contrato    | abierta (cierra al devolver el original) |

Only **Vehículos** and **Fianzas** populate `attributes`; every other type leaves it
empty. The list will grow ("etc.") — adding a type means a new enum value + (optional)
per-type schema in code, **no migration**.

> Fianzas appear in **both** features and are kept **separate**: the *Library* Seguro
> is the insurance record (admin-owned, with its own licitación fields for filtering);
> the *Vault* `OriginalDocument` is the custody record of the physical original
> (created/held by various members). No FK between them — different owners and
> lifecycles. An optional link may be added later if navigation between them is needed.

## Custody semantics (Feature 2)

- `CustodyEvent` is an **append-only ledger** — events are added, never edited or
  deleted (deletion is admin-only, and avoided for records).
- **Current holder = the most recent event** by `occurred_at`.
- A holder is **either** an app user (`holder_user_id`) **or** a free label
  (`holder_label`) such as "Devuelto" when the original returns to its external owner.
- The FE shows the current holder by default and can expand the full timeline.

---

## Roles & permissions

| Action                          | Admin | Member |
|---------------------------------|:-----:|:------:|
| Full access to all clients      |  ✔    |   —    |
| Download library docs           |  ✔    |  ✔ (wired clients) |
| Upload library docs             |  ✔    |  ✔ (wired clients) |
| Create / edit custody records   |  ✔    |  ✔ (wired clients) |
| Delete anything                 |  ✔    |   —    |
| Manage users & client wiring    |  ✔    |   —    |

Members self-register; the admin wires them to the clients they may access
(via an admin panel) and/or via invite tokens.

---

## Storage

- All file access goes behind a **storage interface** in the backend; the actual
  provider is a single swappable adapter.
- Provider choice (Cloudflare R2 / Supabase Storage / Backblaze B2 — all free-tier)
  is deferred to when uploads are built. Not baked into the model.

---

## Decisions locked

- Two separate features (Library vs Original Vault), sharing `StoredFile`, **kept
  decoupled even for fianzas** (no FK) — different owners and lifecycles.
- **Library is a typed `Seguro`** (parent) with child `SeguroDocument` rows per file,
  **superseding** the old flat `LibraryDocument`. A seguro groups many documents.
- `insurance_type` and `doc_kind` are **fixed code enums**, not admin-editable.
- Per-type fields live in `attributes` (JSONB), validated per-type in code; only
  **Vehículos** (matrícula/chasis/motor/padrón) and **Fianzas** (nº/tipo/duración de
  licitación) use it.
- **Vigencia:** `vigencia_desde` required; `vigencia_hasta` nullable (null → abierta,
  for ADT/Fianzas). `estado` is an explicit field (vigente | anulada | devuelta) —
  manual for now, possibly vigencia-derived later; future alarms hang off it.
- One `Client` entity, referenced in multiple roles; access only via `UserClient`.
- Custody history is full + append-only.
- `tender_type` (Vault) is **fixed in code**, not admin-editable.
- Client identity = a single required `name` (clients are usually companies or
  public entities, so a surname is rarely meaningful; a full name goes in `name`).

## Deferred / open

- Storage provider selection.
- Hosting (app + Postgres): Neon / Render / Fly / Supabase — free tiers, decided at deploy.
- Optional future: admin-editable category lookup tables; insurance API integration.
```
