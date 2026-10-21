# Work packet: edit src/app/(authenticated)/admin/companies/page.tsx

18 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-10/superadmin-companies.md, docs/audit/gap2/lane-9/superadmin-companies-college.md, docs/audit/gap2/lane-9/superadmin-company-curation.md, docs/audit/gap2/lane-10/cross-10-list-conventions.md

## G2-10-004-008  [P1] GAP  facet F03  effort L
- Legacy: Old global companies render Antd table with Company Domains Added by Colleges Drives Actions columns `docs/legacy-source/frontend/src/pages/superadmin/sections/CompanyCuration.js:59-81`
- vNext now: New display one card per college-company relationship with headings badges disclosure links `src/app/(authenticated)/admin/companies/page.tsx:143-192`
- Fix: Add global distinct-company table with exact old column set; separate college relationships detail view

## G2-10-004-011  [P1] GAP  facet F03  effort M
- Legacy: Old college list shows Contact person and Contact email column `docs/legacy-source/frontend/src/pages/superadmin/sections/Companies.js:262-269`
- vNext now: New relationship list deliberately excludes CRM private contacts `src/app/(authenticated)/admin/companies/page.tsx:43-45` `src/app/(authenticated)/admin/companies/page.tsx:143-181`
- Fix: Add authorized college-only contact detail while preventing global cross-college disclosure

## G2-10-004-016  [P1] GAP  facet F04  effort L
- Legacy: Old global item summarizes number of colleges and drives across platform `docs/legacy-source/frontend/src/pages/superadmin/sections/CompanyCuration.js:66-70` `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/company/CompanyCurationService.java:44-50`
- vNext now: New row repeats one company per relationship and counts company colleges within authorized scope `src/modules/placements/admin-company-directory-service.ts:68-104` `src/app/(authenticated)/admin/companies/page.tsx:176-181`
- Fix: Build distinct global company view with global counts for unscoped admin and scoped counts when restricted

## G2-10-004-017  [P1] GAP  facet F04  effort M
- Legacy: Old college record has industry, logo, private contacts, notes, drive count and last active `docs/legacy-source/frontend/src/pages/superadmin/sections/Companies.js:242-295` `docs/legacy-source/frontend/src/pages/superadmin/sections/Companies.js:140-150`
- vNext now: New summary has industry, website, addedByType, driveCount, lastActiveAt but no private notes/contact fields `src/app/(authenticated)/admin/companies/page.tsx:162-181`
- Fix: Restore need-to-know private contact and notes access only under college scope

## G2-10-004-053  [P1] GAP  facet F11  effort M
- Legacy: Legacy curator sees global master regardless selected college, while college tab restricted `docs/legacy-source/frontend/src/pages/superadmin/companies/index.js:8-21` `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/company/CompanyCurationService.java:35-65`
- vNext now: New GLOBAL tab while a college is selected warns results remain scoped to college `src/app/(authenticated)/admin/companies/page.tsx:40-55` `src/modules/placements/admin-company-directory-service.ts:36-40`
- Fix: Restore genuine global curated list independent of selected college, or clearly require clearing scope before selecting global tab

## G2-10-004-091  [P1] GAP  facet F23  effort L
- Legacy: Old global list allows selected-college tab to preserve local notes/contacts and global catalog independently `docs/legacy-source/frontend/src/pages/superadmin/companies/index.js:8-21` `docs/legacy-source/frontend/src/pages/superadmin/sections/Companies.js:140-150`
- vNext now: New global and college modes render same relationship feed with different view label and scope `src/app/(authenticated)/admin/companies/page.tsx:40-55` `src/app/(authenticated)/admin/companies/page.tsx:143-192`
- Fix: Split global master and college CRM experiences instead of a shared list

## G2-9-033-008  [P1] GAP  facet F03  effort M
- Legacy: Old college list shows Contact person and Contact email column `docs/legacy-source/frontend/src/pages/superadmin/sections/Companies.js:262-269`
- vNext now: New relationship list deliberately excludes CRM private contacts `src/app/(authenticated)/admin/companies/page.tsx:43-45` `src/app/(authenticated)/admin/companies/page.tsx:143-181`
- Fix: Add authorized college-only contact detail while preventing global cross-college disclosure

## G2-9-033-012  [P1] GAP  facet F04  effort M
- Legacy: Old college record has industry, logo, private contacts, notes, drive count and last active `docs/legacy-source/frontend/src/pages/superadmin/sections/Companies.js:242-295` `docs/legacy-source/frontend/src/pages/superadmin/sections/Companies.js:140-150`
- vNext now: New summary has industry, website, addedByType, driveCount, lastActiveAt but no private notes/contact fields `src/app/(authenticated)/admin/companies/page.tsx:162-181`
- Fix: Restore need-to-know private contact and notes access only under college scope

