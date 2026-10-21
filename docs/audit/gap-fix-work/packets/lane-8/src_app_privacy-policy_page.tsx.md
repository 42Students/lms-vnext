# Work packet: edit src/app/privacy-policy/page.tsx

3 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-15/l20-u031-public-pages.md, docs/audit/gap2/lane-20/privacy-policy.md, docs/audit/gap2/lane-20/shared-public-pages.md

## G2-20-031-004  [P1] GAP  facet F01  effort M
- Legacy: Legacy privacy served in place at `/privacy-policy` `privacy-policy.js:26-49`.
- vNext now: vNext `/privacy-policy` redirects to `/assets/static/privacy-policy-view.html` `src/app/privacy-policy/page.tsx:6-9`.
- Fix: Serve styled semantic policy at stable public URL without visible URL change; preserve canonical and link hashes.

## G2-20-007-004  [P1] MISSING  facet F01  effort S
- Legacy: Root head canonical=https://42lms.com/privacy-policy; index/follow; `docs/legacy-source/frontend/src/pages/privacy-policy.js:29-34`
- vNext now: Route performs redirect, no explicit robots or canonical; static HTML head lacks both; `src/app/privacy-policy/page.tsx:4-9`, `public/assets/static/privacy-policy-view.html:3-12`
- Fix: Add canonical pointing to primary branded URL and robots index/follow to served static or React page; avoid redirect SEO dilution.

## G2-20-031-058  [P1] GAP  facet F11  effort M
- Legacy: Legacy privacy page directly at canonical /privacy-policy (`docs/legacy-source/frontend/src/pages/privacy-policy.js:29-34`)
- vNext now: Redirects canonical route to static assets directory, no page-level rel canonical (`src/app/privacy-policy/page.tsx:4-9`, `public/assets/static/privacy-policy-view.html:1-12`)
- Fix: Serve policy with canonical and indexability at stable route for mobile/store users
