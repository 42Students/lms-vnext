# Work packet (wave 2): edit src/app/universities/page.tsx

22 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-15/l20-u031-public-pages.md, docs/audit/gap2/lane-20/universities.md

## G2-20-031-006  [P2] GAP  facet F02  effort M
- Legacy: Legacy Universities page hero, audience detail, agent grid, lifecycle strip, CTA `universities.js:32-55`; Enterprises hero, detail, integrations, pillars, CTA `enterprises.js:32-51`.
- vNext now: vNext Universities/Enterprises hero, simple capability grid and CTA `src/app/universities/page.tsx:4-17;src/app/enterprises/page.tsx:4-16`.
- Fix: Recreate old component hierarchy and sectional styling where applicable, replacing AI-only sections with vNext content.

## G2-20-008-005  [P2] GAP  facet F02  effort S
- Legacy: Sections in order PageHero → AudienceDetail → AgentGrid → LifecycleStrip → CtaBand; `docs/legacy-source/frontend/src/pages/universities.js:35-50`
- vNext now: Sections in order MarketingHero → 5 role-feature cards → MarketingCta; `src/app/universities/page.tsx:5-16`
- Fix: Recreate five-section marketing anatomy with updated truthful content.

## G2-20-008-006  [P2] MISSING  facet F02  effort S
- Legacy: AudienceDetail has h2, four bullet checks, Outcomes caption and five outcome pills; `docs/legacy-source/frontend/src/components/marketing/sections.jsx:208-221`, `docs/legacy-source/frontend/src/components/marketing/data.js:113-129`
- vNext now: FeatureGrid five cards, no checklist/outcome pills; `src/app/universities/page.tsx:8-14`
- Fix: Reinstate audience-detail panel with check list and five outcomes pills; position immediately after hero.

## G2-20-008-007  [P2] GAP  facet F02  effort S
- Legacy: AgentGrid seven AI agent cards, section heading with eyebrow/le lede; `docs/legacy-source/frontend/src/components/marketing/sections.jsx:106-123`, `docs/legacy-source/frontend/src/components/marketing/data.js:27-63`
- vNext now: Five non-AI campus role cards, no separate agent section; `src/app/universities/page.tsx:8-14`
- Fix: Maintain legacy 3-column/icon card layout as non-AI campus capability grid; document product-copy change.

## G2-20-008-008  [P2] MISSING  facet F02  effort S
- Legacy: LifecycleStrip shows six arrow-separated steps and heading; `docs/legacy-source/frontend/src/components/marketing/sections.jsx:245-266`, `docs/legacy-source/frontend/src/components/marketing/data.js:111`
- vNext now: No lifecycle strip or arrow step sequence; `src/app/universities/page.tsx:5-16`
- Fix: Restore lifecycle bar and responsive wrapping arrows, with owner-approved no-AI labels.

## G2-20-008-012  [P2] GAP  facet F03  effort S
- Legacy: PageHero eyebrow 'For Universities', no action buttons; `docs/legacy-source/frontend/src/pages/universities.js:35-39`, `docs/legacy-source/frontend/src/components/marketing/sections.jsx:23-35`
- vNext now: Eyebrow 'For universities' and two hero CTAs injected by MarketingHero; `src/app/universities/page.tsx:6-7`, `src/components/marketing/marketing-layout.tsx:35-44`
- Fix: Capitalize 'Universities', suppress extra hero CTAs on sub-page.

## G2-20-008-013  [P2] GAP  facet F03  effort S
- Legacy: Hero h1 'Develop Employable Graduates with AI' with legacy display font; `docs/legacy-source/frontend/src/pages/universities.js:36-38`, `docs/legacy-source/frontend/src/components/marketing/marketing.module.scss:226-234`
- vNext now: Hero h1 'Develop employable graduates through learning and placements' as 30px semibold; `src/app/universities/page.tsx:6`, `src/components/marketing/marketing-layout.tsx:38`
- Fix: Keep no-AI messaging but port hero font treatment, size clamp32–54px and line-height1.08.

## G2-20-008-014  [P2] GAP  facet F03  effort S
- Legacy: PageHero lede mentions exams/assignments/projects/interviews and gap detection; `docs/legacy-source/frontend/src/pages/universities.js:38`
- vNext now: New shorter lede about academics/projects/placements; `src/app/universities/page.tsx:7`
- Fix: Flag owner-approved content replacement; preserve text measure and visible subtitle style.

## G2-20-008-016  [P2] MISSING  facet F03  effort S
- Legacy: Outcomes are five 13px teal pill badges; `docs/legacy-source/frontend/src/components/marketing/sections.jsx:158-166`, `docs/legacy-source/frontend/src/components/marketing/marketing.module.scss:360-369`
- vNext now: No university outcome chips/badges; `src/app/universities/page.tsx:8-14`
- Fix: Recreate visible five outcome pills and wrapping gap.

## G2-20-008-021  [P2] GAP  facet F04  effort S
- Legacy: UNIVERSITIES.points four ordered items: evaluation across exams/assignments/projects/practical/interviews/handwriting; gaps; personalized support; readiness; `docs/legacy-source/frontend/src/components/marketing/data.js:113-121`
- vNext now: Five new role cards Student/Faculty/Mentor/Placement/Admin, not equivalently ordered point list; `src/app/universities/page.tsx:8-14`
- Fix: Owner decide legacy content retirement; document every 4-point-to-5-card replacement in content matrix.

