# CLAUDE.md — DocTrack

## ⭐ Start Here

- **Current status & next steps:** [docs/project-status.md](docs/project-status.md)
- **Domain model (source of truth):** [docs/domain-model.md](docs/domain-model.md)

Read both before starting work. There are open decisions awaiting answers in
project-status.md before Slice 1 (auth) can be built.

## Project Overview

- **Type:** Fullstack monorepo (document tracking / management)
- **Structure:** `apps/web` (React frontend) · `apps/api` (Python FastAPI backend)
- **FE Stack:** React 19, TypeScript 5.x strict, TanStack Query, TanStack Router, Zustand, shadcn/ui, Tailwind CSS v4
- **BE Stack:** Python 3.14, FastAPI, SQLAlchemy (async), Alembic, PostgreSQL, uv
- **Package manager:** npm (FE) · uv (BE)

## Development Commands

```bash
# Frontend (from repo root or apps/web)
npm run web:dev          # Start FE dev server
npm run web:build        # TypeScript + Vite build
npm run web:lint         # ESLint

# Backend
npm run api:up           # docker compose up (DB + API)
npm run api:down         # docker compose down

# Both at once
npm run dev              # concurrently runs web:dev + api:up
```

Always run `npm run web:lint && npm run web:build` before committing or creating a PR.

---

## Rule Priority Order

1. useEffect Rule (section below) — **highest priority**
2. UI Consistency & Reuse Gate
3. Single Responsibility hard limits
4. Data Fetching / BE Escalation rules
5. React & TypeScript best practices
6. General architecture standards

---

## 1. useEffect — Escape Hatch Only (Highest Priority)

`useEffect` is only for synchronizing with **external systems**. Never use it for:
- Derived state
- Prop-sync or state resets (use component `key` instead)
- Event-specific logic (use event handlers)
- Parent notifications
- Chained state transitions
- Server data fetching (use TanStack Query)

Decision gate before writing `useEffect`:
1. Can this be calculated during render?
2. Is this an expensive derivation → `useMemo`?
3. Should state reset by changing component `key`?
4. Is this user interaction logic → event handler?
5. Is this external store subscription → `useSyncExternalStore`?
6. Is this server data → TanStack Query?
7. Is this truly synchronization with an external system?

Only write `useEffect` when **item 7 is true**.

---

## 2. Shadcn-First UI Rule

Always use existing shadcn/ui components from `apps/web/src/components/ui/` when an equivalent exists.

- Never introduce raw HTML controls (`input`, `select`, `textarea`, `button`, form wrappers, modal primitives, cards, labels, separators) when shadcn components cover the case.
- Compose shadcn primitives: `Form`, `FormField`, `Input`, `Button`, `Card`, `Dialog`, `Select`, `Label`, `Separator`.
- Only fall back to native HTML/CSS when no shadcn path exists — document the reason.

---

## 3. UI Consistency & Reuse Gate (Mandatory)

Before creating or editing any UI element:
1. Is there an existing shared component for this element type?
2. Is there an existing semantic variant that matches this intent?
3. Can I achieve this by reusing `apps/web/src/components/ui/*` without local color overrides?
4. Should I add a new semantic variant in the shared component instead of local styles?
5. Is this a real product requirement for a unique design?

Only add local custom styling when **step 5 is true**.

- Do not use `className` color overrides (`bg-*`, `text-*`, `border-*`) on reusable primitives for core intent states.
- One intent = one visual language app-wide.

---

## 4. Single Responsibility — Hard Limits

| Metric | Max | Action |
|--------|-----|--------|
| File length | 200 lines | Split into smaller modules |
| Function / hook body | 30 lines | Extract helpers or sub-hooks |
| Component JSX return | 50 lines | Extract child components |
| Function parameters | 3 | Use an options object |
| Component props | 5–6 | Compose or use `children` |
| Nesting depth | 3 levels | Early returns or extracted helpers |
| Cyclomatic complexity | 5 branches | Simplify or split |

---

## 5. React Best Practices

