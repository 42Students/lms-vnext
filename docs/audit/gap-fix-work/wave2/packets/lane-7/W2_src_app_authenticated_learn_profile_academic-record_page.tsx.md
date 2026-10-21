# Work packet (wave 2): edit src/app/(authenticated)/learn/profile/academic-record/page.tsx

10 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-1/learner-placement-profile-controller.md

## G2-1-009-001  [P2] GAP  facet F01  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/tpo/LearnerPlacementProfileController.java:20-40`: learner self GET /api/v1/learner/profile/academic-record and /data-access.
- vNext now: `src/app/(authenticated)/learn/profile/page.tsx:114-123`,`src/app/(authenticated)/learn/profile/academic-record/page.tsx:8-13`,`src/app/(authenticated)/learn/profile/data-access/page.tsx:8-16`: two linked server-rendered pages under /learn/profile.
- Fix: Map both legacy REST callers to self-only pages/services with migration guidance.

## G2-1-009-013  [P2] MISSING  facet F04  effort S
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/tpo/LearnerAcademicRecord.java:46-47`: gapYears Integer default 0.
- vNext now: `src/app/(authenticated)/learn/profile/academic-record/page.tsx:17-24`: gap-years absent; `src/db/schema/placements.ts:755`: separate gapYears column.
- Fix: Show gap years, distinguish unknown vs zero and source.

## G2-1-009-014  [P2] MISSING  facet F04  effort S
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/tpo/LearnerAcademicRecord.java:49-50`: isLateralEntry Boolean false non-null.
- vNext now: `src/app/(authenticated)/learn/profile/academic-record/page.tsx:17-24`: lateral-entry absent.
- Fix: Project lateral-entry marker with explicit Yes/No.

## G2-1-009-015  [P2] MISSING  facet F04  effort S
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/tpo/LearnerAcademicRecord.java:52-53`: passingYear Integer.
- vNext now: `src/app/(authenticated)/learn/profile/academic-record/page.tsx:17-24`: passing year absent.
- Fix: Show completion-year field if recorded; fallback Not recorded.

## G2-1-009-016  [P2] MISSING  facet F04  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/tpo/LearnerAcademicRecord.java:55-56`: gender String.
- vNext now: `src/app/(authenticated)/learn/profile/academic-record/page.tsx:17-24`: gender absent.
- Fix: Determine data minimization vs legacy parity and add restricted display if approved.

## G2-1-009-018  [P2] MISSING  facet F04  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/tpo/LearnerAcademicRecord.java:62-70`: importBatchId, importedAt, updatedAt.
- vNext now: `src/app/(authenticated)/learn/profile/academic-record/page.tsx:17-31`: no provenance timestamp or batch.
- Fix: Show imported/updated timestamps and restricted batch provenance in admin or learner record.

## G2-1-009-020  [P2] GAP  facet F04  effort S
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/tpo/LearnerAcademicRecord.java:27-33`: missing DB row returns learnerId and defaults, numeric null.
- vNext now: `src/app/(authenticated)/learn/profile/academic-record/page.tsx:25-27`: no active enrollment produces contextual message, does not distinguish missing score row.
- Fix: Distinguish missing placement evidence from missing academic enrollment.

## G2-1-009-036  [P2] GAP  facet F12  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/tpo/LearnerAcademicRecord.java:46-50`,`docs/legacy-source/backend/src/main/java/com/_42students/lms/model/tpo/LearnerAcademicRecord.java:58-60`: gapYears=0, isLateralEntry=false, source=SELF defaults.
- vNext now: `src/app/(authenticated)/learn/profile/academic-record/page.tsx:25-30`: no academic record if enrollment missing, no false verified status.
- Fix: Preserve zero/false/default distinctly from unknown; never mark unverified as verified.

## G2-1-009-038  [P2] GAP  facet F13  effort S
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/LearnerPlacementProfileService.java:29-33`: no record -> new LearnerAcademicRecord with null metrics and SELF.
- vNext now: `src/app/(authenticated)/learn/profile/academic-record/page.tsx:25-27`: missing active enrollment shows guidance but no empty score state.
- Fix: Add no-metrics-imported state independent of enrollment state.

## G2-1-009-047  [P2] GAP  facet F18  effort S
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/LearnerPlacementProfileService.java:13-18`: academic record explicitly distinguishes Verified vs Self-reported.
- vNext now: `src/app/(authenticated)/learn/profile/academic-record/page.tsx:28-30`: `not a transcript, grades disclosure, or proof` but no actual source words.
- Fix: Include exact verification/provenance copy without falsely promising transcript.