## G2-20-008-022  [P2] MISSING  facet F04  effort S
- Legacy: Legacy outcome pills exactly Better Student Outcomes / Higher Employability / Placement Readiness / Continuous Assessment / Personalized Learning; `docs/legacy-source/frontend/src/components/marketing/data.js:122-129`
- vNext now: No corresponding values; `src/app/universities/page.tsx:8-15`
- Fix: Restore pills with owner-approved truthful wording and matching count/order.

## G2-20-008-023  [P2] GAP  facet F04  effort S
- Legacy: Legacy seven agent names/descriptions in data.js; `docs/legacy-source/frontend/src/components/marketing/data.js:27-63`
- vNext now: No seven-agent list, replaced with five campus roles; `src/app/universities/page.tsx:8-14`
- Fix: Document intentional no-AI scope while keeping seven-card layout density if strict visual parity required.

## G2-20-008-024  [P2] MISSING  facet F04  effort S
- Legacy: Lifecycle six labels Assess/Diagnose/Learn/Coach/Improve/Repeat; `docs/legacy-source/frontend/src/components/marketing/data.js:111`
- vNext now: No lifecycle data/strip; `src/app/universities/page.tsx:5-16`
- Fix: Render six-step progression with non-AI descriptions only if approved.

## G2-20-008-027  [P2] MISSING  facet F04  effort S
- Legacy: MarketingLayout OpenGraph site/title/description/og-image metadata 1200x630; `docs/legacy-source/frontend/src/components/marketing/MarketingLayout.jsx:75-87`
- vNext now: Route has only title/description; `src/app/universities/page.tsx:3`
- Fix: Add OG card metadata and image dimension/type/alt.

## G2-20-008-028  [P2] MISSING  facet F04  effort S
- Legacy: Twitter summary_large_image/title/description/image/alt; `docs/legacy-source/frontend/src/components/marketing/MarketingLayout.jsx:89-94`
- vNext now: No Twitter card fields on page; `src/app/universities/page.tsx:3`
- Fix: Add Twitter metadata with updated summary.

## G2-20-008-030  [P2] GAP  facet F05  effort S
- Legacy: AudienceDetail 4 ordered list checks +5 ordered badges; `docs/legacy-source/frontend/src/components/marketing/sections.jsx:146-166,208-221`, `docs/legacy-source/frontend/src/components/marketing/data.js:113-129`
- vNext now: New unordered 5-card grid maxColumns3; `src/app/universities/page.tsx:8-14`, `src/components/marketing/marketing-layout.tsx:46-54`
- Fix: Restore list and badge cardinality/order instead of conflating with campus role grid.

## G2-20-008-031  [P2] GAP  facet F05  effort S
- Legacy: AgentGrid 7 cards, 3-col desktop >=992, 2 >=640; `docs/legacy-source/frontend/src/components/marketing/sections.jsx:111-121`, `docs/legacy-source/frontend/src/components/marketing/marketing.module.scss:287-290`
- vNext now: New feature grid 5 cards, 3-col >=992, 2 >=768; `src/app/universities/page.tsx:8-14`, `src/components/marketing/marketing-layout.tsx:46-53`
- Fix: Match count/gaps and two-column breakpoint at 640px.

## G2-20-008-060  [P2] GAP  facet F18  effort S
- Legacy: Title `For Universities — 42 LMS`; `docs/legacy-source/frontend/src/pages/universities.js:34`
- vNext now: Title `Universities \| 42 LMS` (plus root template); `src/app/universities/page.tsx:3`, `src/app/layout.tsx:11-14`
- Fix: Set exact title or explicitly document approved wording override.

## G2-20-008-062  [P2] GAP  facet F18  effort S
- Legacy: Cta headline 'Graduate students who are ready for work'; `docs/legacy-source/frontend/src/pages/universities.js:47-49`
- vNext now: Cta headline 'Prepare graduates for meaningful opportunities'; `src/app/universities/page.tsx:15`
- Fix: Owner decide which truthful claim; visual parity requires exact heading hierarchy and length.

## G2-20-008-064  [P2] GAP  facet F18  effort S
- Legacy: Agent eyebrow 'How it helps', title 'AI agents that support every student'; `docs/legacy-source/frontend/src/pages/universities.js:41-45`
- vNext now: FeatureGrid title 'For the entire campus', no eyebrow; `src/app/universities/page.tsx:8`
- Fix: Port section eyebrow and large heading styling with non-AI copy.

## G2-20-008-072  [P2] GAP  facet F23  effort S
- Legacy: AI tutor/assessment etc explicitly marketed; `docs/legacy-source/frontend/src/pages/universities.js:37,41-45`, `docs/legacy-source/frontend/src/components/marketing/data.js:27-63`
- vNext now: New deliberately non-AI campus roles and learning/placements; `src/app/universities/page.tsx:6-14`
- Fix: Owner decision excludes AI feature building, document content retirement while matching visual grid.

## G2-20-008-061  [P3] GAP  facet F18  effort S
- Legacy: Eyebrow `For Universities`; `docs/legacy-source/frontend/src/pages/universities.js:36`
- vNext now: Eyebrow `For universities`; `src/app/universities/page.tsx:6`
- Fix: Capitalize U.
