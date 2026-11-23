# SEMEISTVO TECH — PC & Digital Studio (Development Branch)

Service-first PC and digital studio with retained PC Builder and an optional backend catalogue.

## Global visual refinement — 23 November 2026

This branch has a **single, last-loaded visual polish layer** at `css/polish.css`. It reconciles the existing multi-layer styling without rewriting PC Builder, cart, music, admin or gateway code:

- **Header**: slimmer, calmer glass navigation; more consistent responsive spacing and a single header cart.
- **Hero**: restrained gradient, clearer title/description hierarchy, compact service tags and balanced concept visual.
- **Services**: seven cards flow into a balanced four-column composition on wide screens, then two/one columns on smaller screens; matching card radii, photo ratios and action labels.
- **Process / GTA RP / Website**: consistent title sizes, text measure, callout borders and photo frames.
- **PC builds**: five reference builds in a balanced 3+2 layout, with a direct link into the interactive PC Builder, and clear estimate notes.
- **PC Builder**: larger product previews, less cramped selection controls, clearer search/brand chips, readable wattage/summary and stronger selection states.
- **Catalogue**: uniform category cards, reference photography, filters, product card spacing and shopping-cart buttons.
- **Payments / Contact**: genuine bank logos on quiet white backgrounds with an accessible bank-name fallback if remote Wikimedia images are blocked, cohesive lead form and transfer-information notice.
- **Footer**: simpler navigational groups, brand typography and small print, using semantic `nav` sections.
- **Accessibility and mobile**: a skip-to-services link, focus-visible controls, reduced-motion handling and sizing for 360, 390, 430, 768, 1024, 1280, 1440 and 1920px.

All previous service offerings, the original YouTube music component, 46 reference-photo/fallback product entries, SVO logo, 5 payment preferences, PC builds and integrated cart remain in place. No new payment functionality or unverified claims are introduced.

The new `e2e/visual-polish.spec.js` checks responsive overflow, 7 service cards, 5 build presets, payment logo fallback, correct sections and cart/music continuity.

## Ready-to-paste layout and payment logo revision — 23 November 2026

- Repositioned `#preset` (five 2026 configuration suggestions) **before** `#rakit-pc` in `index.html`, preserving the single `#presetsContainer` so the existing `js/app.js` preset cards keep working.
- Added a prompt under the preset cards that links directly to the PC Builder.
- Replaced placeholder initial letters in payment cards with authentic trademark logo images for **BCA, Mandiri, SeaBank Indonesia, Bank Jago (2026 logo), and DANA**. The sources are Wikimedia Commons `Special:FilePath` references; external network access is required to render the logos, and trademark rights continue to apply.
- Appended responsive layout and logo-frame styles to `css/services-expansion.css`, with two-column mobile payment cards and single-column mobile PC presets.
- The payment area is **information and preference only**, not a statement that transfer methods are activated, not an invoice, and not a request for users to send funds without admin confirmation.
- The original logo, music player, synced header cart, FiveM/GTA RP service, web development, server/admin and price estimates are retained.
- Added `e2e/preset-payment-layout.spec.js` for order, unique IDs, logo sources and retained music/cart verification.

**Commercial launch note:** Replace remote Wikimedia assets with locally hosted authorized official bank asset files after reviewing each logo’s trademark/brand guidelines. Do not copy assets or imply endorsement beyond your permission.

## Real hardware reference photos and unified cart (23 November 2026)

