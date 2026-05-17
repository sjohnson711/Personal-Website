# Seth Johnson — Personal Blog & Book Site

A full-stack personal website for weekly blog posts, built with a **React** frontend and **Express** backend. Readers can leave messages on any post. Includes a private admin area for writing and managing articles.

---

## Tech Stack

| Layer    | Technology                                     |
| -------- | ---------------------------------------------- |
| Frontend | React 19, Vite, TypeScript, Tailwind CSS v4    |
| Backend  | Express 4, TypeScript, tsx (dev server)        |
| Database | PostgreSQL via Prisma v7 ORM                   |
| Auth     | JWT (httpOnly cookie), bcrypt password hashing |
| Markdown | marked                                         |
| Routing  | React Router v7                                |

---

## Project Structure

```
Blog_Site/
├── frontend/          # Vite + React application
│   ├── src/
│   │   ├── components/        # Reusable UI components
│   │   │   ├── Navbar.tsx
│   │   │   ├── ArticleCard.tsx
│   │   │   ├── ArticleEditor.tsx
│   │   │   ├── AdminArticleRow.tsx
│   │   │   ├── CommentSection.tsx
│   │   │   ├── Pagination.tsx
│   │   │   └── ProtectedRoute.tsx
│   │   ├── context/
│   │   │   └── AuthContext.tsx  # JWT auth state + login/logout helpers
│   │   ├── pages/
│   │   │   ├── HomePage.tsx
│   │   │   ├── AboutPage.tsx
│   │   │   ├── ArticlesPage.tsx
│   │   │   ├── ArticlePage.tsx  # Includes CommentSection
│   │   │   ├── GatewayPage.tsx  # Admin login (not publicly linked)
│   │   │   ├── NotFoundPage.tsx
│   │   │   └── admin/
│   │   │       ├── DashboardPage.tsx
│   │   │       ├── NewArticlePage.tsx
│   │   │       └── EditArticlePage.tsx
│   │   ├── lib/
│   │   │   └── slug.ts          # Auto slug generation
│   │   ├── App.tsx              # Route definitions
│   │   └── main.tsx
│   ├── index.html
│   ├── vite.config.ts           # Proxies /api → localhost:3001
│   └── package.json
│
├── backend/           # Express REST API
│   ├── src/
│   │   ├── routes/
│   │   │   ├── articles.ts      # CRUD for articles
│   │   │   ├── auth.ts          # Login, logout, /me
│   │   │   └── comments.ts      # Reader messages per article
│   │   ├── middleware/
│   │   │   └── requireAuth.ts   # JWT cookie middleware
│   │   ├── lib/
│   │   │   ├── prisma.ts        # Prisma singleton
│   │   │   └── pagination.ts
│   │   └── index.ts             # Express app entry point
│   ├── prisma/
│   │   ├── schema.prisma        # Article, Comment, Admin models
│   │   ├── migrations/          # SQL migration history
│   │   └── seed.ts              # Seeds admin + sample articles
│   ├── .env                     # Environment variables (see below)
│   └── package.json
│
└── README.md
```

---

## Prerequisites

- **Node.js** v18 or higher
- **PostgreSQL** running locally (or a hosted instance such as Neon)
- **npm** v9 or higher

---

## Installation

### 1. Clone the repository

```bash
git clone <your-repo-url>
cd Blog_Site
```

### 2. Install backend dependencies

```bash
cd backend
npm install
```

### 3. Install frontend dependencies

```bash
cd ../frontend
npm install
```

---

## Configuration

### Backend — `backend/.env`

Create `backend/.env` (copy from `backend/.env.example`):

```env
DATABASE_URL="postgresql://<user>:<password>@localhost:5432/book_site?schema=public"
JWT_SECRET="replace-with-a-long-random-secret"
PORT=3001
FRONTEND_URL="http://localhost:5173"
```

| Variable       | Description                                          |
| -------------- | ---------------------------------------------------- |
| `DATABASE_URL` | PostgreSQL connection string                         |
| `JWT_SECRET`   | Secret used to sign/verify JWT tokens — keep private |
| `PORT`         | Port the Express server listens on (default: 3001)   |
| `FRONTEND_URL` | Allowed CORS origin (default: Vite dev server)       |

---

## Database Setup

### 1. Run migrations

From the `backend/` directory:

```bash
npm run db:push
```

This creates the `Article`, `Comment`, and `Admin` tables.

### 2. Seed the database

This will run the update to the database

