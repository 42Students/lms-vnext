# Work packet (wave 2): edit src/app/(authenticated)/learn/profile/data-access/page.tsx

3 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-1/learner-placement-profile-controller.md

## G2-1-009-001  [P2] GAP  facet F01  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/tpo/LearnerPlacementProfileController.java:20-40`: learner self GET /api/v1/learner/profile/academic-record and /data-access.
- vNext now: `src/app/(authenticated)/learn/profile/page.tsx:114-123`,`src/app/(authenticated)/learn/profile/academic-record/page.tsx:8-13`,`src/app/(authenticated)/learn/profile/data-access/page.tsx:8-16`: two linked server-rendered pages under /learn/profile.
- Fix: Map both legacy REST callers to self-only pages/services with migration guidance.

## G2-1-009-040  [P2] GAP  facet F13  effort S
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/LearnerPlacementProfileService.java:44-55`: no shares yields empty list.
- vNext now: `src/app/(authenticated)/learn/profile/data-access/page.tsx:43`: empty text says `No recorded membership changes to display`.
- Fix: Add distinct `No companies have been given your data` share-empty message.

## G2-1-009-052  [P2] GAP  facet F20  effort S
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/tpo/LearnerAcademicRecord.java:65-70`: importedAt/updatedAt LocalDateTime without explicit timezone.
- vNext now: `src/app/(authenticated)/learn/profile/data-access/page.tsx:39-41`: activityEvent ISO formatted Asia/Kolkata.
- Fix: Render evidence timestamps explicitly in IST, retain migration timezone semantics.
