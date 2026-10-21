# Work packet: edit src/modules/people/college-directory-person-editor-service.ts

6 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-9/l15-u027-faculty-controller.md

## G2-15-027-009  [P1] GAP  facet F04  effort L
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/dto/request/FacultyDTO.java:15-51 first/last names and contacts plus uniqueId,address,website,skills,organizations,experience,qualifications
- vNext now: src/modules/people/college-directory-person-editor-service.ts:16-27 editor has address/bio/gender/date/contact/dept/type/title, not original complete DTO
- Fix: Inventory and expose missing identity/profile fields in proper people profile sections.

## G2-15-027-021  [P1] GAP  facet F06  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/dto/request/FacultyDTO.java:29-33 required deptId & collegeId with min1
- vNext now: src/modules/people/college-directory-person-editor-service.ts:22-23,70-76 UUID dept optional and acting-college scope
- Fix: Require actual department when legacy faculty provisioning demands it; validate belongs to college.

## G2-15-027-036  [P1] GAP  facet F10  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/FacultyController.java:103-171 register can create/update and logs FACULTY_CREATE/FACULTY_UPDATE
- vNext now: src/modules/people/college-directory-person-editor-service.ts:105-112 separate profile update event; onboards elsewhere
- Fix: Preserve distinct creation/update audit entries with relevant actor/college.

## G2-15-027-070  [P1] GAP  facet F22  effort L
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Faculty.java:151-197 identity/languages/skills/qualification/publications JSON
- vNext now: src/modules/people/college-directory-person-editor-service.ts:77-91 typed facultyProfiles.profileDocument update only subset
- Fix: Field-by-field JPA-to-profile JSON migration schema and per-field access policy.

## G2-15-027-025  [P2] GAP  facet F07  effort S
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/FacultyController.java:149-153 department must belong to selected college exact message
- vNext now: src/modules/people/college-directory-person-editor-service.ts:71-76 throws DEPARTMENT_NOT_FOUND
- Fix: Map mismatched department to exact helpful validation copy.

## G2-15-027-031  [P2] GAP  facet F08  effort S
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/Faculty.js:442-485 Faculty updated successfully! and Faculty deleted successfully!
- vNext now: src/modules/people/college-directory-person-editor-service.ts:106-112 response {id,updated:true} and generic activity
- Fix: Use legacy exact success notifications in per-faculty actions.
