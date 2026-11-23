# Deploy SEMEISTVO TECH to Cloudflare Pages + D1

> **Status: Repository is prepared; NOT deployed to a Cloudflare account.** The GitHub connector has permission to edit the repository, not to create projects, databases, secrets, or DNS records in your Cloudflare account. Cloudflare authorization must be performed by the owner.

## Architecture and feature parity

- **Frontend:** Existing `index.html`, `admin.html`, `css/`, `js/`, `images/`, `site.webmanifest` served as static files by Cloudflare Pages.
- **Backend:** `functions/api/[[path]].js` provides Pages Functions APIs (no Node.js process).
- **Database:** D1 named `semeistvotech-db`, with binding **`DB`** in Pages → Settings → Bindings.
- **PC Builder, music, logo, services, cart, and WhatsApp consultations:** unchanged. Data continues in the browser where previously local (saved builds/cart).
- **Catalog:** `GET /api/products` reads D1. Initially 46 items with **zero stock**, explicitly reference/estimate pricing.
- **Admin:** `/admin`, D1-backed session login and editing of product names, images, prices, stock and visibility. Admin orders page reads existing D1 order records if imported.
- **Online checkout and Midtrans:** **DISABLED** on Cloudflare until a security-reviewed D1 transaction and payment implementation is delivered. `POST /api/orders` returns HTTP 503. Existing Express+SQLite gateway code is NOT automatically portable. Customers may request quotes via WhatsApp. Do not claim BCA/Mandiri/SeaBank/Jago/DANA transfers are live.
- **Security:** only an allowlisted `dist/` is published. No `server/`, `runtime-data/`, `.env`, source `functions/` or migration scripts are copied into the static site. API requests outside `/api/*` do not invoke Pages Functions.

## 1. Connect Cloudflare Pages to GitHub

1. Log into [Cloudflare Dashboard](https://dash.cloudflare.com/). Go to **Workers & Pages → Create application → Pages → Connect to Git**.
2. Authorize the Cloudflare GitHub App for the repository **`nandamorgul-gif/morgulpunya`**.
3. Create a Pages project. Suggested project name: **`semeistvotech`** (only if available; Cloudflare may offer a different name).
4. During staging, select production branch **`feature/semeistvo-cloudflare-pages-d1`**. Keep the existing GitHub `main` branch unchanged until the review is complete.
5. Build settings:
   | Field | Value |
   | --- | --- |
   | Framework | None |
   | Root directory | `/` |
   | Build command | `npm run build:pages` |
   | Build output directory | `dist` |
   | Node.js version | `22` |
6. The Git integration deploys the static site and automatically discovers `functions/`. `npm run build:pages` must publish **`dist`**, never the repository root. The app will have a `*.pages.dev` URL only after Cloudflare actually creates the project and its name is available.

## 2. Create and initialize D1

From Cloudflare dashboard, open **D1 SQL Database → Create** and name it `semeistvotech-db`. Alternatively, install the project locally and run:
```bash
npm install
npx wrangler login
npx wrangler d1 create semeistvotech-db
```
Do not share Cloudflare API tokens, account passwords, or 2FA codes in ChatGPT or commit them to GitHub.

After creating the real D1 database, run from your local Git checkout:
```bash
npx wrangler d1 execute semeistvotech-db --remote --file=./migrations/0001_schema.sql
npx wrangler d1 execute semeistvotech-db --remote --file=./db/seed.sql
npx wrangler d1 execute semeistvotech-db --remote --command="SELECT COUNT(*) AS total FROM products;"
```
The expected count is **46** and initial stock is **0**. The seed uses `INSERT OR IGNORE`, so reapplying it does not overwrite previously edited rows.

> Existing private SQLite data is **not** imported automatically. If there are real production customer records, account data, invoices or payment history, do not publish a database dump in GitHub. Export/import privately with appropriate data-protection review, backup, and an explicit migration plan.

## 3. Bind D1 to the Pages project

In **Workers & Pages → your Pages project → Settings → Bindings → D1 Database**:
- Variable / binding name: **`DB`** (must match `env.DB` in the API).
- Database: **`semeistvotech-db`**.
- Set this for the actual **Production** deployment environment; for Preview, use a separate preview D1 where possible.
- Save, then **redeploy** so the new binding takes effect.

You can configure bindings in Pages Settings without committing `wrangler.jsonc`. A non-activated example exists at `wrangler.example.jsonc`. Do not copy it as-is into `wrangler.jsonc`; it deliberately includes a placeholder for your actual D1 UUID.

## 4. Secure the admin account

In **Pages → Settings → Variables and Secrets**, configure these as **secrets** for the same deployment environment:

| Secret | Value |
| --- | --- |
| `ADMIN_EMAIL` | Your own admin login email |
| `ADMIN_PASSWORD` | A unique, strong, random password (at least 16 characters) |

Do **not** store the password in `.env` in the repo or in GitHub code. No default credentials exist. Admin login creates a secure, HttpOnly, SameSite=Strict session cookie and limits failed attempts. Use Cloudflare WAF/rate-limiting rules and optional Cloudflare Access protection for higher security. Do not expose the account on a public website until TLS and binding are confirmed.

## 5. Validate before accepting public traffic

Open the actual Cloudflare Pages URL provided by Cloudflare:

1. `https://YOUR-PROJECT.pages.dev/` — website, music controls, PC Builder, seven service cards, five payment preferences, cart and WhatsApp enquiry.
2. `https://YOUR-PROJECT.pages.dev/api/health` — expected JSON `{"ok":true,"database":"d1","payment_mode":"disabled","checkout_enabled":false}`.
3. `https://YOUR-PROJECT.pages.dev/api/products` — 46 rows, not fictitious availability.
4. `https://YOUR-PROJECT.pages.dev/admin` — authenticated product management; without configured secrets admin login intentionally fails.
5. `POST /api/orders` — HTTP **503** by design until real payments are implemented.
6. Check that `/server/app.js`, `/runtime-data/`, `/.env`, and `/package.json` return **404**, never the contents of source files or secrets.
7. Review authorized hardware/photo assets and copyright before launch; missing external photos are hidden rather than displayed as unrelated illustration.

## 6. Optional real custom domain

When you actually own **`semeistvotech.com`** (or another domain), add it in **Pages → Custom domains**. If the domain's DNS zone is managed in Cloudflare, Cloudflare can guide the DNS setup. If you have not registered a domain, you can first launch on the automatically assigned `*.pages.dev` domain.

Do not create a fake `CNAME` file or point a domain you do not own at this deployment.

## Local development and test

```bash
npm install
npm test
npm run build:pages
# Compile functions without deploying:
npx wrangler pages functions build --outdir=./.cloudflare-compiled
```

To run Pages Functions locally with D1, create your personal `wrangler.jsonc` with the real D1 UUID from `wrangler.example.jsonc`, or use a local Pages D1 binding. Keep secrets in local untracked files or Cloudflare secret storage. Do not run live payment commands.

## References

- https://developers.cloudflare.com/pages/get-started/git-integration/
- https://developers.cloudflare.com/pages/functions/bindings/
- https://developers.cloudflare.com/pages/functions/routing/
- https://developers.cloudflare.com/d1/get-started/
- https://developers.cloudflare.com/d1/best-practices/import-export-data/
