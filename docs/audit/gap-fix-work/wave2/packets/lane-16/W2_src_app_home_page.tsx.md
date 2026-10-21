# Work packet (wave 2): edit src/app/home/page.tsx

28 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-15/l20-u031-public-pages.md, docs/audit/gap2/lane-20/home.md, docs/audit/gap2/lane-20/shared-public-pages.md

## G2-20-031-001  [P2] GAP  facet F01  effort M
- Legacy: Legacy `/` tenant login via index.js:11-25,54-73 and `/home` marketing via home.js:28-43; marketing brand links `/` via MarketingHeader.jsx:22-29.
- vNext now: vNext `src/app/page.tsx:73-106` tenant-aware sign-in/landing and `src/app/home/page.tsx:5-34`; brand href `/home` `src/components/marketing/marketing-layout.tsx:15-20`.
- Fix: Keep tenant-aware sign-in; verify public-origin landing and align legacy marketing logo destination without breaking login.

## G2-20-031-005  [P2] GAP  facet F02  effort L
- Legacy: Marketing home: Hero, Personalization, AgentGrid, IntegrationsStrip, AudienceSplit, PlatformPillars, LifecycleStrip, CtaBand `home.js:28-44`.
- vNext now: vNext hero, feature grid, audience links, pillars, ordered journey, CTA `src/app/home/page.tsx:5-34`.
- Fix: Match legacy section hierarchy, band spacings/hero artwork; retain vNext non-AI content per owner decision.

## G2-20-031-014  [P2] GAP  facet F04  effort M
- Legacy: Legacy marketing data-driven seven agents, ten integration chips, six pillars and audience facts `home.js:28-43; MarketingFooter.jsx:37-53`.
- vNext now: vNext hardcoded six capability items, four pillar items and four journey steps `src/app/home/page.tsx:10-33`.
- Fix: Restore number/grid/pill/icon treatments while keeping AI feature copy intentionally omitted.

## G2-20-005-001  [P2] GAP  facet F01  effort M
- Legacy: Public marketing home rendered from `/home` component but MarketingLayout path=`/` canonical; `docs/legacy-source/frontend/src/pages/home.js:28-31`, `docs/legacy-source/frontend/src/components/marketing/MarketingLayout.jsx:59-73`
- vNext now: Marketing home lives at `/home` and platform root `/` can redirect to /home; `src/app/home/page.tsx:5-7`, `src/app/page.tsx:97-103`
- Fix: Make / vs /home canonical/route decision explicit; apply redirects and metadata accordingly.

## G2-20-005-005  [P2] GAP  facet F02  effort S
- Legacy: Sections: Hero → Personalization → AgentGrid → IntegrationsStrip → AudienceSplit → PlatformPillars → LifecycleStrip → CtaBand; `docs/legacy-source/frontend/src/pages/home.js:30-39`
- vNext now: Sections: MarketingHero → FeatureGrid → audience 2 link cards → FeatureGrid → journey steps → Cta; `src/app/home/page.tsx:6-33`
- Fix: Produce an explicit section mapping retaining eight distinct visual bands; content can reflect no-AI scope.

## G2-20-005-006  [P2] MISSING  facet F02  effort S
- Legacy: Personalization quote band has eyebrow 'Every individual is different' and 'Why should learning be the same?'; `docs/legacy-source/frontend/src/components/marketing/sections.jsx:88-103`
- vNext now: No personalization quote band, feature grid begins after hero; `src/app/home/page.tsx:8-17`
- Fix: Add quote band with eyebrow/large quote visual treatment or document content removal decision.

## G2-20-005-007  [P2] GAP  facet F02  effort S
- Legacy: Seven-agent grid with 3 columns at desktop, each icon/name/description; `docs/legacy-source/frontend/src/components/marketing/sections.jsx:106-123`, `docs/legacy-source/frontend/src/components/marketing/data.js:27-63`
- vNext now: Six generic role-feature cards with no icons; `src/app/home/page.tsx:10-17`, `src/components/marketing/marketing-layout.tsx:46-54`
- Fix: Restore icon-card density/grid styling; replace AI descriptions only with owner-approved non-AI content.

## G2-20-005-008  [P2] MISSING  facet F02  effort S
- Legacy: IntegrationsStrip tinted band with 10 chips; `docs/legacy-source/frontend/src/components/marketing/sections.jsx:125-144`, `docs/legacy-source/frontend/src/components/marketing/data.js:65-76`
- vNext now: No chip band; integrations condensed to a single plain feature card; `src/app/home/page.tsx:22-27`
- Fix: Rebuild tinted horizontal/wrapping integrations chips if suitable to current integrations.

