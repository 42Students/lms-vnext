# Work packet: edit src/app/(authenticated)/hr/home/page.tsx

19 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-10/recruiter-self-controller.md, docs/audit/gap2/lane-13/recruiter-home.md, docs/audit/gap2/lane-9/recruiter-colleges-index.md

## G2-10-025-004  [P1] GAP  facet F01  effort L
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/RecruiterSelfController.java:102-107 — GET /home dashboard across accessible colleges inside selected session.
- vNext now: src/app/(authenticated)/hr/home/page.tsx:42-75 — Today chooses single grant or shows college selection, not unified aggregate.
- Fix: Offer old cross-college Home metrics while preserving tenancy

## G2-10-025-006  [P1] MISSING  facet F02  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/RecruiterSelfController.java:175-224 — /colleges returns college summary + placement contact/branches.
- vNext now: src/app/(authenticated)/hr/colleges/page.tsx:3-5; src/app/(authenticated)/hr/home/page.tsx:58-72 — Chooser shows name/code/grant, lacks dedicated rich section.
- Fix: Restore Colleges view sections

## G2-10-025-011  [P1] MISSING  facet F03  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/RecruiterSelfController.java:207-220 — College item has TPO contact name and email.
- vNext now: src/app/(authenticated)/hr/home/page.tsx:60-72 — College chooser lacks TPO contact.
- Fix: Render authorized TPO contact or contact missing state

## G2-10-025-047  [P1] GAP  facet F10  effort L
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/RecruiterSelfController.java:102-107 — GET /api/v1/recruiter/home cross-college totals.
- vNext now: src/app/(authenticated)/hr/home/page.tsx:79-118 — Multiple services compose Today per selected college.
- Fix: Build permitted cross-college aggregation

## G2-13-002-002  [P1] GAP  facet F01  effort M
- Legacy: Recruiter works at one college placement address per session (`docs/legacy-source/frontend/src/pages/recruiter/home.js:14-18`)
- vNext now: New app accepts `?collegeId` and can show multiple college grants (`src/app/(authenticated)/hr/home/page.tsx:39-74`)
- Fix: Decide tenant-domain vs multi-grant access contract and test all redirects.

## G2-13-002-012  [P1] GAP  facet F03  effort M
- Legacy: Live card displays name, applied, closes/no deadline, list not shared notice (`docs/legacy-source/frontend/src/components/recruiter/RecruiterToday.jsx:195-220`)
- vNext now: New rows show shared applicant counts and deadline (`src/app/(authenticated)/hr/home/page.tsx:225-241`)
- Fix: Explicitly reconcile totals vs shared-only counts, including no-shared state.

## G2-13-002-031  [P1] GAP  facet F07  effort M
- Legacy: 403 message access-ended uses placement-cell guidance (`docs/legacy-source/frontend/src/components/recruiter/recruiterRoutes.js:18-20`)
- vNext now: New no grant/invalid college redirects, 404 or chooser (`src/app/(authenticated)/hr/home/page.tsx:42-61`)
- Fix: Display explicit access-ended copy where safe and actionable.

## G2-13-002-038  [P1] GAP  facet F10  effort L
- Legacy: Today GET `/api/v1/recruiter/colleges/{collegeId}/today` (`docs/legacy-source/frontend/src/api/Services/RecruiterService.js:73-75`)
- vNext now: Page composes jobs/calendar/notifications/conversations/request/round/offer services (`src/app/(authenticated)/hr/home/page.tsx:79-118`)
- Fix: Build per-task output contract tests from legacy controller and SQL.

## G2-13-002-042  [P1] GAP  facet F11  effort L
- Legacy: Legacy SQL filters recruiter_id, college_id and non-deleted jobs (`docs/legacy-source/backend/src/main/java/com/_42students/lms/service/recruiter/RecruiterTodayService.java:35-40`)
- vNext now: New own jobs filtered by tenant/relationship and non-archived (`src/app/(authenticated)/hr/home/page.tsx:79-95`)
- Fix: Test imported jobs with deleted/archived/relationship migration states.

## G2-13-002-056  [P1] GAP  facet F15  effort M
- Legacy: Old unread task sums per-thread unread counts (`docs/legacy-source/backend/src/main/java/com/_42students/lms/service/recruiter/RecruiterTodayService.java:173-176`)
- vNext now: New polls notifications and inbox conversation signals separately (`src/app/(authenticated)/hr/home/page.tsx:81-110`)
- Fix: Verify double counting and scope for unread tasks.

