# DocTrack — Domain Model

## Purpose

DocTrack helps an insurance assessor (admin) and their clients manage two distinct
documentation needs:

1. **Library** — generic documents the assessor publishes (Pólizas, Facturas,
   Certificados, …) that clients can self-serve and download any time.
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
Client          id, first_name, last_name, notes
UserClient      user_id, client_id, granted_at, granted_by   ← the ONLY source of access

── Feature 1: Library ──
LibraryDocument
  id, client_id, category (Póliza | Factura | Certificado | …)
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

- Two separate document entities (Library vs Original Vault), sharing `StoredFile`.
- One `Client` entity, referenced in multiple roles; access only via `UserClient`.
- Custody history is full + append-only.
- Category lists (`category`, `tender_type`) are **fixed in code**, not admin-editable.
- Client identity = first + last name (no external identifier for now).

## Deferred / open

- Storage provider selection.
- Hosting (app + Postgres): Neon / Render / Fly / Supabase — free tiers, decided at deploy.
- Optional future: admin-editable category lookup tables; insurance API integration.
```
