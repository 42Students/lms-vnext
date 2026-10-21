# Work packet (wave 2): edit src/app/(authenticated)/hr/home/page.tsx (part 1 of 2)

40 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-10/recruiter-self-controller.md, docs/audit/gap2/lane-13/recruiter-home.md, docs/audit/gap2/lane-2/l14-u025-recruiter-drive.md

## G2-10-025-002  [P2] GAP  facet F01  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/RecruiterSelfController.java:131-166 — GET /me supports global chooser and scoped session.
- vNext now: src/app/(authenticated)/hr/profile/page.tsx:13-17; src/app/(authenticated)/hr/home/page.tsx:42-73 — Profile and Today perform direct scoped reads.
- Fix: Expose one canonical self/session payload for chooser and profile

## G2-10-025-009  [P2] MISSING  facet F03  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/RecruiterSelfController.java:149-154 — College item includes logoUrl and membershipKey.
- vNext now: src/app/(authenticated)/hr/home/page.tsx:61-69 — Grant chooser card includes collegeName/code/date, no logo/member key.
- Fix: Add college avatar/logo and session access indicator

## G2-10-025-012  [P2] MISSING  facet F03  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/RecruiterSelfController.java:196-200 — College item has studentsTotal and branches list.
- vNext now: src/app/(authenticated)/hr/home/page.tsx:60-72; src/modules/placements/recruiter-college-branch-service.ts:9-19 — College chooser lacks totals and branch chips.
- Fix: Add student count/branches to rich recruiter Colleges page

## G2-10-025-013  [P2] MISSING  facet F03  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/RecruiterSelfController.java:203-205 — College item includes drivesWithYou count.
- vNext now: src/app/(authenticated)/hr/home/page.tsx:60-72 — Chooser lacks drive count.
- Fix: Include per-college recruiter drive count

## G2-10-025-016  [P2] GAP  facet F04  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/RecruiterSelfController.java:148-154 — Colleges numeric collegeId, code, logo, validUntil, membershipKey.
- vNext now: src/modules/placements/recruiter-profile-service.ts:65-67; src/app/(authenticated)/hr/home/page.tsx:58-69 — UUID grant IDs and code but logo/membership key missing.
- Fix: Define ID/key translation and logo inclusion

## G2-10-025-017  [P2] GAP  facet F04  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/RecruiterSelfController.java:193-200 — studentsTotal excludes deleted/suspended; branches distinct alphabetical.
- vNext now: src/modules/placements/recruiter-college-branch-service.ts:15-18; src/app/(authenticated)/hr/home/page.tsx:60-72 — Departments branch suggestions capped 200, not learner-derived.
- Fix: Reproduce learner-filtered branches and student count

## G2-10-025-018  [P2] GAP  facet F04  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/RecruiterSelfController.java:203-205 — drivesWithYou counts nondeleted jobs by recruiterId and college.
- vNext now: src/app/(authenticated)/hr/home/page.tsx:79-95 — Jobs loaded by ownership/context, count in Today model not chooser.
- Fix: Show exact nonarchived drive count

## G2-10-025-019  [P2] MISSING  facet F04  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/RecruiterSelfController.java:207-220 — TPO contact faculty firstName+lastName/contactMail, fallback faculty_type14.
- vNext now: src/app/(authenticated)/hr/home/page.tsx:58-72 — Does not display TPO contact.
- Fix: Find equivalent current TPO team membership/email contact

## G2-10-025-041  [P2] GAP  facet F09  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/RecruiterSelfController.java:131-166 — API college chooser response supports global session switcher.
- vNext now: src/app/(authenticated)/hr/home/page.tsx:53-73 — Chooser card list with Open recruiter Today.
- Fix: Add logo/access validity and equivalent global chooser

## G2-10-025-058  [P2] MISSING  facet F12  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/RecruiterSelfController.java:193-196 — Learner total excludes is_deleted and suspended.
- vNext now: src/app/(authenticated)/hr/home/page.tsx:60-72 — No learner total calculation.
- Fix: Compute active learner count with current membership semantics

