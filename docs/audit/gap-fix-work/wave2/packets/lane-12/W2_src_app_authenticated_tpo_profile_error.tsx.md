# Work packet (wave 2): edit src/app/(authenticated)/tpo/profile/error.tsx

2 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-10/l19-u030-tpo-profile.md

## G2-19-030-010  [P2] GAP  facet F03  effort M
- Legacy: docs/legacy-source/frontend/src/pages/tpo/profile.js:90-92 — red error title plus primary icon Retry.
- vNext now: src/app/(authenticated)/tpo/profile/error.tsx:7-10 — ErrorState Unable to load your profile with secondary Retry.
- Fix: Match error CTA prominence and wording.

## G2-19-030-041  [P2] GAP  facet F13  effort M
- Legacy: docs/legacy-source/frontend/src/pages/tpo/profile.js:79-95 — retry error page with specific faculty record text.
- vNext now: src/app/(authenticated)/tpo/profile/error.tsx:7-10 — generic membership ErrorState.
- Fix: Align loading/error states and exact copy.
