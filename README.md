# SEMEISTVO TECH — PC Store (Development Branch)

Professional PC storefront foundation with retained PC Builder.

## 2026 visual + catalogue refresh (23 November 2026)
- Curated 2026 sample component catalogue with **46 entries in 10 categories**, including CPUs, GPUs, motherboards, cases, coolers and service packages.
- 2026 highlights: Ryzen 7 9850X3D, Ryzen 9 9950X3D, Intel Core Ultra 250K/270K Plus, GeForce RTX 5060 Ti 16GB / RTX 5070 Ti / RTX 5080 / RTX 5090, Radeon RX 9060 XT / RX 9070 XT.
- Four updated preset builds with basic checks for CPU socket, RAM type, motherboard form factor, PSU type and estimated power margin.
- Home page, services, contact and footer simplified for mobile and desktop; removed unrelated autoplay media and unverified sample testimonials.
- Legacy PC Builder payment form is now an **inquiry-only quotation form**; removed direct bank account options and payment-proof uploads. Only the separate server-backed checkout may initiate a provider payment.
- Original **category-specific SVG illustrations** under `images/products/`. These are not photographs of the exact SKU. Admin may replace images with **approved/licensed product photo URLs** over HTTPS; broken URLs fall back to illustrations.
- **All component prices are illustrative rupiah estimates**, not live quotations. Before selling, admin must confirm product SKU variant, actual photos, pricing, manufacturer warranty and stock.
- Official specifications used for model selection: [AMD Ryzen 7 9850X3D](https://www.amd.com/en/products/processors/desktops/ryzen/9000-series/amd-ryzen-7-9850x3d.html), [NVIDIA RTX 50](https://www.nvidia.com/id-id/geforce/graphics-cards/50-series/), [AMD Radeon RX 9000](https://www.amd.com/en/products/specifications/graphics.html), [Intel Core Ultra](https://www.intel.com/content/www/us/en/support/articles/000099656/processors.html).

### Update an existing SQLite catalog
- Backup `runtime-data/semeistvo.sqlite` and verify backups can be restored.
- Run `npm run catalog:sync` to preview which legacy SKUs will become inactive; curated new products retain zero stock.
- Review the preview, then run `npm run catalog:sync -- --apply` for the actual migration.
- Existing matching SKUs retain their admin-defined price/stock. Old SKUs are deactivated, not deleted; order history is preserved.
- New curated models come with zero stock; update actual stock, price, and photos in `/admin` before transactions.

## Currently implemented
- SEMEISTVO TECH rebrand, SVO logo, Dark Luxury storefront.
- Preserved existing PC Builder, preset builds, consultation, and content.
- Product catalogue, searching, sorting, browser cart, WhatsApp inquiry fallback.
- Node.js Express API, SQLite database, products and available stock.
- Server-authoritative totals and transactionally reserved stock (30-minute checkout).
- Midtrans Snap sandbox/production integration scaffold with server-side status verification.
- Protected admin login, product price/stock/**photo URL** editing, order list and fulfillment status transitions.
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
