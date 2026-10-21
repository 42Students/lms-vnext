# Work packet (wave 3): edit src/modules/academics/college-section-mutation-service.ts

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-5/u003-college-admin-classes.md

## G2-5-003-044  [P1] MISSING  facet F10 Actions/side effects  effort L
- Legacy: DELETE /api/v1/class/delete/:id guards learners/schedules and audits CLASS_DELETE. (docs/legacy-source/frontend/src/pages/superadmin/sections/Classes.js:287-306; docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/ClassController.java:225-255)
- vNext now: Archive/Restore PATCH lifecycle instead; no equivalent delete in mapped page. (src/components/academics/college-section-lifecycle-action.tsx:19-37; src/modules/academics/college-section-mutation-service.ts:129-140)
- Fix: Implement guarded deletion or owner-confirm semantic replacement.
