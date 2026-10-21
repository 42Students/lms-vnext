# Work packet: edit src/app/(authenticated)/tpo/settings/rules/page.tsx

3 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-8/l11-u024-tpo-settings.md

## G2-11-024-014  [P1] MISSING  facet F06  effort M
- Legacy: docs/legacy-source/frontend/src/pages/tpo/settings.js:392-405 CGPA percentage rule Select and Change
- vNext now: src/app/(authenticated)/tpo/settings/rules/page.tsx:101-422 prioritizes job-specific eligibility and fixed notes, CGPA editor not shown
- Fix: Restore mutable college CGPA conversion control.

## G2-11-024-028  [P1] GAP  facet F11  effort M
- Legacy: docs/legacy-source/frontend/src/pages/tpo/settings.js:165-171 nonadmin TPO sees info College settings are managed by the TPO admins
- vNext now: src/app/(authenticated)/tpo/settings/rules/page.tsx:57-69 any TPO member may see page then service manages permissions
- Fix: Separate edit/admin permission and read-only nonadmin notice.

## G2-11-024-019  [P2] GAP  facet F07  effort M
- Legacy: docs/legacy-source/frontend/src/pages/tpo/settings.js:148-150 unknown access error Could not verify your placement-settings access
- vNext now: src/app/(authenticated)/tpo/settings/rules/page.tsx:57-69 redirects non-TPO and reads service directly
- Fix: Distinguish unknown access error with retry.