## G2-13-002-070  [P1] GAP  facet F19  effort M
- Legacy: Old Today backend has no 500 jobs truncation flag (`docs/legacy-source/backend/src/main/java/com/_42students/lms/service/recruiter/RecruiterTodayService.java:83-186`)
- vNext now: New limits recent jobs to 500 with warning (`src/app/(authenticated)/hr/home/page.tsx:79-80`)
- Fix: Make complete task counts available beyond preview cap.

## G2-13-002-074  [P1] GAP  facet F20  effort M
- Legacy: Old needsYou counts only tasks with actionable label (`docs/legacy-source/backend/src/main/java/com/_42students/lms/service/recruiter/RecruiterTodayService.java:178-183`)
- vNext now: New count from synthesized queue may include generic reviews (`src/app/(authenticated)/hr/home/page.tsx:108-118`)
- Fix: Only count persisted verified work, never speculative tasks.

## G2-13-002-075  [P1] GAP  facet F21  effort L
- Legacy: Legacy Depends on TpoMessagesService and optional TpoSettingsHub direct visibility (`docs/legacy-source/backend/src/main/java/com/_42students/lms/service/recruiter/RecruiterTodayService.java:29-34`)
- vNext now: New builds from notifications/conversations and shared shortlist queries (`src/app/(authenticated)/hr/home/page.tsx:81-110`)
- Fix: Map direct-applicant setting to grant/shortlist policy; document deliberate removal.

## G2-13-002-077  [P1] GAP  facet F22  effort L
- Legacy: Old task SQL reads job, change requests, rounds, results, offers, share links and tpo audit log (`docs/legacy-source/backend/src/main/java/com/_42students/lms/service/recruiter/RecruiterTodayService.java:87-176`)
- vNext now: New uses placement modules, recruiter requests, rounds, inbox and offers (`src/app/(authenticated)/hr/home/page.tsx:79-118`)
- Fix: Create column/status/index crosswalk for every signal and migration.

## G2-13-002-029  [P2] GAP  facet F07  effort M
- Legacy: Failed account fetch shows `We couldn't load your account` (`docs/legacy-source/frontend/src/pages/recruiter/home.js:59-68`)
- vNext now: No recruiter `/me` fetch; request context route may redirect/error (`src/app/(authenticated)/hr/home/page.tsx:42-53`)
- Fix: Distinguish account retrieval failure from unauthorized access; provide Retry.

## G2-13-002-030  [P2] GAP  facet F07  effort M
- Legacy: Failed Today GET fallback `We could not load what needs you today.` (`docs/legacy-source/frontend/src/components/recruiter/RecruiterToday.jsx:48-59`)
- vNext now: Some server dependencies fail hard, others show partial alert (`src/app/(authenticated)/hr/home/page.tsx:79-106`)
- Fix: Separate primary data failure, optional dependency and access-ended errors.

## G2-13-002-032  [P2] GAP  facet F08  effort M
- Legacy: Stale response refresh failure shows closable explicit alert (`docs/legacy-source/frontend/src/components/recruiter/RecruiterToday.jsx:119-121`)
- vNext now: Server partial banner but no previous data retention (`src/app/(authenticated)/hr/home/page.tsx:144-153`)
- Fix: Keep last successfully verified values across soft refresh if feasible.

## G2-13-002-033  [P2] GAP  facet F08  effort S
- Legacy: Auxiliary drive lookup warning cites unverifiable history (`docs/legacy-source/frontend/src/components/recruiter/RecruiterToday.jsx:60-71`)
- vNext now: New partial warning cites calendar/notifications/inbox (`src/app/(authenticated)/hr/home/page.tsx:89-101`)
- Fix: Identify exact failed dependency; never silently convert unknown to empty.

## G2-9-021-015  [P2] GAP  facet F07  effort M
- Legacy: Legacy Home fetch error says We couldn't load your account + Retry `docs/legacy-source/frontend/src/pages/recruiter/home.js:56-69`
- vNext now: HR home invalid college selection says Invalid college selection and Choose again `src/app/(authenticated)/hr/home/page.tsx:44-50`
- Fix: Keep distinct load failure vs invalid-selection errors with equivalent recovery.
