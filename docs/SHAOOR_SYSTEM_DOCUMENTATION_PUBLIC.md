# Shaoor Academic Journal Platform
## Enterprise Architecture & Technical Specification (PUBLIC EDITION)

> **PUBLIC STAKEHOLDER EDITION // ARCHITECTURAL REFERENCE**  
> **Classification:** Public System Specification (All Secrets & Passwords Redacted)  
> **Platform URL:** [https://shaoor.org](https://shaoor.org) | [https://www.shaoor.org](https://www.shaoor.org)  
> **Vercel Staging:** [https://shaoor-nine.vercel.app](https://shaoor-nine.vercel.app)  
> **GitHub Repository:** [https://github.com/CEO-H-S-N/Shaoor](https://github.com/CEO-H-S-N/Shaoor) (`main` branch)  
> **Version:** 2.4.0 (September 2026 Production Release)

---

## 1. Executive Summary & Purpose

**Shaoor** (شعور — *Consciousness & Enlightenment*) is an academic manuscript publication and peer-review platform. It provides authors, reviewers, and journal editors with an integrated digital workflow:

- **Self-Service Author Portal**: Guided manuscript submission with metadata extraction, multi-author ORCID attribution, keyword indexing, and automated APA citation generation.
- **Scientific Figure Gallery**: Dedicated database and cloud asset management for embedded high-resolution figures, schematics, and captions linked to manuscripts.
- **Double-Blind Review Queue**: Role-based reviewer workspace supporting qualitative critiques, score-based assessment, structured decisions (Accept, Reject, Request Revisions), and direct author feedback notifications.
- **Dynamic Editorial CMS**: Zero-downtime content management allowing the Owner to directly edit the Journal Scope, Author Guidelines, and Editorial Team directory from the web UI.
- **Automated Auth & Verification**: Multi-factor onboarding featuring secure email OTP codes, self-service password reset, and Google One-Click OAuth authentication.
- **AI Research Assistant**: Integrated Google Gemini Generative AI sidebar assisting researchers with scholarly literature synthesis and paper exploration.

---

## 2. Infrastructure Architecture & Technology Stack

| Layer | Technology | Specification & Role |
| :--- | :--- | :--- |
| **Frontend Framework** | Next.js 15 (App Router) | React 19, Server Components, TypeScript, CSS Modules |
| **Application Hosting** | Vercel Edge Network | Serverless Node.js 20 runtime, Edge Middleware for JWT validation |
| **DNS & Domain** | Vercel Anycast DNS | Connected to Namecheap custom domain via `ns1.vercel-dns.com` / `ns2.vercel-dns.com` |
| **Database Service** | AWS RDS PostgreSQL 16 | Managed `db.t3.micro` in `eu-north-1` (Stockholm), automated backups |
| **ORM & Schema** | Prisma ORM v6 | Type-safe database client, connection pooling, automated migrations |
| **Object Storage** | AWS S3 | Private bucket in `eu-north-1` with temporary IAM pre-signed upload/download URLs |
| **Authentication** | Auth.js (NextAuth v5) | Dual-strategy: Google OAuth 2.0 + Credentials with Bcrypt (cost factor 12) |
| **Transactional Mail** | SMTP / Nodemailer | Six-digit cryptographic OTP generation with 10-minute automated expiry |
| **AI Assistant** | Google Gemini API | Gemini 1.5 Flash streaming completions for contextual research inquiries |

---

## 3. Role-Based Access Control (RBAC) & Governance

- **MASTER OWNER**:
  - Root system administrator with complete authority.
  - Can create new trusted Administrator accounts via the sidebar with name, email, and temporary password.
  - Can directly edit dynamic CMS pages (About Us, Author Guidelines, Editorial Team).
  - Can review, approve, request revisions, or reject any manuscript in the journal.
  - Can deactivate or temporarily ban user accounts.
- **ADMINISTRATOR**:
  - Access to the `/review` queue.
  - Can download manuscripts, view attached scientific figures, and submit formal peer evaluations.
  - Cannot edit CMS pages or provision new admin accounts.
- **CUSTOMER / AUTHOR**:
  - Submit manuscripts, upload scientific figures, view review status in real-time.
  - Read reviewer decision messages and re-submit revised versions.
  - Generate formatted APA citations and download published papers.
- **DESIGNER**:
  - Responsive layout and UI review privileges.

---

## 4. Environment Variables Directory (PUBLIC TEMPLATE)

> [!NOTE]
> All sensitive passwords, secret tokens, and AWS access keys have been redacted below for public distribution. Copy these keys into your local `.env.local` or Vercel dashboard and supply your own credentials.

### A. Environment Schema
```env
# Session Secret (Generate via: openssl rand -base64 32)
AUTH_SECRET="[32_CHARACTER_RANDOM_SECRET_KEY]"

# Google OAuth 2.0 (Google Cloud Console)
GOOGLE_CLIENT_ID="[YOUR_GOOGLE_CLIENT_ID].apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="[YOUR_GOOGLE_CLIENT_SECRET]"

# AWS RDS PostgreSQL (Connection String)
DATABASE_URL="postgresql://[USER]:[PASSWORD]@[RDS_ENDPOINT]:5432/[DB_NAME]?schema=public"

# AWS S3 Storage (IAM Access Keys & Bucket)
AWS_ACCESS_KEY_ID="[YOUR_AWS_ACCESS_KEY_ID]"
AWS_SECRET_ACCESS_KEY="[YOUR_AWS_SECRET_ACCESS_KEY]"
AWS_S3_BUCKET_NAME="[YOUR_AWS_S3_BUCKET_NAME]"
AWS_REGION="eu-north-1"

# Google AI Studio (Gemini Assistant)
GOOGLE_GENERATIVE_AI_API_KEY="[YOUR_GEMINI_API_KEY]"

# Transactional Mail (Gmail SMTP or SendGrid for OTP)
EMAIL_FROM="no-reply@shaoor.org"
EMAIL_APP_PASSWORD="[16_CHARACTER_SMTP_APP_PASSWORD]"
```

### B. Domain & Nameserver Configuration
- **Primary Nameserver:** `ns1.vercel-dns.com`
- **Secondary Nameserver:** `ns2.vercel-dns.com`
- **Apex & WWW Routing:** `shaoor.org` & `www.shaoor.org`

---

## 5. Database Schema Reference

The PostgreSQL database contains 12 core tables:
1. `users`: Identity, authentication hashes, roles, status, and ban logs.
2. `accounts`: OAuth provider linkages (Google, ORCID).
3. `sessions`: JWT / Edge session references.
4. `verification_tokens`: Secure token storage.
5. `papers`: Academic manuscripts with titles, abstracts, category foreign keys, statuses, and decision logs.
6. `paper_figures`: High-resolution scientific figures with captions linked to parent papers.
7. `paper_versions`: Iteration histories tracking revision cycles.
8. `reviews`: Quantitative and qualitative peer evaluations with decision outcomes.
9. `categories`: Scholarly disciplines with custom color codes and sort orders.
10. `notifications`: Real-time author alerts for paper status updates and reviewer comments.
11. `audit_logs`: OWASP A09 security logging tracking user registrations, reviews, and admin changes.
12. `email_otps`: Six-digit one-time passwords for verification and password recovery.
13. `page_contents`: Dynamic CMS entries for `/about` and `/author-guidelines`.
14. `team_members`: Editorial board directory with photos, designations, and bios.

---

## 6. Operational Procedures & Runbook

### Creating a New Admin Account
1. Log into `https://shaoor.org/login` using an authorized Master Owner account.
2. Click **Make Admin Account** on the left navigation panel.
3. Fill in the Professor's name, email, and temporary password.
4. Click **Create Admin Account**.

### Updating Dynamic CMS Pages
1. While logged in as the Master Owner, visit `/about`, `/author-guidelines`, or `/team`.
2. Click the **Edit Page** button.
3. Modify the content or team members in real-time and click **Save Changes**.

### Reviewing and Responding to Manuscripts
1. Navigate to `/review`.
2. Select any paper under review.
3. Choose **Approve**, **Reject**, or **Request Revision**.
4. Type feedback notes in the decision box and submit. The author is instantly notified.

---
*Public Architectural Manual — Shaoor Academic Platform.*
