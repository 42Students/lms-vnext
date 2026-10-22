# Deep verification packet (rows that fast mode DEFERRED)

These rows were marked DEFERRED without being checked. Each row must now end as exactly one of:
- OK: vNext already matches the old LMS. Give EVIDENCE: the vNext file:line that implements it AND the legacy source file (docs/legacy-source/...) it matches.
- FIXED: you changed the code so it matches. Give the commit and file.

DEFERRED is NOT allowed. For each row: read its full text in the source packet named next to it, find the old behaviour in docs/legacy-source, find the vNext code, decide, and fix if needed.
Keep tests passing and TypeScript valid; never silence errors. Write one result line per row under Results, push, then tick this packet in your queue.

- [ ] G2-9-010-084  (source: docs/audit/gap-fix-work/verify2/packets/lane-19/W1_lane19_11.md)
- [ ] G2-9-010-087  (source: docs/audit/gap-fix-work/verify2/packets/lane-19/W1_lane19_11.md)
- [ ] G2-9-011-015  (source: docs/audit/gap-fix-work/verify2/packets/lane-19/W1_lane19_11.md)
- [ ] G2-9-011-045  (source: docs/audit/gap-fix-work/verify2/packets/lane-19/W1_lane19_11.md)
- [ ] G2-9-011-064  (source: docs/audit/gap-fix-work/verify2/packets/lane-19/W1_lane19_11.md)
- [ ] G2-9-014-027  (source: docs/audit/gap-fix-work/verify2/packets/lane-19/W1_lane19_11.md)
- [ ] G2-9-014-090  (source: docs/audit/gap-fix-work/verify2/packets/lane-19/W1_lane19_11.md)
- [ ] G2-9-016-014  (source: docs/audit/gap-fix-work/verify2/packets/lane-19/W1_lane19_11.md)
- [ ] G2-9-016-095  (source: docs/audit/gap-fix-work/verify2/packets/lane-19/W1_lane19_11.md)
- [ ] G2-9-016-096  (source: docs/audit/gap-fix-work/verify2/packets/lane-19/W1_lane19_11.md)

## Results

- G2-9-010-084: OK — vNext src/components/placements/college-application-detail-drawer.tsx:11-12,221-238 (interview list/ICS via CollegeInterviewAppointments + collegeInterviewIcs, candidate interviews fetch), :39-40 offers/resume preview, :264 pipeline/screening history, notes — matches docs/legacy-source/frontend/src/pages/superadmin/sections/JobApplications.js:6-44 integrations.
- G2-9-010-087: OK — drawer college-application-detail-drawer.tsx:35-39,146-182 presents internal notes with append-only amendment history and per-offer offerLetterUrl attach/versioning, covering JobApplication.java:83-109 internalNotes/offerLetterUrl.
- G2-9-011-015: OK — src/app/(authenticated)/college/placements/jobs/[jobId]/overview/page.tsx:56-60,81-86 renders title, company, status (Draft/Open/Open · Expired/Closed from status+deadline), normalized job type and a secondary row with openings and work mode, matching docs/legacy-source/frontend/src/pages/college-admin/jobs/[jobId]/index.js:195-205 (label fixed under G2-9-011-039 in packet DEEP_lane2_3).
- G2-9-011-045: OK — overview/page.tsx:27-33,94 loads attention via Promise.allSettled and only shows an info alert on failure, so the drive stays visible; matches index.js:92-94.
- G2-9-011-064: OK — src/modules/placements/college-drive-overview-service.ts:46-99 counts applications from placementApplications and returns withdrawn and external separately (not folded into stage counts), matching the status-count semantics at index.js:244-259.
- G2-9-014-027: OK — src/components/placements/college-application-pipeline-controls.tsx:331-335 offers "Select all N on this page" and "Select all N matching this filter" (matchingFilter sent at :162, capped), with clear, and shortlisted/page.tsx:159 disables external candidates; matches JobApplications.js:1778-1815.
- G2-9-014-090: OK — shortlisted/page.tsx:73-75 Interviews tab, :95-100 assessment link with copy, CollegeShortlistedToolbar CSV export, and rows open the application drawer (history, notes, offer letters); matches JobApplications.js:208-245.
- G2-9-016-014: OK — src/app/(authenticated)/college/placements/page.tsx:105-108 renders the four tiles "Active drives", "Needs attention", "Closed / draft", "All drives" from overall counts; matches DrivesLanding.js:251-258.
- G2-9-016-095: OK — src/components/placements/placement-operations-workspace.tsx:82-110 wires operations snapshot (attention/deadlines), retention report, student lookup, season, companies and policy sections; matches DrivesLanding.js:5-15 dependencies.
- G2-9-016-096: FIXED — placements/page.tsx still said "Student placement history lookup is not yet available" although the college student-lookup route and the workspace's "Student placement lookup" disclosure (placement-operations-workspace.tsx:96-103, after the drive cards) exist; replaced the false note with a link to /college/placements/student-lookup in src/app/(authenticated)/college/placements/page.tsx. Matches DrivesLanding.js:12-17.
