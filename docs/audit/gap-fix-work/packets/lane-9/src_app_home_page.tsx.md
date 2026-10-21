# Work packet: edit src/app/home/page.tsx

2 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-20/home.md

## G2-20-005-027  [P1] GAP  facet F04  effort M
- Legacy: SoftwareApplication structured data has @id #software, BusinessApplication and EducationalApplication categories, description, publisher, isAccessibleForFree=false; `docs/legacy-source/frontend/src/pages/home.js:13-26`
- vNext now: SoftwareApplication JSON-LD has only @context/@type/name/applicationCategory EducationalApplication/operatingSystem; `src/app/home/page.tsx:7`
- Fix: Restore structured-data coverage with current truthful product metadata (URL, ID, publisher, description, accessibility flag).

## G2-20-005-028  [P1] MISSING  facet F04  effort M
- Legacy: MarketingLayout emits Organization + WebSite schema and dedicated OpenGraph/Twitter tags, canonical /; `docs/legacy-source/frontend/src/components/marketing/MarketingLayout.jsx:12-49,59-106`
- vNext now: MarketingLayout emits no metadata/script tags; home page only its own short JSON-LD; `src/components/marketing/marketing-layout.tsx:12-33`, `src/app/home/page.tsx:4-7`
- Fix: Add shared structured Organization/WebSite and complete canonical, OG, Twitter and robots metadata.
