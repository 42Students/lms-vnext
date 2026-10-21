# Work packet (wave 2): edit src/app/layout.tsx

4 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-20/enterprises.md, docs/audit/gap2/lane-20/home.md, docs/audit/gap2/lane-20/universities.md, docs/audit/gap2/lane-20/index.md

## G2-20-004-059  [P2] GAP  facet F18  effort S
- Legacy: Browser title exact `For Enterprises — 42 LMS`; `docs/legacy-source/frontend/src/pages/enterprises.js:34`
- vNext now: Title metadata `Enterprises \| 42 LMS` then root template appends `· 42LMS`; `src/app/enterprises/page.tsx:3`, `src/app/layout.tsx:11-14`
- Fix: Set exact title and prevent redundant 42LMS suffix if not intended.

## G2-20-005-029  [P2] GAP  facet F04  effort S
- Legacy: Legacy page title via MarketingLayout default '42 LMS — The AI Talent & Workforce Operating System'; `docs/legacy-source/frontend/src/components/marketing/MarketingLayout.jsx:51-66`
- vNext now: New metadata '42 LMS \| Talent development' with root title template; `src/app/home/page.tsx:4`, `src/app/layout.tsx:11-14`
- Fix: Set product-approved exact replacement title without duplicated suffix; record intentional AI copy retirement.

## G2-20-008-060  [P2] GAP  facet F18  effort S
- Legacy: Title `For Universities — 42 LMS`; `docs/legacy-source/frontend/src/pages/universities.js:34`
- vNext now: Title `Universities \| 42 LMS` (plus root template); `src/app/universities/page.tsx:3`, `src/app/layout.tsx:11-14`
- Fix: Set exact title or explicitly document approved wording override.

## G2-20-006-060  [P3] GAP  facet F18  effort S
- Legacy: Root tab title exact `42 LMS`; `docs/legacy-source/frontend/src/pages/index.js:33-34`
- vNext now: Dynamic `Sign in · 42LMS` with metadata parent template; `src/app/page.tsx:14-17`, `src/app/layout.tsx:11-14`
- Fix: Match title if 42 LMS root tab fidelity necessary.
