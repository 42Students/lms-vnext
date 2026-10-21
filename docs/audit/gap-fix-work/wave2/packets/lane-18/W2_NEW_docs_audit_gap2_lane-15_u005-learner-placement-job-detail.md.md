# Work packet (wave 2): NEW / MISSING items from docs/audit/gap2/lane-15/u005-learner-placement-job-detail.md

28 findings. No vNext file yet: create the needed files, modules or routes inside the feature area of this lane.
Audit documents with full context: docs/audit/gap2/lane-15/u005-learner-placement-job-detail.md

## G2-15-005-001  [P2] GAP  facet F01  effort M
- Legacy: Legacy route uses PlacementsTabsLayout and page `VerifiedJobDetailContent` (learn/my-placements/jobs/[jobId].js:1-10)
- vNext now: Current route directly renders placement detail in space-y-5, no explicit tab shell (learn/my-placements/jobs/[jobId]/page.tsx:60-85)
- Fix: Render same My Placements PageShell tab strip with Jobs active and slide navigation

## G2-15-005-002  [P2] GAP  facet F01  effort S
- Legacy: Legacy `returnTo` URL only within `/learn/my-placements/jobs` (VerifiedJobDetailContent.jsx:23-31)
- vNext now: Current page accepts `back` parameter normalized via learnerJobReturnToDrivesHref (learn/my-placements/jobs/[jobId]/page.tsx:63-76)
- Fix: Preserve allowlisted `returnTo` bookmarks and convert to new `back` semantics safely

## G2-15-005-004  [P2] GAP  facet F02  effort M
- Legacy: PlacementsTabsLayout PageShell `My Placements` top tabs and swipe navigation (PlacementsTabsLayout.js:18-25,64-109)
- vNext now: Detail PageHeader title company and breadcrumbs, outside explicit legacy PageShell in file (learner-placement-job-detail.tsx:44-71)
- Fix: Restore PageShell top strip/spacings while retaining within-page header

## G2-15-005-006  [P2] GAP  facet F02  effort L
- Legacy: Legacy role detail hero then eligibility, journey, About, Requirements, Key dates (JobDetailContent.jsx:1098-1318)
- vNext now: VNext Availability, Requirements, About+Eligibility, Pay, Roles and Journey after detail (learner-placement-job-detail.tsx:102-300; jobs/[jobId]/page.tsx:82-85)
- Fix: Restore legacy content hierarchy and align journey after eligibility, before About

## G2-15-005-007  [P2] MISSING  facet F03  effort M
- Legacy: Legacy logo avatar 56px adjacent job title/organization and location (JobDetailContent.jsx:1100-1115)
- vNext now: VNext PageHeader job title/company but no company logo/avatar in detail (learner-placement-job-detail.tsx:52-71)
- Fix: Display authorized logo image or fallback avatar at legacy 56px

## G2-15-005-008  [P2] GAP  facet F03  effort S
- Legacy: Legacy saved job HeartFilled/HeartOutlined icon top-right with tooltip and aria-pressed (JobDetailContent.jsx:1121-1130)
- vNext now: VNext full `LearnerSaveDriveButton` under facts in action row (learner-placement-job-detail.tsx:89-93)
- Fix: Restore heart action position, pressed state and icon/tooltip without removing save functionality

## G2-15-005-009  [P2] GAP  facet F03  effort M
- Legacy: Legacy facts summary icons and deadline urgency chips (`Closes today`, `1 day left`, `N days left`) (JobDetailContent.jsx:44-57,1134-1215)
- vNext now: VNext facts labels text only and static deadline label, role cards use urgency model (learner-placement-job-detail.tsx:72-88)
- Fix: Place deadline urgency tone/icon/relative copy in top facts on detail, avoid relying on role list

## G2-15-005-010  [P2] GAP  facet F03  effort S
- Legacy: Legacy pay summary shows only one Pay or Compensation fact not duplicates (JobDetailContent.jsx:1161-1197)
- vNext now: VNext simultaneously Compensation, Pay at top and detailed Pay section (learner-placement-job-detail.tsx:77-82,265-280)
- Fix: Use legacy single compact facts row, keep additional breakdown only in detail if justified