## G2-20-005-009  [P2] GAP  facet F02  effort S
- Legacy: AudienceSplit 2 contrasting cards, inner checklists, outcomes pills and links; `docs/legacy-source/frontend/src/components/marketing/sections.jsx:168-205`
- vNext now: Two equal plain linked cards for Universities and Enterprises, no checklists/badges; `src/app/home/page.tsx:18-21`
- Fix: Restore two-audience section depth and legacy dark enterprise card; keep current claims accurate.

## G2-20-005-010  [P2] GAP  facet F02  effort S
- Legacy: Six PlatformPillars icon cards under 'Everything you need to develop talent'; `docs/legacy-source/frontend/src/components/marketing/sections.jsx:223-243`
- vNext now: Four 'Connected platform pillars' cards, no icons; `src/app/home/page.tsx:22-27`
- Fix: Restore six card visual slots and icons, while honoring deliberate AI feature retirement.

## G2-20-005-011  [P2] GAP  facet F02  effort S
- Legacy: LifecycleStrip shows six named steps with arrows; `docs/legacy-source/frontend/src/components/marketing/sections.jsx:245-266`, `docs/legacy-source/frontend/src/components/marketing/data.js:111`
- vNext now: Journey has four numbered steps and no inter-step arrows; `src/app/home/page.tsx:28-31`
- Fix: Adopt legacy horizontal steps/arrows visual grammar but keep approved four-step business journey.

## G2-20-005-012  [P2] GAP  facet F02  effort S
- Legacy: Dark-gradient CTA band with two actions; `docs/legacy-source/frontend/src/components/marketing/sections.jsx:269-289`, `docs/legacy-source/frontend/src/components/marketing/marketing.module.scss:397-409`
- vNext now: Light primary-subtle CTA with one action; `src/app/home/page.tsx:32`, `src/components/marketing/marketing-layout.tsx:56-61`
- Fix: Recreate dark-gradient legacy CTA and secondary Login action.

## G2-20-005-014  [P2] GAP  facet F03  effort S
- Legacy: Hero eyebrow with spark icon 'The AI Talent & Workforce Operating System'; `docs/legacy-source/frontend/src/components/marketing/sections.jsx:44-46`
- vNext now: Hero eyebrow 'Connected talent development', no spark; `src/app/home/page.tsx:8`, `src/components/marketing/marketing-layout.tsx:35-39`
- Fix: If AI copy retired, retain legacy icon/pill typography and document changed text.

## G2-20-005-015  [P2] GAP  facet F03  effort S
- Legacy: Hero H1 two lines with accent on 'Employable Graduates'; `docs/legacy-source/frontend/src/components/marketing/sections.jsx:47-50`
- vNext now: One continuous 'One connected platform for learning, projects and placements'; `src/app/home/page.tsx:8`
- Fix: Use 2-line/accent hero visual treatment without resurrecting unbuilt AI claims.

## G2-20-005-016  [P2] MISSING  facet F03  effort S
- Legacy: Hero CSS-only dark console artwork, 4 agent icon chips, pulse indicator; `docs/legacy-source/frontend/src/components/marketing/sections.jsx:66-81`, `docs/legacy-source/frontend/src/components/marketing/marketing.module.scss:244-280`
- vNext now: No hero visual art or chip panel; `src/app/home/page.tsx:6-9`, `src/components/marketing/marketing-layout.tsx:35-44`
- Fix: Restore a visual feature panel/illustration of live vNext modules while matching legacy size/shadow/color.

## G2-20-005-022  [P2] GAP  facet F04  effort S
- Legacy: Home first-screen copy 'Build Employable Graduates. Create High-Performing Workforces.'; `docs/legacy-source/frontend/src/components/marketing/sections.jsx:47-50`
- vNext now: New headline learning/projects/placements; `src/app/home/page.tsx:8`
- Fix: Use approved non-AI messaging but retain same visual line breaks/density.

## G2-20-005-023  [P2] GAP  facet F04  effort S
- Legacy: Seven AGENTS names and descriptions, all in data.js; `docs/legacy-source/frontend/src/components/marketing/data.js:27-63`
- vNext now: Six role capability cards instead; `src/app/home/page.tsx:10-17`
- Fix: Record all removed AI agent claims as intentional product scope and map replacement cards explicitly.

## G2-20-005-024  [P2] MISSING  facet F04  effort S
- Legacy: Ten INTEGRATIONS values incl GitHub, Teams/Slack, CRM/ERP and academic signals; `docs/legacy-source/frontend/src/components/marketing/data.js:65-76`
- vNext now: No equivalent 10-value list; only 'Integrations' teaser; `src/app/home/page.tsx:24`
- Fix: Restore chip list shape; use only supported integrations in text.

