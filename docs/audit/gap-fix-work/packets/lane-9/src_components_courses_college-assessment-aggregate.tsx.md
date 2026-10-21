# Work packet: edit src/components/courses/college-assessment-aggregate.tsx

8 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-4/college-admin-assignments.md, docs/audit/gap2/lane-4/superadmin-sections-assignments.md

## G2-4-004-010  [P1] GAP  facet F03  effort M
- Legacy: Course select label placeholder `All courses` 260px, searchable client-side. (`docs/legacy-source/frontend/src/pages/superadmin/sections/Assignments.js:403-407`)
- vNext now: Free-text exact course-code input inside advanced filters, no course-option select. (`src/components/courses/college-assessment-aggregate.tsx:126-133`)
- Fix: Restore searchable course picker backed by authorized course options and course ID filtering.

## G2-4-004-011  [P1] GAP  facet F03  effort M
- Legacy: Section select placeholder `All scopes` 220px, disabled until course selected; options sorted label. (`docs/legacy-source/frontend/src/pages/superadmin/sections/Assignments.js:408-413; docs/legacy-source/frontend/src/pages/superadmin/sections/Assignments.js:217-247`)
- vNext now: Audience scope select `All scopes` offers ALL/SHARED/SECTION but no section-specific choice. (`src/components/courses/college-assessment-aggregate.tsx:144-151`)
- Fix: Restore course-dependent class/section selector with eligible section IDs and proper reset.

## G2-4-004-022  [P1] GAP  facet F04  effort M
- Legacy: Legacy per-assignment submission counts include totalSubmitted,totalStudents,totalGraded,notGraded. (`docs/legacy-source/frontend/src/pages/superadmin/sections/Assignments.js:350-358; docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/AdminAssignmentController.java:129-131`)
- vNext now: vNext counts currently eligible unique learners and graded submissions; historical rows separate. (`src/components/courses/college-assessment-aggregate.tsx:273-276; src/components/courses/college-assessment-aggregate.tsx:305-312`)
- Fix: Reconcile denominator/cohort filtering and expose notGraded count to match legacy stats semantics.

## G2-4-004-072  [P1] GAP  facet F14  effort M
- Legacy: `Export CSV (page)` only currently displayed 20 rows, filename `assignments-college-ID-page-P.csv`. (`docs/legacy-source/frontend/src/pages/superadmin/sections/Assignments.js:329-341`)
- vNext now: vNext Export CSV endpoint cap1000 and full filtered export, not page; different filename and schema. (`src/components/courses/college-assessment-aggregate.tsx:85-90; src/modules/courses/college-assessment-export-model.ts:4-20`)
- Fix: Offer exact current-page export with legacy columns and filename; keep full-filter export as separately labeled option.

## G2-4-010-010  [P1] GAP  facet F03  effort M
- Legacy: Course select label placeholder `All courses` 260px, searchable client-side. (`docs/legacy-source/frontend/src/pages/superadmin/sections/Assignments.js:403-407`)
- vNext now: Free-text exact course-code input inside advanced filters, no course-option select. (`src/components/courses/college-assessment-aggregate.tsx:126-133`)
- Fix: Restore searchable course picker backed by authorized course options and course ID filtering.

## G2-4-010-011  [P1] GAP  facet F03  effort M
- Legacy: Section select placeholder `All scopes` 220px, disabled until course selected; options sorted label. (`docs/legacy-source/frontend/src/pages/superadmin/sections/Assignments.js:408-413; docs/legacy-source/frontend/src/pages/superadmin/sections/Assignments.js:217-247`)
- vNext now: Audience scope select `All scopes` offers ALL/SHARED/SECTION but no section-specific choice. (`src/components/courses/college-assessment-aggregate.tsx:144-151`)
- Fix: Restore course-dependent class/section selector with eligible section IDs and proper reset.

## G2-4-010-022  [P1] GAP  facet F04  effort M
- Legacy: Legacy per-assignment submission counts include totalSubmitted,totalStudents,totalGraded,notGraded. (`docs/legacy-source/frontend/src/pages/superadmin/sections/Assignments.js:350-358; docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/AdminAssignmentController.java:129-131`)
- vNext now: vNext counts currently eligible unique learners and graded submissions; historical rows separate. (`src/components/courses/college-assessment-aggregate.tsx:273-276; src/components/courses/college-assessment-aggregate.tsx:305-312`)
- Fix: Reconcile denominator/cohort filtering and expose notGraded count to match legacy stats semantics.

## G2-4-010-072  [P1] GAP  facet F14  effort M
- Legacy: `Export CSV (page)` only currently displayed 20 rows, filename `assignments-college-ID-page-P.csv`. (`docs/legacy-source/frontend/src/pages/superadmin/sections/Assignments.js:329-341`)
- vNext now: vNext Export CSV endpoint cap1000 and full filtered export, not page; different filename and schema. (`src/components/courses/college-assessment-aggregate.tsx:85-90; src/modules/courses/college-assessment-export-model.ts:4-20`)
- Fix: Offer exact current-page export with legacy columns and filename; keep full-filter export as separately labeled option.
