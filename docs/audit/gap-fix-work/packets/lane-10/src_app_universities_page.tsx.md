# Work packet: edit src/app/universities/page.tsx

3 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-20/universities.md

## G2-20-008-025  [P1] GAP  facet F04  effort M
- Legacy: Legacy page title 'For Universities — 42 LMS', DESC and full JSON-LD; `docs/legacy-source/frontend/src/pages/universities.js:5-30,34`
- vNext now: Metadata 'Universities \| 42 LMS' with much shorter description, no JSON-LD; `src/app/universities/page.tsx:1-3`
- Fix: Restore full SEO schema coverage with truthful current content.

## G2-20-008-026  [P1] MISSING  facet F04  effort S
- Legacy: Canonical 'https://42lms.com/universities'; `docs/legacy-source/frontend/src/components/marketing/MarketingLayout.jsx:59-73`, `docs/legacy-source/frontend/src/pages/universities.js:34`
- vNext now: No alternates/canonical configured; `src/app/universities/page.tsx:3`
- Fix: Add canonical in Next Metadata and verify real tenant host strategy.

## G2-20-008-029  [P1] MISSING  facet F04  effort M
- Legacy: Per-route WebPage/BreadcrumbList JSON-LD plus Organization/WebSite shared graph; `docs/legacy-source/frontend/src/pages/universities.js:8-30`, `docs/legacy-source/frontend/src/components/marketing/MarketingLayout.jsx:12-49,96-105`
- vNext now: No JSON-LD scripts; `src/app/universities/page.tsx:1-17`, `src/components/marketing/marketing-layout.tsx:1-63`
- Fix: Add page and organization graphs with proper @ids, breadcrumb names and published URL.
