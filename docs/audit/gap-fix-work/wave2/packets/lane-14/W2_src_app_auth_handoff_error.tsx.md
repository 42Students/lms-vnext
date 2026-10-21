# Work packet (wave 2): edit src/app/auth/handoff/error.tsx

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-1/auth-handoff-token.md

## G2-1-014-035  [P2] GAP  facet F13  effort S
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/AuthController.java:509-517`: expired/used returns controlled 410/404.
- vNext now: `src/app/auth/handoff/error.tsx:5-10`: generic boundary retry to retired notice.
- Fix: Provide specific expired-link explanation with safe restart.
