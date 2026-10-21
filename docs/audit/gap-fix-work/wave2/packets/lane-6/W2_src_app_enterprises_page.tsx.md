# Work packet (wave 2): edit src/app/enterprises/page.tsx

24 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-15/l20-u031-public-pages.md, docs/audit/gap2/lane-20/enterprises.md, docs/audit/gap2/lane-20/shared-public-pages.md

## G2-20-031-006  [P2] GAP  facet F02  effort M
- Legacy: Legacy Universities page hero, audience detail, agent grid, lifecycle strip, CTA `universities.js:32-55`; Enterprises hero, detail, integrations, pillars, CTA `enterprises.js:32-51`.
- vNext now: vNext Universities/Enterprises hero, simple capability grid and CTA `src/app/universities/page.tsx:4-17;src/app/enterprises/page.tsx:4-16`.
- Fix: Recreate old component hierarchy and sectional styling where applicable, replacing AI-only sections with vNext content.

## G2-20-031-051  [P2] MISSING  facet F21  effort M
- Legacy: Legacy marketing JSON-LD structured data and SEO metadata `request-demo.js:13-44;enterprises.js:8-34;universities.js:8-34`.
- vNext now: vNext metadata title/description but no per-page JSON-LD in shown routes `src/app/request-demo/page.tsx:1-6;src/app/enterprises/page.tsx:1-5`.
- Fix: Restore canonical, OG/Twitter and structured data where still accurate (remove AI promises).

## G2-20-004-006  [P2] GAP  facet F02  effort S
- Legacy: Section order: PageHero → AudienceDetail → IntegrationsStrip → PlatformPillars → CtaBand; `docs/legacy-source/frontend/src/pages/enterprises.js:35-46`
- vNext now: Section order: MarketingHero → four-item MarketingFeatureGrid → MarketingCta; `src/app/enterprises/page.tsx:5-15`
- Fix: Restore legacy section anatomy/order as separate blocks while preserving intentionally updated business-content semantics.

## G2-20-004-007  [P2] MISSING  facet F02  effort S
- Legacy: AudienceDetail section contains section heading, four checklist points, Outcomes heading, five pills; `docs/legacy-source/frontend/src/components/marketing/sections.jsx:208-221`, `docs/legacy-source/frontend/src/components/marketing/data.js:131-146`
- vNext now: FeatureGrid shows four unrelated tile cards, no checklist/outcomes; `src/app/enterprises/page.tsx:8-13`, `src/components/marketing/marketing-layout.tsx:46-54`
- Fix: Render checklist and five outcomes badges or document intentional content redesign and retain physical section shapes.

## G2-20-004-008  [P2] MISSING  facet F02  effort S
- Legacy: IntegrationsStrip has heading, subtitle, ten integration chips; `docs/legacy-source/frontend/src/components/marketing/sections.jsx:125-144`, `docs/legacy-source/frontend/src/components/marketing/data.js:65-76`
- vNext now: No integrations section at all; `src/app/enterprises/page.tsx:8-15`
- Fix: Add an explicit integration-chip section in same position, with accurate capabilities and no unbuilt integration promise.

## G2-20-004-009  [P2] MISSING  facet F02  effort S
- Legacy: PlatformPillars contains section heading and six icon cards in 3-column grid; `docs/legacy-source/frontend/src/components/marketing/sections.jsx:223-243`, `docs/legacy-source/frontend/src/components/marketing/data.js:78-109`
- vNext now: No separate pillar section; only four two-column enterprise feature tiles; `src/app/enterprises/page.tsx:8-14`
- Fix: Restore six-card pillar grid structure or clearly mark product-scope removals for owner's content approval.

## G2-20-004-010  [P2] GAP  facet F02  effort S
- Legacy: CTA band includes heading, subline and two buttons; `docs/legacy-source/frontend/src/components/marketing/sections.jsx:269-289`, `docs/legacy-source/frontend/src/pages/enterprises.js:43-46`
- vNext now: CTA band includes title, generic paragraph and one link; `src/components/marketing/marketing-layout.tsx:56-61`, `src/app/enterprises/page.tsx:14`
- Fix: Restore two-action dark CTA band with specific subtitle if content parity desired.

