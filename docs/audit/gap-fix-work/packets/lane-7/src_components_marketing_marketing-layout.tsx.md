# Work packet: edit src/components/marketing/marketing-layout.tsx

7 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-10/platform.md, docs/audit/gap2/lane-12/request-demo.md, docs/audit/gap2/lane-20/enterprises.md, docs/audit/gap2/lane-20/home.md, docs/audit/gap2/lane-20/shared-public-pages.md, docs/audit/gap2/lane-20/universities.md

## G2-10-001-036  [P1] MISSING  facet F17  effort S
- Legacy: Focus-only Skip to main content link and main-content target `docs/legacy-source/frontend/src/components/marketing/MarketingLayout.jsx:109-115` `docs/legacy-source/frontend/src/components/marketing/marketing.module.scss:32-45`
- vNext now: No skip link or main-content id `src/components/marketing/marketing-layout.tsx:12-25`
- Fix: Add focus-visible skip link and main landmark id

## G2-12-001-032  [P1] MISSING  facet F17 Keyboard/accessibility  effort S
- Legacy: Skip-to-main visible on focus and targets main id `docs/legacy-source/frontend/src/components/marketing/MarketingLayout.jsx:109-114`
- vNext now: No skip link/id in marketing layout `src/components/marketing/marketing-layout.tsx:12-24`
- Fix: Add skip link with visible focus and target id

## G2-20-004-029  [P1] MISSING  facet F04  effort M
- Legacy: Site-wide Organization and WebSite JSON-LD plus page WebPage/BreadcrumbList graph; `docs/legacy-source/frontend/src/components/marketing/MarketingLayout.jsx:12-49,96-105`, `docs/legacy-source/frontend/src/pages/enterprises.js:8-30`
- vNext now: No JSON-LD in enterprises page or MarketingLayout; `src/app/enterprises/page.tsx:1-16`, `src/components/marketing/marketing-layout.tsx:1-63`
- Fix: Render safe JSON-LD via script with Organization/WebSite and WebPage/BreadcrumbList, updated business semantics.

## G2-20-004-039  [P1] GAP  facet F10  effort M
- Legacy: Demo CTA goes to /request-demo where DEMO_MAILTO pre-fills subject and detailed body; `docs/legacy-source/frontend/src/components/marketing/sections.jsx:279-283`, `docs/legacy-source/frontend/src/components/marketing/data.js:10-18`, `docs/legacy-source/frontend/src/pages/request-demo.js:68-82`
- vNext now: Demo CTA goes to /request-demo where mailto contains subject only; `src/components/marketing/marketing-layout.tsx:60`, `src/app/request-demo/page.tsx:18-20`
- Fix: Reinstate prefilled demo email body fields Name, Organization, Role, Phone, problem statement or replace with validated dedicated lead form.

## G2-20-005-028  [P1] MISSING  facet F04  effort M
- Legacy: MarketingLayout emits Organization + WebSite schema and dedicated OpenGraph/Twitter tags, canonical /; `docs/legacy-source/frontend/src/components/marketing/MarketingLayout.jsx:12-49,59-106`
- vNext now: MarketingLayout emits no metadata/script tags; home page only its own short JSON-LD; `src/components/marketing/marketing-layout.tsx:12-33`, `src/app/home/page.tsx:4-7`
- Fix: Add shared structured Organization/WebSite and complete canonical, OG, Twitter and robots metadata.

## G2-20-031-075  [P1] MISSING  facet F17  effort S
- Legacy: Legacy marketing skip-to-content link targets #main-content and becomes visible on focus (`docs/legacy-source/frontend/src/components/marketing/MarketingLayout.jsx:108-113`, `docs/legacy-source/frontend/src/components/marketing/marketing.module.scss:32-45`)
- vNext now: New MarketingLayout no skip link or target main ID (`src/components/marketing/marketing-layout.tsx:12-24`)
- Fix: Add keyboard skip link and focusable main content target

## G2-20-008-029  [P1] MISSING  facet F04  effort M
- Legacy: Per-route WebPage/BreadcrumbList JSON-LD plus Organization/WebSite shared graph; `docs/legacy-source/frontend/src/pages/universities.js:8-30`, `docs/legacy-source/frontend/src/components/marketing/MarketingLayout.jsx:12-49,96-105`
- vNext now: No JSON-LD scripts; `src/app/universities/page.tsx:1-17`, `src/components/marketing/marketing-layout.tsx:1-63`
- Fix: Add page and organization graphs with proper @ids, breadcrumb names and published URL.
