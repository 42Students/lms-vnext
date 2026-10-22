# Verification packet (P1 round 2): 25 rows

For EACH row: open the vNext file(s) it cites, check that the Fix is really implemented (wording, validation, behaviour, permissions, empty/error states, wiring). If it is missing, partial or wrong, FIX it now in the file (keep valid syntax, no uninstalled packages). In your commit message list the row IDs as OK or FIXED. Rows without a vNext file describe a new feature: search the repo for it; if it does not exist, build it.

## G2-14-016-017 [P1] GAP facet F06
- Files: src/modules/placements/tpo-recruiter-grant-write-model.ts
- Legacy: Legacy extend defaults months=6 when missing `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/tpo/TpoRecruiterAccessController.java:87-102`
- Expected fix: Match default6 and support requested legacy 1..60 months where allowed

## G2-14-016-018 [P1] GAP facet F06
- Files: src/modules/placements/tpo-recruiter-grant-write-model.ts, src/modules/placements/recruiter-grant-expiry-policy.ts
- Legacy: Legacy extend accepts 0 months for no end date `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/tpo/TpoRecruiterAccessController.java:87-105`
- Expected fix: Decide whether indefinite grants intentionally prohibited and surface migration policy

## G2-14-016-030 [P1] GAP facet F10
- Files: src/modules/placements/recruiter-grant-expiry-policy.ts
- Legacy: Legacy checks ACTIVE, not deleted, and validUntil null or future `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/RecruiterCollegeAccess.java:80-85`
- Expected fix: Backfill valid expiry and verification, keep access fail-closed

## G2-14-016-039 [P1] GAP facet F12
- Files: src/modules/placements/recruiter-grant-expiry-policy.ts
- Legacy: Legacy ACTIVE plus null expiry grants indefinite access `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/RecruiterCollegeAccess.java:80-85`
- Expected fix: Define intentional forced-expiry policy and migrate open-ended grants

## G2-14-019-034 [P1] GAP facet F10
- Files: src/modules/placements/hr-interview-slot-service.ts, src/modules/placements/tpo-interview-slot-service.ts
- Legacy: Legacy validates no candidate overlap across applications `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/InterviewServiceImpl.java:306-310` `docs/legacy-source/backend/src/main/java/com/_42students/lms/repository/InterviewRepository.java:104-129`
- Expected fix: Enforce learner cross-drive overlap under lock before booking

## G2-14-020-010 [P1] GAP facet F04
- Files: src/modules/placements/tpo-company-memory-service.ts
- Legacy: Legacy internalNotes TEXT unbounded `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/CollegeCompany.java:35-36`
- Expected fix: Migrate old private notes to dedicated college-scoped memory record

## G2-15-014-034 [P1] GAP facet F10
- Files: src/modules/placements/round-service.ts
- Legacy: Round insertion locks drive row then max sequence. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/TpoDriveExtrasService.java:53-59`)
- Expected fix: Guard historical unique sequence even for canceled and audit references.

## G2-15-014-042 [P1] GAP facet F12
- Files: src/modules/placements/round-service.ts
- Legacy: Saving non-null schedule auto-sets status SCHEDULED. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/TpoDriveExtrasService.java:72-73`)
- Expected fix: Enable create+schedule equivalent and handle missing venue/link via guided validation.