```bash
npm run db:seed
```

This creates:

- Admin account: `admin@yoursite.com` / `change-this-password`
- 3 sample articles (2 published, 1 draft)

> **Important:** Change the admin password before going live. Update `prisma/seed.ts` before seeding, or log in and replace the account directly.

### 3. Regenerate Prisma client (after schema changes only)

```bash
npx prisma generate
```

---

## Running the App

You need two terminal windows — one for the backend, one for the frontend.

### Terminal 1 — Backend

```bash
cd backend
npm run dev
```

Server starts at `http://localhost:3001`.

### Terminal 2 — Frontend

```bash
cd frontend
npm run dev
```

App opens at `http://localhost:5173`. All `/api/*` requests are proxied to the backend automatically.

---

## Admin Access

The admin login page is at `/gateway` — it is not linked anywhere in the public navigation.

1. Navigate to `http://localhost:5173/gateway`
2. Sign in with your admin credentials
3. You are redirected to `/admin/dashboard`

From the dashboard you can:

- View article stats (total, published, drafts)
- Create a new article (Markdown supported)
- Edit or delete existing articles
- Sign out

---

## API Reference

### Auth

| Method | Endpoint           | Description                   | Auth |
| ------ | ------------------ | ----------------------------- | ---- |
| POST   | `/api/auth/login`  | Sign in, sets httpOnly cookie | —    |
| POST   | `/api/auth/logout` | Clear session cookie          | —    |
| GET    | `/api/auth/me`     | Returns current admin email   | Yes  |

### Articles

| Method | Endpoint                   | Description                     | Auth |
| ------ | -------------------------- | ------------------------------- | ---- |
| GET    | `/api/articles`            | Paginated list (published only) | —    |
| GET    | `/api/articles?admin=true` | All articles including drafts   | Yes  |
| GET    | `/api/articles/:idOrSlug`  | Single article by ID or slug    | —    |
| POST   | `/api/articles`            | Create new article              | Yes  |
| PUT    | `/api/articles/:id`        | Update article                  | Yes  |
| DELETE | `/api/articles/:id`        | Delete article                  | Yes  |

### Comments

| Method | Endpoint                   | Description                 | Auth |
| ------ | -------------------------- | --------------------------- | ---- |
| GET    | `/api/comments/:articleId` | All comments for an article | —    |
| POST   | `/api/comments/:articleId` | Submit a reader message     | —    |

---

## Production Build

### Frontend

```bash
cd frontend
npm run build
```

Output is in `frontend/dist/`. Serve with any static host (Vercel, Netlify, Nginx).

### Backend

```bash
cd backend
npm run build
npm run start
```

Output is compiled to `backend/dist/`.

---

## Deployment

### Recommended: Vercel (frontend) + Railway or Render (backend) + Neon (database)

1. Push both `frontend/` and `backend/` to GitHub.
2. Deploy the frontend on Vercel — set the `VITE_API_URL` if using a custom domain.
3. Deploy the backend on Railway or Render — set all `backend/.env` variables in the dashboard.
4. Update `FRONTEND_URL` in the backend environment to your production frontend URL.
5. Run migrations against the production database:
   ```bash
   DATABASE_URL="<production-url>" npx prisma migrate deploy
   ```
6. Run seed once against production to create the admin account.

---

## Color Design System

| Role              | Color        | Hex                   |
| ----------------- | ------------ | --------------------- |
| Headings / Accent | Amber        | `#FBBF24`             |
| Buttons / Links   | Forest Green | `#40916C`             |
| Primary Button BG | Dark Forest  | `#217346`             |
| Navbar BG         | Dark Forest  | `rgba(27,67,50,0.95)` |
| Body Text         | Cream        | `#FFF7ED`             |
| Muted Text        | Warm Tan     | `#A89070`             |
| Cards             | Frosted Dark | `rgba(10,5,0,0.62)`   |

All theme tokens are defined in `frontend/src/index.css` inside the `@theme {}` block (Tailwind v4 CSS config).

---

> **Note:** If you add anything else to this file, always keep the following section at the very bottom.

## Features to add

- **Resend integration for newsletter emails** — We will be adding Resend on a later date once we get done with the functionality of the app. Website: https://resend.com/docs/send-with-express
   -*Examples: https://github.com/resend/resend-examples/blob/main/express-resend-examples/README.md
- **Hamburger menu for mobile** — We will be adding a hamburger menu to the app when it is mobile sized.
-*Make articles sharable 
