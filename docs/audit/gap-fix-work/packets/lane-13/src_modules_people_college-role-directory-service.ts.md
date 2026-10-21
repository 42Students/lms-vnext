# Work packet: edit src/modules/people/college-role-directory-service.ts

15 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-15/learner-search-controller.md, docs/audit/gap2/lane-5/u027-learner-controller.md, docs/audit/gap2/lane-6/college-admin-teachers.md

## G2-15-013-028  [P1] GAP  facet F07  effort L
- Legacy: Unauthorized faculty error Learner directory requires an admin or assigned class faculty. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/search/learners/LearnerSearchController.java:71-79`)
- vNext now: New requires COLLEGE_ADMIN and people.manage. (`src/modules/people/college-role-directory-service.ts:49-60`)
- Fix: Allow assigned faculty read-only class roster search via dedicated teacher endpoint, not broad people.manage.

## G2-15-013-039  [P1] GAP  facet F10  effort M
- Legacy: GET /api/v2/learners/search with query/limit/collegeId/programId/classId; returns list. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/search/learners/LearnerSearchController.java:114-138`)
- vNext now: New listCollegeRoleDirectory(context,kind,filter) DB-backed. (`src/modules/people/college-role-directory-service.ts:40-47`)
- Fix: Expose scoped read adapter if command/autocomplete search requires old payload.

## G2-15-013-047  [P1] GAP  facet F11  effort L
- Legacy: Legacy search admin or assigned faculty for exact class only. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/search/learners/LearnerSearchController.java:65-79`)
- vNext now: New college admin read enforced; faculty excluded from directory. (`src/modules/people/college-role-directory-service.ts:49-60`)
- Fix: Add separate teacher-class search authorization tied to teaching assignment.

## G2-15-013-076  [P1] GAP  facet F20  effort M
- Legacy: Empty principal college/org with requested class resolves class college. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/search/learners/LearnerSearchController.java:81-99`)
- vNext now: New college admin requires persisted membership; no class-only fallback. (`src/modules/people/college-role-directory-service.ts:49-60`)
- Fix: Allow faculty class-only read when persisted assignment exists; do not broaden across college.

## G2-15-013-080  [P1] GAP  facet F22  effort L
- Legacy: Legacy learner integer key, college/program/class integer IDs and contact. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/search/learners/LearnerSearchDTO.java:19-34`)
- vNext now: New UUID collegeMemberships/users and enrollment relationships. (`src/modules/people/college-role-directory-service.ts:233-280`)
- Fix: Write legacy learner/class/program ID -> membership UUID crosswalk if importing historical links.

## G2-15-013-084  [P1] GAP  facet F23  effort M
- Legacy: Search role permits class-assigned faculty, masks contact. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/search/learners/LearnerSearchController.java:114-138`)
- vNext now: New role directory denies all faculty via people.manage. (`src/modules/people/college-role-directory-service.ts:49-60`)
- Fix: Do not silently drop faculty class-scoped picker.

## G2-5-027-014  [P1] GAP  facet F04  effort M
- Legacy: Legacy learner detail is Learner entity enriched with hierarchy. `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/LearnerController.java:589-609`
- vNext now: vNext roster row projects membershipId, name, email, statuses, program/cohort/sections. `src/modules/people/college-role-directory-service.ts:369-383`
- Fix: Create field parity map (roll, mobile, DOB, department, hierarchy) for detail view.

## G2-5-027-019  [P1] GAP  facet F04  effort M
- Legacy: Legacy class roster returns LearnerDTO with contact masking logic based on role. `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/LearnerController.java:630-670`
- vNext now: vNext college role directory only returns email and name as row, not faculty roster contract. `src/modules/people/college-role-directory-service.ts:369-383`
- Fix: Trace faculty assigned-class roster API and preserve contact masking policy.

## G2-5-027-021  [P1] GAP  facet F05  effort M
- Legacy: Legacy getLearnersByCollege page optional, default size 25 when paging; search name/mobile/email/roll/unique/class ID. `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/LearnerController.java:535-587`
- vNext now: vNext search across names/email/program and bounded visible directory fields; mobile/unique IDs not listed. `src/modules/people/college-role-directory-service.ts:176-188,281-293`
- Fix: Restore supported search keys under authorized PII access.

## G2-5-027-050  [P1] GAP  facet F11  effort M
- Legacy: Legacy class roster allows admin or actively assigned teacher, contact visible to teacher. `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/LearnerController.java:630-655`
- vNext now: vNext generic admin directory cannot stand in for faculty roster. `src/modules/people/college-role-directory-service.ts:233-281`
- Fix: Ensure faculty course roster is assignment-scoped and contact masked per policy.

## G2-6-001-072  [P1] GAP  facet F22  effort L
- Legacy: Legacy faculty entity stores college_id, dept_id, faculty_type, dob, mobile, gender and profile JSON `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Faculty.java:35-105` `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Faculty.java:151-196`
- vNext now: New faculty profile is membership-linked; membership and identity queried separately `src/db/schema/profiles.ts:33-64` `src/modules/people/college-role-directory-service.ts:233-252`
- Fix: Create field-by-field schema mapping; preserve legacy profile JSON sections in profile models

## G2-6-001-073  [P1] GAP  facet F22  effort M
- Legacy: Legacy suspendedAt and suspensionReason persisted in faculty entity `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Faculty.java:28-34`
- vNext now: New roster reads collegeMemberships.status and users.platformStatus `src/modules/people/college-role-directory-service.ts:233-250`
- Fix: Ensure reversible suspension reason/history and session revocation are represented in new schema

## G2-6-001-074  [P1] GAP  facet F22  effort M
- Legacy: Old faculty direct FK to dept_id, college_id `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Faculty.java:44-49`
- vNext now: New roster resolves faculty department by faculty_profiles and membership college `src/modules/people/college-role-directory-service.ts:205-220` `src/modules/people/college-role-directory-service.ts:233-252`
- Fix: Verify DB constraints/indexes ensure primaryDepartment belongs to membership college

## G2-15-013-030  [P2] GAP  facet F07  effort S
- Legacy: No college scope -> 403 College scope required. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/search/learners/LearnerSearchController.java:319-320`)
- vNext now: New authorization error people.manage, no same message. (`src/modules/people/college-role-directory-service.ts:49-60`)
- Fix: Provide public-friendly scope error without tenant leaks.

## G2-5-027-031  [P2] GAP  facet F07  effort M
- Legacy: Legacy unauthenticated list returns 401 and bad learnerId returns `Invalid learner id`. `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/LearnerController.java:469-476,589-609`
- vNext now: vNext page requires request context and UUID membership keys; response error type differs. `src/app/(authenticated)/college/students/page.tsx:1-10`, `src/modules/people/college-role-directory-service.ts:39-47`
- Fix: Map unauthorized/not-found/invalid-id to safe user-readable states.