## G2-15-014-060 [P1] GAP facet F20
- Files: src/modules/placements/round-service.ts
- Legacy: MAX(seq)+1 includes all rounds, even those pending removal before hard delete. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/TpoDriveExtrasService.java:53-59`)
- Expected fix: Prevent sequence reuse if histories link to cancelled round positions.

## G2-18-013-002 [P1] GAP facet F01
- Files: src/modules/placements/learner-jobs-browse-model.ts, src/app/api/placements/jobs/route.ts
- Legacy: Legacy controller routes /search,/popular,/organizations,/organization/{id},/department/{id},/program/{id},/job-type/{type},/categories,/category/{type},/stats and refresh; JobSearchController.java:121-407
- Expected fix: Create route-by-route compatibility sheet for permitted use cases; retire diagnostic organization catalog deliberately

## G2-18-013-011 [P1] GAP facet F05
- Files: src/modules/placements/learner-jobs-browse-model.ts
- Legacy: Legacy org-scoped search controller first takes 1000 org jobs, then filters substring query and caps limit default15; JobSearchController.java:169-203
- Expected fix: Avoid first-1000 truncation, preserve scoped search and accepted default limit semantics

## G2-15-002-042 [P1] MISSING facet F09
- Files: src/app/(authenticated)/admin/placements/student-lookup/page.tsx
- Legacy: Resume, Job Preferences, Skills are separate Collapse panels, multiple can open; initially collapsed (`ProfileSectionsPanel.js:481-504`).
- Expected fix: Implement three independent collapsibles collapsed by default.

## G2-15-005-038 [P1] MISSING facet F09
- Files: src/components/placements/learner-placement-jobs.tsx
- Legacy: Legacy resume Preview modal width860 iframe PDF and fallback DOC notice (JobDetailContent.jsx:1440-1465)
- Expected fix: Restore secure signed resume preview dialog and non-PDF fallback/download link

## G2-15-005-050 [P1] GAP facet F12
- Files: (none, new feature)
- Legacy: Legacy withdraw permitted only when applicationStatus `APPLIED` (JobDetailContent.jsx:1000-1010)
- Expected fix: Check round progression/withdraw window and enforce stage-specific canWithdraw from server

## G2-15-005-056 [P1] MISSING facet F14
- Files: src/components/placements/learner-placement-jobs.tsx
- Legacy: Legacy JD PDF/URL link, resume preview link; no direct resume upload per drive (JobDetailContent.jsx:1023-1042,1256-1269,1440-1465)
- Expected fix: Restore safe stored JD and signed resume preview links, no unapproved upload

## G2-15-005-059 [P1] GAP facet F16
- Files: src/components/placements/learner-placement-jobs.tsx
- Legacy: Legacy sticky right application rail and mobile fixed apply bar visible whenever !hasApplied (JobDetailContent.jsx:1320-1344)
- Expected fix: Restore sticky right rail at desktop and mobile fixed CTA respecting notch/safe area

## G2-15-008-024 [P1] GAP facet F06
- Files: (none, new feature)
- Legacy: Old class scope explicitly resolved from learner class, faculty assignment or selected admin class (syllabusDetail.js:143-149)
- Expected fix: Map legacy selected-class context to correct course delivery, especially admin cross-section preview

## G2-16-003-039 [P1] GAP facet F10
- Files: (none, new feature)
- Legacy: `BugTrackerService.js:68-85`; `PublicBugTrackerController.java:49-82`: GET public issue, attachments, activity in separate calls.
- Expected fix: Return equivalent safe detail and signed previews for reporter scope with independently retryable attachment fetch.

## G2-16-008-027 [P1] GAP facet F07
- Files: (none, new feature)
- Legacy: `syllabus.js:895-902`: lesson fetch failed Alert `Could not load course lessons` and Retry.
- Expected fix: Recover independently failed lesson list with original titled Alert and Retry.

## G2-16-023-005 [P1] GAP facet F02
- Files: src/modules/placements/learner-journey-service.ts
- Legacy: LearnerJourneyService.java:153-157 applications/schedule/offers in one response.
- Expected fix: Supply typed schedule+offers in journey response or document separate equivalent endpoints.

## G2-16-023-010 [P1] GAP facet F04
- Files: src/modules/placements/learner-journey-service.ts
- Legacy: LearnerPlacementService.java:45 schedule assigned dates/rooms.
- Expected fix: Join round assignments and expose schedule sorted by start.

## G2-16-023-012 [P1] GAP facet F04
- Files: src/modules/placements/learner-journey-service.ts
- Legacy: LearnerJourneyService.java:30-38 application fields logo/jobType/pay/location/deadline/assessment/cancel reason.
- Expected fix: Preserve detail metadata in journey DTO or accessible link, incl cancelled reason.

## G2-16-023-015 [P1] GAP facet F05
- Files: src/modules/placements/learner-journey-service.ts
- Legacy: LearnerJourneyService.java:47-50 rounds ordered jobId,seq,id.
- Expected fix: Render each round in sequence including unreached future stages.

## G2-16-023-034 [P1] GAP facet F12
- Files: src/modules/placements/learner-journey-service.ts
- Legacy: LearnerJourneyService.java:99-114 state CLEARED,NOT_CLEARED,ABSENT,WAITLISTED,TALK,NEXT,LATER.
- Expected fix: Build exact per-round state reducer respecting blocked/ended/live.

## G2-16-023-035 [P1] GAP facet F12
- Files: src/modules/placements/learner-journey-service.ts
- Legacy: LearnerJourneyService.java:147-150 withdrawal SELF until booked, then REQUEST.
- Expected fix: Compute withdrawal policy from booked round/current status and expose UI action.
