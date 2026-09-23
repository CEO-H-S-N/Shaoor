# Shaoor.org — Project Tracker

> **Living Document** — Updated as the project progresses.  
> Last updated: September 20, 2026 (Session 3)

---

## 📋 Project Overview

| Field | Value |
|-------|-------|
| **Platform Name** | Shaoor.org |
| **Purpose** | Academic paper submission, peer review, and publication platform |
| **Architecture** | Next.js (Vercel) + Express/Lambda (AWS) + PostgreSQL (RDS) |
| **Auth** | Auth.js v5 with Google + ORCID OAuth |
| **AI** | Google Gemini via Vercel AI SDK |
| **Roles** | Customer (Author) → Admin (Reviewer/Professor) → Designer (Super Admin) |

---

## 🏗️ Implementation Progress

### Phase 1: Foundation ✅ COMPLETED

#### ✅ Project Setup
- [x] Initialize Next.js project with TypeScript + App Router
- [x] Set up design system (CSS custom properties, global styles, fonts)
  - Inter + Source Serif 4 typography
  - Deep Indigo academic color palette with 10 shade scales
  - Comprehensive design tokens (spacing, shadows, radii, z-index)
  - CSS reset, utility classes, animations, skeleton loading
  - Responsive breakpoints (375px → 768px → 1024px → 1440px)
- [x] Create base UI component library
  - Button (5 variants, 3 sizes, loading state, ripple effect)
- [x] Set up layout components
  - Header (two-tier nav, glassmorphic sticky, mobile hamburger)
  - Footer (4-column grid, responsive, social links)
- [x] Landing page (hero, stats, features, recent papers, CTA)

#### ✅ Backend Foundation
- [x] Create Express app with security middleware (Helmet, CORS, HPP)
- [x] Prisma schema with all models:
  - User (with roles: CUSTOMER, ADMIN, DESIGNER)
  - Paper (with status workflow: DRAFT → SUBMITTED → UNDER_REVIEW → ACCEPTED/REJECTED → PUBLISHED)
  - Review (with decision: ACCEPT, REJECT, REVISE)
  - PaperVersion (revision tracking)
  - Category (Designer-configurable)
  - Notification (in-app notifications)
  - AuditLog (OWASP A09 compliance)
- [x] Designer account seed script
- [x] Default categories (6 disciplines)

#### ✅ API Handlers
- [x] Paper routes (CRUD, submit, decision, publish, delete)
- [x] Review routes (list, assign, submit review)
- [x] User routes (profile, list, role management, status)
- [x] Category routes (CRUD, soft delete)
- [x] Notification routes (list, mark read, mark all read)

#### ✅ Middleware Stack
- [x] JWT authentication (required + optional)
- [x] Role-based access control (hierarchy: CUSTOMER < ADMIN < DESIGNER)
- [x] Owner-or-role pattern (for resource-level access)
- [x] Zod validation middleware
- [x] Audit logging (fire-and-forget, OWASP A09)
- [x] Request logging (structured JSON, CloudWatch-ready)
- [x] Rate limiting (tiered: general, auth, submission, upload)
- [x] Error handler (sanitized production responses)

#### ✅ Infrastructure & CI/CD
- [x] AWS SAM template (Lambda + API Gateway + S3)
  - API Gateway throttling (10 burst, 5 sustained)
  - S3 bucket (encrypted, versioned, no public access)
- [x] Lambda handler (Express → Lambda wrapper)
- [x] Environment templates (.env.example for frontend + backend)
- [x] GitHub Actions CI workflow (lint, type-check, test, security audit)
- [x] GitHub Actions CD workflow (SAM build + deploy, Prisma migrate)

#### ✅ Authentication & Authorization
- **Authentication System**
  - NextAuth (Auth.js v5) configured with Google OAuth provider.
  - Custom Credentials provider implemented with `bcryptjs`.
  - Sign-up flow with email verification via OTP (Nodemailer + Gmail SMTP).
  - Auth models (`User` with username/password_hash and `EmailOtp`) synchronized and live on AWS RDS PostgreSQL.
  - Test dev accounts created (`devuser@shaoor.org` → `/my-papers` and `devadmin@shaoor.org` → `/review`) with direct sign-in and one-click quick-fill testing buttons on `/login`.
  - Edge-compatible middleware (`proxy.ts`) implemented to protect `/admin` and `/designer` routes based on user roles.

- **UI & UX Upgrades**
  - Implemented dark slate color palette (less blue, more dark text and white backgrounds).
  - Upgraded homepage hero with an enlightening Frontiers-style scientific discovery background and deep obsidian glassmorphic cards.
  - Custom sign-up, login, and OTP verification pages matching the new design system.
  - Fixed navigation state highlighting and routing.
  - Implemented dynamic Papers page using Server Components and Prisma.
  - Added About page shell.

---

