# Deep verification packet (rows that fast mode DEFERRED)

These rows were marked DEFERRED without being checked. Each row must now end as exactly one of:
- OK: vNext already matches the old LMS. Give EVIDENCE: the vNext file:line that implements it AND the legacy source file (docs/legacy-source/...) it matches.
- FIXED: you changed the code so it matches. Give the commit and file.

DEFERRED is NOT allowed. For each row: read its full text in the source packet named next to it, find the old behaviour in docs/legacy-source, find the vNext code, decide, and fix if needed.
Keep tests passing and TypeScript valid; never silence errors. Write one result line per row under Results, push, then tick this packet in your queue.

- [ ] G2-4-026-021  (source: docs/audit/gap-fix-work/verify2/packets/lane-4/W1_lane4_8.md)
- [ ] G2-4-026-025  (source: docs/audit/gap-fix-work/verify2/packets/lane-4/W1_lane4_8.md)
- [ ] G2-4-026-054  (source: docs/audit/gap-fix-work/verify2/packets/lane-4/W1_lane4_8.md)
- [ ] G2-4-026-089  (source: docs/audit/gap-fix-work/verify2/packets/lane-4/W1_lane4_8.md)
- [ ] G2-4-028-060  (source: docs/audit/gap-fix-work/verify2/packets/lane-4/W1_lane4_8.md)
- [ ] G2-5-002-002  (source: docs/audit/gap-fix-work/verify2/packets/lane-4/W1_lane4_8.md)
- [ ] G2-5-002-004  (source: docs/audit/gap-fix-work/verify2/packets/lane-4/W1_lane4_8.md)
- [ ] G2-11-017-045  (source: docs/audit/gap-fix-work/verify2/packets/lane-4/W1_lane4_9.md)
- [ ] G2-11-026-007  (source: docs/audit/gap-fix-work/verify2/packets/lane-4/W1_lane4_9.md)
- [ ] G2-12-011-006  (source: docs/audit/gap-fix-work/verify2/packets/lane-4/W1_lane4_9.md)

## Results

- G2-4-026-021: OK — src/modules/placements/public-page/read-service.ts:93-107 publishes explicit snapshot semantics (populationBasis PUBLISHED_ELIGIBLE_SNAPSHOT, eligibilitySnapshotAsOf, eligibilitySnapshotWarning, publicationFresh) while the offer ledger is recomputed live on each read (:58-90); this is the "publish clear snapshot semantics" option for the legacy live PlacementEligibilityService count in docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/PlacementsPageService.java:88-89
- G2-4-026-025: OK — src/components/placements/public-recruit-from-us.tsx:115-117 Company input has no required/validation rule (submit() at :27-45 validates only email, name, code), matching docs/legacy-source/frontend/src/pages/placements/index.js:95
- G2-4-026-054: OK — src/modules/placements/public-page/read-service.ts:84-86 counts RELEASED(ISSUED with releasedAt)/ACCEPTED offers for the offers total and :62-65 counts distinct employers and placed learners from ACCEPTED only, matching PlacementsPageService.java:93-99
- G2-4-026-089: FIXED — company, mobile and "hiring for" fields (company optional, note maxLength 1000, code input autoComplete one-time-code) were only shown after the code was sent; they are now always rendered before the code step like the legacy form, in src/components/placements/public-recruit-from-us.tsx (matches docs/legacy-source/frontend/src/pages/placements/index.js:89-108; resend retained)
- G2-4-028-060: OK — src/app/(authenticated)/tpo/team/page.tsx:25-75 implements the legacy alias contract (tab=people/members goes to /tpo/settings?tab=team dropping other params; otherwise /tpo/messages?tab=team keeping the rest params) matching docs/legacy-source/frontend/src/pages/tpo/team.js:7-9; covered by tests/unit/chat12-round7-students-open-facets.test.ts and chat2-company-team-reachability.test.ts
- G2-5-002-002: OK — src/components/placements/placement-calendar-workspace.tsx:332-333 links INTERVIEW_SLOT events to /college/placements/jobs/<jobId>/applications?applicationId=<id> and src/app/(authenticated)/college/placements/jobs/[jobId]/applications/page.tsx:44-45 opens that applicant detail; src/app/(authenticated)/college/placements/interviews/page.tsx:62 applicantHref does the same; legacy InterviewCalendarContent.js:624-632 and college-admin/calendar.js:22-28
- G2-5-002-004: OK — src/app/(authenticated)/college/placements/interviews/page.tsx:99-108,225 is the single Interviews page: header, Refresh (CollegeInterviewRefresh), four summary metrics (Scheduled/Today/Companies/Conflicts), filter toolbar and DataTable; matches legacy InterviewCalendarContent.js:750-1049
- G2-11-017-045: OK — src/modules/placements/tpo-utility-model.ts:16-18,25 lists Announcements (/tpo/announcements), Messages (/tpo/messages), Placement team (/tpo/settings?tab=team) and Settings (/tpo/settings) as separate links with the exact legacy descriptions, rendered by src/components/tpo/tpo-more-navigation.tsx; matches docs/legacy-source/frontend/src/pages/tpo/more.js:26-28,41
- G2-11-026-007: FIXED — GET /api/tracker/issues accepted only page/size/sort/status/severity/environment/q; it now also accepts the legacy `search` (alias of q) and `reporter` (case-insensitive exact reporter name) filters on both the super-admin legacy-page branch and the reporter's own-records branch, with zero-based page, size<=100 and sort DESC default already supported (src/app/api/tracker/issues/route.ts, src/modules/bug-tracker/admin-service.ts); matches docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/PublicBugTrackerController.java:37-46 and BugReportRepository search
- G2-12-011-006: FIXED — hidden-unread count and deferred auto-read already existed (src/modules/placements/hr-recruiter-bell-service.ts:71, src/components/hr/hr-recruiter-bell.tsx:83 skips auto-read while hiddenUnread>0, per-item unread flag), but the banner wording differed; it now reads "N older unread notification(s) isn't/aren't shown here; your drives have them." exactly as docs/legacy-source/frontend/src/components/recruiter/RecruiterNotificationBell.jsx:134-137 (src/components/hr/hr-recruiter-bell.tsx:126)
