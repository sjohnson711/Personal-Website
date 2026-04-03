# Blog Site — Project Summary

## Architecture

This is a **decoupled full-stack application**:
- `frontend/` — Vite + React 19, TypeScript, Tailwind v4, React Router v7
- `backend/` — Express 4, TypeScript, Prisma v7, PostgreSQL

The frontend proxies all `/api/*` requests to the backend in dev (via `vite.config.ts`).

---

## Tech Stack

| Layer         | Technology                                      |
|---------------|-------------------------------------------------|
| Frontend      | React 19, Vite 6, TypeScript, Tailwind CSS v4   |
| Backend       | Express 4, TypeScript, tsx                      |
| Database ORM  | Prisma v7                                       |
| Database      | PostgreSQL                                      |
| Auth          | JWT (httpOnly cookie) + bcryptjs                |
| Markdown      | marked                                          |
| Slug gen      | slugify                                         |

---

## Color Design

| Role                  | Color              | Hex                    |
|-----------------------|--------------------|------------------------|
| Gradient / Headings   | Amber              | `#FBBF24`              |
| Accent / buttons      | Forest green       | `#40916C`              |
| Primary button BG     | Dark forest        | `#217346`              |
| Navbar background     | Dark forest        | `rgba(27,67,50,0.95)`  |
| Primary text          | Cream              | `#FFF7ED`              |
| Muted text            | Warm tan           | `#A89070`              |
| Cards                 | Frosted dark       | `rgba(10,5,0,0.62)`    |

All theme tokens live in `frontend/src/index.css` inside `@theme {}`. The `.glass-card` utility and `.prose-sunset` markdown styles are also defined there.

---

## File Structure

```
frontend/src/
├── components/
│   ├── Navbar.tsx           ← Sticky nav; shows Dashboard + Sign Out when admin is logged in
│   ├── ArticleCard.tsx      ← Card used on home + articles list
│   ├── ArticleEditor.tsx    ← New/edit form with auto-slug generation
│   ├── AdminArticleRow.tsx  ← Dashboard row with edit + delete
│   ├── CommentSection.tsx   ← Reader message list + submission form
│   ├── Pagination.tsx       ← Page nav (shows only when >1 page)
│   └── ProtectedRoute.tsx   ← Redirects to /gateway if not authenticated
├── context/
│   └── AuthContext.tsx      ← JWT auth state (email, loading, login, logout)
├── pages/
│   ├── HomePage.tsx         ← Hero, latest 3 articles, newsletter CTA
│   ├── AboutPage.tsx        ← Author bio
│   ├── ArticlesPage.tsx     ← Paginated article list (7 per page)
│   ├── ArticlePage.tsx      ← Single article with markdown + CommentSection
│   ├── GatewayPage.tsx      ← Secret admin login (not publicly linked)
│   ├── NotFoundPage.tsx     ← 404 page
│   └── admin/
│       ├── DashboardPage.tsx   ← Stats + article list with edit/delete
│       ├── NewArticlePage.tsx  ← Wraps ArticleEditor in new mode
│       └── EditArticlePage.tsx ← Fetches article by id, wraps ArticleEditor in edit mode
└── lib/
    └── slug.ts              ← generateSlug() using slugify

backend/src/
├── routes/
│   ├── articles.ts   ← GET (paginated + admin mode), GET/:id, POST, PUT, DELETE
│   ├── auth.ts       ← POST /login, POST /logout, GET /me
│   └── comments.ts   ← GET /:articleId, POST /:articleId
├── middleware/
│   └── requireAuth.ts  ← JWT cookie middleware (requireAuth + getOptionalAuth)
├── lib/
│   ├── prisma.ts       ← Prisma singleton (PrismaPg adapter)
│   └── pagination.ts   ← ARTICLES_PER_PAGE=7, getPaginationParams, getTotalPages
└── index.ts            ← Express entry; registers all routers + CORS + cookie-parser

backend/prisma/
├── schema.prisma   ← Article, Comment, Admin models
├── migrations/     ← SQL migration history
└── seed.ts         ← Seeds admin account + 3 sample articles
```