## G2-10-025-059  [P2] GAP  facet F12  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/RecruiterSelfController.java:203-205 — Drive count excludes deleted, not only published.
- vNext now: src/app/(authenticated)/hr/home/page.tsx:79-95 — Today live drive count filters job status.
- Fix: Separate all owned nonarchived and live drive totals

## G2-10-025-060  [P2] MISSING  facet F12  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/RecruiterSelfController.java:207-215 — TPO contact first role TPO_ADMIN sorted name then faculty_type14 fallback.
- vNext now: src/app/(authenticated)/hr/home/page.tsx:60-72 — No contact resolution.
- Fix: Use current TPO role lookup with deterministic fallback

## G2-10-025-068  [P2] MISSING  facet F14  effort S
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/RecruiterSelfController.java:148-154 — College logoUrl is view-only, sourced from branding service.
- vNext now: src/app/(authenticated)/hr/home/page.tsx:60-72 — No logo field presented in chooser.
- Fix: Display existing signed/proxy logo without new upload

## G2-10-025-075  [P2] GAP  facet F16  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/RecruiterSelfController.java:175-224 — College cards should carry long names, multi-branch lists, logos.
- vNext now: src/app/(authenticated)/hr/home/page.tsx:58-73 — Simple list cards with wrapped college name.
- Fix: Extend card layout with stacked details on mobile

## G2-10-025-078  [P2] GAP  facet F17  effort S
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/RecruiterSelfController.java:175-224 — College list includes human TPO contact and code.
- vNext now: src/app/(authenticated)/hr/home/page.tsx:60-73 — Chooser accessible links with college title, no contact.
- Fix: Expose contact under readable heading

## G2-10-025-086  [P2] GAP  facet F19  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/RecruiterSelfController.java:102-107 — Home delegates to dashboardService per-college composed views.
- vNext now: src/app/(authenticated)/hr/home/page.tsx:79-118 — Multiple parallel/subsequent services and job cap500.
- Fix: Add explicit partial-data warning when 500 cap reached

## G2-10-025-087  [P2] GAP  facet F19  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/RecruiterSelfController.java:175-224 — Colleges summary computed for only one selected college.
- vNext now: src/app/(authenticated)/hr/home/page.tsx:60-72 — All chooser grant cards but less data.
- Fix: Bound rich summaries per authorized grant

## G2-10-025-092  [P2] GAP  facet F21  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/RecruiterSelfController.java:46-48,151-152 — CollegeLogoService supplies college avatar fallback.
- vNext now: src/app/(authenticated)/hr/home/page.tsx:60-72 — No image accessor.
- Fix: Connect branding read endpoint/proxy for logos

## G2-10-025-097  [P2] GAP  facet F22  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/RecruiterSelfController.java:193-215 — Learner/job/faculty tables used for colleges summary.
- vNext now: src/modules/placements/recruiter-college-branch-service.ts:15-18; src/app/(authenticated)/hr/home/page.tsx:60-72 — New departments and placement jobs/roles require joins.
- Fix: Rebuild counts/contacts with new memberships and placements tables

## G2-13-002-004  [P2] GAP  facet F02  effort M
- Legacy: Desktop layout is Needs you, This week, Live drive in two-column grid (`docs/legacy-source/frontend/src/components/recruiter/RecruiterToday.jsx:123-224`)
- vNext now: New vertical succession Next up, Quick numbers, This week, Live drives, accordions (`src/app/(authenticated)/hr/home/page.tsx:154-330`)
- Fix: Clone shared section placement at desktop width; document extra panels separately.

## G2-13-002-005  [P2] GAP  facet F02  effort M
- Legacy: Actionable tasks appear as standalone compact cards (`docs/legacy-source/frontend/src/components/recruiter/RecruiterToday.jsx:142-152`)
- vNext now: Next up is one divided list of anchor rows (`src/app/(authenticated)/hr/home/page.tsx:154-174`)
- Fix: Match card/row shape, spacing, urgency dot, CTA placement.

