# 📖 Book of Forgiveness — Full-Stack Blog Platform

> A production-ready blog platform showcasing modern full-stack development practices with React 19, Express, PostgreSQL, and multi-service deployments.

**Live Demo:** [personal-website-kgm3-6in28es7v-seths-projects-4bb15efa.vercel.app](https://personal-website-kgm3-6in28es7v-seths-projects-4bb15efa.vercel.app)

---

## 🎯 About This Project

This project demonstrates **enterprise-grade full-stack development** across multiple cloud platforms. It's designed to impress technical leaders and showcase:

✨ **Frontend Excellence** — React 19 + TypeScript + Vite + React Router v7 + Tailwind CSS v4  
✨ **Backend Resilience** — Express + Prisma v7 with driver adapters + JWT auth  
✨ **Database Mastery** — PostgreSQL on Neon with migrations & seed data  
✨ **Production Deployment** — Multi-service architecture (Vercel + Railway + Neon)  
✨ **Security First** — httpOnly cookies, CORS, bcryptjs hashing, parameterized queries  
✨ **Email Integration** — Resend for transactional emails  
✨ **Monorepo Best Practices** — Unified workspaces, separate build pipelines  

---

## 🚀 Key Features

### For Readers
- 📰 Browse published articles with markdown rendering
- 👤 Author bio and credentials
- 💌 Subscribe to newsletter (Resend email integration)
- 💬 Post comments on articles
- 🔗 Share articles to Twitter, LinkedIn, Facebook
- 📧 Contact author via modal form
- 📱 Fully responsive design

### For Admin
- 🔐 Secure login (JWT + httpOnly cookies)
- 📊 Dashboard with article statistics
- ✍️ Create, edit, publish, delete articles
- 🔤 Auto-generate URL slugs
- 📝 Markdown editor with preview
- 📬 View reader comments
- 🔔 Email notifications for new articles

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────┐
│   Frontend (React 19 + Vite)               │
│   Deployed on Vercel (Edge CDN)            │
│   https://personal-website-kgm3-...        │
└──────────────────┬──────────────────────────┘
                   │ VITE_API_URL=/api
                   ↓
┌─────────────────────────────────────────────┐
│   Backend (Express + TypeScript)           │
│   Deployed on Railway (Node Container)     │
│   https://personal-website-b2f4.railway.app│
└──────────────────┬──────────────────────────┘
                   │ DATABASE_URL
                   ↓
┌─────────────────────────────────────────────┐
│   Database (PostgreSQL on Neon)            │
│   Serverless, Auto-backups, Connection Pool│
└─────────────────────────────────────────────┘
                   ↓
┌─────────────────────────────────────────────┐
│   Email Service (Resend)                   │
│   Newsletters, Contact Forms, Alerts       │
└─────────────────────────────────────────────┘
```

### Monorepo Structure

```
blog-site/
├── frontend/               # React SPA (Vite)
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── pages/          # Route-based pages
│   │   ├── context/        # Auth state (AuthContext)
│   │   ├── lib/            # API client, utilities
│   │   └── index.css       # Tailwind v4 + theme
│   ├── vite.config.ts
│   └── vercel.json         # SPA routing config
│
├── backend/                # Express API
│   ├── src/
│   │   ├── routes/         # API endpoints
│   │   ├── middleware/     # JWT auth, CORS
│   │   └── lib/            # Database, utilities
│   ├── prisma/
│   │   ├── schema.prisma   # Database schema
│   │   ├── migrations/     # Migration history
│   │   └── seed.ts         # Admin + sample data
│   └── index.ts
│
├── package.json            # Workspaces config
├── vercel.json             # Build pipeline
└── README.md
```

---

## 🛠️ Tech Stack

| **Layer** | **Technology** | **Version** | **Why** |
|-----------|---|---|---|
| Frontend Framework | React | 19.2.3 | Latest, concurrent rendering |
| Build Tool | Vite | 6 | Lightning fast HMR, optimized bundles |
| Routing | React Router | 7 | Client-side SPA routing |
| Styling | Tailwind CSS | 4 | Utility-first, no config file |
| Language | TypeScript | 5 | Type safety across codebase |
| Backend Framework | Express | 4 | Lightweight, flexible middleware |
| ORM | Prisma | 7 | Type-safe, driver adapters, migrations |
| Database | PostgreSQL | (Neon) | ACID compliance, relational integrity |
| Auth | JWT + bcryptjs | - | Stateless, httpOnly cookies |
| Email | Resend | - | High deliverability, API-first |
| Frontend Hosting | Vercel | - | Edge functions, auto-deploy, CDN |
| Backend Hosting | Railway | - | Container deployment, auto-scaling |
| Database Hosting | Neon | - | Serverless Postgres, auto-backups |

---

## 📊 Data Model

```typescript
Article {
  id:        Int       @id @autoincrement
  title:     String
  slug:      String    @unique        // auto-generated
  excerpt:   String    // short preview
  content:   String    // markdown
  published: Boolean   @default(false)
  createdAt: DateTime  @default(now())
  updatedAt: DateTime  @updatedAt
  comments:  Comment[] // cascade delete
}

Comment {
  id:        Int       @id @autoincrement
  articleId: Int       // foreign key
  article:   Article   @relation(onDelete: Cascade)
  name:      String    // max 100 chars
  body:      String    // max 2000 chars
  createdAt: DateTime  @default(now())
}

Admin {
  id:       Int     @id @autoincrement
  email:    String  @unique
  password: String  // bcryptjs hashed (cost 12)
}

Subscriber {
  id:               Int     @id @autoincrement
  email:            String  @unique
  unsubscribeToken: String  @unique
  createdAt:        DateTime @default(now())
}
```

---

## 🔌 API Endpoints

### Articles
```
GET    /api/articles              # Paginated list (7 per page, published only)
GET    /api/articles/:id          # Single article
POST   /api/articles              # Create (admin only)
PUT    /api/articles/:id          # Update (admin only)
DELETE /api/articles/:id          # Delete (admin only)
```

### Authentication
```
POST   /api/auth/login            # Login → httpOnly JWT cookie
POST   /api/auth/logout           # Clear JWT
GET    /api/auth/me               # Current admin (auth required)
```

### Comments
```
GET    /api/comments/:articleId   # Get comments
POST   /api/comments/:articleId   # Post comment (public)
```

### Email
```
POST   /api/subscribers           # Subscribe to newsletter
POST   /api/contact               # Contact form → email
```

All endpoints return `application/json`. Auth endpoints use httpOnly cookies (XSS protection).

---

## 🚀 Getting Started

### Prerequisites
- **Node.js** 18+ (22+ recommended)
- **PostgreSQL** (local) or **Neon account** (cloud)
- **npm** 9+

### Local Development

1. **Clone & install:**
   ```bash
   git clone https://github.com/sjohnson711/Personal-Website.git
   cd Blog_Site
   npm install
   ```

2. **Setup database:**
   ```bash
   cd backend
   npm run db:push    # Apply migrations
   npm run db:seed    # Create admin + sample articles
   ```

3. **Configure environment** (`backend/.env`):
   ```env
   DATABASE_URL="postgresql://user:password@localhost:5432/book_site"
   JWT_SECRET="your-secret-key-here"
   PORT=3001
   FRONTEND_URL="http://localhost:5173"
   RESEND_API_KEY="re_..."
   ```

4. **Start servers:**
   ```bash
   # Terminal 1
   cd backend && npm run dev     # http://localhost:3001
   
   # Terminal 2
   cd frontend && npm run dev    # http://localhost:5173
   ```

5. **Login at** `http://localhost:5173/gateway`
   - Email: `admin@yoursite.com`
   - Password: (from seed, or `ADMIN_PASSWORD` env var)

---

## 📦 Production Deployment

### Quick Reference

| Service | Where | How |
|---------|-------|-----|
| **Frontend** | Vercel | Auto-deploy on GitHub push |
| **Backend** | Railway | Auto-deploy on GitHub push |
| **Database** | Neon | Serverless PostgreSQL |
| **Email** | Resend | API integration |

### Deployment Steps

#### 1. **Neon Database**
```bash
# 1. Sign up at neon.tech
# 2. Create project, copy connection string
# 3. Keep for next steps
```

#### 2. **Railway Backend**
```bash
# 1. Sign up at railway.app
# 2. Connect GitHub, create project
# 3. Set root directory: /backend
# 4. Add environment variables:
#    - DATABASE_URL (from Neon)
#    - JWT_SECRET
#    - FRONTEND_URL (after Vercel deploy)
#    - SITE_URL
#    - RESEND_API_KEY
#    - FROM_EMAIL
#    - ADMIN_PASSWORD
```

#### 3. **Vercel Frontend**
```bash
# 1. Sign up at vercel.com
# 2. Import GitHub repo
# 3. Root Directory: . (root)
# 4. Build Command: npm install && cd frontend && npm run build
# 5. Output: frontend/dist
# 6. Environment: VITE_API_URL=https://your-railway-domain.railway.app/api
# 7. Deploy
```

#### 4. **Update Railway**
```bash
# After Vercel deploy:
# 1. Go back to Railway
# 2. Update FRONTEND_URL & SITE_URL to Vercel domain
# 3. Redeploy
```

#### 5. **Sync Data**
```bash
# Export local articles
pg_dump --username=<user> --dbname=book_site \
  --table='"Article"' --data-only --column-inserts \
  > articles.sql

# Import to Neon
psql "<neon-url>" -f articles.sql

# Seed admin
DATABASE_URL="<neon-url>" ADMIN_PASSWORD="<pwd>" npx tsx prisma/seed.ts
```

---

## 🔐 Security

- **Authentication** — JWT tokens signed with HS256, 7-day expiration
- **Session Storage** — httpOnly cookies (prevents JavaScript access, XSS protection)
- **Password Hashing** — bcryptjs cost factor 12
- **CORS Policy** — Allows `*.vercel.app` (handles redeployments) + explicit `FRONTEND_URL`
- **Database** — Parameterized queries via Prisma, cascade deletes
- **Email** — Verified sender domain via Resend, rate limiting

---

## 🧪 Testing

### Manual Checklist
- [ ] Homepage loads with articles
- [ ] Article detail page renders markdown
- [ ] About page displays author bio
- [ ] Newsletter signup sends email
- [ ] Contact form sends email
- [ ] Admin login works at `/gateway`
- [ ] Can create/edit/delete articles
- [ ] Slug auto-generation works
- [ ] Comments display on published articles
- [ ] Share buttons work (Twitter, LinkedIn, Facebook)
- [ ] Logout clears session

---

## 📚 Development Notes

### Prisma v7 Driver Adapters
This project uses Prisma's driver adapter pattern (not traditional `DATABASE_URL` in schema):

```typescript
const adapter = new PrismaPg(
  new Pool({ connectionString: process.env.DATABASE_URL })
);
const prisma = new PrismaClient({ adapter });
```

Benefits: Better pooling control, works with Neon's pgBouncer.

### Tailwind v4
No `tailwind.config.ts`. All customization in CSS (`frontend/src/index.css`):

```css
@theme {
  --color-amber: #fbbf24;
  --color-forest: #40916c;
}

@layer utilities {
  .glass-card {
    background: rgba(10, 5, 0, 0.62);
    backdrop-filter: blur(10px);
  }
}
```

### Environment Variables
- **Frontend** — `VITE_` prefix for Vite injection
- **Backend** — Standard Node.js env vars
- **Vercel** — Injected via dashboard
- **Railway** — Injected via dashboard

---

## 🐛 Troubleshooting

| Problem | Solution |
|---------|----------|
| **Articles not loading** | Verify `VITE_API_URL` in Vercel includes `/api` suffix |
| **CORS errors** | Update `FRONTEND_URL` in Railway to current Vercel domain |
| **Prisma client error** | Run `npx prisma migrate deploy && npx prisma generate` |
| **Database timeout** | Check `DATABASE_URL` is correct, verify Neon connection limit |
| **Build fails on Vercel** | Check Vercel build logs for missing dependencies |

---

## 🎓 Key Learning Outcomes

This project demonstrates:

1. **Full-stack competency** — Frontend + backend + database in production
2. **DevOps thinking** — Multi-service deployments, environment management, CI/CD
3. **Security best practices** — Auth, CORS, password hashing, SQL injection prevention
4. **Modern tooling** — Vite, Prisma v7, React 19, TypeScript
5. **Monorepo management** — Shared dependencies, unified deployment
6. **Database design** — Schema migrations, relationships, cascade deletes
7. **API design** — REST principles, CRUD operations, status codes
8. **Production readiness** — Error handling, logging, scalability

---

## 📈 Future Enhancements

- [ ] Full-text search on articles
- [ ] Comment moderation dashboard
- [ ] Reading time estimates
- [ ] Related articles (tags)
- [ ] Dark mode toggle
- [ ] Advanced analytics
- [ ] API rate limiting
- [ ] Email scheduling
- [ ] Live editor preview
- [ ] Custom domain support

---

## 📄 License

MIT — Feel free to use as template or reference for interviews.

---

## 👨‍💼 Author

**Seth Johnson** — Full-stack engineer focused on scalable systems and production deployments.

- **GitHub:** [sjohnson711](https://github.com/sjohnson711)
- **LinkedIn:** [Seth Johnson]([https://linkedin.com/in/seth-johnson](https://www.linkedin.com/in/seth-johnson-10a6a217b/))
- **Live Demo:** [personal-website-kgm3-6in28es7v-seths-projects-4bb15efa.vercel.app](https://personal-website-kgm3-6in28es7v-seths-projects-4bb15efa.vercel.app)

---

**Status:** ✅ Production-Ready | **Last Updated:** May 2026 
