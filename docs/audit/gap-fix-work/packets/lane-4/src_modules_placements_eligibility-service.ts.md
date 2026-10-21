# Work packet: edit src/modules/placements/eligibility-service.ts

17 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-11/l18-u023-learner-eligibility-controller.md, docs/audit/gap2/lane-15/job-eligibility-override.md, docs/audit/gap2/lane-16/u015-job-eligibility.md, docs/audit/gap2/lane-17/job-eligibility-override-repository.md, docs/audit/gap2/lane-20/job-service.md, docs/audit/gap2/lane-9/l18-u023-learner-eligibility-controller.md

## G2-18-023-029  [P1] GAP  facet F12  effort M
- Legacy: Legacy eligibility missing marks = `Not provided` and eligible absent verified-only requirement; EligibilityService.java:25-31
- vNext now: VNext MISSING status, missingEvidencePolicy REQUIRE_COMPLETE may block else eligible_with_missing; eligibility-service.ts:815-843,1280-1320
- Fix: Align default missing academic evidence semantic per policy and label `Not provided` rather than silently treating missing as failure.

## G2-18-023-045  [P1] GAP  facet F22  effort L
- Legacy: Legacy eligibility has JSON job criteria, learner academic record, override, batch rules and student calendar events; EligibilityService.java:52-115; LearnerEligibilityController.java:102-155
- vNext now: vNext placementJobEligibilityPolicies, candidateEvidence, Overrides, placementCollegeRules, learnerRounds; eligibility-service.ts:978-1320; learner-placement-rules-service.ts:34-47
- Fix: Write column-by-column crosswalk including effective batch policy and student talk/exam block tables.

## G2-15-015-021  [P1] GAP  facet F06  effort M
- Legacy: Any override supersedes ordinary scoring rules. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/EligibilityService.java:100-108`)
- vNext now: New override supersedes ordinary policy but not hard eligibility gates. (`src/modules/placements/eligibility-service.ts:1098-1111`)
- Fix: Document non-overridable cohort/verified-evidence restrictions to TPO before include.

## G2-15-015-023  [P1] GAP  facet F07  effort M
- Legacy: Override always takes precedence, including INCLUDE over missing academic evidence. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/EligibilityService.java:100-108`)
- vNext now: New cohort/verification hard denial occurs before override. (`src/modules/placements/eligibility-service.ts:1049-1095`)
- Fix: Show denial reason and distinguish hard policy constraints from overrideable grades.

## G2-15-015-039  [P1] GAP  facet F12  effort M
- Legacy: Old INCLUDE may override all eligibility rules. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/EligibilityService.java:100-108`)
- vNext now: New learner enrollment/target section/verification gates override prior. (`src/modules/placements/eligibility-service.ts:1034-1095`)
- Fix: Display explicit nonoverrideable gates and prevent TPO confusion.

## G2-15-015-054  [P1] GAP  facet F19  effort M
- Legacy: Bulk job override read in one query to prevent N+1. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/EligibilityService.java:111-129`)
- vNext now: New per-member evaluator loads one override per call. (`src/modules/placements/eligibility-service.ts:975-995`)
- Fix: Batch preload for Drive preview at college scale.

## G2-15-015-059  [P1] GAP  facet F20  effort M
- Legacy: Per-student INCLUDE/EXCLUDE enforced before default rules. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/EligibilityService.java:100-108`)
- vNext now: New hard gates first. (`src/modules/placements/eligibility-service.ts:1049-1095`)
- Fix: State precedence clearly in UI; record as intentional safety policy.

## G2-15-015-065  [P1] GAP  facet F23  effort M
- Legacy: Old all-criteria overrides always win. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/EligibilityService.java:100-108`)
- vNext now: New hard security/verified/section guards can override manual INCLUDE. (`src/modules/placements/eligibility-service.ts:1049-1095`)
- Fix: Document intentional stricter policy in owner-decision matrix.

## G2-16-015-002  [P1] GAP  facet F01  effort L
- Legacy: JobEligibility.java:10-12 targeting columns act as visibility gate separately from eligibility.
- vNext now: eligibility-service.ts:51-125 validates college-scoped allowed program/cohort/section.
- Fix: Preserve strict visibility vs application eligibility distinction and verify all four original target levels.

## G2-17-014-023  [P1] GAP  facet F10  effort L
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/EligibilityService.java:100-108 — Any override replaces all academic rules.
- vNext now: src/modules/placements/eligibility-service.ts:1035-1118 — Validates targeting and other scope gates before applying override.
- Fix: Preserve intended include/exclude precedence except documented hard security gates.

## G2-17-014-029  [P1] GAP  facet F12  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/EligibilityService.java:27-32 — Per-student include/exclude always wins eligibility criteria.
- vNext now: src/modules/placements/eligibility-service.ts:1071-1118 — Hard cohort/target rules before override.
- Fix: Document exact precedence exceptions to prevent unauthorized inclusion.

## G2-20-012-024  [P1] GAP  facet F12  effort M
- Legacy: Visibility ignores skills/GPA/degree/specialization `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/JobService.java:49-56`
- vNext now: Eligibility service includes candidateAcademicEvidence and placementJobEligibilityPolicies `src/modules/placements/eligibility-service.ts:9-22`
- Fix: Separate visibility from eligibility screening, do not silently hide low-score jobs

## G2-18-023-069  [P1] GAP  facet F22  effort L
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/EligibilityService.java:100-108,277-292 JobEligibility JSON and LearnerAcademicRecord/marks verification
- vNext now: src/modules/placements/eligibility-service.ts:975-1032 placementJobEligibilityPolicies, candidate evidence and enrollments
- Fix: Map PG/gender/CGPA conversion, original criteria, and override precedence to new normalized schema.

## G2-18-023-017  [P2] GAP  facet F07  effort M
- Legacy: Drive missing exact `Drive not found`, learner missing `Not found`; IllegalArgumentException maps 404 {error}; LearnerEligibilityController.java:63-65,157-160
- vNext now: vNext service uses AuthorizationError and PlacementsServiceError, server error UI; eligibility-service.ts:~205-270
- Fix: Map secure 404 for hidden/missing drive, 403 for role and recoverable profile-absent error without leaking IDs.

## G2-18-023-021  [P2] GAP  facet F08  effort S
- Legacy: Eligibility results include override reason and `Added by college`; EligibilityService.java:95-103
- vNext now: vNext override reason stored but checks become empty; eligibility-service.ts:1092-1120
- Fix: Render `Added by college` override chip with reason/eligible outcome, not an empty checklist.

## G2-15-015-025  [P2] GAP  facet F07  effort S
- Legacy: Removing absent override is no-op. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/TpoDriveExtrasService.java:392-395`)
- vNext now: New DELETE absent override throws NOT_FOUND. (`src/modules/placements/eligibility-service.ts:810-813`)
- Fix: Handle idempotent clear gracefully and align feedback.

## G2-17-014-019  [P2] GAP  facet F08  effort S
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/tpo/TpoWorkspaceController.java:213-217 — Audit logs `ELIGIBILITY_{type}`, includes learner and reason.
- vNext now: src/modules/placements/eligibility-service.ts:682-696 — Event summary `Drive eligibility override saved`.
- Fix: Map legacy event labels/metadata in audit view.
