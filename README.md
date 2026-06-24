# TxnFlow Backend

> **Secure Multi-Tenant Finance API** — Hono + TypeScript backend with Better Auth, PostgreSQL, Prisma ORM, and true per-organization data isolation.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Runtime | Node.js >= 18 |
| Framework | Hono (TypeScript) |
| Database | PostgreSQL 15 |
| ORM | Prisma |
| Auth | Better Auth (email/password + JWT + Organizations) |
| Deployment | Railway / Render / Fly.io |

---

## Project Structure

```
backend/
├── src/
│   ├── index.ts                  # Hono app entry point
│   ├── auth/
│   │   ├── better-auth.ts        # Better Auth config (orgs, JWT plugin)
│   │   └── middleware.ts         # Auth guard middleware
│   ├── routes/
│   │   ├── auth.ts               # POST /api/auth/register, /login
│   │   └── transactions.ts       # POST /extract, GET /
│   ├── services/
│   │   └── extractor.ts          # Transaction parsing logic + confidence score
│   └── lib/
│       └── prisma.ts             # Prisma client singleton
├── prisma/
│   ├── schema.prisma             # DB schema (Better Auth + transactions)
│   └── migrations/               # Prisma migration history
├── tests/
│   ├── auth.test.ts              # Auth tests (register, login, JWT)
│   ├── extractor.test.ts         # Parsing tests (all 3 sample formats)
│   └── isolation.test.ts         # Multi-tenancy isolation tests
├── .env.example
├── package.json
└── tsconfig.json
```

---

## Prerequisites

- Node.js >= 18
- PostgreSQL 15 running locally or via Docker
- npm or pnpm

---

## Setup & Installation

### 1. Clone & install

```bash
git clone https://github.com/your-username/txnflow-backend.git
cd txnflow-backend
npm install
```

### 2. Configure environment

```bash
cp .env.example .env
```

Edit `.env`:

```env
# Database
DATABASE_URL=postgresql://postgres:password@localhost:5432/txnflow

# Better Auth
BETTER_AUTH_SECRET=your_better_auth_secret_here     # openssl rand -base64 32
BETTER_AUTH_URL=http://localhost:8080

# JWT
JWT_SECRET=your_jwt_secret_here                     # openssl rand -base64 32
JWT_EXPIRY=7d

# App
PORT=8080
NODE_ENV=development
```

### 3. Set up database

```bash
# Run migrations
npx prisma migrate dev --name init

# (Optional) Seed test users + organizations
npm run seed
```

### 4. Start the server

```bash
# Development (with hot reload)
npm run dev

# Production build
npm run build
npm start
```

API is live at **http://localhost:8080**

---

## API Reference

All protected routes require: `Authorization: Bearer <token>`

### Auth

#### `POST /api/auth/register`

```json
// Request
{
  "email": "alice@test.com",
  "password": "Test@1234",
  "name": "Alice"
}

// Response 201
{
  "user": { "id": "...", "email": "alice@test.com" },
  "organizationId": "org_abc123"
}
```

#### `POST /api/auth/login`

```json
// Request
{ "email": "alice@test.com", "password": "Test@1234" }

// Response 200
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expiresAt": "2026-01-01T00:00:00Z"
}
```

---

### Transactions

#### `POST /api/transactions/extract` *(protected)*

```json
// Request
{ "text": "Date: 11 Dec 2025\nDescription: STARBUCKS COFFEE MUMBAI\nAmount: -420.00\nBalance after transaction: 18,420.50" }

// Response 201
{
  "transaction": {
    "id": "txn_xyz",
    "date": "2025-12-11",
    "description": "STARBUCKS COFFEE MUMBAI",
    "amount": -420.00,
    "balance": 18420.50,
    "type": "debit",
    "confidence": 95,
    "organizationId": "org_abc123",
    "createdAt": "2026-06-24T10:00:00Z"
  }
}
```

#### `GET /api/transactions` *(protected + cursor pagination)*

```
GET /api/transactions?cursor=txn_xyz&limit=10
```

```json
// Response 200
{
  "transactions": [ /* array of transaction objects */ ],
  "nextCursor": "txn_abc",
  "hasMore": true
}
```

> All queries filter by `organizationId` from the Better Auth session context — users can never access another org's data.

