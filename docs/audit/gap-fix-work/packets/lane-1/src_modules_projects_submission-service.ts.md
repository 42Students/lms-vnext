# Work packet: edit src/modules/projects/submission-service.ts

11 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-3/project-delivery-event.md, docs/audit/gap2/lane-4/project-delivery-model.md

## G2-3-018-021  [P1] GAP  facet F10  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/ProjectDeliveryEvent.java:16-47`
- vNext now: `src/modules/projects/submission-service.ts:322-326`, `src/modules/projects/admin-submission-review-service.ts:77-82`
- Fix: Legacy single project_delivery_event history records broad actions, statuses and snapshots; vNext technical append-only event inserts only attachment change/lock/reopen. Record submission, draft save, review and feedback chronology via combined history.

## G2-4-018-001  [P1] GAP  facet F01  effort M
- Legacy: Legacy project delivery accessible through /api/v1/projects/id/delivery and /submission endpoints. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/ProjectWorkspaceController.java:342-394`)
- vNext now: New projectSubmissions service has draft/create/submit/review/list functions under project UUID. (`src/modules/projects/submission-service.ts:101-106`; `src/modules/projects/submission-service.ts:337-355`; `src/modules/projects/submission-service.ts:471-483`)
- Fix: Map old delivery/submission routes and identifiers to new versioned submission endpoints.

## G2-4-018-024  [P1] GAP  facet F06  effort L
- Legacy: Legacy PUT delivery updates snapshot, notes, attachments and feedback via workspace controller. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/ProjectWorkspaceController.java:342-376`; `docs/legacy-source/backend/src/main/java/com/_42students/lms/dto/projects/ProjectDeliveryDTO.java:9-26`)
- vNext now: New create/update draft and submit have validated structured payload. (`src/modules/projects/submission-service.ts:101-112`; `src/modules/projects/submission-service.ts:216-235`)
- Fix: Provide field-level form migration for old snapshot/primary attachment inputs.

## G2-4-018-025  [P1] GAP  facet F06  effort M
- Legacy: Legacy attachment list additive rather than overwrite primary attachment. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/model/ProjectDelivery.java:55-61`)
- vNext now: New typed attachments array supplied to draft mutation. (`src/modules/projects/submission-service.ts:159-179`; `src/modules/projects/submission-service.ts:216-235`)
- Fix: Ensure concurrent add/remove preserves unrelated entries with optimistic CAS.

## G2-4-018-026  [P1] GAP  facet F06  effort M
- Legacy: Legacy submittedByType supports different submitter roles as string. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/model/ProjectDelivery.java:83-85`)
- vNext now: New learner-only create/submit access, reviewer separate. (`src/modules/projects/submission-service.ts:76-99`)
- Fix: Document policy for prior mentor/admin submissions and creator names.

## G2-4-018-028  [P1] GAP  facet F07  effort M
- Legacy: Legacy entity has JPA @Version on Long for optimistic mutation. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/model/ProjectDelivery.java:123-129`)
- vNext now: New draft revisions checked by updatedAt and row locks; DB has version ordinal. (`src/modules/projects/submission-service.ts:19-20`; `src/db/schema/projects.ts:826-827`)
- Fix: Ensure draft token uses ms precision and rejects stale writes without overwriting.

## G2-4-018-067  [P1] GAP  facet F20  effort M
- Legacy: Legacy JPA @Version Long null for new record to guarantee persist. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/model/ProjectDelivery.java:123-129`)
- vNext now: New project submission row version is business ordinal with updatedAt revision CAS. (`src/db/schema/projects.ts:826-827`; `src/modules/projects/submission-service.ts:19-20`)
- Fix: Do not confuse ordinal with optimistic token; test concurrent edit races.

## G2-4-018-068  [P1] GAP  facet F20  effort M
- Legacy: Legacy JSON attachment list added additively to avoid overwriting primary fields. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/model/ProjectDelivery.java:55-61`)
- vNext now: New full attachments array update requires fresh revision checking. (`src/modules/projects/submission-service.ts:216-235`)
- Fix: Test concurrent add and remove, ensure no silent lost attachment.

## G2-3-018-015  [P2] GAP  facet F07  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/ProjectWorkspaceController.java:342-365`
- vNext now: `src/modules/projects/submission-service.ts:225-244`
- Fix: Legacy bad delivery mutation replies BAD_REQUEST, forbidden access FORBIDDEN, history missing NOT_FOUND; vNext throws structured PROJECT_SUBMISSION_INVALID_STATE/CONFLICT. Match user-facing status mapping and error copy.

## G2-4-018-031  [P2] GAP  facet F07  effort M
- Legacy: Legacy error text for stale version defined in service, not entity. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/model/ProjectDelivery.java:123-129`)
- vNext now: New maps DB unique conflicts to PROJECT_SUBMISSION_CONFLICT. (`src/modules/projects/submission-service.ts:56-71`)
- Fix: Map 409/conflict copy exactly on submit and draft editor.

## G2-4-018-034  [P2] GAP  facet F08  effort S
- Legacy: Legacy reviewCount increments over resubmission; exact toast independent of DB. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/model/ProjectDelivery.java:63-64`)
- vNext now: New version number increments when new draft created after reopen. (`src/modules/projects/submission-service.ts:147-180`)
- Fix: Show revision count consistently across history.
