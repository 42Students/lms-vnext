# Deep verification packet (rows that fast mode DEFERRED)

These rows were marked DEFERRED without being checked. Each row must now end as exactly one of:
- OK: vNext already matches the old LMS. Give EVIDENCE: the vNext file:line that implements it AND the legacy source file (docs/legacy-source/...) it matches.
- FIXED: you changed the code so it matches. Give the commit and file.

DEFERRED is NOT allowed. For each row: read its full text in the source packet named next to it, find the old behaviour in docs/legacy-source, find the vNext code, decide, and fix if needed.
Keep tests passing and TypeScript valid; never silence errors. Write one result line per row under Results, push, then tick this packet in your queue.

- [ ] G2-9-001-036  (source: docs/audit/gap-fix-work/verify2/packets/lane-18/W1_lane18_6.md)
- [ ] G2-9-001-040  (source: docs/audit/gap-fix-work/verify2/packets/lane-18/W1_lane18_6.md)
- [ ] G2-9-001-068  (source: docs/audit/gap-fix-work/verify2/packets/lane-18/W1_lane18_6.md)
- [ ] G2-9-004-014  (source: docs/audit/gap-fix-work/verify2/packets/lane-18/W1_lane18_6.md)
- [ ] G2-9-004-046  (source: docs/audit/gap-fix-work/verify2/packets/lane-18/W1_lane18_6.md)
- [ ] G2-9-004-052  (source: docs/audit/gap-fix-work/verify2/packets/lane-18/W1_lane18_6.md)
- [ ] G2-9-008-032  (source: docs/audit/gap-fix-work/verify2/packets/lane-18/W1_lane18_6.md)
- [ ] G2-9-010-048  (source: docs/audit/gap-fix-work/verify2/packets/lane-18/W1_lane18_6.md)
- [ ] G2-9-011-017  (source: docs/audit/gap-fix-work/verify2/packets/lane-18/W1_lane18_6.md)
- [ ] G2-9-011-039  (source: docs/audit/gap-fix-work/verify2/packets/lane-18/W1_lane18_6.md)

## Results

- G2-9-001-036: OK — vNext src/modules/activity/college-activity-service.ts:32-47 (category->legacy category map, IMPORTANT default view, 50 page size) and src/modules/activity/college-activity-model.ts:94-98 (30-day default) match docs/legacy-source/frontend/src/components/admin/activity/ActivityCenter.jsx:21-130 (important/30d/size 50).
- G2-9-001-040: OK — vNext college-activity-service.ts:11-27 (College Admin forced to own membership college; Super Admin must resolve an acting college via resolveActingCollege + requirePermission) matches docs/legacy-source/backend/.../SuperAdminAuditController.java:122-163.
- G2-9-001-068: OK — vNext src/modules/activity/service.ts:526-545 (legacyCategoryCondition maps legacy actionKey/entityType keys incl. imported legacyActionKey/legacyEntityType to typed events) matches AdminAuditLogService.CATEGORIES + SuperAdminAuditService.js:1-5.
- G2-9-004-014: OK — vNext src/modules/placements/college-company-directory-service.ts:78-80 projects contactName/contactEmail (placement-admin scoped) and src/components/placements/placement-employer-relationships.tsx:416-417 renders them; matches docs/legacy-source/frontend/src/pages/superadmin/sections/Companies.js:283-295.
- G2-9-004-046: OK — vNext src/components/placements/placement-employer-relationships.tsx:600-640 company history (drives with applicants/hired totals, scoped to college) plus directory aggregates in college-company-directory-service.ts:37-57 match docs/legacy-source/frontend/src/api/Services/AdminService.js:662-673 (company jobs/stats).
- G2-9-004-052: OK — vNext college-company-directory-service.ts:21-32 treats archived relationship OR archived canonical company as deleted and shows both when showDeleted=1, matching docs/legacy-source/frontend/src/pages/superadmin/sections/Companies.js:118-137.
- G2-9-008-032: OK — vNext src/app/(authenticated)/college/hiring-dashboard/page.tsx:57-98 (Promise.allSettled, funnel-only warning Alert, rest of report stays visible) matches docs/legacy-source/frontend/src/pages/superadmin/sections/HiringDashboard.js:503-505.
- G2-9-010-048: OK — vNext src/app/api/placements/college/jobs/[jobId]/pipeline/route.ts:22-33 returns canonicalApplicationStatusUnchanged:true with partial/skipped receipts so stage moves are not misrepresented as legacy status transitions (AdminJobController.java:516-605).
- G2-9-011-017: OK — vNext src/modules/placements/college-drive-overview-model.ts:6-12 (zero fallback only for comparable metrics, Selected "Not available") and overview/page.tsx pipeline section (missing counts shown as unavailable, selected note) match docs/legacy-source/frontend/src/pages/college-admin/jobs/[jobId]/index.js:245-255.
- G2-9-011-039: FIXED — status label for a published drive past its deadline changed from "Expired" to the legacy "Open · Expired" (Draft/Open/Closed unchanged) in src/app/(authenticated)/college/placements/jobs/[jobId]/overview/page.tsx:59, matching docs/legacy-source/frontend/src/pages/college-admin/jobs/[jobId]/index.js:197-206.