- **Function components only.**
- No manual memoization by default — React 19 compiler handles it.
- Never use array indexes as keys for dynamic lists.
- Prefer `startTransition` for non-urgent updates.
- Prefer `useActionState` for form submission flows.
- Prefer `useOptimistic` for optimistic UI.
- Pass `ref` as prop in React 19-compatible components; avoid `forwardRef`.

---

## 6. TypeScript Best Practices

- `strict: true` always enabled.
- Prefer `interface` for extendable shapes; `type` for unions/intersections.
- Prefer discriminated unions over optional-property state bags.
- Avoid `any`; use `unknown` at unsafe boundaries.
- Use exhaustive `never` checks in `switch` for discriminated unions.
- Annotate return types on all exported functions.
- Never use numeric enums.

---

## 7. Data Fetching — Server-First

- Always prefer dedicated BE endpoints that filter/search/paginate server-side.
- Use `useInfiniteQuery` or paged `useQuery` for any list that can grow.
- Do not build client-side filter logic over in-memory lists.

Decision gate before writing any data-fetching code:
1. Does a BE endpoint exist that returns exactly this data?
2. If yes → wire it up in `*-api.ts` and `*-queries.ts`.
3. If no → **stop**. Escalate to backend first.

---

## 8. Backend Capability Escalation

If required behavior is backend-owned and missing: **do not fix it in frontend.**

Until backend support exists, frontend may only:
- Show a clear blocked-state UX
- Hide/disable unsupported UI actions

---

## 9. Architecture & Boundaries

### FE Feature File Naming

```
apps/web/src/features/{name}/api/{name}-api.ts       ← API calls
apps/web/src/features/{name}/api/{name}-queries.ts   ← TanStack Query hooks
apps/web/src/features/{name}/types/{name}-types.ts   ← interfaces/types
```

### BE Module Naming

```
apps/api/src/doctrack/{domain}/router.py    ← FastAPI router
apps/api/src/doctrack/{domain}/models.py   ← SQLAlchemy models
apps/api/src/doctrack/{domain}/schemas.py  ← Pydantic schemas
apps/api/src/doctrack/{domain}/service.py  ← Business logic
```

---

## 10. Git Workflow

### Branch Naming

Format: `<type>/<short-kebab-description>`

Allowed types: `feat`, `fix`, `refactor`, `chore`, `docs`, `style`, `perf`, `build`, `ci`, `test`

### Commit Messages (Conventional Commits)

Format: `<type>(<scope>): <subject>`

- Head line must not exceed 100 characters
- Scope examples: `web`, `api`, `auth`, `docs`

---

## 11. No Frontend Tests (Default)

Do not create, modify, or propose frontend tests unless explicitly requested.

Prefer typecheck/build/lint plus manual verification.

<!-- claude-skills:skill-evaluation:start -->
## Skills

BEFORE writing ANY code, you MUST:

1. List EVERY skill available: check `.claude/skills/` (project) and `~/.claude/skills/` (global). The system-reminder's available-skills section is a hint, not the source of truth — if it's missing or empty, still check the directories.
2. For each skill, write: [skill-name] → ACTIVATE / SKIP — [one-line reason]
3. Call Skill(name) for every skill marked ACTIVATE
4. Emit the literal token `[skills-checked]` on its own line
5. Only THEN proceed to implementation

A PreToolUse gate hook blocks Write/Edit/MultiEdit until the `[skills-checked]` token appears in your response since the most recent user prompt. The gate fires once per turn — the first blocked edit is the signal to evaluate skills, then retry. If you skip the evaluation, your response is INCOMPLETE and WRONG.
<!-- claude-skills:skill-evaluation:end -->

<!-- claude-skills:file-size:start -->
## File Size Enforcement

- **Never write a file longer than 200 lines of code.** If a file would exceed 200 lines, split it into smaller modules before writing.
- This rule applies during skill evaluation: if the code you're about to write would exceed 200 lines in any single file, refactor into multiple files first.
- Skill evaluation must check this limit as part of every ACTIVATE decision.
<!-- claude-skills:file-size:end -->
