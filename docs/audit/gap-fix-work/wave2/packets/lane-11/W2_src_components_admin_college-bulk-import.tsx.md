# Work packet (wave 2): edit src/components/admin/college-bulk-import.tsx

6 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-9/superadmin-colleges.md

## G2-9-032-009  [P2] GAP  facet F03  effort S
- Legacy: Bulk Import has Upload icon; Refresh has Reload icon `docs/legacy-source/frontend/src/pages/superadmin/sections/Colleges.js:566-580`
- vNext now: Bulk Import at bottom; Refresh text link in filter row `src/app/(authenticated)/admin/colleges/page.tsx:162-172` `src/components/admin/college-bulk-import.tsx:48-74`
- Fix: Expose Bulk Import and Refresh icon buttons beside search

## G2-9-032-042  [P2] GAP  facet F09  effort S
- Legacy: Bulk draft close confirms Discard this bulk-import draft? with Keep editing `docs/legacy-source/frontend/src/pages/superadmin/sections/Colleges.js:343-356`
- vNext now: Discard Bulk Import draft? confirm; slightly different description `src/components/admin/college-bulk-import.tsx:85-89`
- Fix: Use old exact title/CTA and do not clear partially saved results

## G2-9-032-043  [P2] GAP  facet F09  effort M
- Legacy: Bulk modal width640, text area rows8, footer Close/Import `docs/legacy-source/frontend/src/pages/superadmin/sections/Colleges.js:611-624`
- vNext now: Expanded inline bulk section and separate confirm step `src/components/admin/college-bulk-import.tsx:48-90`
- Fix: Match modal geometry/content and modal close behavior

## G2-9-032-062  [P2] GAP  facet F14  effort M
- Legacy: Bulk results #,Name,Unique ID,Result,Message with color Tags `docs/legacy-source/frontend/src/pages/superadmin/sections/Colleges.js:611-672`
- vNext now: Results Row,Code,Status,Details with badges CREATED/SKIPPED/FAILED `src/components/admin/college-bulk-import.tsx:75-84`
- Fix: Restore legacy headers and name while retaining new SKIPPED state

## G2-9-032-066  [P2] GAP  facet F17  effort M
- Legacy: Dirty edit/bulk modal prevents accidental close `docs/legacy-source/frontend/src/pages/superadmin/sections/Colleges.js:343-378`
- vNext now: Bulk guard exists, edit guard absent `src/components/admin/college-edit-dialog.tsx:116-129` `src/components/admin/college-bulk-import.tsx:85-89`
- Fix: Restore edit focus/dirty dismissal guard

## G2-9-032-069  [P2] GAP  facet F18  effort S
- Legacy: Bulk Import Colleges (CSV), Columns orgId,name,uniqueId,city,state `docs/legacy-source/frontend/src/pages/superadmin/sections/Colleges.js:611-628`
- vNext now: Bulk Import panel and different template text `src/components/admin/college-bulk-import.tsx:48-90`
- Fix: Align exact import labels and template
