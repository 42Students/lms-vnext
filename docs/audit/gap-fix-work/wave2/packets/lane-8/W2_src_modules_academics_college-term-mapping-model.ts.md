# Work packet (wave 2): edit src/modules/academics/college-term-mapping-model.ts

6 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-5/u025-semester-controller.md, docs/audit/gap2/lane-17/superadmin-semester-course-mapping.md

## G2-5-025-009  [P2] GAP  facet F03  effort M
- Legacy: Legacy Semester–Course Mapping emphasizes Course Type, Core Mandatory and electives. `docs/legacy-source/frontend/src/pages/superadmin/sections/SemesterCourseMapping.js:1-16`
- vNext now: vNext model preserves selected labels but add defaults CORE. `src/modules/academics/college-term-mapping-model.ts:43-54`, `src/components/academics/college-term-mapping-manager.tsx:128-162`
- Fix: Expose course type selection in add action as legacy.

## G2-5-025-016  [P2] GAP  facet F05  effort M
- Legacy: Legacy reorder accepts complete mappingIds list and assigns contiguous 1-based courseOrder. `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/SemesterController.java:553-599`
- vNext now: vNext PATCH mapping+position renumbers whole term deterministically. `src/modules/academics/college-term-mapping-service.ts:176-234`, `src/modules/academics/college-term-mapping-model.ts:14-21`
- Fix: Offer bulk reorder endpoint or DnD adapter preserving atomic full-list semantics.

## G2-5-025-021  [P2] GAP  facet F06  effort M
- Legacy: Legacy reorder accepts mappingIds complete sequence. `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/SemesterController.java:553-599`
- vNext now: vNext edit position requires credits value even if only changing order. `src/modules/academics/college-term-mapping-model.ts:9-21`, `src/components/academics/college-term-mapping-manager.tsx:90-125`
- Fix: Provide order-only move and dense ordering with no credits rewrite.

## G2-5-025-064  [P2] GAP  facet F22  effort M
- Legacy: Legacy separate SemesterDTO and SemesterCourseDTO accept optional totalCredits and mapping attrs. `docs/legacy-source/backend/src/main/java/com/_42students/lms/dto/request/SemesterDTO.java:10-22`, `docs/legacy-source/backend/src/main/java/com/_42students/lms/dto/request/SemesterCourseDTO.java:12-26`
- vNext now: vNext Zod strict schemas, required confirm+timestamp on update. `src/modules/academics/semester-mutation-model.ts:6-23`, `src/modules/academics/college-term-mapping-model.ts:3-25`
- Fix: Translate serialized DTOs and carry CAS tokens through forms.

## G2-17-002-012  [P3] GAP  facet F03  effort S
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/SemesterCourseMapping.js:372-375 Add Courses to Semester has PlusOutlined icon.
- vNext now: src/components/academics/college-term-mapping-manager.tsx:166-169 same label via src/modules/academics/college-term-mapping-model.ts:45, no plus icon.
- Fix: Add Plus icon inside primary Add button.

## G2-5-025-010  [P3] GAP  facet F03  effort S
- Legacy: Legacy `Course added to semester`, `{N} courses added to semester` mutation message. `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/SemesterController.java:363-367,409-415`
- vNext now: vNext `Added N course(s) to this semester.` copy. `src/modules/academics/college-term-mapping-model.ts:43-54`, `src/components/academics/college-term-mapping-manager.tsx:49-56`
- Fix: Match legacy endpoint and toast phrasing where visible.