## G2-15-005-011  [P2] GAP  facet F03  effort M
- Legacy: Legacy section cards rounded bordered `ljd-card`, hero and rail (JobDetailContent.jsx:1098-1101,1256-1274,1320-1322)
- vNext now: VNext flat border-bottom sections and inline two-column grid (learner-placement-job-detail.tsx:134-169,199-281)
- Fix: Clone card borders radius/shadows/padding in two-column canvas

## G2-15-005-012  [P2] GAP  facet F03  effort M
- Legacy: Legacy job detail can display role/package choice as Pay list `Package N` only if multiple (JobDetailContent.jsx:672-686,1173-1189)
- vNext now: VNext each role a full pay row, amounts in INR LPA (learner-placement-job-detail.tsx:265-280)
- Fix: Preserve legacy no-redundant default package label and role package order

## G2-15-005-014  [P2] GAP  facet F04  effort M
- Legacy: Legacy posted date format relative (`formatPostedAgo`), deadline `D MMM YYYY` with countdown (JobDetailContent.jsx:877-882,1198-1215)
- vNext now: VNext posted absolute en-IN medium IST, deadline label (learner-placement-job-detail.tsx:83-87)
- Fix: Match relative posted and deadline urgency formatting/timezone once canonical

## G2-15-005-016  [P2] GAP  facet F04  effort M
- Legacy: Legacy candidatePreferences custom labels parsed to chips (JobDetailContent.jsx:635-666,1273-1294)
- vNext now: VNext requirements generated from per-role eligibility checks, no custom preference rows (learner-placement-job-detail.tsx:134-155,199-255)
- Fix: Include published custom degree/specialization/city/preferences and chip list separately from pass/fail checks

## G2-15-005-018  [P2] MISSING  facet F04  effort M
- Legacy: Legacy current job can display next booked interview CTA by matching application ID (JobDetailContent.jsx:363-387,966-976)
- vNext now: VNext historical journey shows round statuses/date but no `View your interview` prominent link (learner-own-drive-journey.tsx:18-35)
- Fix: Project next booked interview for own application and CTA to schedule, no other applicant data

## G2-15-005-020  [P2] GAP  facet F05  effort S
- Legacy: Legacy returnTo from job list stable allowlisted and persists query (VerifiedJobDetailContent.jsx:23-31)
- vNext now: VNext parses `back` only, default jobs route (jobs/[jobId]/page.tsx:63-76)
- Fix: Support old `returnTo`, reject non-internal URL and test back navigation

## G2-15-005-023  [P2] GAP  facet F06  effort M
- Legacy: Legacy `Apply now` CTA disabled with reason `Can't confirm application status`, `Not eligible to apply`, `Applications closed` (JobDetailContent.jsx:888-900)
- vNext now: VNext `Apply to this role` appears only when canApply, otherwise separate explanatory status or closed badge (learner-placement-jobs.tsx:360-405)
- Fix: Show disabled legacy main CTA with exact reason label and aria-describedby to eligibility

## G2-15-005-036  [P2] GAP  facet F09  effort M
- Legacy: Legacy withdrawn modal red danger, close/keyboard disabled during submitting (JobDetailContent.jsx:1346-1376)
- vNext now: VNext Dialog withdrawal with reason and keep/submit CTAs, disabled pending (learner-placement-jobs.tsx:302-348)
- Fix: Match warning icon, original title and focus/pending semantics while preserving approved reason

## G2-15-005-051  [P2] GAP  facet F12  effort M
- Legacy: Legacy custom next interview taken by application identity not same-job match (JobDetailContent.jsx:369-387)
- vNext now: VNext journey checks own application but returns first matching job/application limit1 (learner-historical-drive-service.ts:16-27)
- Fix: Use application ID association for all interview rounds if multiple role options under one job

## G2-15-005-054  [P2] GAP  facet F13  effort M
- Legacy: Legacy invalid ID and unavailable job have separate actionable empty states (JobDetailContent.jsx:823-875)
- vNext now: VNext generic notFound except own historical drive case (jobs/[jobId]/page.tsx:71-85)
- Fix: Add exact error/no access/not found explanations with back link

