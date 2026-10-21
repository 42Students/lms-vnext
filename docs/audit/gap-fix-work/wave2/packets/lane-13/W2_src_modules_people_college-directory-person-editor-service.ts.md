# Work packet (wave 2): edit src/modules/people/college-directory-person-editor-service.ts

4 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-9/l15-u027-faculty-controller.md

## G2-15-027-002  [P2] GAP  facet F01  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/FacultyController.java:103-109 register deprecated, edit delegated profile route
- vNext now: src/modules/people/college-directory-person-editor-service.ts:61-69 profile edit via membership-scoped service rather than facultyId
- Fix: Provide explicit transition/deep links from old faculty IDs to membership detail or document migration.

## G2-15-027-019  [P2] GAP  facet F06  effort S
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/dto/request/FacultyDTO.java:15-17 firstName nonblank max255; facultyId min1
- vNext now: src/modules/people/college-directory-person-editor-service.ts:16-27 editor updates profile by UUID, no firstName split field
- Fix: Validate first and last name separately with legacy 255 cap where collecting.

## G2-15-027-020  [P2] GAP  facet F06  effort S
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/dto/request/FacultyDTO.java:27-47 contactMail email max255, website HTTP(S) optional
- vNext now: src/modules/people/college-directory-person-editor-service.ts:16-27 email Zod and separate contactPhone max32; website not in editor
- Fix: Match email max and site URL validation in complete profile editor.

## G2-15-027-056  [P2] GAP  facet F15  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/FacultyController.java:158-163,627-695 create/edit/delete admin audit events
- vNext now: src/modules/people/college-directory-person-editor-service.ts:106-112 profile event + src/modules/people/college-faculty-lifecycle-service.ts:88-99 lifecycle event taxonomy
- Fix: Emit distinct register/update/delete audit actions with correct recipients.
