# Book Site — Project Summary

## What Was Built

A full-stack personal website for an upcoming book, built with Next.js 16 (App Router),
Tailwind v4, Prisma v7, NextAuth v5, and PostgreSQL.

---

## Tech Stack

| Layer         | Technology                          |
|---------------|-------------------------------------|
| Framework     | Next.js 16 (App Router, React 19)   |
| Language      | TypeScript                          |
| Styling       | Tailwind CSS v4 (CSS-based config)  |
| Database ORM  | Prisma v7                           |
| Database      | PostgreSQL                          |
| Auth          | NextAuth v5 beta (JWT + Credentials)|
| Markdown      | marked                              |
| Slug gen      | slugify                             |
| Testing       | Jest (34 tests, all passing)        |

---

## Color Design

| Role                  | Color   | Hex       |
|-----------------------|---------|-----------|
| Gradient start        | Amber   | `#FBBF24` |
| Gradient mid          | Excel green (IDE trim) | `#217346` |
| Gradient end          | Purple  | `#7C3AED` |
| Accent / buttons      | Forest green | `#40916C` |
| Navbar background     | Dark forest | `rgba(27,67,50,0.92)` |
| Primary text          | Cream   | `#FFF7ED` |
| Muted text            | Warm tan | `#A89070` |

The gradient is a fixed full-page background. Content sits on top in
frosted glass cards (`.glass-card` utility class in `app/globals.css`).

---

## File Structure

```
book-site/
├── app/
│   ├── globals.css                        ← Tailwind v4 theme + sunset gradient + glass-card
│   ├── layout.tsx                         ← Root layout with Navbar + footer
│   ├── page.tsx                           ← Home: book hero, latest articles, newsletter CTA
│   ├── about/page.tsx                     ← Bio page (placeholders)
│   ├── articles/
│   │   ├── page.tsx                       ← Paginated article list (7 per page)
│   │   └── [slug]/page.tsx               ← Individual article (markdown rendered)
│   ├── gateway/page.tsx                   ← Secret admin login (not linked publicly)
│   ├── admin/
│   │   ├── dashboard/page.tsx             ← Article manager (stats, list, delete)
│   │   ├── articles/
│   │   │   ├── new/page.tsx              ← Write a new article
│   │   │   └── [id]/edit/page.tsx        ← Edit an existing article
│   └── api/
│       ├── auth/[...nextauth]/route.ts    ← NextAuth handler
│       ├── articles/route.ts              ← GET (paginated) + POST
│       └── articles/[id]/route.ts        ← GET + PUT + DELETE
│
├── components/
│   ├── Navbar.tsx                         ← Sticky nav with active link highlighting
│   ├── ArticleCard.tsx                    ← Card used on home + articles list
│   ├── Pagination.tsx                     ← Page 1/2/3 nav, shows only when > 1 page
│   ├── ArticleEditor.tsx                  ← New/edit form with auto-slug generation
│   └── AdminArticleRow.tsx                ← Dashboard row with edit + delete
│
├── lib/
│   ├── prisma.ts                          ← Prisma singleton (imports from app/generated/prisma)
│   ├── pagination.ts                      ← ARTICLES_PER_PAGE=7, getPaginationParams, getTotalPages
│   └── slug.ts                            ← generateSlug() using slugify
│
├── prisma/
│   ├── schema.prisma                      ← Article + Admin models
│   └── seed.ts                            ← Seeds admin account + 3 sample articles
│
├── auth.config.ts                         ← Edge-safe NextAuth config (no Prisma)
├── auth.ts                                ← Full NextAuth (credentials + Prisma, Node.js only)
├── proxy.ts                               ← Next.js 16 edge proxy, protects /admin/* routes
├── prisma.config.ts                       ← Prisma v7 config (reads DATABASE_URL)
├── jest.config.ts                         ← Jest config via next/jest
├── .env                                   ← DATABASE_URL + NEXTAUTH_SECRET (fill in)
│
└── __tests__/
    ├── lib/pagination.test.ts             ← 12 tests: page math, clamping, edge cases
    ├── lib/slug.test.ts                   ← 8 tests: slug generation
    └── api/articles.test.ts              ← 14 tests: all CRUD routes, auth guards, 409/404
```

---

## Key Implementation Notes

### Prisma v7
- Generator is `prisma-client` (not `prisma-client-js`).
- Client is generated to `app/generated/prisma/`. Run `npx prisma generate` after schema changes.
- Always import from `@/app/generated/prisma/client`, **not** `@prisma/client` or bare `@/app/generated/prisma` (no index.ts).
- `url` is NOT in `schema.prisma`. Requires `@prisma/adapter-pg` + `pg` packages. Instantiate with `new PrismaPg({ connectionString: process.env.DATABASE_URL! })` passed as `adapter` to `new PrismaClient({ adapter })`.
- Seeds require `import "dotenv/config"` since they run outside Next.js.

