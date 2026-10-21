# Work packet (wave 2): edit src/modules/placements/college-legacy-drive-settings-model.ts

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-9/college-admin-jobs-settings.md

## G2-9-013-064  [P2] GAP  facet F12  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/AdminJobServiceImpl.java:816-824` — Legacy true isActive clears draft; true isDraft clears active.
- vNext now: `src/modules/placements/college-legacy-drive-settings-model.ts:1-15` — Independent single status enum DRAFT/PUBLISHED/CLOSED/ARCHIVED.
- Fix: Write explicit state translation and preserve allowed transitions.
