# Work packet: edit src/app/(authenticated)/college/programs/page.tsx

2 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-9/college-admin-programs.md

## G2-9-018-002  [P1] GAP  facet F01  effort S
- Legacy: No-college route shows warning and contact-administrator description `docs/legacy-source/frontend/src/pages/college-admin/programs.js:19-32`
- vNext now: No college membership redirects to /dashboard `src/app/(authenticated)/college/programs/page.tsx:12-14`
- Fix: Display old actionable no-college warning rather than silently redirect.

## G2-9-018-047  [P1] GAP  facet F11  effort S
- Legacy: No-college page renders warning, not mutation options `docs/legacy-source/frontend/src/pages/college-admin/programs.js:19-33`
- vNext now: Absent college membership redirects `src/app/(authenticated)/college/programs/page.tsx:11-15`
- Fix: Render warning and explain next administrative action.
