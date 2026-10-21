# Work packet (wave 2): edit src/modules/people/college-faculty-lifecycle-service.ts

3 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-1/admin-user-lifecycle-controller.md, docs/audit/gap2/lane-9/l15-u027-faculty-controller.md

## G2-1-001-024  [P2] GAP  facet F10  effort M
- Legacy: `AdminUserLifecycleController.java:206-212` logs `LEARNER_SUSPEND`, `FACULTY_SUSPEND`/`REACTIVATE`, entity type learner/faculty and optional reason.
- vNext now: `repository.ts:851-896`, `college-faculty-lifecycle-service.ts:83-98` log IDENTITY_MEMBERSHIP_* on `college_membership` with summary and metadata.
- Fix: Keep typed role in metadata/subject and legacy audit filters or provide compatibility mapping for existing audit screens.

## G2-1-001-048  [P2] GAP  facet F22  effort M
- Legacy: `Faculty.java:63-69`, `Learner.java:68-74` use JPA @Version optimistic entity rows.
- vNext now: `memberships.ts:17-49` has updatedAt but no version column; faculty service uses status predicate (`college-faculty-lifecycle-service.ts:64-82`).
- Fix: Use membership version or timestamp CAS consistently for all generic lifecycle mutations if stale-client conflict matters.

## G2-15-027-056  [P2] GAP  facet F15  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/FacultyController.java:158-163,627-695 create/edit/delete admin audit events
- vNext now: src/modules/people/college-directory-person-editor-service.ts:106-112 profile event + src/modules/people/college-faculty-lifecycle-service.ts:88-99 lifecycle event taxonomy
- Fix: Emit distinct register/update/delete audit actions with correct recipients.
