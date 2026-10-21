# Work packet (wave 2): edit src/app/platform/page.tsx

12 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-10/platform.md

## G2-10-001-005  [P2] MISSING  facet F01  effort S
- Legacy: BreadcrumbList JSON-LD of Home then Platform `docs/legacy-source/frontend/src/pages/platform.js:28-34`
- vNext now: Page metadata has title and description only `src/app/platform/page.tsx:1-3`
- Fix: Emit legacy BreadcrumbList in /platform structured data

## G2-10-001-008  [P2] GAP  facet F02  effort M
- Legacy: Alternating neutral pillars section and teal-tinted integration section `docs/legacy-source/frontend/src/components/marketing/sections.jsx:125-143` `docs/legacy-source/frontend/src/components/marketing/sections.jsx:223-242` `docs/legacy-source/frontend/src/components/marketing/marketing.module.scss:170-174`
- vNext now: Uniform container and plain card sections `src/app/platform/page.tsx:8-21` `src/components/marketing/marketing-layout.tsx:46-54`
- Fix: Reproduce alternating full-width legacy section backgrounds

## G2-10-001-010  [P2] GAP  facet F03  effort M
- Legacy: Seven AI agent cards with decorative line SVG and 48px icon tiles `docs/legacy-source/frontend/src/components/marketing/sections.jsx:106-123` `docs/legacy-source/frontend/src/components/marketing/marketing.module.scss:304-318`
- vNext now: Six workspace cards with heading and copy only `src/app/platform/page.tsx:8-15` `src/components/marketing/marketing-layout.tsx:50-53`
- Fix: Add icon tiles to approved non-AI role cards and resolve card count

## G2-10-001-011  [P2] GAP  facet F03  effort M
- Legacy: Six platform pillar cards with icons `docs/legacy-source/frontend/src/components/marketing/sections.jsx:223-241` `docs/legacy-source/frontend/src/components/marketing/data.js:78-109`
- vNext now: Four pillar cards without icons `src/app/platform/page.tsx:16-21`
- Fix: Apply old icon-tile treatment and record intentionally removed cards

## G2-10-001-012  [P2] MISSING  facet F03  effort M
- Legacy: Ten named integrations as teal-dot chips `docs/legacy-source/frontend/src/components/marketing/sections.jsx:125-143` `docs/legacy-source/frontend/src/components/marketing/data.js:65-76`
- vNext now: Only one generic Integrations card `src/app/platform/page.tsx:20-20`
- Fix: Reintroduce chip strip with real supported integrations

## G2-10-001-013  [P2] GAP  facet F03  effort S
- Legacy: Six lifecycle bordered steps with arrow icons `docs/legacy-source/frontend/src/components/marketing/sections.jsx:245-266` `docs/legacy-source/frontend/src/components/marketing/data.js:111-111`
- vNext now: One prose line with arrow characters `src/app/platform/page.tsx:22-23`
- Fix: Reproduce individual chips and separator icons

## G2-10-001-018  [P2] GAP  facet F04  effort M
- Legacy: Ten specific integration names including GitHub Slack Teams CRM ERP `docs/legacy-source/frontend/src/components/marketing/data.js:65-76`
- vNext now: No named services; generic integrations text `src/app/platform/page.tsx:20-20`
- Fix: Show only verified current integrations as chips

## G2-10-001-028  [P2] GAP  facet F12  effort S
- Legacy: Static cardinality is 7 agents, 6 pillars, 10 integration chips, 6 lifecycle stages `docs/legacy-source/frontend/src/components/marketing/data.js:27-111`
- vNext now: Static cardinality is 6 roles, 4 pillars and prose lifecycle `src/app/platform/page.tsx:8-23`
- Fix: Record content counts and approved omissions explicitly

## G2-10-001-039  [P2] GAP  facet F18  effort S
- Legacy: Eyebrow The platform `docs/legacy-source/frontend/src/pages/platform.js:41-43`
- vNext now: Eyebrow 42 LMS platform `src/app/platform/page.tsx:6-6`
- Fix: Restore approved eyebrow wording

## G2-10-001-043  [P2] GAP  facet F18  effort S
- Legacy: Pillar section heading Everything you need to develop talent `docs/legacy-source/frontend/src/components/marketing/sections.jsx:223-230`
- vNext now: Heading Connected platform pillars `src/app/platform/page.tsx:16-16`
- Fix: Approve exact headline or restore old heading if no scope conflict

## G2-10-001-044  [P2] GAP  facet F18  effort S
- Legacy: Lifecycle copy Assess Diagnose Learn Coach Improve Repeat `docs/legacy-source/frontend/src/components/marketing/sections.jsx:245-252`
- vNext now: Lifecycle Discover needs Learn Build Demonstrate Interview Grow `src/app/platform/page.tsx:22-23`
- Fix: Preserve approved stages but use old visual chips

## G2-10-001-045  [P2] GAP  facet F18  effort S
- Legacy: CTA The future of learning is autonomous; Request a Demo `docs/legacy-source/frontend/src/components/marketing/sections.jsx:269-285`
- vNext now: CTA Explore the platform with our team; See 42 LMS in action `src/app/platform/page.tsx:24-24` `src/components/marketing/marketing-layout.tsx:56-61`
- Fix: Approve non-AI text exception and restore CTA geometry
