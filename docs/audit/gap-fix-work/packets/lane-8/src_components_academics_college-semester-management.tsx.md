# Work packet: edit src/components/academics/college-semester-management.tsx

17 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-5/l18-u029-semester-management.md, docs/audit/gap2/lane-9/college-admin-semesters.md, docs/audit/gap2/lane-12/new-program-structure.md, docs/audit/gap2/lane-1/l15-u029-superadmin-semesters.md, docs/audit/gap2/lane-5/l12-u016-semester-entity.md, docs/audit/gap2/lane-5/u025-semester-controller.md

## G2-18-029-034  [P1] GAP  facet F10  effort M
- Legacy: Legacy edit sends programId/number/name/totalCredits/isActive. `docs/legacy-source/frontend/src/pages/superadmin/sections/SemesterManagement.js:231-275`
- vNext now: vNext PATCH name,isActive,totalCredits=null, CAS and confirm. `src/components/academics/college-semester-management.tsx:134-156`, `src/modules/academics/semester-mutation-model.ts:13-19`
- Fix: Avoid silently clearing totalCredits, preserve unchanged value.

## G2-9-019-029  [P1] GAP  facet F06  effort M
- Legacy: Total Credits edit hidden to retain legacy value `docs/legacy-source/frontend/src/pages/superadmin/sections/SemesterManagement.js:585-589`
- vNext now: Edit always sends totalCredits:null `src/components/academics/college-semester-management.tsx:135-145`
- Fix: Preserve stored totalCredits on edit, or explicit migration to derived-only model.

## G2-9-019-034  [P1] GAP  facet F07  effort M
- Legacy: Server snake_case program_id/semester_number/total_credits field errors `docs/legacy-source/frontend/src/pages/superadmin/sections/SemesterManagement.js:199-205,267-272`
- vNext now: One notice paragraph with first Zod error or service code `src/components/academics/college-semester-management.tsx:50-65`
- Fix: Map backend field errors and retain closeable persistent card alert.

## G2-12-018-024  [P2] GAP  facet F08  effort S
- Legacy: Legacy status update returns 'Status updated successfully.' `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/ProgramStructureController.java:123-139`
- vNext now: New update returns row and copied 'Semester updated successfully!' UI message `src/components/academics/college-semester-management.tsx:147-155`
- Fix: Use separate precise status transition toast.

## G2-18-029-024  [P2] GAP  facet F07  effort M
- Legacy: Legacy server field errors map program_id,semester_number,total_credits,is_active. `docs/legacy-source/frontend/src/pages/superadmin/sections/SemesterManagement.js:199-205`
- vNext now: vNext one notice, no per-field error mapping. `src/components/academics/college-semester-management.tsx:56-68`
- Fix: Show field-level error.

## G2-18-029-025  [P2] GAP  facet F07  effort M
- Legacy: Legacy delete failure shows Retry delete action. `docs/legacy-source/frontend/src/pages/superadmin/sections/SemesterManagement.js:506-516`
- vNext now: vNext row notice, no Retry delete CTA. `src/components/academics/college-semester-management.tsx:159-171,227-227`
- Fix: Provide retry after conflict.

## G2-18-029-027  [P2] GAP  facet F08  effort M
- Legacy: Legacy create success `Created semester name. Next, map courses and assign faculty.` sets selected program. `docs/legacy-source/frontend/src/pages/superadmin/sections/SemesterManagement.js:187-198`
- vNext now: vNext success copy but router.refresh, no auto-selected program filter. `src/components/academics/college-semester-management.tsx:60-66`
- Fix: Redirect/filter to created program.

## G2-18-029-028  [P2] GAP  facet F08  effort M
- Legacy: Legacy update success exact Semester updated successfully! `docs/legacy-source/frontend/src/pages/superadmin/sections/SemesterManagement.js:259-262`
- vNext now: vNext SEMESTER_COPY.updatedMessage, inline not toast. `src/components/academics/college-semester-management.tsx:149-154`
- Fix: Match toast placement.

## G2-18-029-029  [P2] GAP  facet F08  effort M
- Legacy: Legacy delete success exact Semester deleted successfully! `docs/legacy-source/frontend/src/pages/superadmin/sections/SemesterManagement.js:287-289`
- vNext now: vNext inline SEMESTER_COPY.deletedMessage. `src/components/academics/college-semester-management.tsx:159-169`
- Fix: Match toast placement.

## G2-9-019-030  [P2] GAP  facet F07  effort S
- Legacy: Create required validation Please select program `docs/legacy-source/frontend/src/pages/superadmin/sections/SemesterManagement.js:414-419`
- vNext now: Native required + Zod invalid UUID, not same copy `src/components/academics/college-semester-management.tsx:79-84` `src/modules/academics/semester-mutation-model.ts:5-11`
- Fix: Show exact inline Select program field error.

## G2-9-019-031  [P2] GAP  facet F07  effort S
- Legacy: Create missing number Enter semester number `docs/legacy-source/frontend/src/pages/superadmin/sections/SemesterManagement.js:432-435`
- vNext now: Browser required + Zod min1, no exact copy `src/components/academics/college-semester-management.tsx:86-91`
- Fix: Restore exact per-field message.

## G2-9-019-033  [P2] GAP  facet F07  effort S
- Legacy: Name max 255 Name must be 255 characters or less `docs/legacy-source/frontend/src/pages/superadmin/sections/SemesterManagement.js:441-449`
- vNext now: Zod max255 generic and HTML maxLength255 `src/modules/academics/semester-mutation-model.ts:3-9` `src/components/academics/college-semester-management.tsx:92-96`
- Fix: Use exact maximum-length wording.

## G2-9-019-039  [P2] GAP  facet F08  effort S
- Legacy: Ant messages transient toasts `docs/legacy-source/frontend/src/pages/superadmin/sections/SemesterManagement.js:187-205,259-275`
- vNext now: Inline role=status notice `src/components/academics/college-semester-management.tsx:65,115-117,225`
- Fix: Use global toast duration/placement matching Ant with retained inline status for a11y.

## G2-15-029-017  [P3] GAP  facet F07  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/SemesterManagement.js:175-176,445-446 — Semester name is required / Please enter semester name
- vNext now: src/components/academics/college-semester-management.tsx:52-58 — Zod first issue generic displayed as notice
- Fix: Match field-level legacy error text and focus

## G2-15-029-018  [P3] GAP  facet F07  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/SemesterManagement.js:203-205 — Failed to create semester. fallback plus server field errors
- vNext now: src/components/academics/college-semester-management.tsx:66-68 — academicSetupErrorMessage notice
- Fix: Display field-specific errors and closable failed alert

## G2-12-016-019  [P3] GAP  facet F08  effort S
- Legacy: Legacy update/delete success wording in Response. `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/SemesterController.java:189-195,235-240`
- vNext now: vNext UI uses status messages `Semester updated successfully!` etc. `src/components/academics/college-semester-management.tsx:18-23`
- Fix: Align punctuation/exact notification copy.

## G2-5-025-029  [P3] GAP  facet F08  effort S
- Legacy: Legacy create toast names semester and next steps; edit/delete have dedicated success messages. `docs/legacy-source/frontend/src/pages/superadmin/sections/SemesterManagement.js:187-205`, `src/modules/academics/semester-copy.ts:3-23`
- vNext now: vNext copy keeps most messaging but in-page notice instead of antd toast. `src/components/academics/college-semester-management.tsx:60-68`, `src/modules/academics/semester-copy.ts:10-23`
- Fix: Match toast lifecycle and text location.
