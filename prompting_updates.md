# Prompting Updates — Architecture, Changes & Todos

> A living document tracking the **current** state of the project, what has changed,
> and what's left to do. The `README.md` still describes the older Vite + Express
> architecture and is intentionally left untouched for now (see Todos).

**Last updated:** 2026-06-29

---

## 📌 TL;DR

The project is **mid-migration** from a decoupled *Vite frontend + Express backend*
(deployed on Vercel + Railway + Neon) to a **single full-stack Next.js 16 app** at the
repository root. As of today, the Next.js app is the one being actively developed and
tested. The legacy `frontend/` and `backend/` directories still exist and `vercel.json`
still deploys the Vite frontend.

---

## 🏗️ Current Architecture (Next.js app at root)

A single full-stack **Next.js 16 (App Router)** application — frontend pages and API
routes live together in one codebase.

```
┌──────────────────────────────────────────────┐
│  Next.js 16 App (App Router)                  │
│  ├─ React 19 Server/Client Components (UI)    │
│  ├─ Route Handlers  → /app/api/* (the API)    │
│  └─ Auth.js (next-auth v5) middleware         │
└───────────────────────┬───────────────────────┘
                        │ Prisma v7 (PrismaPg adapter)
                        ↓
┌──────────────────────────────────────────────┐
│  PostgreSQL (Neon / local)                    │
└──────────────────────────────────────────────┘
```

### Stack

| Layer        | Technology                                   |
|--------------|----------------------------------------------|
| Framework    | Next.js 16.1.6 (App Router)                  |
| UI           | React 19, TypeScript 5                       |
| Styling      | Tailwind CSS v4 (no config file)             |
| Auth         | Auth.js / next-auth v5 (Credentials + JWT)   |
| Password     | bcryptjs                                     |
| ORM          | Prisma v7 (`prisma-client` generator)        |
| Database     | PostgreSQL                                   |
| Markdown     | marked                                       |
| Slug gen     | slugify                                      |
| Tests        | Jest 30 + `next/jest`                        |

### Directory layout (root app)

```
Blog_Site/
├── app/
│   ├── page.tsx                      # Home
│   ├── about/page.tsx                # Author bio
│   ├── articles/page.tsx             # Paginated article list
│   ├── articles/[slug]/page.tsx      # Single article (markdown)
│   ├── gateway/page.tsx              # Secret admin login
│   ├── admin/
│   │   ├── dashboard/page.tsx        # Stats + article management
│   │   ├── articles/new/page.tsx     # Create article
│   │   └── articles/[id]/edit/page.tsx
│   ├── api/
│   │   ├── articles/route.ts         # GET (list), POST (create)
│   │   ├── articles/[id]/route.ts    # GET, PUT, DELETE
│   │   └── auth/[...nextauth]/route.ts
│   ├── layout.tsx
│   ├── globals.css                   # Tailwind v4 + theme
│   └── generated/prisma/             # Generated Prisma client
├── components/                       # AdminArticleRow, ArticleCard,
│                                     #   ArticleEditor, Navbar, Pagination
├── lib/                              # pagination.ts, prisma.ts, slug.ts
├── prisma/                           # schema.prisma, migrations/, seed.ts
├── __tests__/                        # Jest suites (see Testing)
├── auth.ts                           # NextAuth instance (Credentials + bcrypt)
├── auth.config.ts                    # Edge-safe config (used by middleware)
├── proxy.ts                          # Next.js middleware → protects /admin/*
└── jest.config.ts                    # next/jest config
```

### Auth flow (Auth.js v5)
- `proxy.ts` is the Next.js middleware. It runs `authConfig` and protects
  `/admin/:path*` (matcher), redirecting unauthenticated users to `/gateway`.
- `auth.config.ts` is **edge-safe** (no Prisma/bcrypt) — used by the middleware.
- `auth.ts` spreads `authConfig` and adds the Credentials provider, which looks up
  the `Admin` by email and verifies the password with `bcrypt.compare`.
- Session strategy is **JWT** (`session.strategy: "jwt"`). Auth.js manages the
  session cookie — there is no hand-rolled JWT cookie route anymore.

