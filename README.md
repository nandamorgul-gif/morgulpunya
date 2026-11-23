# SEMEISTVO TECH — PC Store (Development Branch)

Professional PC storefront foundation with retained PC Builder.

## Currently implemented
- SEMEISTVO TECH rebrand, SVO logo, Dark Luxury storefront.
- Preserved existing PC Builder, preset builds, consultation, and content.
- Product catalogue, searching, sorting, browser cart, WhatsApp inquiry fallback.
- Node.js Express API, SQLite database, products and available stock.
- Server-authoritative totals and transactionally reserved stock (30-minute checkout).
- Midtrans Snap sandbox/production integration scaffold with server-side status verification.
- Protected admin login, product price/stock editing, order list and fulfillment status transitions.
- Private order access tokens for customers to check their most recent order status.

## Getting started locally
1. Install Node.js 20.17+.
2. Run `npm install` in the repository root.
3. Copy `.env.example` to `.env`.
4. Set a unique admin email and strong password of 16+ characters. Do not publish credentials.
5. Set `SEED_DEMO_STOCK=3` **only on your first local run** to try test products. Production defaults to stock 0.
6. Optional: configure a **Midtrans sandbox server key** in `.env`; never embed the server key in frontend code.
7. Run `npm start` and open `http://localhost:3000`.
8. Visit `http://localhost:3000/admin` for the protected admin dashboard.

The existing static website still works if opened directly, using consultation checkout instead of a backend checkout.
The public catalogue uses backend prices and stock when the API is available.
Price shown in the original PC Builder remains demo pricing from `js/data.js` until that configurator is connected to the backend.

## Payments
- With no server key, real online checkout is **disabled**; customers can still make WhatsApp inquiries.
- Sandbox key: test checkout only through Midtrans sandbox.
- Before any real-money launch: set `MIDTRANS_ENV=production`, `ENABLE_LIVE_PAYMENTS=true`, provide production key, deploy HTTPS with persistent storage, and configure the official **Midtrans HTTP notification URL** to `https://YOUR-DOMAIN/api/payments/midtrans/notification`.
- The backend verifies notification signatures **and** calls the provider's order-status endpoint before marking any order paid.
- Never accept a browser redirect or screenshot as proof of payment.
- Current shipping is a **fixed demonstration value**, not a live courier API; configure `SHIPPING_FLAT_IDR` before taking orders.

## Operating limitations — do not launch for real orders yet
This is a development foundation, **not production-ready**. The prototype needs:
- Automated end-to-end tests, payment sandbox webhook testing, and manual visual/mobile QA.
- Account recovery, admin password change/rotation and stronger protections such as MFA.
- Database backups, monitoring, reliable inventory expiry/compensation for all payment outcomes, concurrency/load tests and deployment hardening.
- Customer accounts, order history across devices, invoice generation, shipping/carrier integration, refund automation, returns and business policies.
- True live inventory and price control for the original PC Builder. Its prices are static examples.
- Business identity/domain/trademark checks and truthful claims for warranty, shipping and software licensing.
- No real transactions should be enabled until a full test and review.

## Production data security
`runtime-data/`, `.env`, SQLite files, and `node_modules/` are gitignored. The server serves only explicitly allowed frontend assets. Use HTTPS, encrypted backups and private filesystem permissions on hosting.
