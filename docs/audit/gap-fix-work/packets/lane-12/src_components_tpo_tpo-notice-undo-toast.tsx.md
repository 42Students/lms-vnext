# Work packet: edit src/components/tpo/tpo-notice-undo-toast.tsx

2 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-11/tpo-announcements.md

## G2-11-005-060  [P2] GAP  facet F08  effort S
- Legacy: Successful immediate notice toast Sent to N student(s) for 30 seconds `docs/legacy-source/frontend/src/pages/tpo/announcements.js:61`
- vNext now: vNext Countdown toast Announcement saved. Undo send (Xs remaining) `src/components/tpo/tpo-notice-undo-toast.tsx:30`
- Fix: Include recipient count in toast

## G2-11-005-061  [P2] GAP  facet F08  effort S
- Legacy: Undo success Undone. Nobody was told. `docs/legacy-source/frontend/src/pages/tpo/announcements.js:66`
- vNext now: vNext Undo form server redirect success not same text in toast `src/components/tpo/tpo-notice-undo-toast.tsx:30`
- Fix: Match success phrasing
