# Verification packet (P1 round 2): 25 rows

For EACH row: open the vNext file(s) it cites, check that the Fix is really implemented (wording, validation, behaviour, permissions, empty/error states, wiring). If it is missing, partial or wrong, FIX it now in the file (keep valid syntax, no uninstalled packages). In your commit message list the row IDs as OK or FIXED. Rows without a vNext file describe a new feature: search the repo for it; if it does not exist, build it.

## G2-14-017-007 [P1] GAP facet F04
- Files: src/db/schema/projects.ts
- Legacy: Legacy sprintKey max120 and title max220 `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/ProjectSprint.java:44-54`
- Expected fix: Map keys over64 and enforce legacy title max where needed

## G2-14-017-008 [P1] GAP facet F04
- Files: src/db/schema/projects.ts
- Legacy: Legacy separate sprintStatus UPCOMING IN_PROGRESS COMPLETED OVERDUE (derived) `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/ProjectSprint.java:56-57` `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/ProjectSprint.java:71-75`
- Expected fix: Compute and expose progress-derived status independent of lifecycle

## G2-14-017-012 [P1] GAP facet F04
- Files: src/db/schema/projects.ts
- Legacy: Legacy startedBy/At and completedBy/At persisted `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/ProjectSprint.java:108-120`
- Expected fix: Add lifecycle actor/time columns or immutable activity projection

## G2-14-017-014 [P1] GAP facet F05
- Files: src/db/schema/projects.ts, src/modules/projects/mentor-sprint-delete-service.ts
- Legacy: Legacy reads active sprints only by isDeleted false `docs/legacy-source/backend/src/main/java/com/_42students/lms/repository/ProjectSprintRepository.java:16-20`
- Expected fix: Preserve history/tombstones for intentionally removed legacy sprints

## G2-14-017-018 [P1] GAP facet F06
- Files: src/db/schema/projects.ts
- Legacy: Legacy deletedByWorkspace defaults false `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/ProjectSprint.java:41-42`
- Expected fix: Record deliberate workspace removals for template reconciliation

## G2-14-017-037 [P1] GAP facet F12
- Files: src/db/schema/projects.ts
- Legacy: Legacy sprintState PLANNED ACTIVE COMPLETED distinct from task progress derived status `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/ProjectSprint.java:71-77`
- Expected fix: Avoid conflating progress badge and actionable sprint state

## G2-14-017-060 [P1] GAP facet F22
- Files: src/db/schema/projects.ts
- Legacy: Legacy project_sprint table int projectId, releaseId, created/updated actor, deleted flag `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/ProjectSprint.java:34-45` `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/ProjectSprint.java:90-120`
- Expected fix: Document complete DB field disposition

## G2-14-017-061 [P1] GAP facet F22
- Files: src/db/schema/projects.ts
- Legacy: Legacy sprintKey max120, title max220, sortOrder and sprintNumber distinct `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/ProjectSprint.java:44-51` `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/ProjectSprint.java:79-80`
- Expected fix: Map long key and ordering collisions before migration

## G2-14-017-062 [P1] GAP facet F22
- Files: src/db/schema/projects.ts
- Legacy: Legacy sprintStatus and sprintState separate columns `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/ProjectSprint.java:56-77`
- Expected fix: Rebuild progress derivation and lifecycle independently

## G2-14-018-051 [P1] GAP facet F22
- Files: drizzle/0133_lanes_round_1.sql
- Legacy: Legacy V157 migration establishes original state table `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/LogAlertState.java:14-31`
- Expected fix: Validate fresh schema and upgrade path with existing rows

## G2-14-019-004 [P1] GAP facet F02
- Files: src/db/schema/placement-round-candidate-slots.ts, src/modules/placements/hr-interview-slot-service.ts
- Legacy: Legacy interview directly organization scoped `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Interview.java:33-35`
- Expected fix: Support SA org-scope only through explicit authorized college context

## G2-14-019-008 [P1] GAP facet F04
- Files: src/db/schema/placement-round-candidate-slots.ts, src/db/schema/placements.ts
- Legacy: Legacy Interview has organizationId,jobId,applicationId,learnerId integer FKs `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Interview.java:33-47`
- Expected fix: Map all four legacy IDs and verify college crosslinks

## G2-14-019-016 [P1] GAP facet F05
- Files: src/db/schema/placement-round-candidate-slots.ts, src/modules/placements/tpo-interview-slot-service.ts
- Legacy: Legacy learner upcoming filters three active statuses `docs/legacy-source/backend/src/main/java/com/_42students/lms/repository/InterviewRepository.java:90-94`
- Expected fix: Match upcoming vs past tabs including pending reschedules