---

## Data Models

```prisma
model Article {
  id        Int       @id @default(autoincrement())
  title     String
  slug      String    @unique
  excerpt   String
  content   String    // Markdown
  published Boolean   @default(false)
  createdAt DateTime  @default(now())
  updatedAt DateTime  @updatedAt
  comments  Comment[]
}

model Comment {
  id        Int      @id @default(autoincrement())
  articleId Int
  article   Article  @relation(fields: [articleId], references: [id], onDelete: Cascade)
  name      String
  body      String
  createdAt DateTime @default(now())
}

model Admin {
  id       Int    @id @default(autoincrement())
  email    String @unique
  password String // bcrypt hashed
}
```

---

## Key Implementation Notes

### Prisma v7
- Generator is `prisma-client` (not `prisma-client-js`).
- Client generated to `backend/src/generated/prisma/`.
- Always import from `../generated/prisma/client`.
- No `url` in `schema.prisma` — uses `PrismaPg` adapter passed to `PrismaClient`.
- Run `npx prisma generate` after schema changes.

### Tailwind v4
- No `tailwind.config.ts`. All customization is in `frontend/src/index.css` inside `@theme {}`.

### Auth Flow
- Admin logs in at `/gateway` → POST `/api/auth/login` → sets `httpOnly` JWT cookie (7 days).
- `AuthContext` hydrates from `GET /api/auth/me` on mount.
- `ProtectedRoute` wraps all `/admin/*` routes — redirects to `/gateway` if not logged in.
- `requireAuth` middleware reads cookie or `Authorization: Bearer` header.

### Comments
- Public — no auth required to post.
- Validated: name ≤ 100 chars, body ≤ 2000 chars, article must be published.
- Deleted automatically (cascade) when the parent article is deleted.

### Secret Login
- `/gateway` is not linked anywhere in the public nav.
- On success, redirects to `/admin/dashboard`.

---

## npm Scripts

### Backend (`backend/`)

| Command             | What it does                      |
|---------------------|-----------------------------------|
| `npm run dev`       | Start dev server with tsx watch   |
| `npm run build`     | Compile TypeScript to `dist/`     |
| `npm run start`     | Run compiled production server    |
| `npm run db:push`   | Run Prisma migrations             |
| `npm run db:seed`   | Seed admin account + sample data  |

### Frontend (`frontend/`)

| Command           | What it does                     |
|-------------------|----------------------------------|
| `npm run dev`     | Start Vite dev server            |
| `npm run build`   | Production build to `dist/`      |
| `npm run preview` | Preview production build locally |

---

## Environment Variables

### `backend/.env`

```env
DATABASE_URL="postgresql://postgres:Ilovewillie1!@localhost:5432/book_site?schema=public"
JWT_SECRET="RAvaoMHRHjVjTDABv8iAQPgAZOp2Z4UMeOV57LlKlyU="
PORT=3001
FRONTEND_URL="http://localhost:5173"
```

---

## Getting Started

```bash
# 1. Install dependencies
cd backend && npm install
cd ../frontend && npm install

# 2. Run database migration
cd ../backend && npm run db:push

# 3. Seed admin + sample articles
npm run db:seed

# 4. Start backend (terminal 1)
npm run dev

# 5. Start frontend (terminal 2)
cd ../frontend && npm run dev
```

Visit `http://localhost:5173` for the public site.
Visit `http://localhost:5173/gateway` to log in as admin.

Default credentials (change after first login):
- Email: `admin@yoursite.com`
- Password: `change-this-password`

---

## Placeholders to Customize

Search the frontend for `[` to find all placeholder text:

| Placeholder             | Replace with                  |
|-------------------------|-------------------------------|
| `[Book Title]`          | Your book's title             |
| `BOOK COVER`            | Your actual book cover image  |
| `[A compelling...]`     | Your real book synopsis       |
| `admin@yoursite.com`    | Your actual email             |
| Social link `href="#"`  | Your real social profile URLs |
