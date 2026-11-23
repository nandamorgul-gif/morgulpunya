# SEMEISTVO TECH — GitHub Pages Custom Domain

Status: **NOT ACTIVATED**. No domain name or DNS provider has been supplied by the site owner. Do not create a guessed `CNAME` file or point to a domain that the owner does not control.

## Prerequisites

- Own an actual domain. Decide whether `www.YOUR-DOMAIN.TLD` (recommended) or the apex `YOUR-DOMAIN.TLD` is the primary address.
- Have administrator access to the domain's DNS control panel.
- Confirm which branch / workflow publishes GitHub Pages under [Repository Settings → Pages](https://github.com/nandamorgul-gif/morgulpunya/settings/pages). This project's development PR is **not merged to main**, so do not assume `main` is the deployed site.
- **GitHub Pages hosts static files only.** The repository's Express/SQLite/administration/payment backend does not execute on GitHub Pages. Keep quote-mode payments and contact requests until a secure separately hosted backend and verified gateway are deployed.

## Configuration for a www subdomain

1. On [GitHub Repository Settings → Pages](https://github.com/nandamorgul-gif/morgulpunya/settings/pages), enter your **actual** `www.YOUR-DOMAIN.TLD` in **Custom domain**, then Save. Do this before creating DNS records.
2. At the DNS provider, create or update:
   - **Type:** CNAME
   - **Name/Host:** `www`
   - **Target/Value:** `nandamorgul-gif.github.io`
   - **TTL:** Auto or 300–3600 seconds depending on the provider.
   - Do **not** include `https://`, `/morgulpunya`, or a URL path in the target.
3. If you also want the apex domain to redirect to `www`, configure the four GitHub Pages A records at host `@` **after verifying the current values in GitHub Docs**:
   - `185.199.108.153`
   - `185.199.109.153`
   - `185.199.110.153`
   - `185.199.111.153`
   Check for and remove unrelated conflicting A, AAAA, ALIAS or ANAME records **only after understanding what else the domain currently hosts**.
4. Optionally verify the domain under your GitHub personal account Settings → Pages by creating the precise **TXT** record that GitHub provides. Do not guess its verification token. Preserve the TXT record after verification to help prevent domain takeovers.
5. Allow time for DNS propagation and GitHub's TLS certificate issuance, then enable **Enforce HTTPS** in Settings → Pages when available. Test `https://www.YOUR-DOMAIN.TLD/` on desktop and mobile.
6. Re-check menu links, photos, music, saved builds, cart, and WhatsApp quote flow under the new hostname. Existing localStorage data does **not automatically migrate across domains**.

## Apex domain as primary address

For `YOUR-DOMAIN.TLD` instead of `www`, enter the actual apex hostname in GitHub Pages settings and use the GitHub Pages A records at `@` above (or supported ALIAS/ANAME), optionally pointing `www` to `nandamorgul-gif.github.io`. Do not create conflicting CNAME and A records on the same host.

## Repository CNAME file

- When GitHub Pages publishes from a branch, saving a custom domain through Pages Settings typically creates / manages the `CNAME` file in the publication source. The file must contain **only the real hostname**.
- When GitHub Pages uses a custom Actions deployment workflow, GitHub ignores any repository `CNAME` file; configure the hostname in Pages Settings.
- Do not add a placeholder CNAME. A fake hostname may break the current GitHub Pages address or lead to domain takeover risks.

## Official references

- https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site/managing-a-custom-domain-for-your-github-pages-site
- https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site/verifying-your-custom-domain-for-github-pages
- https://docs.github.com/en/pages/getting-started-with-github-pages/securing-your-github-pages-site-with-https

**Required from owner to complete:** exact domain, whether to use `www` or apex, and DNS provider. No password, transfer token, or sensitive credentials should be shared in chat.