## G2-15-005-060  [P2] GAP  facet F16  effort M
- Legacy: Legacy hero avatar/long title/preview cards in CSS `ljd-card`, mobile nav/action (JobDetailContent.jsx:1098-1132,1325-1344)
- vNext now: VNext flat responsive sections and down anchor CTA (learner-placement-job-detail.tsx:44-101,168-300)
- Fix: Compare 1280/768/375 card spacing, fold and touch targets; apply source legacy geometry

## G2-15-005-061  [P2] GAP  facet F17  effort M
- Legacy: Legacy Apply disabled reasons linked to eligibility id via aria-describedby (JobDetailContent.jsx:1073-1085)
- vNext now: VNext status paragraphs and button conditional, no disabled Apply for ineligible (learner-placement-jobs.tsx:360-405)
- Fix: Add status explanation id/disabled button aria-describedby and live updates

## G2-15-005-062  [P2] GAP  facet F17  effort M
- Legacy: Legacy header breadcrumb nav `aria-label=Breadcrumb`, loading polite and modal aria controls (JobDetailContent.jsx:749-767,781-783,1402-1417)
- vNext now: VNext Breadcrumbs and aria-labeled section, but no loading role (learner-placement-job-detail.tsx:45-52,134-135)
- Fix: Preserve landmark and async status announcements; verify focus after modal close

## G2-15-005-065  [P2] GAP  facet F18  effort S
- Legacy: Legacy absent description text `No description has been added for this role yet. You can still apply and ask the recruiter for details.` (JobDetailContent.jsx:1263-1269)
- vNext now: VNext `No additional description was published for this drive.` (learner-placement-job-detail.tsx:169-173)
- Fix: Restore exact absent-description text if rule permits apply; otherwise action-specific copy

## G2-15-005-066  [P2] MISSING  facet F18  effort S
- Legacy: Legacy receipt wording `Reference`, `Submitted`, `Resume sent`; `APP-{id}` (JobDetailContent.jsx:928-959)
- vNext now: No receipt vocabulary rendered for own submitted application (learner-placement-jobs.tsx:286-301)
- Fix: Restore receipt strings and APP reference

## G2-15-005-068  [P2] GAP  facet F19  effort M
- Legacy: Legacy saved/readiness fetched asynchronously, Apply gated; unknown check fail closes (JobDetailContent.jsx:220-252,389-400,888-900)
- vNext now: VNext server awaits eligibility and held-offer evaluation for all targeted jobs (learner-job-service.ts:188-292)
- Fix: Batch targeted eligibility for one job to prevent N+1 across full feed; maintain action guard

## G2-15-005-073  [P2] GAP  facet F21  effort M
- Legacy: Legacy no separate external confirmation state; direct in-LMS application after company link (JobDetailContent.jsx:1146-1151)
- vNext now: VNext externalConfirmation true recorded as external channel, user self-attestation (learner-placement-jobs.tsx:202-217,465-489)
- Fix: Show explicit self-declared status and stage comparison to legacy application workflow

## G2-15-005-027  [P3] GAP  facet F06  effort S
- Legacy: Legacy confirmation modal width440, Not yet, Confirm & apply (JobDetailContent.jsx:1378-1392)
- vNext now: VNext Dialog same title/buttons, variable width from ui/Dialog (learner-placement-jobs.tsx:429-439)
- Fix: Fix dialog width/center and modal icon to legacy

## G2-15-005-037  [P3] GAP  facet F09  effort S
- Legacy: Legacy apply modal shows security badge icon and optional privacy disclosure (JobDetailContent.jsx:1394-1417)
- vNext now: VNext includes privacy disclosure but no SafetyCertificate icon (learner-placement-jobs.tsx:429-464)
- Fix: Use legacy safety badge, spacing and visually secondary disclose control

## G2-15-005-057  [P3] GAP  facet F15  effort S
- Legacy: Legacy confirmation says interview bookings email, other progress notices here (JobDetailContent.jsx:961-964)
- vNext now: VNext history displays rounds/status, no email/notification promise in detail (learner-own-drive-journey.tsx:18-35)
- Fix: Restore verified channel wording after checking backend notifications
