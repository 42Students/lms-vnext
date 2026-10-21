# Work packet: edit src/modules/placements/college-placement-student-lookup-service.ts

12 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-15/u002-student-placement-lookup.md

## G2-15-002-018  [P1] MISSING  facet F04  effort M
- Legacy: Shows rejection reason inline when nonempty (`StudentPlacementLookup.js:197-201`; `LearnerApplicationWithInterviewsDTO.java:40-54`).
- vNext now: Service selects only `applicationStatus`, offers/joining; no rejection reason (`college-placement-student-lookup-service.ts:47-53`).
- Fix: Expose authorized rejection reason from application history and place after date/interview.

## G2-15-002-025  [P1] GAP  facet F05  effort M
- Legacy: List all application records returned for selected student; no per-student truncation hint (`StudentPlacementLookup.js:97-104,180-207`; `AdminJobServiceImpl.java:1889-1899`).
- vNext now: Truncates after 100 application-offer records and shows `Showing newest 100...` (`college-placement-student-lookup-service.ts:65-70`; `admin/placements/student-lookup/page.tsx:74`).
- Fix: Offer paginated load-more/full-history access for students beyond 100 records, deduplicate multi-offer rows.

## G2-15-002-046  [P1] GAP  facet F10  effort L
- Legacy: Selection `GET /api/v1/admin/jobs/students/{id}/placement-summary?collegeId`, success-envelope checked (`AdminService.js:701-702`; `StudentPlacementLookup.js:88-109`).
- vNext now: All matching students' history loaded eagerly via Drizzle in single page render (`college-placement-student-lookup-service.ts:46-72`; `admin/placements/student-lookup/page.tsx:22-26`).
- Fix: Add authorized selected-learner detail service/action keyed by membership, with own pending/error path.

## G2-15-002-047  [P1] MISSING  facet F10  effort M
- Legacy: Profile GETs: job-preferences, resume, skills (`ProfileService.js:104-115,144-154`; `LearnerProfileController.java:844-903,1177-1235`).
- vNext now: No profile reads (service selects roll/name/email and applications only) (`college-placement-student-lookup-service.ts:14-20,46-70`).
- Fix: Read scoped profileDocument resume/skills/preferences and expose only necessary permitted fields.

## G2-15-002-055  [P1] GAP  facet F12  effort L
- Legacy: Every application stage from legacy job application status; next upcoming interview attached (`LearnerApplicationWithInterviewsDTO.java:21-28,40-54`; `StudentPlacementLookup.js:184-201`).
- vNext now: Applications status only + separately offer/joining status; no interview (`college-placement-student-lookup-service.ts:46-70`).
- Fix: Create canonical status transition/next-interview projection with per-application stage.

## G2-15-002-057  [P1] GAP  facet F12  effort M
- Legacy: All applications under a student; list source `jobService.getLearnerApplicationsWithInterviews` (`AdminJobServiceImpl.java:1889-1899`).
- vNext now: One entry per left-joined offer and outcome; potentially multiple records per application (`college-placement-student-lookup-service.ts:47-67`).
- Fix: Group offer rows by application ID before display; show latest relevant offer and joining separately.

## G2-15-002-071  [P1] GAP  facet F19  effort L
- Legacy: Legacy search uses in-memory learner cache with search limit10; selected summary single jobService fetch (`LearnerSearchController.java:95-103,129-137`; `AdminJobServiceImpl.java:1889-1899`).
- vNext now: DB queries 15 learners and in parallel up to100 application+offers each; separate all-students JOIN query (`college-placement-student-lookup-service.ts:21-72`).
- Fix: Avoid N+1 work: first fetch 10 suggestions then one selected learner summary; add bounded indexed pagination.

## G2-15-002-079  [P1] GAP  facet F22  effort L
- Legacy: Legacy learner search IDs integer learnerId and job application IDs; application-view stage, rejectionReason, nextInterview DTO (`StudentPlacementLookup.js:88-103,184-200`; `LearnerApplicationWithInterviewsDTO.java:21-28,40-54,145-193`).
- vNext now: UUID membershipId/placementApplications/job/offer; status and submittedAt in persisted application; no rejectionReason projection (`college-placement-student-lookup-service.ts:14-20,46-70`; `placements.ts:973-1018`).
- Fix: Define one-to-one legacy learner/application stage mapping, reason/interview joins and stable identity policy.

## G2-15-002-080  [P1] GAP  facet F22  effort L
- Legacy: Resume, skills, job preferences obtained as separate learner profile sections (`ProfileSectionsPanel.js:35-51,475-505`; `ProfileService.js:104-115,144-154`).
- vNext now: learnerProfiles has JSONB profileDocument, but lookup only reads roll number (`profiles.ts:15-31`; `college-placement-student-lookup-service.ts:14-20`).
- Fix: Specify typed JSONB section schema and mapping/validation, read and write audit/version behavior.

## G2-15-002-081  [P1] GAP  facet F22  effort M
- Legacy: Legacy summary rows conceptually one per placement application, with next interview DTO (`AdminJobServiceImpl.java:1889-1899`; `LearnerApplicationWithInterviewsDTO.java:21-28`).
- vNext now: Left joins placementOffers and placementJoiningOutcomes can multiply rows per application (`college-placement-student-lookup-service.ts:47-67`); app uniqueness by role+membership (`placements.ts:1026-1042`).
- Fix: Aggregate offers per application deterministically and avoid misleading duplicate history entries.

## G2-15-002-082  [P1] GAP  facet F22  effort M
- Legacy: Legacy status enum set includes APPLIED, SHORTLISTED, ASSESSMENT, INTERVIEW, WAITLISTED, OFFERED, HIRED, REJECTED, WITHDRAWN (`StudentPlacementLookup.js:13-23`).
- vNext now: placementApplications status defaults `SUBMITTED`, separately offer/joining statuses (`placements.ts:993-1009`; `college-placement-student-lookup-service.ts:47-53`).
- Fix: Implement stage crosswalk and time/event source of truth without conflating application, offer and joining.

## G2-15-002-036  [P2] GAP  facet F07  effort M
- Legacy: API not-found `Student not found` / `Student does not belong to the specified college`, invalid collegeId positive integer (`AdminJobServiceImpl.java:1889-1895`; `AdminJobController.java:997-1015`).
- vNext now: Name search returns empty set, missing college shows selection empty state (`college-placement-student-lookup-service.ts:21-27`; `admin/placements/student-lookup/page.tsx:50-54`).
- Fix: For direct selected ID, preserve explicit unauthorized vs not-found distinction without leaking cross-college identity.