---

## Database Schema (Prisma)

```prisma
model User {
  id             String    @id @default(cuid())
  email          String    @unique
  hashedPassword String
  name           String?
  createdAt      DateTime  @default(now())
  organizationId String
  organization   Organization @relation(fields: [organizationId], references: [id])
  transactions   Transaction[]
}

model Organization {
  id           String    @id @default(cuid())
  name         String
  createdAt    DateTime  @default(now())
  users        User[]
  transactions Transaction[]
}

model Transaction {
  id             String    @id @default(cuid())
  date           DateTime
  description    String
  amount         Float
  balance        Float?
  type           String    // "debit" | "credit"
  confidence     Int       // 0-100
  rawText        String
  userId         String
  organizationId String
  createdAt      DateTime  @default(now())
  user           User      @relation(fields: [userId], references: [id])
  organization   Organization @relation(fields: [organizationId], references: [id])

  @@index([organizationId])
  @@index([userId])
  @@index([createdAt])
  @@index([organizationId, createdAt])
}
```

---

## Transaction Parsing Logic

The extractor (`src/services/extractor.ts`) handles three formats:

| Format | Example | Confidence |
|--------|---------|-----------|
| Labeled | `Date: 11 Dec 2025 / Amount: -420.00` | 90–100% |
| UPI/SMS | `₹1,250.00 debited / Available Balance → ₹17,170.50` | 80–90% |
| Messy | `txn123 2025-12-10 ₹2,999.00 Dr Bal 14171.50` | 70–80% |

**Confidence score** is computed from:
- Date successfully parsed → +30 pts
- Amount found and valid → +30 pts
- Description extracted → +20 pts
- Balance found → +20 pts

---

## Multi-Tenancy & Data Isolation

- On **register**, Better Auth creates a new `Organization` and assigns the user to it.
- Every transaction is stored with both `userId` and `organizationId`.
- All `GET /api/transactions` queries include `WHERE organizationId = ?` from the JWT context — never from user input.
- Even with a valid JWT from User A, they cannot query User B's transactions. The org ID is extracted server-side from the verified token.
- **Bonus:** PostgreSQL Row-Level Security (RLS) policy applied as a second layer of defense.

---

## Running Tests

```bash
# All tests (Jest)
npm test

# Watch mode
npm run test:watch

# Coverage report
npm run test:coverage
```

Tests cover:
1. User registration with hashed password
2. Login returns valid JWT
3. Protected route rejects missing/invalid token
4. Transaction extraction — Sample 1 (labeled)
5. Transaction extraction — Sample 2 (UPI/SMS)
6. Transaction extraction — Sample 3 (messy)
7. Data isolation — User A cannot read User B's transactions
8. Cursor-based pagination returns correct page

---

## Test Credentials

Seeded via `npm run seed`:

| User | Email | Password | Org |
|------|-------|----------|-----|
| Alice | `alice@test.com` | `Test@1234` | `org_alice` |
| Bob | `bob@test.com` | `Test@1234` | `org_bob` |

---

## Deployment (Railway)

```bash
# Install Railway CLI
npm i -g @railway/cli

# Login + deploy
railway login
railway up
```

Set env vars in Railway Dashboard → Variables. Add `DATABASE_URL` pointing to Railway's provisioned Postgres.

Live API: `https://txnflow-api.railway.app`

---

## .env.example

```env
DATABASE_URL=postgresql://postgres:password@localhost:5432/txnflow
BETTER_AUTH_SECRET=
BETTER_AUTH_URL=http://localhost:8080
JWT_SECRET=
JWT_EXPIRY=7d
PORT=8080
NODE_ENV=development
```

---

## Approach to Better Auth Integration for Isolation & Scalability

Better Auth's **Organizations** plugin is the backbone of multi-tenancy. Each registered user is automatically placed into their own organization, and every database write and read is scoped to that `organizationId`. The JWT issued at login embeds the `organizationId` as a claim — the Hono middleware verifies this token and injects the org context into every request handler, making it impossible for a user to query outside their org even with a tampered request. For scalability, composite indexes on `(organizationId, createdAt)` support fast cursor-based pagination without full table scans, and the Prisma client is a singleton to avoid connection pool exhaustion under load.
