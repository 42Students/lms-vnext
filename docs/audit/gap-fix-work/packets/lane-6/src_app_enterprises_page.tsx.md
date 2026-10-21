# Work packet: edit src/app/enterprises/page.tsx

3 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-20/enterprises.md

## G2-20-004-025  [P1] GAP  facet F04  effort M
- Legacy: Page description exact 144-character-ish DESC string and jsonLd.org graph; `docs/legacy-source/frontend/src/pages/enterprises.js:5-6,8-30`
- vNext now: Metadata description short `Build stronger workforces through learning and hiring.`, no page JSON-LD; `src/app/enterprises/page.tsx:1-3`
- Fix: Write enterprise canonical/OG/Twitter/structured data metadata using current non-AI claims but preserve metadata fields/schema; verify with SEO snapshot.

## G2-20-004-026  [P1] MISSING  facet F04  effort S
- Legacy: MarketingLayout canonical href `https://42lms.com/enterprises`; `docs/legacy-source/frontend/src/components/marketing/MarketingLayout.jsx:59-73`
- vNext now: No canonical in route metadata; `src/app/enterprises/page.tsx:3`
- Fix: Add alternates.canonical for /enterprises, respecting canonical host.

## G2-20-004-029  [P1] MISSING  facet F04  effort M
- Legacy: Site-wide Organization and WebSite JSON-LD plus page WebPage/BreadcrumbList graph; `docs/legacy-source/frontend/src/components/marketing/MarketingLayout.jsx:12-49,96-105`, `docs/legacy-source/frontend/src/pages/enterprises.js:8-30`
- vNext now: No JSON-LD in enterprises page or MarketingLayout; `src/app/enterprises/page.tsx:1-16`, `src/components/marketing/marketing-layout.tsx:1-63`
- Fix: Render safe JSON-LD via script with Organization/WebSite and WebPage/BreadcrumbList, updated business semantics.
