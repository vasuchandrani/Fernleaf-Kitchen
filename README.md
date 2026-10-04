# Fernleaf Kitchen

Fernleaf Kitchen is an internal operations panel for a commercial kitchen
that prepares boxed meals for corporate companies. Staff create employee
orders, the kitchen prepares them, dispatch assigns deliveries, and drivers
complete them.

There is no customer-facing application in this assignment.

## Stack

- **Frontend:** Next.js, React, TypeScript
- **Backend:** NestJS, TypeScript
- **ORM/database:** Prisma with PostgreSQL
- **Deployment:** Frontend on Vercel, backend on Render

The frontend communicates with the backend over HTTP. Business rules and
permissions are enforced by the backend.

## Demo accounts

All demo accounts use `Test@1234`.

| Role | Email |
|---|---|
| Admin | `admin@test.com` |
| Kitchen | `kitchen@test.com` |
| Dispatch | `dispatch@test.com` |
| Driver | `driver@test.com` |

Each account has one role and receives only that role's permissions.

## Local setup

### Prerequisites

- Node.js 20+
- PostgreSQL database

### Backend

```powershell
cd backend
npm install
# Set DATABASE_URL in backend/.env
npx prisma generate
npx prisma db push
npm run start:dev
```

### Frontend

```powershell
cd frontend
npm install
# Set NEXT_PUBLIC_API_URL, normally http://localhost:8080
npm run dev
```

Open `http://localhost:4000`.

## Architecture

```text
Browser (Next.js)
        |
        | HTTP + JWT cookie
        v
NestJS API
  Auth/RBAC | Catalogue | Pricing | Companies | Orders
  Kitchen   | Dispatch | Driver  | Billing  | Settings
        |
        v
Prisma
        |
        v
PostgreSQL
```

Server permissions are checked with guards and permission mappings. The
frontend may redirect users to the correct dashboard, but it is not the
security boundary.

## Data model

```text
Company 1---* Employee 1---* Order 1---* OrderLine
   |                         |
   |                         *---* OrderCombination --- KitchenStation
   |                         |
   *---1 PriceTier           *---1 Drop --- User (Driver)

Dish 1---* OptionGroup *---* Option
  |
  *---* PriceTierDish
  *---* DishPrice
```

Prices are stored as integer cents. Order lines and combinations keep
snapshots so later catalogue or price changes do not alter historical orders.

## Dashboards

- **Admin:** catalogue, options, pricing tiers, companies, employees,
  settings, order creation, order management and operational oversight.
- **Kitchen:** confirmed preparation work by date and station; units move from
  not started to started to done.
- **Dispatch:** kitchen-ready drops, driver assignment, packing/dispatch
  progress and delivery tracking.
- **Driver:** the driver's assigned deliveries for today, ordered by time,
  showing only order number and item quantity; the driver marks an
  out-for-delivery drop as delivered.

Detailed real-life user stories are in
[docs/role-dashboards.md](./docs/role-dashboards.md).

## Design patterns

The main domain patterns are:

1. **Strategy Pattern** for fixed, derived and overridden catalogue price
   resolution.
2. **State Machine Pattern** for legal order, kitchen and delivery status
   transitions.

The implementation also uses permission guards and service boundaries to keep
authorization and persistence concerns separate. See
[docs/design-patterns.md](./docs/design-patterns.md).

## Key decisions and trade-offs

- Money uses integer cents instead of floating-point values.
- The kitchen timezone is **Asia/Kolkata (IST)** for “today”, cut-offs and
  delivery dates.
- Dishes are deactivated rather than deleted because historical orders refer
  to them.
- Server-side validation is authoritative; frontend validation improves
  feedback but cannot bypass API rules.
- Server-side filtering and pagination protect large order and kitchen lists.
- The required workflow was prioritised before optional portions and CSV
  import features.

Catalogue pricing strategies currently apply to final dish prices. Option
prices remain their own stored values; independent option-price derivation can
be added later without changing historical order snapshots.

## Delivery and testing priorities

The implementation prioritises:

1. Authentication, permission guards and the data model.
2. Catalogue, pricing, companies and employees.
3. Order creation, cut-offs and status transitions.
4. Kitchen, dispatch, driver and billing workflows.
5. Seed data, responsive UX, tests and deployment validation.

The most important business tests cover cut-off calculation, price
resolution/rounding, missing-price menu filtering, combination quantities and
invoice totals.