### Tailwind v4
- No `tailwind.config.ts`. All theme customization lives in `app/globals.css`
  inside the `@theme {}` block.

### NextAuth v5
- **Edge-safe split**: `auth.config.ts` holds session/pages/authorized callback (no Node.js deps). `auth.ts` spreads authConfig and adds the Credentials provider with Prisma.
- `proxy.ts` (Next.js 16 replaces `middleware.ts`) imports from `auth.config.ts` only — safe for Edge Runtime.
- API route at `app/api/auth/[...nextauth]/route.ts` just re-exports `handlers` from `auth.ts`.
- Strategy is `jwt` — no database adapter needed.

### Secret Login
- The admin login page lives at `/gateway`.
- It is **not linked anywhere** in the public UI.
- After login, the admin is redirected to `/admin/dashboard`.

### Pagination
- Defined in `lib/pagination.ts` — change `ARTICLES_PER_PAGE` there to adjust.
- Invalid/non-numeric page params safely fall back to page 1.

### Article Content
- Written in Markdown in the admin editor.
- Rendered via `marked` on the article detail page.
- Styled with the `.prose-sunset` CSS class in `globals.css`.

---

## npm Scripts

| Command               | What it does                              |
|-----------------------|-------------------------------------------|
| `npm run dev`         | Start development server                  |
| `npm run build`       | Production build                          |
| `npm run start`       | Start production server                   |
| `npm test`            | Run all 34 tests                          |
| `npm run test:watch`  | Run tests in watch mode                   |
| `npm run test:coverage` | Run tests with coverage report          |
| `npm run db:push`     | Run Prisma migrations                     |
| `npm run db:seed`     | Seed admin account + sample articles      |

---

## Steps to Get It Running

### 1. Provision a PostgreSQL database

**DONE** — Local PostgreSQL installed and configured.
- User: `postgres`
- Database: `book_site` (created by Prisma migrate)

### 2. Fill in the .env file

**DONE** — `.env` is fully configured:

```env
DATABASE_URL="postgresql://postgres:Ilovewillie1!@localhost:5432/book_site?schema=public"
NEXTAUTH_SECRET="RAvaoMHRHjVjTDABv8iAQPgAZOp2Z4UMeOV57LlKlyU="
NEXTAUTH_URL="http://localhost:3000"
```

### 3. Run the database migration

```bash
npx prisma migrate dev --name init
```

This creates all tables (`Article`, `Admin`) in your database.

### 4. Seed the database

```bash
npm run db:seed
```

This creates:
- Admin account: `admin@yoursite.com` / password: `change-this-password`
- 3 sample articles (2 published, 1 draft)

**Change the password immediately** — update `prisma/seed.ts` before seeding,
or log in and use the edit flow.

### 5. Start the dev server

```bash
npm run dev
```

Visit:
- `http://localhost:3000` — public home page
- `http://localhost:3000/about` — bio page
- `http://localhost:3000/articles` — articles list
- `http://localhost:3000/gateway` — secret admin login

### 6. Fill in the placeholders

Search the project for `[` to find all placeholder text:

| Placeholder          | Replace with                          |
|----------------------|---------------------------------------|
| `[Author Name]`      | Your name                             |
| `[Book Title]`       | Your book's title                     |
| `BOOK COVER`         | Your actual book cover image          |
| `[A compelling...]`  | Your real book synopsis               |
| `admin@yoursite.com` | Your actual email (in seed.ts + .env) |
| Social link `href="#"` | Your real social profile URLs       |

### 7. Deploy (optional — Vercel + Neon recommended)

1. Push the project to a GitHub repo.
2. Import the repo at vercel.com.
3. Add your environment variables in the Vercel dashboard.
4. Set `NEXTAUTH_URL` to your production domain (e.g. `https://mybook.com`).
5. Run migrations against the production DB:
   ```bash
   DATABASE_URL="your-production-url" npx prisma migrate deploy
   ```
6. Run the seed once against production (or create the admin manually).

---

## Running the Tests

```bash
npm test
```

All 34 tests should pass with no database required (Prisma and auth are mocked).

Test files:
- `__tests__/lib/pagination.test.ts` — pagination math + edge cases
- `__tests__/lib/slug.test.ts` — slug generation
- `__tests__/api/articles.test.ts` — full CRUD API coverage with auth guards