## G2-20-005-025  [P2] MISSING  facet F04  effort S
- Legacy: UNIVERSITIES and ENTERPRISES audience lists include check points and outcomes; `docs/legacy-source/frontend/src/components/marketing/data.js:113-147`
- vNext now: Two short one-paragraph cards; `src/app/home/page.tsx:18-21`
- Fix: Show audience checklist/outcomes or mark content removal in owner review.

## G2-20-005-026  [P2] GAP  facet F04  effort S
- Legacy: Six lifecycle items Assess/Diagnose/Learn/Coach/Improve/Repeat; `docs/legacy-source/frontend/src/components/marketing/data.js:111`
- vNext now: Four steps Learn/Build/Demonstrate/Get hired; `src/app/home/page.tsx:28-30`
- Fix: Preserve timeline/inter-item arrow treatment, document changed list values.

## G2-20-005-029  [P2] GAP  facet F04  effort S
- Legacy: Legacy page title via MarketingLayout default '42 LMS — The AI Talent & Workforce Operating System'; `docs/legacy-source/frontend/src/components/marketing/MarketingLayout.jsx:51-66`
- vNext now: New metadata '42 LMS \| Talent development' with root title template; `src/app/home/page.tsx:4`, `src/app/layout.tsx:11-14`
- Fix: Set product-approved exact replacement title without duplicated suffix; record intentional AI copy retirement.

## G2-20-005-030  [P2] GAP  facet F05  effort S
- Legacy: Seven AGENT card list order from data.js and 6 PILLARS; `docs/legacy-source/frontend/src/components/marketing/data.js:27-63,78-109`
- vNext now: Six role cards followed by four pillars, no table/pagination/search/bulk actions; `src/app/home/page.tsx:10-27`
- Fix: Honor corresponding ordering and card counts if marketing density parity is required.

## G2-20-005-058  [P2] GAP  facet F18  effort S
- Legacy: Legacy headline and trust sentence, AI-related messaging; `docs/legacy-source/frontend/src/components/marketing/sections.jsx:44-64`
- vNext now: New home messaging emphasizes courses/projects/placements; `src/app/home/page.tsx:8-9`
- Fix: Retain owner-approved non-AI copy, match structural text roles and line lengths.

## G2-20-005-059  [P2] GAP  facet F18  effort S
- Legacy: Legacy section heading `Everything you need to develop talent`; `docs/legacy-source/frontend/src/components/marketing/sections.jsx:227-230`
- vNext now: New `Connected platform pillars`; `src/app/home/page.tsx:22`
- Fix: Record exact replacement in copy change ledger; use owner decision.

## G2-20-005-068  [P2] GAP  facet F23  effort S
- Legacy: Legacy AI-driven product positioning and 7 AI agents are present; `docs/legacy-source/frontend/src/components/marketing/sections.jsx:44-53,106-123`, `docs/legacy-source/frontend/src/components/marketing/data.js:27-63`
- vNext now: AI positioning is intentionally removed in vNext, replaced with grounded learning/projects/placements copy; `src/app/home/page.tsx:8-17`
- Fix: Document owner-approved AI feature removal, do not reintroduce unbuilt product claims; achieve visual clone via replacement content.

## G2-20-031-084  [P2] GAP  facet F19  effort M
- Legacy: Legacy marketing site includes org+website JSON-LD on all routes and page JSON-LD (`docs/legacy-source/frontend/src/components/marketing/MarketingLayout.jsx:10-49`, `docs/legacy-source/frontend/src/components/marketing/MarketingLayout.jsx:96-105`)
- vNext now: New only home contains one SoftwareApplication JSON-LD; subpages none (`src/app/home/page.tsx:5-8`, `src/components/marketing/marketing-layout.tsx:12-34`)
- Fix: Restore lawful non-AI org/site/page JSON-LD and precise URLs

## G2-20-005-019  [P3] GAP  facet F03  effort S
- Legacy: Home audience enterprise card dark background with light primary CTA; `docs/legacy-source/frontend/src/components/marketing/sections.jsx:190-199`, `docs/legacy-source/frontend/src/components/marketing/marketing.module.scss:339-349`
- vNext now: Both audience cards white and bordered; `src/app/home/page.tsx:18-21`
- Fix: Give enterprise half dark panel, outcomes and light button treatment.

## G2-20-005-056  [P3] GAP  facet F17  effort S
- Legacy: Legacy Hero h1, section h2, cards h3 and checked list semantics; `docs/legacy-source/frontend/src/components/marketing/sections.jsx:47-50,106-119,169-205`
- vNext now: New h1, section h2 and h3 cards, numbered ol journey; `src/components/marketing/marketing-layout.tsx:35-54`, `src/app/home/page.tsx:28-31`
- Fix: Keep semantic list structure for feature/outcome lists in cloned sections.
