# Work packet (wave 3): edit src/components/academics/college-section-lifecycle-action.tsx

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-5/u003-college-admin-classes.md

## G2-5-003-079  [P1] MISSING  facet F23 Extra/dropped  effort L
- Legacy: Delete action and named confirmation are part of legacy surface. (docs/legacy-source/frontend/src/pages/superadmin/sections/Classes.js:403-425; docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/ClassController.java:225-255)
- vNext now: Delete removed, Archive/Restore substituted. (src/components/academics/college-structure-directory.tsx:396-406; src/components/academics/college-section-lifecycle-action.tsx:42-55)
- Fix: Owner decision needed: reinstate guarded delete or mark intentional omission.
