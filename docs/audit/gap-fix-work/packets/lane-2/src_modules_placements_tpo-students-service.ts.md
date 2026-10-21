# Work packet: edit src/modules/placements/tpo-students-service.ts

7 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-4/tpo-students-hub-controller.md, docs/audit/gap2/lane-5/u022-tpo-student-controller.md

## G2-4-022-002  [P1] GAP  facet F01  effort M
- Legacy: Legacy /table everyone=false lists only students participating in placements; everyone=true includes college students. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/tpo/TpoStudentsHubController.java:56-62`)
- vNext now: New page uses placement rosters and batch/filter query, unclear direct everyone=true equivalent. (`src/app/(authenticated)/tpo/students/page.tsx:55-82`; `src/modules/placements/tpo-students-service.ts:240-253`)
- Fix: Add/verify all-college roster selection for pickers and bulk enrollment.

## G2-4-022-065  [P1] GAP  facet F22  effort L
- Legacy: Legacy API uses integer learner/drive/course references, Maps and separate POST endpoints. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/tpo/TpoStudentsHubController.java:30-46`; `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/tpo/TpoStudentsHubController.java:56-62`)
- vNext now: New UUID memberships/jobs, strict Zod and separate domain tables/routes. (`src/modules/placements/tpo-students-service.ts:81-110`; `src/app/api/placements/tpo/students/academic-import/route.ts:16-25`)
- Fix: Create per-action legacy/new input/output and data FK mapping.

## G2-5-022-004  [P1] GAP  facet F03  effort L
- Legacy: Legacy summary id, first/last, uniqueId, rollNumber, department, class/program, mail/mobile,resume `docs/legacy-source/backend/src/main/java/com/_42students/lms/dto/tpo/StudentSummaryDTO.java:12-42`
- vNext now: VNext student source projects displayName,email,roll,registration,branch,program/cohort and readiness `src/modules/placements/tpo-students-service.ts:210-273`
- Fix: Map uniqueId, separate names, direct phone and resume access with policy.

## G2-5-022-006  [P1] GAP  facet F04  effort L
- Legacy: Legacy per learner academic GET/PUT entity decimals cgpa/percentage/gaps/year/entry/gender `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/tpo/LearnerAcademicRecord.java:15-75`
- vNext now: VNext evidence uses cgpaHundredths/pctBasisPoints, source and verifiedAt `src/modules/placements/tpo-students-service.ts:233-280`
- Fix: Map unit conversion/rounding and all source fields (including lateral/gender).

## G2-5-022-009  [P1] GAP  facet F04  effort L
- Legacy: Legacy StudentSummaryDTO sends `contactMobile` and resumeUrl `docs/legacy-source/backend/src/main/java/com/_42students/lms/dto/tpo/StudentSummaryDTO.java:22-41`
- vNext now: VNext roster deliberately omits direct phone/resume and masks private evidence `src/modules/placements/tpo-students-service.ts:240-275`
- Fix: Provide authorized need-to-know action/receipt rather than expose raw URL.

## G2-5-022-044  [P1] GAP  facet F19  effort L
- Legacy: Legacy list max5000, no pagination beyond first page `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/tpo/TpoStudentController.java:37-48`
- vNext now: VNext paged 25 max100, but initial query materializes all active learner rows `src/modules/placements/tpo-students-service.ts:47-114,140-280`
- Fix: Push filters/count/paging into SQL for 10k+ learners.

## G2-5-022-048  [P1] GAP  facet F22  effort L
- Legacy: Legacy academic record decimals and learnerId PK `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/tpo/LearnerAcademicRecord.java:15-78`
- vNext now: VNext placementCandidateAcademicEvidence UUID member, hundredths/basis points `src/modules/placements/tpo-students-service.ts:232-267`
- Fix: Map all academic fields with scale/rounding and verified metadata.
