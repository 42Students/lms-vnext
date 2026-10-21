# Work packet: edit src/modules/placements/college-drive-archive-preview-service.ts

4 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-9/college-admin-jobs-settings.md

## G2-9-013-056  [P1] GAP  facet F10  effort L
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/AdminJobServiceImpl.java:998-1078` — Legacy soft delete cancels nonterminal interviews, invalidates caches, audits JOB_DELETED and sends learner notifications after commit.
- vNext now: `src/modules/placements/college-drive-archive-preview-service.ts:11-45` — Archive preview and archivePlacementJob do not show an equivalent delete cascade/notification operation.
- Fix: Decide if archive must cancel outstanding interviews and notify impacted learners; implement correct side effects.

## G2-9-013-077  [P1] GAP  facet F15  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/AdminJobServiceImpl.java:1048-1078` — Backend queues post-commit in-app notification, not explicit email, per affected application.
- vNext now: `src/modules/placements/college-drive-archive-preview-service.ts:29-45` — Archive service has no direct learner-notification call.
- Fix: Decide notification parity on archive/cancel/close, audit recipient and event semantics.

## G2-9-013-078  [P1] GAP  facet F15  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/AdminJobServiceImpl.java:378-395` — Legacy cascading canceled interviews invokes notifyInterviewCancelledByCascade after commit.
- vNext now: `src/modules/placements/college-drive-archive-preview-service.ts:29-45` — Archive delegates archivePlacementJob; no cancellation loop on archive code path.
- Fix: Handle active scheduled interview notifications or explicitly document intentional change.

## G2-9-013-103  [P1] GAP  facet F23  effort S
- Legacy: `docs/legacy-source/frontend/src/pages/college-admin/jobs/[jobId]/settings.js:145-165` — Delete exposed even for published active drive after metric verification.
- vNext now: `src/modules/placements/college-drive-archive-preview-service.ts:28-45` — Archive refuses published drive until closed.
- Fix: Explain close-before-archive rule and impact; preserve deliberate safety constraint.
