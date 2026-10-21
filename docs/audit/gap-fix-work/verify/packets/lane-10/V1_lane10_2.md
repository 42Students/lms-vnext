# Verification packet (P1 sample): 6 rows

For EACH row: open the vNext file(s) it cites, check that the Fix is really implemented (wording, validation, behaviour, permissions, empty/error states, wiring). If it is missing, partial or wrong, FIX it now in the file (keep valid syntax, no uninstalled packages). In your commit message list the row IDs as OK or FIXED. Rows without a vNext file describe a new feature: search the repo for it; if it does not exist, build it.

## G2-7-036-083 [P1] MISSING facet F23
- Files: src/components/college/college-student-csv-import.tsx
- Legacy: Students.js:868-879 import batch history
- Expected fix: Provide persisted batch history

## G2-11-027-023 [P1] GAP facet F13
- Files: src/modules/module-access/service.ts
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/FeatureFlagController.java:48-49 absent rule reads enabled by default.
- Expected fix: Owner decision on source default; distinguish no rule vs false stored rule.

## G2-13-024-023 [P1] MISSING facet F07
- Files: src/modules/inbound-mail/admin-service.ts
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/SuperAdminInboundMailController.java:73-76 unknown id detail returns HTTP404
- Expected fix: Implement 404 full-detail endpoint and matching drawer error state

## G2-13-024-033 [P1] GAP facet F11
- Files: src/modules/inbound-mail/admin-service.ts
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/SuperAdminInboundMailController.java:20-25 intended SUPER_ADMIN via WebSecurityConfig; global list no selected college needed
- Expected fix: Make authorized Super Admin inbox accessible despite acting-in-college UI mode or clearly expose scope reset

## G2-8-017-083 [P1] GAP facet F22
- Files: (none, new feature)
- Legacy: LBE/model/ProjectTemplateVersion.java:18-41 actionType, lifecycleStatus, changedBy, changedAt, notes, full snapshotJson
- Expected fix: Retain action type and whole-template snapshots for forensic rollback fidelity.

## G2-9-015-073 [P1] GAP facet F13
- Files: src/app/(authenticated)/college/placements/drives/page.tsx
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/Jobs.js:812-823` — Warning stale rows with Retry action, does not present blank list.
- Expected fix: Support stale scoped result while revalidating.
