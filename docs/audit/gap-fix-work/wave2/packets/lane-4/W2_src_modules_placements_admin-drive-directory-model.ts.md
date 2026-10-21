# Work packet (wave 2): edit src/modules/placements/admin-drive-directory-model.ts

9 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-10/superadmin-jobs-all.md, docs/audit/gap2/lane-8/super-admin-jobs-directory.md

## G2-10-016-020  [P2] GAP  facet F05  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/Jobs.js:50-53,81-116 — Default pageSize=20; URL keys q/status/page/size; filter all/draft/active/closed.
- vNext now: src/modules/placements/admin-drive-directory-model.ts:7-13 — Default10, URL `pageSize` instead of `size`, uppercase status values.
- Fix: Support legacy query alias and default20.

## G2-10-016-023  [P2] GAP  facet F05  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/Jobs.js:137-161 — Clears search/status, resets page preserving size; shallow route replace.
- vNext now: src/modules/placements/admin-drive-directory-model.ts:15-42 — Clear all returns default10 page size.
- Fix: Retain chosen page-size and reset only filters.

## G2-10-016-076  [P2] GAP  facet F20  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/Jobs.js:118-135 — URL persists size status search and page; Back restores settings.
- vNext now: src/modules/placements/admin-drive-directory-model.ts:15-42 — New URL pageSize, uppercase status; old deep links not interoperable.
- Fix: Map old URL keys safely.

## G2-10-016-078  [P2] GAP  facet F21  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/Jobs.js:45-80,233-283 — Job list via AdminService searchAdminJobs and college membership.
- vNext now: src/modules/placements/tpo-operations-service.ts:25-47; src/modules/placements/admin-drive-directory-model.ts:15-29 — Modern getPlacementTpoOperations and filtered normalized list.
- Fix: Document direct old/new field mapping and ordering.

## G2-10-016-081  [P2] GAP  facet F22  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/Jobs.js:485-565 — Legacy job fields isDraft/isActive, postedDate, jobType, applicationCount, deadline.
- vNext now: src/modules/placements/admin-drive-directory-model.ts:44-48; src/app/(authenticated)/admin/placements/drives/page.tsx:65-80 — UUID normalized placementJobs/status, applicant metric count.
- Fix: Project exact status/date and nullable applicant count, no fabricated defaults.

## G2-8-030-007  [P2] GAP  facet F03  effort M
- Legacy: Old status badge Draft, Open/Closed, Expired implied; jobType tag docs/legacy-source/frontend/src/pages/superadmin/sections/Jobs.js:27-39,614-633.
- vNext now: New status badge derived PUBLISHED/ DRAFT/CLOSED and expiry Open · Expired src/modules/placements/admin-drive-directory-model.ts:38-41.
- Fix: Match legacy badge text and icon color per status at date minute boundary.

## G2-8-030-015  [P2] GAP  facet F05  effort M
- Legacy: Old URL q,status,page,size restored; page default1,size20 options10/20/50/100 docs/legacy-source/frontend/src/pages/superadmin/sections/Jobs.js:81-116.
- vNext now: New URL q,status,page,pageSize strict, pageSize default10 options same src/modules/placements/admin-drive-directory-model.ts:9-14; src/app/(authenticated)/admin/placements/drives/page.tsx:85-103.
- Fix: Set default pageSize20 and alias legacy size query.

## G2-8-030-040  [P2] GAP  facet F12  effort M
- Legacy: Old status isActive separate from isDraft, expired computed deadline minute docs/legacy-source/frontend/src/pages/superadmin/sections/Jobs.js:27-39,578-596.
- vNext now: New status enum DRAFT,PUBLISHED,CLOSED,CANCELLED and expiry only badge src/modules/placements/admin-drive-directory-model.ts:19-23,38-41.
- Fix: Explicit mapping of legacy booleans and expiration to new enum.

## G2-8-030-053  [P2] GAP  facet F20  effort M
- Legacy: Old deadline parser handles legacy UTC and applicationDeadline/importantDates docs/legacy-source/frontend/src/pages/superadmin/sections/Jobs.js:27-39,195-203.
- vNext now: New uses Date and IST formatter; Date comparator uses <= now src/modules/placements/admin-drive-directory-model.ts:38-49; src/app/(authenticated)/admin/placements/drives/page.tsx:65-67.
- Fix: Test old deadline minute and timezone rounding, preserve fallback.