### Data models (current — `prisma/schema.prisma`)
```prisma
model Article {
  id        Int      @id @default(autoincrement())
  title     String
  slug      String   @unique
  excerpt   String
  content   String   // markdown
  published Boolean  @default(false)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

model Admin {
  id       Int    @id @default(autoincrement())
  email    String @unique
  password String // bcrypt hashed
}
```
> NOTE: The Next.js app's schema has **only `Article` and `Admin`**. The `Comment`
> and `Subscriber` models exist only in the legacy `backend/` app.

### API endpoints (current)
```
GET    /api/articles               # Paginated list
POST   /api/articles               # Create (admin)
GET    /api/articles/[id]          # Single article
PUT    /api/articles/[id]          # Update (admin)
DELETE /api/articles/[id]          # Delete (admin)
*      /api/auth/[...nextauth]     # Auth.js (login/session/callbacks)
```

---

## 🧪 Testing

- Runner: **Jest 30** configured via `next/jest` (`jest.config.ts`), `testEnvironment: "node"`.
- `@/*` path alias mapped to repo root via `moduleNameMapper`.
- Jest globals (`describe`/`it`/`expect`/`jest`) are auto-injected — no imports needed;
  `tsconfig.json` declares `"types": ["jest", "node"]` so TypeScript recognizes them.

| Command                 | What it runs            |
|-------------------------|-------------------------|
| `npm test`              | Full Jest suite         |
| `npm run test:watch`    | Watch mode              |
| `npm run test:coverage` | Coverage report (v8)    |

Suites (`__tests__/`):
- `lib/pagination.test.ts`, `lib/slug.test.ts` — pure unit tests.
- `api/articles.test.ts`, `api/articles.edge.test.ts`, `api/auth.test.ts` — API route
  logic with `@/auth` and `@/lib/prisma` mocked (no DB needed).

**Status:** ✅ 5 suites / 66 tests passing.

---

## 📝 Changelog

### 2026-06-29 — Restored test toolchain & Next.js dependencies
- The root `package.json` had been clobbered (commit `9a30640`) with a stale
  "workspaces-only" version listing **zero dependencies** — so `next`, `jest`, and the
  entire test toolchain were uninstalled and the test suite could not run.
- Restored the Next.js app dependencies + Jest toolchain (`jest`,
  `jest-environment-jsdom`, `@types/jest`, `ts-jest`) and the
  `test` / `test:watch` / `test:coverage` scripts, recovered from commit `9d542e9`.
- Kept the `workspaces: ["frontend", "backend"]` field so the existing `vercel.json`
  deploy of the Vite frontend is not broken.
- Ran `npm install` (660 packages added) and verified `npx jest` → **66/66 passing**.

---

## ✅ Todos / Open Items

### Architecture reconciliation (highest priority)
- [ ] **Decide the production target.** `vercel.json` still builds & deploys the Vite
      `frontend/` (`buildCommand: "npm install && cd frontend && npm run build"`,
      output `frontend/dist`) — NOT the Next.js app. If Next.js is the future, update
      `vercel.json` (or Vercel project settings) to build the Next app.
- [ ] Once the target is chosen, **remove or archive** the legacy `frontend/` and
      `backend/` directories (and drop the unused `workspaces` field).
- [ ] Update `README.md` to match the chosen architecture (left untouched for now).
- [ ] Reconcile `CLAUDE.md`, which still documents the Vite + Express structure.

### Feature parity (port from legacy backend → Next.js app)
The legacy Express backend has features the Next.js app does not yet implement:
- [ ] **Comments** — `Comment` model + `/api/comments` routes + `CommentSection` UI.
- [ ] **Newsletter / email** — Resend integration + `Subscriber` model + signup.
- [ ] **Contact form** — contact endpoint + email send.
- [ ] Rate limiting (legacy backend used `express-rate-limit`).
- [ ] Profanity filtering on comments (legacy used `bad-words`).

### Maintenance
- [ ] `npm audit` reported **17 vulnerabilities (10 high)** from transitive deps after
      install — review and remediate.
- [ ] The npm cache at `~/.npm` had a permission/EACCES issue during install (worked
      around with a custom `--cache` dir) — worth fixing locally.

### Product / roadmap (from prior notes)
- [ ] Add real images / book cover and finalize media embeds.
- [ ] Wire all social links to the real profiles.
- [ ] (Later) YouTube API integration for posting videos.
