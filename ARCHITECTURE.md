# SIAM COIN — Production Architecture

## Stack

```
Frontend         Next.js 15 + TypeScript + Tailwind CSS
Auth             Supabase Auth (Email + Google OAuth)
Database         Supabase PostgreSQL + Prisma ORM
Storage          Supabase Storage / Cloudinary
Payment          Stripe + PromptPay
AI               OpenAI GPT-4o Vision (coin analysis)
Realtime         Supabase Realtime (auction bidding)
Deploy           Vercel (frontend) + Supabase (backend)
```

## Repository Structure

```
src/
├── app/
│   ├── api/                    # API Routes (REST)
│   │   ├── auth/sync/          POST  — Sync Supabase → Prisma user
│   │   ├── coins/              GET   — List coins (filter/sort/pagination)
│   │   │                       POST  — Create coin
│   │   ├── coins/[id]/         GET   — Coin detail + view count
│   │   │                       PATCH — Update coin
│   │   │                       DELETE— Soft delete (DELISTED)
│   │   ├── orders/             GET   — My orders
│   │   │                       POST  — Create order + escrow
│   │   ├── orders/[id]/        GET   — Order detail
│   │   │                       PATCH — Update status (ship/deliver/cancel)
│   │   ├── auctions/           GET   — List auctions
│   │   │                       POST  — Create auction
│   │   ├── auctions/[id]/bid/  GET   — Auction bids
│   │   │                       POST  — Place bid + auto-bid
│   │   ├── certificates/       GET   — Pending certs (expert/admin)
│   │   │                       POST  — Request certification
│   │   ├── certificates/[id]/  GET   — Certificate detail
│   │   │                       PATCH — Approve/Reject
│   │   ├── reviews/            GET   — Seller reviews
│   │   │                       POST  — Create review
│   │   ├── watchlist/          GET   — My watchlist
│   │   │                       POST  — Toggle watchlist
│   │   ├── monks/              GET   — List monks
│   │   ├── notifications/      GET   — My notifications
│   │   ├── notifications/read/ PATCH — Mark as read
│   │   ├── ai/analyze/         GET   — Get AI analysis
│   │   │                       POST  — Submit image for AI analysis
│   │   ├── fraud/              GET   — Fraud alerts (admin)
│   │   │                       POST  — Report fraud
│   │   ├── fraud/[id]/resolve/ PATCH — Resolve alert (admin)
│   │   └── admin/stats/        GET   — Platform statistics (admin)
│   │
│   ├── (pages)/                # Frontend Pages
│   │   ├── page.tsx            Home
│   │   ├── market/             Coin marketplace
│   │   ├── coins/[id]/         Coin detail
│   │   ├── checkout/[id]/      Checkout + payment
│   │   ├── dashboard/          Seller dashboard
│   │   ├── sell/               List coin for sale
│   │   ├── login/              Auth page
│   │   └── auth/callback/      OAuth callback
│   │
│   └── layout.tsx              Root layout + providers
│
├── components/
│   ├── auth/ProtectedRoute.tsx
│   ├── coins/CoinCard.tsx
│   ├── layout/Navbar.tsx
│   └── ui/                     Button, Badge, Card, StarRating
│
├── context/
│   ├── AuthContext.tsx          Supabase session state
│   └── LangContext.tsx          TH/EN/ZH i18n
│
└── lib/
    ├── prisma.ts               Prisma client singleton
    ├── auth-helpers.ts         getServerSession, getCurrentUser, requireAuth
    ├── api-response.ts         ok(), created(), badRequest(), etc.
    ├── validations.ts          Zod schemas for all API inputs
    ├── slug.ts                 URL slug generation
    ├── types.ts                Shared TypeScript types
    ├── i18n.ts                 Translations (TH/EN/ZH)
    ├── mock-data.ts            Development mock data
    └── utils.ts                formatPrice, conditionLabel

prisma/
├── schema.prisma               Database schema (14 models)
└── seed.ts                     Seed data (monks, sample coins)
```

## Database Models

```
User            — buyer/seller/expert/admin
Monk            — เกจิอาจารย์ (reference data)
Coin            — เหรียญพระเครื่อง (main entity)
Certificate     — ใบรับรองของแท้ (expert verification)
Order           — คำสั่งซื้อ + escrow
Auction         — ประมูลสด
Bid             — การประมูล (auction bids)
Review          — รีวิวผู้ขาย
Watchlist       — รายการที่สนใจ
PriceHistory    — ประวัติราคา (price chart)
Notification    — การแจ้งเตือน
Transaction     — payment logs
AiAnalysis      — ผล AI วิเคราะห์รูปเหรียญ
FraudAlert      — ระบบตรวจจับการโกง
```

## Setup Guide

### 1. Supabase Database Connection

ใน Supabase Dashboard → Settings → Database → Connection String

```env
# .env.local

# Transaction pooler (Prisma + connection pooling)
DATABASE_URL=postgresql://postgres.[project-ref]:[password]@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true

# Direct connection (migrations only)
DIRECT_URL=postgresql://postgres.[project-ref]:[password]@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres
```

### 2. Run Migrations

```bash
# Generate Prisma Client
npm run db:generate

# Create and apply migration
npm run db:migrate

# Seed initial data
npm run db:seed

# Optional: Open Prisma Studio
npm run db:studio
```

### 3. Sync User on Login

หลัง Supabase Auth login สำเร็จ ต้องเรียก:

```typescript
// ใน login callback หรือ auth state change
await fetch('/api/auth/sync', { method: 'POST' })
```

## API Usage Examples

```typescript
// List available coins
GET /api/coins?status=AVAILABLE&page=1&limit=20&sort=newest

// Search coins
GET /api/coins?q=หลวงปู่ทวด&certified=true&minPrice=1000&maxPrice=50000

// Get coin detail
GET /api/coins/[id]

// Create order
POST /api/orders
{ coinId, shippingAddress: { name, address, city, country, postalCode, phone } }

// Place auction bid
POST /api/auctions/[id]/bid
{ amountTHB: 5000, isAutoBid: false }

// Toggle watchlist
POST /api/watchlist
{ coinId: "xxx" }

// Request AI analysis
POST /api/ai/analyze
{ imageUrl: "https://...", coinId: "xxx" }

// Submit fraud report
POST /api/fraud
{ coinId, type: "counterfeit_coin", description: "..." }
```