- **43 model/family-matched physical component and accessory photographs** plus **3 distinct context photographs** for software setup services; all 46 catalogue entries now have a reference image URL in `js/product-photos.js`. Product images are *reference photography*, not proof of the exact variant in stock. They are externally hosted.
- Service photography is labeled as an *illustration of the service*, never a photo of the promised result. A failed or hotlink-blocked external image still falls back to locally retained per-SKU illustration (`images/catalog/<id>.svg`) and then category artwork. No broken white/empty tiles.
- Existing SQLite product records with older `images/products/` or `images/catalog/` illustration URLs now show the latest reference photo in the client; **custom admin-selected images remain untouched**. Production rollout must obtain supplier/manufacturer permissions or replace with commercially licensed photographs and can consider downloading authorized photos locally.
- **One common header cart:** the PC Builder and hardware catalogue now both contribute to `#svoShopCartCount` and `#svoCartItems`.
- PC Builder controls for selecting/swapping/removing hardware, loading presets, restoring saved configurations and resetting a build emit `svo:builder-change`. The cart listens and displays these items as `Dari PC Builder`, with accurate combined quantity and estimated subtotal.
- Manual catalogue additions are persisted as before and remain separate from builder selections internally: changing CPU/GPU will not silently erase items manually placed in the cart.
- Removing an item originating in the Builder from the header cart clears that component in the Builder; removing a manual item does not touch the other source. The old duplicate header cart badge was removed.
- PC Builder includes a **Lihat di Keranjang Atas** shortcut to the same drawer. Stok-out items can still be included in a WhatsApp inquiry, **but an online payment is blocked** until real server stock is available and the gateway is configured. Server-pricing and verification rules remain authoritative.
- New `e2e/cart-sync.spec.js` checks builder selection, replacement, removal, manual+builder coexistence, preset load/reset, and full reference photo coverage.

**Important:** Live retail photos from third-party stores/manufacturers may be blocked, expire, or require permission. This branch remains a **draft for review**, not a commercially cleared product-image catalogue.

## Roleplay servers, premium logo, and payment preferences (2026-11-23)

- Updated SEMEISTVO TECH **luxury brand symbol** into a flowing silver/violet ribbon icon and matching wordmark/favicon.
- Added a new **GTA 5 Roleplay (FiveM/Cfx.re) server development service** with a separate page section and inquiry CTA. Supports discussing server setup, RP framework, resources/scripts, admin management, initial testing and documentation. This independent service is **not affiliated with or endorsed by Rockstar, GTA V, FiveM or Cfx.re**. Third-party asset licenses and platform rules apply.
- **Hosting/VPS, game server hosting, paid scripts/assets, licenses and domain fees are excluded** unless listed explicitly in the approved quote. Website development also **excludes hosting, domain, professional email, premium themes/plugins, paid APIs and renewals** unless explicitly contracted.
- PC Builder now includes **five compatible concept presets**, including Mini-ITX White (Ryzen 7 9700X, B850I, RTX 5060 Ti 16GB, SFX 850W). Sample prices are component-only estimates; **labor, installation, licenses, shipping and additional warranty are not included**.
- Added **BCA, Mandiri, SeaBank, Bank Jago and DANA** as optional *customer payment preferences*, shown in a payments section and selectable in the service consultation and PC quote forms. The selected preference is included in the WhatsApp inquiry.
- **No bank numbers, wallet phone numbers, QR codes, fake payment proof, or automatic payment confirmation have been invented**. Do not transfer funds until the admin verifies the invoice and destination. These preferences are not equivalent to active payment channels. Real provider checkout displays only the methods enabled by the provider account.
- The original compact hidden YouTube music player and previous PC Builder, cart, SQLite admin and secure gateway foundation remain unchanged.
- `npm run test:e2e` includes browser smoke checks for the new roleplay, hosting disclaimer, payments and five presets.

## Services-first transformation (23 November 2026)

**New positioning:** SEMEISTVO TECH is a **technology service studio**, not primarily a retail hardware shop. The main website promotes:
- Custom PC assembly and build consultations
- PC / hardware selection, compatibility screening, and upgrade planning
- OS / driver installation and lawful software setup
- PC troubleshooting, maintenance, gaming & streaming configuration
- Responsive website / landing page / business website / custom web application work
- Additional productivity setup, networking discussions and website maintenance

### Homepage architecture
1. Service-focused hero and direct consultation CTA
2. Six service cards with photography and per-service links to inquiry
3. Four-step process (discovery, estimation, approval, handover)
4. Dedicated website-development presentation and service CTA
5. Preserved interactive PC Builder and sample build presets
6. Additional services, hardware reference catalogue and previous cart
7. Brand values and consultation form

