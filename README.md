# ReachTheTop

A simple advertising marketplace: businesses compete for a single **#1** homepage placement by paying a bid that is **strictly higher** than the current winner.

Core loop:

**See #1 → see the live bid → bid higher → pay with Stripe → become #1 → get exposure**

This is paid advertising placement. Traffic, clicks, downloads, sales, and conversions are **not guaranteed**. It is not gambling.

## Stack

- Next.js 15 (App Router) + TypeScript
- Tailwind CSS
- PostgreSQL + Prisma
- Auth.js (credentials)
- Stripe Checkout + signed webhooks

## Install

```bash
npm install
cp .env.example .env
```

Generate `AUTH_SECRET`:

```bash
openssl rand -base64 32
```

Paste it into `.env` as `AUTH_SECRET`.

## Database

Start Postgres (Docker):

```bash
npm run db:up
```

Apply schema and generate the Prisma client:

```bash
npx prisma migrate dev --name init
```

If you prefer to push the schema without migration history:

```bash
npm run db:push
```

Seed demo advertisers, a live #1 bid of **$37**, and the first admin:

```bash
npm run db:seed
```

Default seed logins (override with env vars):

| Role | Email | Password |
| --- | --- | --- |
| Admin | `ADMIN_EMAIL` or `admin@example.com` | `ADMIN_PASSWORD` or `change-me-now` |
| Demo advertiser | `founder@northstar.example` | `demo-password` |

**Change the admin password before any public deploy.**

## Stripe

1. Create a Stripe account: [https://dashboard.stripe.com/register](https://dashboard.stripe.com/register)
2. Open [test API keys](https://dashboard.stripe.com/test/apikeys)
3. Put them in `.env`:

```
STRIPE_SECRET_KEY=sk_test_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
```

4. Forward webhooks while `npm run dev` is running:

```bash
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

Copy the `whsec_...` value into `STRIPE_WEBHOOK_SECRET`, then restart `npm run dev`.

Test card: `4242 4242 4242 4242`, any future expiry, any CVC.

Funds go to the Stripe account that owns those keys. Connect a bank in Stripe for payouts. This app never stores card numbers.

### Webhooks (required for production)

In production, add an endpoint in the Stripe Dashboard:

`https://your-domain.com/api/stripe/webhook`

Subscribe at least to:

- `checkout.session.completed`
- `checkout.session.async_payment_failed`
- `checkout.session.expired`
- `payment_intent.payment_failed`
- `charge.refunded`

The returning success page also verifies the Checkout Session with Stripe and finalizes the bid if the webhook is delayed. The **live #1 seat is never granted from the browser alone**. Before seating a winner, the server:

- Confirms the paid amount matches the bid
- Re-reads the current highest bid under a PostgreSQL advisory lock
- Rejects equal or lower bids
- Refunds automatically if someone else already took #1 at a higher price

## Run locally

```bash
npm run test
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

Admin: [http://localhost:3000/admin](http://localhost:3000/admin)

## Environment variables

| Variable | Purpose |
| --- | --- |
| `DATABASE_URL` | PostgreSQL connection string |
| `AUTH_SECRET` | Auth.js session secret |
| `AUTH_URL` | App origin, e.g. `http://localhost:3000` |
| `NEXT_PUBLIC_APP_URL` | Public URL for Stripe redirects, sitemap, OG |
| `NEXT_PUBLIC_SITE_NAME` | Display name |
| `STRIPE_SECRET_KEY` | Stripe secret key |
| `STRIPE_WEBHOOK_SECRET` | Webhook signing secret |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Stripe publishable key (optional for Checkout redirect) |
| `ADMIN_EMAIL` | Seeded admin email |
| `ADMIN_PASSWORD` | Seeded admin password |

## How bidding works

- Opening bid defaults to **$8** (configurable in admin).
- Minimum increment defaults to **$1**.
- If #1 is $37, the next valid bid is **$38** or more. **$37 is rejected**.
- You stay #1 until another advertiser’s **higher** payment is confirmed.
- Settings (starting bid, increment, approval, rules) live in **Admin → Settings**.

## Deploy

1. Provision PostgreSQL.
2. Set all environment variables on the host (Vercel, Fly, Railway, etc.).
3. Point `NEXT_PUBLIC_APP_URL` and `AUTH_URL` at HTTPS.
4. Run `npx prisma migrate deploy` then `npm run db:seed` once (or create the admin user yourself).
5. `npm run build` and `npm start` (or the platform’s Next.js build).
6. Register the Stripe webhook on the production URL.
7. Replace legal placeholders (Terms, Privacy, Advertising, Refund) with counsel-reviewed copy.
8. Replace the support email in Admin → Settings.

## Tests

```bash
npm test
```

Covers opening bid, strict increment, and vacant-board floor price.
