# Work packet (wave 2): edit src/app/(authenticated)/tpo/settings/page.tsx

2 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-8/l11-u024-tpo-settings.md

## G2-11-024-003  [P2] GAP  facet F02  effort M
- Legacy: docs/legacy-source/frontend/src/pages/tpo/settings.js:176-205 PageShell Settings header and two-column nav/content
- vNext now: src/app/(authenticated)/tpo/settings/page.tsx:1-9 redirect only; src/app/(authenticated)/tpo/settings/rules/page.tsx:101-104 PageHeader then compact Settings sections disclosure
- Fix: Restore always-visible two-column Settings navigation.

## G2-11-024-043  [P2] GAP  facet F18  effort S
- Legacy: docs/legacy-source/frontend/src/pages/tpo/settings.js:179-182 exact Settings heading and subtitle How your placement cell runs
- vNext now: src/app/(authenticated)/tpo/settings/page.tsx:1-9 no Settings title; src/app/(authenticated)/tpo/settings/rules/page.tsx:101 Placement rules title
- Fix: Restore parent Settings heading.
