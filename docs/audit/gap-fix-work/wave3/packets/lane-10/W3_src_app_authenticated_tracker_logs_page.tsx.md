# Work packet (wave 3): edit src/app/(authenticated)/tracker/logs/page.tsx

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-16/u005-tracker-logs.md

## G2-16-005-085  [P1] MISSING  facet F23  effort L
- Legacy: `logs.js:557-585`: health strip/deploy markers, digest and direct log detail.
- vNext now: `tracker/logs/page.tsx:81-109`: Known Errors-first and optional live backup; deploy health/detail missing.
- Fix: Restore primary live triage, deployment correlation and deep linked full detail.