## G2-13-002-006  [P2] GAP  facet F02  effort M
- Legacy: Waiting tasks immediately follow actionable queue (`docs/legacy-source/frontend/src/components/recruiter/RecruiterToday.jsx:156-168`)
- vNext now: With the placement cell disclosures appear near bottom (`src/app/(authenticated)/hr/home/page.tsx:293-325`)
- Fix: Place waiting block below Needs you to retain old information hierarchy.

## G2-13-002-007  [P2] GAP  facet F02  effort M
- Legacy: Single busiest Live drive card below left column (`docs/legacy-source/frontend/src/components/recruiter/RecruiterToday.jsx:194-223`)
- vNext now: Up to three live drives appear in separate lower section (`src/app/(authenticated)/hr/home/page.tsx:218-241`)
- Fix: Make busiest drive primary and new previews optional.

## G2-13-002-016  [P2] GAP  facet F04  effort S
- Legacy: Task timestamp formats `ddd D MMM, h:mm A` with exact label (`docs/legacy-source/frontend/src/components/recruiter/RecruiterToday.jsx:147-149`)
- vNext now: New formats `en-IN` IST and conditional Due/Recorded for (`src/app/(authenticated)/hr/home/page.tsx:167-169`)
- Fix: Match exact task-time phrase and date pattern.

## G2-13-002-017  [P2] GAP  facet F04  effort S
- Legacy: Moment calendar prints Today/Tomorrow/weekday for events (`docs/legacy-source/frontend/src/components/recruiter/RecruiterToday.jsx:188-190`)
- vNext now: New weekday+month+day+time with optional Today label (`src/app/(authenticated)/hr/home/page.tsx:208-213`)
- Fix: Restore relative-day copy and retain full datetime for screen reader.

## G2-13-002-028  [P2] GAP  facet F06  effort M
- Legacy: Old first-drive conditional checks full own drive history (`docs/legacy-source/frontend/src/components/recruiter/RecruiterToday.jsx:60-71`)
- vNext now: New first-drive condition checks collegeJobs and requestCount (`src/app/(authenticated)/hr/home/page.tsx:113-115`)
- Fix: Include archived/previous requests in first-drive detection or explain omission.

## G2-13-002-037  [P2] GAP  facet F10  effort M
- Legacy: Account GET `/api/v1/recruiter/me` (`docs/legacy-source/frontend/src/api/Services/RecruiterService.js:5-6`)
- vNext now: Server uses getCurrentRequestContext and recruiter profile/grants (`src/app/(authenticated)/hr/home/page.tsx:42-55`)
- Fix: Map errors/scope from old response to new server state.

## G2-13-002-039  [P2] GAP  facet F10  effort M
- Legacy: Secondary drives GET determines zero history, preserving last count on failure (`docs/legacy-source/frontend/src/components/recruiter/RecruiterToday.jsx:60-71`)
- vNext now: New job/request count derived fresh server-side (`src/app/(authenticated)/hr/home/page.tsx:91-115`)
- Fix: Add unknown/partial state for failed count source.

## G2-13-002-041  [P2] GAP  facet F11  effort M
- Legacy: Legacy controller checks college grant before Today data (`docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/RecruiterDriveController.java:49-55`)
- vNext now: New checks active recruiter and selected granted college, invalid 404 (`src/app/(authenticated)/hr/home/page.tsx:42-53`)
- Fix: Preserve authorization denial semantics and recovery copy.

## G2-13-002-044  [P2] GAP  facet F11  effort S
- Legacy: Legacy session without college displays placement-address help (`docs/legacy-source/frontend/src/components/recruiter/NoCollegeSession.jsx:7-11`)
- vNext now: New multi-grant choice or zero access EmptyState (`src/app/(authenticated)/hr/home/page.tsx:53-73`)
- Fix: Keep no-college explanation for truly domainless accounts.

