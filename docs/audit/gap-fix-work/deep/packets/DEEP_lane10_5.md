# Deep verification packet (rows that fast mode DEFERRED)

These rows were marked DEFERRED without being checked. Each row must now end as exactly one of:
- OK: vNext already matches the old LMS. Give EVIDENCE: the vNext file:line that implements it AND the legacy source file (docs/legacy-source/...) it matches.
- FIXED: you changed the code so it matches. Give the commit and file.

DEFERRED is NOT allowed. For each row: read its full text in the source packet named next to it, find the old behaviour in docs/legacy-source, find the vNext code, decide, and fix if needed.
Keep tests passing and TypeScript valid; never silence errors. Write one result line per row under Results, push, then tick this packet in your queue.

- [x] G2-8-022-002  (source: docs/audit/gap-fix-work/verify2/packets/lane-9/W1_lane9_14.md)
- [x] G2-9-001-074  (source: docs/audit/gap-fix-work/verify2/packets/lane-9/W1_lane9_14.md)
- [x] G2-9-007-049  (source: docs/audit/gap-fix-work/verify2/packets/lane-9/W1_lane9_14.md)
- [x] G2-9-012-010  (source: docs/audit/gap-fix-work/verify2/packets/lane-9/W1_lane9_14.md)
- [x] G2-9-013-054  (source: docs/audit/gap-fix-work/verify2/packets/lane-9/W1_lane9_14.md)
- [x] G2-9-014-048  (source: docs/audit/gap-fix-work/verify2/packets/lane-9/W1_lane9_14.md)
- [x] G2-9-015-056  (source: docs/audit/gap-fix-work/verify2/packets/lane-9/W1_lane9_14.md)
- [x] G2-9-020-019  (source: docs/audit/gap-fix-work/verify2/packets/lane-9/W1_lane9_14.md)
- [x] G2-9-020-060  (source: docs/audit/gap-fix-work/verify2/packets/lane-9/W1_lane9_14.md)
- [x] G2-9-029-055  (source: docs/audit/gap-fix-work/verify2/packets/lane-9/W1_lane9_14.md)

## Results

- G2-8-022-002: OK — vNext src/app/api/placements/seasons/route.ts:37-44 supports GET ?current=true returning the newest ACTIVE season via currentPlacementSeason (no side-effect creation, explicit no-season message) and src/app/api/placements/tpo/settings/season/route.ts:24-34 exposes currentSeasonId; matches TpoSeasonController.java:39-42 / TpoSeasonService.java:27-29.
- G2-9-001-074: OK — vNext src/app/(authenticated)/college/activity/page.tsx:75-80,227-260,269-278 day-grouped feed (Today/Yesterday headings), "several at once" related-event badge, inline Details toggle and "Load more (N older)" append count; matches ActivityCenter.jsx:232-259.
- G2-9-007-049: OK — vNext src/app/(authenticated)/college/electives/[slotId]/allocate/page.tsx:90-99 renders "Admin not assigned to an active college" ErrorState with recovery link when membership/role is missing; matches docs/legacy-source/frontend/src/pages/college-admin/electives.js:20-31.
- G2-9-012-010: OK — vNext src/app/(authenticated)/college/placements/jobs/[jobId]/interviews/page.tsx:85-93,129-141 computes overlapping conflicts (collegeInterviewConflictIds) and a red Conflicts (N) toggle filtering to conflicts only; matches InterviewCalendarContent.js:897-911.
- G2-9-013-054: OK — vNext src/modules/placements/college-legacy-drive-settings-model.ts:16-30 documents and implements isDraft/isActive to status translation (mutual exclusion rejected) used by src/app/(authenticated)/college/placements/jobs/[jobId]/settings/page.tsx:211-214; matches AdminService.js:718-750.
- G2-9-014-048: OK — vNext src/components/placements/college-application-pipeline-controls.tsx:126-138,234,320-324,456-463 provides single and bulk Reject with optional reason, discard guard, and per-row skipped/failure outcome list; matches JobApplications.js:215-220.
- G2-9-015-056: OK — vNext src/components/placements/college-drive-archive-action.tsx:9-20,48-69 loads an impact preview (applications, rounds, interviews, offers retained) before archive confirm, used from src/app/(authenticated)/college/placements/drives/page.tsx:110-115,232-234; matches Jobs.js:426-469.
- G2-9-020-019: OK — vNext src/modules/verification/staff-queue-service.ts:95-96,110-150 computes counts/filters over all matching rows (10,001-row guard with VerificationQueueLimitError) and displays a transparent first-1,000 cap with capacityMessage; matches VerificationWorkspace.jsx:35-36,417-431.
- G2-9-020-060: OK — vNext src/modules/verification/staff-queue-service.ts:110-150 returns truncated, totalMatching and the explicit "Showing the first 1,000 matching requests" message so no rows are hidden silently; matches VerificationWorkspace.jsx:35-36,169-181.
- G2-9-029-055: FIXED — batches.csv export (src/app/api/admin/batches/export/route.ts, linked at src/app/(authenticated)/admin/batches/page.tsx exportHref) now uses the legacy header batchName (was name) with legacy keys id/programId/currentSemester/academicYear/status/students/startDate/endDate; cells go through placementReportCsv formula neutralization (src/modules/placements/report-model.ts:682-703); matches Batches.js:538-548.