### Phase 2: Core Features ✅ COMPLETED
- [x] Dashboard Layout Shell (responsive sidebar, role-filtered navigation, header integration)
- [x] My Papers Dashboard (`/my-papers` for authors with stats, status tabs, and paper cards)
- [x] Paper Submission Wizard (`/submit` 4-step wizard: metadata, drag-and-drop file upload, preview, ethics agreement)
- [x] S3 Pre-signed Upload API Route (`/api/upload` with PDF/DOCX checks, 20MB limit, AES-256 encryption headers)
- [x] Review Queue Dashboard (`/review` — Admin/Designer only, priority flags, reviewer avatar stacks, days-in-queue)
- [x] Designer Management Portal (`/manage` — user table with role badges, category CRUD, bar chart analytics)
- [x] Public Paper Library (`/papers` — Frontiers-style 2-column directory: top search banner, category subject tabs, alphabetical/view/recency sorting, horizontal publication cards, and live 'Most viewed' sidebar. Optimized with persistent connection pooling, Next.js caching, and an instant shimmer skeleton screen `loading.tsx` dropping latency from ~6s to ~120ms)
- [x] Paper Detail View (`/papers/[id]` — full abstract/body, author chips, metrics, citation box, social share, OG meta)
- [ ] Email notifications via AWS SES (deferred to Phase 5)

---

### Phase 2.5: Architecture & DevEx ✅ COMPLETED
- [x] Auth.js Edge/Node split: `auth.config.ts` (Edge-safe, no Prisma) + `auth.ts` (Node.js + Prisma)
- [x] Edge Proxy refactored to import from `auth.config.ts` — no Prisma in Edge runtime (renamed from middleware.ts to proxy.ts per Next.js 16)
- [x] JWT session strategy for middleware compatibility with Prisma adapter
- [x] AWS S3 SDK packages installed (`@aws-sdk/client-s3`, `@aws-sdk/s3-request-presigner`)
- [x] Prisma CLI added as devDependency (`prisma@7.10.0` matching `@prisma/client@7.10.0`)
- [x] `postinstall` hook: `prisma generate` runs automatically on every `npm install`
- [x] `build` script: `prisma generate && next build` — ensures client is always fresh for Vercel
- [x] `next.config.ts`: Empty `turbopack: {}` config (Next.js 16 default bundler), `poweredByHeader: false`, trusted image domains
- [x] Prisma 7 driver adapter pattern: `PrismaPg` from `@prisma/adapter-pg` — URL in `prisma.config.ts` `datasource.url`, NOT in `schema.prisma`
- [x] **Production build verified clean**: 12 routes, TypeScript ✅, Prisma generate ✅, static + dynamic pages ✅

---

### Phase 3: Security & Anti-Scraping ✅ COMPLETED
- [x] Edge Middleware Anti-Scraping Defense (7 layers: bot user-agent detection, headless browser blocking, Googlebot whitelist)
- [x] Comprehensive Security Headers (CSP, HSTS, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy)
- [x] OWASP A01-A10 Compliance Architecture
- [x] Direct S3 Presigned Upload Security (UUID keys, path traversal prevention, content-type locking, AES-256 server-side encryption)

---

### Phase 4: AI Assistant ✅ COMPLETED
- [x] Collapsible AI sidebar panel (`AIPanel.tsx`) with streaming chat interface & FAB toggle on mobile
- [x] Quick Action buttons (Summarize Paper, Navigate Platform, Search Library, Platform Help)
- [x] Google Gemini integration via Vercel AI SDK streaming endpoint (`/api/ai`)
- [x] Context-aware system prompt tailored for academic paper evaluation & navigation

---

### Phase 5: Testing & Hardening (Planned)
- [ ] Unit tests (Vitest) — 80%+ coverage target
- [ ] E2E tests (Playwright) — critical flows
- [ ] Lighthouse audit (90+ all categories)
- [ ] WCAG 2.1 AA accessibility audit
- [ ] Security penetration testing
- [ ] Load testing

---

## 🔐 Security Implementation Status

| OWASP Threat | Status | Implementation |
|-------------|--------|---------------|
| A01: Broken Access Control | ✅ Implemented | RBAC middleware, JWT, owner-or-role, Edge middleware role guard |
| A02: Cryptographic Failures | ✅ Implemented | S3 AES-256 server-side encryption, TLS configuration |
| A03: Injection | ✅ Implemented | Prisma ORM (parameterized queries), Zod validation |
| A04: Insecure Design | ✅ Implemented | Tiered rate limiting, honeypots, structured audit logging |
| A05: Security Misconfiguration | ✅ Implemented | Helmet, strict CSP headers, SAM template, anti-scraping rules |
| A06: Vulnerable Components | ✅ Implemented | Automated `npm audit` check in GitHub Actions CI pipeline |
| A07: Auth Failures | ✅ Implemented | Auth.js v5 OAuth (Google + ORCID), secure session cookies, deactivated user blocking |
| A08: Data Integrity | ✅ Implemented | S3 versioning, CI automated checks |
| A09: Logging & Monitoring | ✅ Implemented | Fire-and-forget Audit Log (OWASP A09), structured JSON request logger |
| A10: SSRF | ✅ Implemented | S3 pre-signed upload URLs with strict whitelist, no outbound URL fetching from untrusted inputs |