## G2-9-033-054  [P1] GAP  facet F23  effort L
- Legacy: Old global list allows selected-college tab to preserve local notes/contacts and global catalog independently `docs/legacy-source/frontend/src/pages/superadmin/companies/index.js:8-21` `docs/legacy-source/frontend/src/pages/superadmin/sections/Companies.js:140-150`
- vNext now: New global and college modes render same relationship feed with different view label and scope `src/app/(authenticated)/admin/companies/page.tsx:40-55` `src/app/(authenticated)/admin/companies/page.tsx:143-192`
- Fix: Split global master and college CRM experiences instead of a shared list

## G2-9-034-007  [P1] GAP  facet F03  effort L
- Legacy: Old global companies render Antd table with Company Domains Added by Colleges Drives Actions columns `docs/legacy-source/frontend/src/pages/superadmin/sections/CompanyCuration.js:59-81`
- vNext now: New display one card per college-company relationship with headings badges disclosure links `src/app/(authenticated)/admin/companies/page.tsx:143-192`
- Fix: Add global distinct-company table with exact old column set; separate college relationships detail view

## G2-9-034-010  [P1] GAP  facet F04  effort L
- Legacy: Old global item summarizes number of colleges and drives across platform `docs/legacy-source/frontend/src/pages/superadmin/sections/CompanyCuration.js:66-70` `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/company/CompanyCurationService.java:44-50`
- vNext now: New row repeats one company per relationship and counts company colleges within authorized scope `src/modules/placements/admin-company-directory-service.ts:68-104` `src/app/(authenticated)/admin/companies/page.tsx:176-181`
- Fix: Build distinct global company view with global counts for unscoped admin and scoped counts when restricted

## G2-9-034-030  [P1] GAP  facet F11  effort M
- Legacy: Legacy curator sees global master regardless selected college, while college tab restricted `docs/legacy-source/frontend/src/pages/superadmin/companies/index.js:8-21` `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/company/CompanyCurationService.java:35-65`
- vNext now: New GLOBAL tab while a college is selected warns results remain scoped to college `src/app/(authenticated)/admin/companies/page.tsx:40-55` `src/modules/placements/admin-company-directory-service.ts:36-40`
- Fix: Restore genuine global curated list independent of selected college, or clearly require clearing scope before selecting global tab

## G2-9-034-056  [P1] GAP  facet F23  effort L
- Legacy: Old global list allows selected-college tab to preserve local notes/contacts and global catalog independently `docs/legacy-source/frontend/src/pages/superadmin/companies/index.js:8-21` `docs/legacy-source/frontend/src/pages/superadmin/sections/Companies.js:140-150`
- vNext now: New global and college modes render same relationship feed with different view label and scope `src/app/(authenticated)/admin/companies/page.tsx:40-55` `src/app/(authenticated)/admin/companies/page.tsx:143-192`
- Fix: Split global master and college CRM experiences instead of a shared list

## G2-9-034-064  [P1] GAP  facet F03  effort M
- Legacy: Colleges and Drives columns widths90/80 `docs/legacy-source/frontend/src/pages/superadmin/sections/CompanyCuration.js:68-69`
- vNext now: Counts in collapsible details only, drives currently college-scoped `src/app/(authenticated)/admin/companies/page.tsx:176-180`
- Fix: Show global platform aggregates in fixed-width table columns.

## G2-9-034-065  [P1] GAP  facet F03  effort M
- Legacy: Row actions Verify, Edit, Domains, Other names, Merge visible together `docs/legacy-source/frontend/src/pages/superadmin/sections/CompanyCuration.js:70-80`
- vNext now: Verification outside details; edit/identity hidden; merge in separate duplicate-disclosure `src/app/(authenticated)/admin/companies/page.tsx:159-175,198-225`
- Fix: Expose full action strip on each distinct global company row.

## G2-10-031-026  [P2] GAP  facet F07  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/Companies.js:78-83 — Failed to load companies; stale cache warning Couldn't refresh companies.
- vNext now: src/app/(authenticated)/admin/companies/page.tsx:26-50,185-231 — server data-load errors/filters, no stale cache wording.
- Fix: Retain differentiated initial/error/refetch feedback.

## G2-10-031-028  [P2] GAP  facet F07  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/CompanyCuration.js:34-40,93-95 — Couldn't load companies retry preserves filter.
- vNext now: src/app/(authenticated)/admin/companies/page.tsx:26-50 — failure gate differs from Ant in-place Alert.
- Fix: Provide in-card retry with current query.

## G2-10-031-029  [P3] GAP  facet F08  effort S
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/Companies.js:362 — Refreshing companies… status while retaining rows.
- vNext now: src/app/(authenticated)/admin/companies/page.tsx:26-50 — SSR fetch; no source refresh status component.
- Fix: Show nonblocking refresh status on updates.