## G2-20-004-013  [P2] GAP  facet F03  effort S
- Legacy: Legacy hero eyebrow exact `For Enterprises`, no hero CTA; `docs/legacy-source/frontend/src/pages/enterprises.js:35-39`, `docs/legacy-source/frontend/src/components/marketing/sections.jsx:23-35`
- vNext now: Hero eyebrow `For enterprises` and two CTA controls; `src/app/enterprises/page.tsx:6-7`, `src/components/marketing/marketing-layout.tsx:40-43`
- Fix: Restore capitalization and suppress hero CTA on enterprise page; leave CTA in final band.

## G2-20-004-014  [P2] GAP  facet F03  effort S
- Legacy: Hero h1 `Build High-Performing Workforces with AI`; `docs/legacy-source/frontend/src/pages/enterprises.js:37`
- vNext now: Hero h1 `Build stronger workforces through learning and hiring`; `src/app/enterprises/page.tsx:6`
- Fix: Flag copy/product-scope divergence; reproduce exact visual heading treatment even if intentionally omitting AI claims.

## G2-20-004-015  [P2] GAP  facet F03  effort S
- Legacy: Hero lede mentions GitHub, Slack, Teams, CRM, ERP, HRMS and capability gaps; `docs/legacy-source/frontend/src/pages/enterprises.js:38`
- vNext now: Hero description discusses capability building and employer-facing recruitment, omits named systems; `src/app/enterprises/page.tsx:7`
- Fix: Owner must decide business-copy changes; retain legacy line-length and typography regardless.

## G2-20-004-021  [P2] GAP  facet F04  effort S
- Legacy: ENTERPRISES.points has four specific points about work systems, real-time capabilities, gap identification, productivity; `docs/legacy-source/frontend/src/components/marketing/data.js:131-139`
- vNext now: Four other feature summaries Skills and learning, Applied projects, Candidate evaluation, Hiring operations; `src/app/enterprises/page.tsx:8-13`
- Fix: Record each legacy point as separate editable content item if owner preserves enterprise marketing claims.

## G2-20-004-022  [P2] MISSING  facet F04  effort S
- Legacy: Outcome pills exactly `Higher Productivity`, `Faster Onboarding`, `Better Knowledge Retention`, `Stronger Workforce Capabilities`, `Improved Business Performance`; `docs/legacy-source/frontend/src/components/marketing/data.js:140-146`
- vNext now: No outcome pills/values in enterprise route; `src/app/enterprises/page.tsx:8-15`
- Fix: Restore five outcomes list items (unless content retirement approved).

## G2-20-004-023  [P2] MISSING  facet F04  effort S
- Legacy: Ten integration chips: Assessments, Assignments, Projects, Interviews, Handwritten Exams, GitHub, Slack & Teams, CRM & ERP Systems, Knowledge Repositories, Performance Data; `docs/legacy-source/frontend/src/components/marketing/data.js:65-76`
- vNext now: No chip collection/values; `src/app/enterprises/page.tsx:8-15`
- Fix: Rebuild integration chip section; annotate discontinued integration claims explicitly.

## G2-20-004-024  [P2] GAP  facet F04  effort S
- Legacy: Six pillar names: AI Assessments, Skills Intelligence, Personalized Learning, Knowledge Intelligence, AI Agents, Analytics & Insights; `docs/legacy-source/frontend/src/components/marketing/data.js:78-109`
- vNext now: Four different tile titles: Skills and learning, Applied projects, Candidate evaluation, Hiring operations; `src/app/enterprises/page.tsx:9-12`
- Fix: Document intended non-AI pivot; maintain six-card layout if visual clone requirement overrides content parity.

## G2-20-004-027  [P2] MISSING  facet F04  effort S
- Legacy: OG image 1200×630, secure_url/type/alt and locale/site_name; `docs/legacy-source/frontend/src/components/marketing/MarketingLayout.jsx:75-87`
- vNext now: No OpenGraph metadata configured in this page; `src/app/enterprises/page.tsx:1-3`
- Fix: Restore OpenGraph metadata with current descriptions and working image asset.