## G2-14-019-035 [P1] GAP facet F10
- Files: src/db/schema/placement-round-candidate-slots.ts
- Legacy: Legacy enforces one live round per application `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/InterviewServiceImpl.java:332-339`
- Expected fix: Block simultaneous rounds across multiple round IDs for same application

## G2-14-019-041 [P1] GAP facet F11
- Files: src/db/schema/placement-round-candidate-slots.ts, src/db/schema/placements.ts
- Legacy: Legacy no-show feedback admin only `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Interview.java:95-113`
- Expected fix: Add no-show outcome without exposing raw admin feedback

## G2-14-019-060 [P1] GAP facet F19
- Files: src/db/schema/placement-round-candidate-slots.ts, src/modules/placements/tpo-interview-slot-service.ts
- Legacy: Legacy duration-aware overlap reads active interviews under locks `docs/legacy-source/backend/src/main/java/com/_42students/lms/repository/InterviewRepository.java:104-129`
- Expected fix: Add cross-round candidate overlap exclusion robust under concurrent writes

## G2-14-019-066 [P1] GAP facet F22
- Files: src/db/schema/placement-round-candidate-slots.ts, src/db/schema/placements.ts
- Legacy: Legacy reschedule history prev date/changedAt and feedback provenance `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Interview.java:125-158`
- Expected fix: Preserve history/attribution and private feedback data

## G2-14-019-067 [P1] GAP facet F22
- Files: src/db/schema/placement-round-candidate-slots.ts
- Legacy: Legacy uniqueness overlap enforced by service instead of scheduled hour index `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Interview.java:60-67` `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/InterviewServiceImpl.java:306-328`
- Expected fix: Add effective exclusion logic for learner and panel collisions

## G2-14-022-008 [P1] GAP facet F03
- Files: src/modules/placements/tpo-recruiter-invite-service.ts
- Legacy: Legacy invite may optionally email and returns emailAvailable/emailed `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/tpo/TpoRecruiterLeadController.java:158-165` `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/TpoRecruiterLeadService.java:297-312`
- Expected fix: Preserve invite sendEmail option and true delivery receipt safely

## G2-14-022-039 [P1] GAP facet F11
- Files: src/modules/placements/tpo-recruiter-invite-service.ts
- Legacy: Legacy invite link base sourced from Origin approved LMS domains `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/tpo/TpoRecruiterLeadController.java:160-164`
- Expected fix: Validate absolute origin/host allowlist and use canonical college URL

## G2-14-022-049 [P1] GAP facet F15
- Files: src/modules/placements/tpo-recruiter-invite-service.ts
- Legacy: Legacy invite optional Zepto mail recruiter-invite and activity log only on success `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/TpoRecruiterLeadService.java:299-313`
- Expected fix: Ensure requested email delivery and accurate one-time receipt

## G2-14-022-064 [P1] GAP facet F22
- Files: src/db/schema/tpo-crm.ts
- Legacy: Legacy recruiter_lead, activity, followup tables use integer/Long IDs and college scope `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/TpoRecruiterLeadService.java:89-126` `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/TpoRecruiterLeadService.java:208-269`
- Expected fix: Create complete legacy ID→UUID migration including crosslinks

## G2-18-031-018 [P1] GAP facet F04
- Files: src/db/schema/users.ts, src/db/schema/profiles.ts
- Legacy: Legacy Learner model stores first/last, roll, class/program/college IDs, contact, description, dob/gender, identity, qualifications, skills, projects, resume and intro video; Learner.java:21-231
- Expected fix: Map every demographic and rich learner field to JSON section and academic join; document intentional removed video/files

## G2-18-031-034 [P1] GAP facet F07
- Files: src/components/admin/super-admin-faculty-bulk-import.tsx
- Legacy: Legacy faculty CSV validates exact roster+department before Create and blocks duplicates; Faculty.js:634-741
- Expected fix: Add server-side PREVIEW of duplicates/department/role before irreversible create

## G2-18-031-042 [P1] GAP facet F10
- Files: src/components/admin/super-admin-faculty-bulk-import.tsx, src/components/admin/person-onboard-dialog.tsx
- Legacy: Legacy Faculty POST /register, /bulk-validate, /bulk-register, PUT /update/{id}, DELETE /delete/{id}; FacultyController.java:107-196,623-690
- Expected fix: Map department/type payloads and batch preflight, retain status/result envelope compatibility for surviving callers
