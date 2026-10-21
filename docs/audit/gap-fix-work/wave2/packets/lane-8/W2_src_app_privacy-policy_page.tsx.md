# Work packet (wave 2): edit src/app/privacy-policy/page.tsx

7 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-15/l20-u031-public-pages.md, docs/audit/gap2/lane-20/privacy-policy.md, docs/audit/gap2/lane-20/shared-public-pages.md

## G2-20-031-012  [P2] GAP  facet F03  effort M
- Legacy: Legacy privacy has brand link, 13 quick-link tiles and 13 bordered sections `privacy-policy.js:36-69,69-221`.
- vNext now: vNext redirects to static HTML `src/app/privacy-policy/page.tsx:7-9`; verified alternate audit `docs/audit/gap2/lane-20/privacy-policy.md:9-55` records structural differences.
- Fix: Carry individual style/semantics fixes from lane-20 privacy audit into its original public route.

## G2-20-007-001  [P2] GAP  facet F01  effort S
- Legacy: Anonymous public route `/privacy-policy` renders dedicated page inline, no authenticated layout; `docs/legacy-source/frontend/src/pages/privacy-policy.js:26-36,378`
- vNext now: Same route redirects HTTP to `/assets/static/privacy-policy-view.html`; `src/app/privacy-policy/page.tsx:1-9`
- Fix: Render same policy at original URL or explicitly accept redirect; preserve public access and canonical SEO signals.

## G2-20-007-034  [P2] GAP  facet F11  effort S
- Legacy: No tenant-specific privacy URL selected; direct canonical host; `docs/legacy-source/frontend/src/pages/privacy-policy.js:5-6,29-34`
- vNext now: Static shared privacy URL for all hosts; redirect resolves relative path; `src/app/privacy-policy/page.tsx:7-9`
- Fix: Define tenant legal policy overrides vs platform policy and canonical to avoid presenting wrong legal notice.

## G2-20-007-057  [P2] GAP  facet F23  effort S
- Legacy: Legacy URL serves React privacy page, full cards with 13 sections and always-visible anchors; `docs/legacy-source/frontend/src/pages/privacy-policy.js:26-222,298-312`
- vNext now: New URL redirect to older-style static policy despite comment 'full existing legacy policy'; `src/app/privacy-policy/page.tsx:6-9`, `public/assets/static/privacy-policy-view.html:14-166`
- Fix: Treat static-page reuse as intentional technical migration, but clone page hierarchy/URL UX and verify legal editorial integrity.

## G2-20-031-095  [P2] GAP  facet F22  effort M
- Legacy: Legacy privacy is fully JSX + embedded CSS with canonical metadata (`docs/legacy-source/frontend/src/pages/privacy-policy.js:26-34`, `docs/legacy-source/frontend/src/pages/privacy-policy.js:223-255`)
- vNext now: New static HTML stored under public assets with separate stylesheet, redirect (`src/app/privacy-policy/page.tsx:4-9`, `public/assets/static/privacy-policy-view.html:1-12`)
- Fix: Keep content canonical and match styling, ensure asset deploys and CSP compatible

## G2-20-007-047  [P3] GAP  facet F18  effort S
- Legacy: Browser title 'Privacy Policy \| 42LMS'; `docs/legacy-source/frontend/src/pages/privacy-policy.js:30`
- vNext now: Static title matches, but route Metadata 'Privacy \| 42LMS' is on redirect response; `public/assets/static/privacy-policy-view.html:10`, `src/app/privacy-policy/page.tsx:4`
- Fix: Keep exact browser title on target and set same Metadata for canonical route if rendered.

## G2-20-007-051  [P3] GAP  facet F19  effort S
- Legacy: React route emits all content as one page, no API/cache/pagination; `docs/legacy-source/frontend/src/pages/privacy-policy.js:26-222`
- vNext now: Static file caches/serves as asset after redirect; no API/list; `src/app/privacy-policy/page.tsx:7-9`, `public/assets/static/privacy-policy-view.html:1-173`
- Fix: Configure HTML caching/version on deploy, ensure stale policy is not served after legal update.
