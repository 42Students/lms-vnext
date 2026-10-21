# Work packet: edit src/app/(authenticated)/college/electives/[slotId]/offerings/[offeringId]/roster/page.tsx

5 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-9/college-admin-electives.md

## G2-9-007-021  [P1] MISSING  facet F05  effort M
- Legacy: `docs/legacy-source/frontend/src/components/admin/electives/OfferingRosterDrawer.jsx:133-141` — Roster search, refresh, CSV, state Enrolled/Waitlisted/Removed/All, 50-row paging
- vNext now: `src/app/(authenticated)/college/electives/[slotId]/offerings/[offeringId]/roster/page.tsx:134-179` — No roster search, filter, export, or pagination; first 500 shown
- Fix: Implement all toolbar operations and pagination

## G2-9-007-046  [P1] GAP  facet F10  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/electives/ElectiveAdminController.java:163-196` — Roster GET, allocate POST, remove DELETE with reason, move POST
- vNext now: `src/app/(authenticated)/college/electives/[slotId]/offerings/[offeringId]/roster/page.tsx:77-118` — Group join/leave/move server actions with generic error redirects
- Fix: Preserve reason, per-student response and waitlist outcomes

## G2-9-007-050  [P1] GAP  facet F11  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/electives/ElectiveAdminController.java:38-42` — Scoped super admin can manage via shared console
- vNext now: `src/app/(authenticated)/college/electives/[slotId]/offerings/[offeringId]/roster/page.tsx:29-35` — Roster route requires explicit COLLEGE_ADMIN membership
- Fix: Use acting-college path for authorized super admin

## G2-9-007-058  [P1] MISSING  facet F14  effort M
- Legacy: `docs/legacy-source/frontend/src/components/admin/electives/OfferingRosterDrawer.jsx:133-141` — Roster CSV export with filtered rows and elective-ID filename
- vNext now: `src/app/(authenticated)/college/electives/[slotId]/offerings/[offeringId]/roster/page.tsx:134-179` — Roster has no export action
- Fix: Add CSV with exact column order and filename

## G2-9-007-068  [P1] GAP  facet F19  effort M
- Legacy: `docs/legacy-source/frontend/src/components/admin/electives/OfferingRosterDrawer.jsx:24-40` — Roster state query is refetched; 50 rows/page
- vNext now: `src/app/(authenticated)/college/electives/[slotId]/offerings/[offeringId]/roster/page.tsx:135-179` — First 500 roster members, no pager
- Fix: Add cursor paging for large rosters
