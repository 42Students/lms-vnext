# Work packet: edit src/app/(authenticated)/admin/students/page.tsx (part 2 of 2)

4 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-19/superadmin-students.md, docs/audit/gap2/lane-5/u027-learner-controller.md

## G2-19-001-091  [P1] GAP  facet F23  effort L
- Legacy: Legacy allowed destructive delete, impersonation, OTP unlock and profile/audit overlays `docs/legacy-source/frontend/src/pages/superadmin/sections/Students.js:966-1085`
- vNext now: vNext omits those and instead offers Move Class and membership details link `src/app/(authenticated)/admin/students/page.tsx:90`
- Fix: Get owner approval for intentional drops; otherwise restore each as individually listed in F03/F09/F10.

## G2-5-027-012  [P1] MISSING  facet F03  effort M
- Legacy: Legacy bulk import list and undo buttons require one-click confirmation/counter. `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/LearnerController.java:436-468`
- vNext now: vNext shows bulk CSV preview/report; undo control not mapped in import flow. `src/app/(authenticated)/admin/students/page.tsx:70-80`, `src/components/college/college-student-csv-import.tsx:27-56`
- Fix: Restore batch-level Undo import action with confirmation and safe compensation.

## G2-5-027-040  [P1] MISSING  facet F09  effort M
- Legacy: Legacy undo bulk action invoked by admin UI; backend returns count. `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/LearnerController.java:449-465`
- vNext now: vNext preview/import page has guarded confirm checkbox, no undo dialog in mapped importer. `src/components/college/college-student-csv-import.tsx:31-56`, `src/app/(authenticated)/admin/students/page.tsx:70-80`
- Fix: Add import-history undo modal showing affected identities and counts.

## G2-5-027-047  [P1] GAP  facet F10  effort M
- Legacy: Legacy update/delete Learner entity + audit LEARNER_UPDATE/TRANSFER/DELETE. `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/LearnerController.java:1065-1143`
- vNext now: vNext directory manages user/membership and learner profile separately. `src/app/(authenticated)/college/students/page.tsx:1-10`, `src/app/(authenticated)/admin/students/page.tsx:61-92`
- Fix: Document and test partial profile lifecycle vs old delete side effects.