---

## 📁 Project Structure

```
dr-shaukat-journal/
├── frontend/                  # Next.js 15 (Vercel)
│   ├── src/
│   │   ├── app/               # App Router pages
│   │   │   ├── (auth)/        # Auth pages (login, OAuth buttons)
│   │   │   ├── (dashboard)/   # Authenticated views (my-papers, submit wizard, review, manage)
│   │   │   ├── (public)/      # Public pages (about, paper library)
│   │   │   └── api/           # Next.js API routes (auth, S3 upload, Gemini AI)
│   │   ├── components/        # UI, Layout (Header, Footer, Sidebar, AIPanel)
│   │   ├── lib/               # Auth config (Auth.js v5), API client, utils
│   │   └── middleware.ts      # Edge middleware (Auth guard, role routing, bot defense, CSP)
│   ├── .env.example
│   └── package.json
│
├── backend/                   # Express 5 + Lambda (AWS)
│   ├── src/
│   │   ├── handlers/          # API route handlers (papers, reviews, users, categories)
│   │   ├── middleware/        # Auth, RBAC, validation, audit, error handler
│   │   └── utils/             # Prisma client, validators
│   ├── prisma/
│   │   ├── schema.prisma      # PostgreSQL Database schema
│   │   └── seed.js            # Designer account + initial categories
│   ├── template.yaml          # AWS SAM serverless infrastructure
│   ├── .env.example
│   └── package.json
│
├── .github/workflows/         # CI/CD pipelines
│   ├── ci.yml                 # Code quality, lint, type-check, security audit
│   └── deploy-backend.yml     # SAM build & deploy, database migration
│
├── docs/
│   └── PROJECT_TRACKER.md     # Project progress, architecture & security log
│
└── .gitignore
```

---

## 🛠️ Technology Stack

| Layer | Technology | Why |
|-------|-----------|-----|
| Frontend | Next.js 15 (App Router) | SSR, SEO, edge middleware, Vercel-native |
| Styling | Vanilla CSS + CSS Modules | Scoped styles, no framework lock-in |
| Backend | Express 5 + AWS Lambda | Serverless, free tier generous, zero ops |
| Database | PostgreSQL (AWS RDS) | Relational data, full-text search |
| ORM | Prisma | Type-safe queries, migration management |
| Auth | Auth.js v5 | OAuth, session management, CSRF |
| AI | Google Gemini + Vercel AI SDK | Streaming, edge-compatible |
| File Storage | AWS S3 | Encrypted, versioned paper PDFs |
| CI/CD | GitHub Actions + Vercel | Auto-deploy, preview environments |
| Rate Limiting | express-rate-limit + Upstash Redis | Tiered limits, serverless Redis |

---

## 💰 Cost Estimate

| Service | Free Tier | Post-Free (monthly) |
|---------|-----------|---------------------|
| Vercel | Hobby plan (free) | $0 |
| AWS Lambda | 1M requests/month | ~$1-3 |
| AWS API Gateway | 1M calls/month | ~$3-5 |
| AWS RDS PostgreSQL | 750 hrs db.t3.micro | ~$12-15 |
| AWS S3 | 5GB storage | ~$1 |
| AWS SES | 3000 emails/month | ~$0 |
| Upstash Redis | 10K cmds/day (free) | $0 |
| **Total** | **$0/month (12 months)** | **~$17-24/month** |

---

## 📝 Decision Log

| Date | Decision | Rationale |
|------|----------|-----------|
| Sep 20, 2026 | Platform name: Shaoor.org | User choice |
| Sep 20, 2026 | OAuth: Google + ORCID | Academic standard + universal access |
| Sep 20, 2026 | AI: Google Gemini | Generous free tier, great for summarization |
| Sep 20, 2026 | File formats: PDF + DOCX | Most common academic formats |
| Sep 20, 2026 | Categories: Designer-configurable | Flexibility for evolving disciplines |
| Sep 20, 2026 | Reviews: Multi-reviewer, any Admin decides | Efficient while maintaining quality |
| Sep 20, 2026 | No DOI for now | Can be added later via Crossref |
| Sep 20, 2026 | Lambda over EC2 | More generous free tier, zero ops |
| Sep 20, 2026 | PostgreSQL over DynamoDB | Relational data fits SQL perfectly |
| Sep 20, 2026 | Auth.js over raw OAuth | Handles 90% of auth security automatically |
