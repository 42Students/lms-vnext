# Work packet: edit src/app/(authenticated)/tpo/settings/recruiters/page.tsx

2 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-8/l11-u024-tpo-settings.md

## G2-11-024-009  [P1] GAP  facet F04  effort M
- Legacy: docs/legacy-source/frontend/src/pages/tpo/settings.js:606-613 recruiter approval=true, access months=6, sees=AFTER_REVIEW defaults
- vNext now: src/app/(authenticated)/tpo/settings/recruiters/page.tsx:98-103 reads grants/duration/link separately
- Fix: Restore combined policy controls and defaults.

## G2-11-024-051  [P1] GAP  facet F22  effort L
- Legacy: docs/legacy-source/frontend/src/pages/tpo/settings.js:616-623 recruiter approval/visibility/months/trusted domains stored in settings
- vNext now: src/app/(authenticated)/tpo/settings/recruiters/page.tsx:98-103 modular grant/link data; combined settings persistence not shown
- Fix: Map and persist every old policy field with defaults.