**Functional consultation**: selecting a service pre-fills the service type in the form. Name, contact, subject, optional budget/method and project details are prepared as a WhatsApp message. The browser opens WhatsApp; submission is **not** claimed as sent, paid, or accepted. Prices and scope are negotiated directly. No user data is sent to the website server by this form.

**Existing systems preserved**: hidden music player (original YouTube reference, browser-restricted autoplay), 2026 component data (46 SKU fallback illustrations), PC Builder with save/load and compatibility screening, local cart, previous Node.js/SQLite admin, stock/order and Midtrans sandbox foundation. **Retail checkout remains secondary and should not be activated without commercial onboarding.**

Images in service cards and the website development feature are illustrative, not examples of completed SEMEISTVO client projects. Permission and licensing of external photographs must be checked before commercial deployment.

### Service-stage acceptance
- Mobile menu and 360 / 390 / 430 / 768 / 1024 / 1440px browser checks.
- `npm test` for inventory/media and `npm run test:e2e` for the new service brief flow.
- Verify WhatsApp message text, mobile image fallback, focus states and unmodified original music media.
- Manual review: copy, service coverage and actual business availability before launch.

## Final design implementation (November 2026)

- **SVO brand assets**: geometric platinum-purple `images/logo.svg`, `images/logo-horizontal.svg`, `images/logo-mono.svg`, plus `images/favicon.svg`. The admin, header and footer use the updated identity.
- **Responsive design**: `css/final.css` adds mobile-first navigation, category tiles, desktop/mobile product grids, 1:1 product art, responsive cart and footer at 360/390/430/768/1024/1440px design targets.
- **Home sections**: direct category jump shortcuts and four curated 2026 hardware pick cards whose buttons filter the product catalogue.
- **PC Builder**: explicit `Simpan Rakitan` / `Muat Rakitan` local browser storage by component ID; existing presets and compatibility checks retained.
- **Consultation**: form opens an editable WhatsApp message and never claims successful sending without user action. Unverified bank-transfer/marketplace icons removed from the legacy simulator.
- **Hidden music**: tiny collapsed icon with auto-play attempt, pause and one-tap unmute. Browser policies may prevent either autoplay or audio; the original YouTube link is retained as a direct fallback.
- **PWA metadata**: `site.webmanifest` (installability depends on browser requirements; maskable PNG/iOS touch icons remain a deployment enhancement).
- **CI**: `.github/workflows/verify.yml` runs Node regression tests, secure route smoke check and Chromium browser checks. Local commands: `npm test` and `npm run test:e2e` after `npx playwright install chromium`.

**Before a commercial launch**: replace third-party photo references with manufacturer-licensed, supplier-approved, or owned exact SKU photos, verify all prices and stock, and pass live/sandbox payment and shipping acceptance testing.

## Music + product imagery restoration (November 2026)
- The original music track reference, **"I Miss You Every Brand New Day"** (YouTube video ID `8_y6w1V9PXs`), is back via a floating mini player.
- Play, pause, minimize, and open-on-YouTube controls; no forced auto-unmute or unsolicited autoplay. Browser/YouTube restrictions can affect playback.
- 43 model/family-matched **hardware photo reference links** plus 3 service context photos for key 2026 hardware entries, defined in `js/product-photos.js`. These external images may expire or block hotlinks.
- Four PC build concept images and the homepage hero use actual PC photography. They are labeled **concept/reference** and are **not photographs of the exact preset configuration**.
- The catalogue displays `Foto referensi model` badges and source links. There are **46 unique locally hosted fallback SVG illustrations**, one per catalogue SKU in `images/catalog/`. If a third-party image fails, the relevant SKU art is used first, then a category art fallback.
- These are **temporary external imagery references, not a commercial photo license**. Obtain image-owner/manufacturer/supplier permission or substitute owned, licensed product images before any public commercial deployment.
- On existing databases, `npm run catalog:sync` is a non-mutating preview; `npm run catalog:sync -- --apply` updates product image URLs and curated catalogue entries, preserving admin-managed matching-product prices and stock.
- The client can show reference photos even if an existing SQLite database still has the old local category images, while server catalogue remains authoritative for prices and stock.

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