## G2-13-002-050  [P2] GAP  facet F12  effort M
- Legacy: Old results/selections with placement cell have null action (`docs/legacy-source/backend/src/main/java/com/_42students/lms/service/recruiter/RecruiterTodayService.java:158-170`)
- vNext now: New waitingRequests and conversation-last-sent are separate and no old selected-offer tally (`src/app/(authenticated)/hr/home/page.tsx:293-319`)
- Fix: Show matching recorded pending selections/result verification.

## G2-13-002-053  [P2] GAP  facet F13  effort M
- Legacy: Old stale-while-refresh preserves prior state and shows status (`docs/legacy-source/frontend/src/components/recruiter/RecruiterToday.jsx:119-121`)
- vNext now: New partial failures use empty calendar/conversation fallback (`src/app/(authenticated)/hr/home/page.tsx:81-101`)
- Fix: Distinguish unavailable data from zero results.

## G2-13-002-054  [P2] GAP  facet F13  effort S
- Legacy: Legacy week empty says next 7 days (`docs/legacy-source/frontend/src/components/recruiter/RecruiterToday.jsx:173-174`)
- vNext now: New week empty says next eight days (`src/app/(authenticated)/hr/home/page.tsx:205-216`)
- Fix: Make date window and copy agree.

## G2-13-002-058  [P2] GAP  facet F16  effort M
- Legacy: Legacy two-column grid with one right-hand week card (`docs/legacy-source/frontend/src/components/recruiter/RecruiterToday.jsx:123-193`)
- vNext now: New stacked border-divided sections (`src/app/(authenticated)/hr/home/page.tsx:154-217`)
- Fix: Restore old desktop placement and proper phone/768px stacking.

## G2-13-002-059  [P2] GAP  facet F16  effort M
- Legacy: Legacy week labels fit compact aside, eight items (`docs/legacy-source/frontend/src/components/recruiter/RecruiterToday.jsx:171-193`)
- vNext now: New full-width week rows with extra time/kind lines (`src/app/(authenticated)/hr/home/page.tsx:200-216`)
- Fix: Compare wrapping, touch widths, and density at 375/768/1280.

## G2-13-002-065  [P2] GAP  facet F18  effort S
- Legacy: Old section title Needs you (`docs/legacy-source/frontend/src/components/recruiter/RecruiterToday.jsx:123-125`)
- vNext now: New section title Next up (`src/app/(authenticated)/hr/home/page.tsx:154-155`)
- Fix: Restore old title.

## G2-13-002-066  [P2] GAP  facet F18  effort S
- Legacy: Old panel title Live drive singular (`docs/legacy-source/frontend/src/components/recruiter/RecruiterToday.jsx:195-198`)
- vNext now: New Live hiring drives plural (`src/app/(authenticated)/hr/home/page.tsx:218-220`)
- Fix: Keep singular primary metric or justify section rename.

## G2-13-002-068  [P2] GAP  facet F19  effort L
- Legacy: Old component loads Today and drives in 2 API calls plus me (`docs/legacy-source/frontend/src/components/recruiter/RecruiterToday.jsx:48-72`)
- vNext now: New server page invokes many services, partially parallel (`src/app/(authenticated)/hr/home/page.tsx:79-118`)
- Fix: Benchmark DB and selectivity; lazy-load below-fold info.

## G2-13-002-073  [P2] GAP  facet F20  effort M
- Legacy: Old backend converts UTC wall-clock to ISO and browser uses locale (`docs/legacy-source/backend/src/main/java/com/_42students/lms/service/recruiter/RecruiterTodayService.java:45-53`)
- vNext now: New forces IST in Intl.DateTimeFormat (`src/app/(authenticated)/hr/home/page.tsx:40-40`)
- Fix: Test timezone roundtrips and explicit IST requirement.

## G2-14-025-002  [P2] GAP  facet F01  effort M
- Legacy: RecruiterDriveController.java:49-71 Today and calendar GET
- vNext now: src/modules/placements/recruiter-calendar-service.ts:41-95 date-only calendar query; src/app/(authenticated)/hr/home/page.tsx:1-25
- Fix: Map Today/calendar read endpoints, 30-day default and date formats.
