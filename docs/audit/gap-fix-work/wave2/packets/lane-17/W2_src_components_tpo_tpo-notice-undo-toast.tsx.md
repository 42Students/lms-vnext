# Work packet (wave 2): edit src/components/tpo/tpo-notice-undo-toast.tsx

2 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-11/tpo-announcements.md

## G2-11-005-077  [P2] GAP  facet F10  effort S
- Legacy: POST :id/undo `docs/legacy-source/frontend/src/api/Services/TpoHubService.js:217`
- vNext now: vNext POST lifecycle action UNDO_SEND `src/components/tpo/tpo-notice-undo-toast.tsx:31`
- Fix: Preserve exact 30-second authorization

## G2-11-005-126  [P2] GAP  facet F20  effort S
- Legacy: Undo success cancels toast key and reloads `docs/legacy-source/frontend/src/pages/tpo/announcements.js:64`
- vNext now: Toast auto expires based created timestamp `src/components/tpo/tpo-notice-undo-toast.tsx:30`
- Fix: Close toast immediately after success