## G2-20-004-028  [P2] MISSING  facet F04  effort S
- Legacy: Twitter summary_large_image/title/description/image/alt; `docs/legacy-source/frontend/src/components/marketing/MarketingLayout.jsx:89-94`
- vNext now: No Twitter fields in page metadata; `src/app/enterprises/page.tsx:1-3`
- Fix: Add Twitter card fields via Next metadata API.

## G2-20-004-031  [P2] GAP  facet F05  effort S
- Legacy: Audience Detail checklist four items and outcome list five; `docs/legacy-source/frontend/src/components/marketing/sections.jsx:208-221`, `docs/legacy-source/frontend/src/components/marketing/data.js:131-146`
- vNext now: FeatureGrid map over four items in two columns; `src/app/enterprises/page.tsx:8-13`, `src/components/marketing/marketing-layout.tsx:46-54`
- Fix: Restore semantic list structures, keep no bulk selection/pagination.

## G2-20-004-059  [P2] GAP  facet F18  effort S
- Legacy: Browser title exact `For Enterprises — 42 LMS`; `docs/legacy-source/frontend/src/pages/enterprises.js:34`
- vNext now: Title metadata `Enterprises \| 42 LMS` then root template appends `· 42LMS`; `src/app/enterprises/page.tsx:3`, `src/app/layout.tsx:11-14`
- Fix: Set exact title and prevent redundant 42LMS suffix if not intended.

## G2-20-004-060  [P2] GAP  facet F18  effort S
- Legacy: CTA headline `Turn workforce capability into business performance`; `docs/legacy-source/frontend/src/pages/enterprises.js:43-46`
- vNext now: CTA headline `Support workforce development from learning to hiring`; `src/app/enterprises/page.tsx:14`
- Fix: Owner-content decision: literal legacy copy vs no-AI pivot; record approved replacement.

## G2-20-004-064  [P2] MISSING  facet F19  effort S
- Legacy: Global org/webpage jsonLd and page JSON-LD both emitted into head; `docs/legacy-source/frontend/src/components/marketing/MarketingLayout.jsx:96-105`
- vNext now: No JSON-LD; route is otherwise light-weight; `src/app/enterprises/page.tsx:1-16`
- Fix: Pre-render updated structured data at build/request rendering, no network fetching required.

## G2-20-004-071  [P2] GAP  facet F23  effort S
- Legacy: Old site advertises autonomous AI and work-system integrations; `docs/legacy-source/frontend/src/pages/enterprises.js:5-46`, `docs/legacy-source/frontend/src/components/marketing/data.js:65-109`
- vNext now: vNext deliberately presents non-AI learning/hiring content; `src/app/enterprises/page.tsx:3-14`
- Fix: Owner removed AI from LMS scope; preserve redesign rationale but keep UI layout clone distinct from product messaging.

## G2-20-031-085  [P2] GAP  facet F19  effort M
- Legacy: Legacy marketing canonical URLs per path and custom OG descriptions (`docs/legacy-source/frontend/src/components/marketing/MarketingLayout.jsx:59-94`)
- vNext now: New Next metadata title/description but no explicit canonical/OG image in layout (`src/components/marketing/marketing-layout.tsx:12-34`, `src/app/enterprises/page.tsx:1-3`)
- Fix: Add canonical, OG and Twitter metadata for each public page

## G2-20-004-054  [P3] GAP  facet F16  effort S
- Legacy: Marketing 3-col pillar grid at ≥992px, 2 columns ≥640px; `docs/legacy-source/frontend/src/components/marketing/marketing.module.scss:287-290`
- vNext now: Enterprise features always maxColumns=2 (2 columns ≥768px); `src/app/enterprises/page.tsx:8`, `src/components/marketing/marketing-layout.tsx:46-53`
- Fix: Restore 640/992 breakpoint and 3-column layout for legacy six pillars.

## G2-20-004-062  [P3] GAP  facet F18  effort S
- Legacy: Eyebrow `For Enterprises` title-case; `docs/legacy-source/frontend/src/pages/enterprises.js:36`
- vNext now: Eyebrow `For enterprises`; `src/app/enterprises/page.tsx:6`
- Fix: Capitalize E exactly.
