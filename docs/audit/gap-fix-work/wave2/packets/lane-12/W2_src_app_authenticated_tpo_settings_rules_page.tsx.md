# Work packet (wave 2): edit src/app/(authenticated)/tpo/settings/rules/page.tsx

6 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-8/l11-u024-tpo-settings.md

## G2-11-024-003  [P2] GAP  facet F02  effort M
- Legacy: docs/legacy-source/frontend/src/pages/tpo/settings.js:176-205 PageShell Settings header and two-column nav/content
- vNext now: src/app/(authenticated)/tpo/settings/page.tsx:1-9 redirect only; src/app/(authenticated)/tpo/settings/rules/page.tsx:101-104 PageHeader then compact Settings sections disclosure
- Fix: Restore always-visible two-column Settings navigation.

## G2-11-024-005  [P2] GAP  facet F03  effort M
- Legacy: docs/legacy-source/frontend/src/pages/tpo/settings.js:50-61 exact section title/description metadata
- vNext now: src/app/(authenticated)/tpo/settings/rules/page.tsx:101-122 substitutes job-specific eligibility explanatory copy
- Fix: Restore exact SETTINGS_META title, eyebrow and description.

## G2-11-024-026  [P2] GAP  facet F10  effort M
- Legacy: docs/legacy-source/frontend/src/pages/tpo/settings.js:139-150 getTeam entitlement check before rendering panels
- vNext now: src/app/(authenticated)/tpo/settings/rules/page.tsx:57-64 TPO membership check without hub-wide admin check
- Fix: Gate edit rights on actual TPO admin role.

## G2-11-024-034  [P2] GAP  facet F13  effort M
- Legacy: docs/legacy-source/frontend/src/pages/tpo/settings.js:154-171 distinct PanelError retry and read-only denial
- vNext now: src/app/(authenticated)/tpo/settings/rules/page.tsx:57-69 role redirect and route-level errors
- Fix: Render inline access-denied versus unavailable recovery.

## G2-11-024-043  [P2] GAP  facet F18  effort S
- Legacy: docs/legacy-source/frontend/src/pages/tpo/settings.js:179-182 exact Settings heading and subtitle How your placement cell runs
- vNext now: src/app/(authenticated)/tpo/settings/page.tsx:1-9 no Settings title; src/app/(authenticated)/tpo/settings/rules/page.tsx:101 Placement rules title
- Fix: Restore parent Settings heading.

## G2-11-024-045  [P2] GAP  facet F19  effort M
- Legacy: docs/legacy-source/frontend/src/pages/tpo/settings.js:139 getTeam once then loads selected panel
- vNext now: src/app/(authenticated)/tpo/settings/rules/page.tsx:94 plus policy/jobs and src/app/(authenticated)/tpo/settings/recruiters/page.tsx:98-103 multiple independent reads
- Fix: Lazy-load job-specific data and sections.
