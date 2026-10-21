# Work packet: edit src/components/admin/inbound-mail-list.tsx

11 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-10/superadmin-inbound-mail.md

## G2-10-009-013  [P1] MISSING  facet F03  effort S
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/inbound-mail.js:37-47` sender bold recruiter/student name, address and Recruiter/Student+college Tag
- vNext now: `src/components/admin/inbound-mail-list.tsx:58` and `src/components/admin/inbound-mail-list.tsx:80-81` only from/to addresses, no sender identity chips
- Fix: Join normalized recruiter/student/college names and render exact badges

## G2-10-009-015  [P1] MISSING  facet F03  effort S
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/inbound-mail.js:19-28` eight distinct routing-status Tag labels/colors
- vNext now: `src/components/admin/inbound-mail-list.tsx:56` renders NEW/TRIAGED/RESOLVED triage only
- Fix: Preserve routing outcome status as separate property and colored tag

## G2-10-009-016  [P1] GAP  facet F03  effort S
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/inbound-mail.js:102` status cell appends Done Tag only when handledAt exists
- vNext now: `src/components/admin/inbound-mail-list.tsx:56` single status badge RESOLVED, no dual routing+handled states
- Fix: Display routing outcome and handled state simultaneously

## G2-10-009-019  [P1] GAP  facet F03  effort S
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/inbound-mail.js:130-133` Mark done / Move back to To read hidden for POSTED
- vNext now: `src/components/admin/inbound-mail-list.tsx:73-76` triage action buttons independent of POSTED outcome
- Fix: Hide manual triage controls for automatically posted replies

## G2-10-009-055  [P1] GAP  facet F09  effort S
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/inbound-mail.js:68-71` row click opens loading Drawer then GET full
- vNext now: `src/components/admin/inbound-mail-list.tsx:62`,68-89 Read button opens data from list without fetch
- Fix: Restore one-time detail GET, loading progress, and post-fetch reconciliation

## G2-10-009-057  [P1] GAP  facet F09  effort S
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/inbound-mail.js:129-133` done/reopen disabled when open.loading and posted
- vNext now: `src/components/admin/inbound-mail-list.tsx:73-76` action set based on triage only; busy disabled
- Fix: Disable actions while unresolved detail loads and for posted replies

## G2-10-009-060  [P1] MISSING  facet F10  effort S
- Legacy: `docs/legacy-source/frontend/src/api/Services/SuperAdminInboundMailService.js:9` GET /api/v1/superadmin/inbound-mail/{id} loads full mail
- vNext now: `src/components/admin/inbound-mail-list.tsx:68-89` no GET detail endpoint
- Fix: Add authenticated GET /api/admin/inbound-mail/{id} with role gate and full body

## G2-10-009-124  [P1] GAP  facet F23  effort S
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/inbound-mail.js:69-71` fetch full body on open
- vNext now: `src/components/admin/inbound-mail-list.tsx:68-89` reads preloaded body and truncates detail
- Fix: Restore lazy detail fetch and full-body visibility

## G2-10-009-043  [P2] GAP  facet F07  effort S
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/SuperAdminInboundMailController.java:73-76` nonexisting id returns HTTP404
- vNext now: `src/components/admin/inbound-mail-list.tsx:68-86` never fetches detail; nonexistent selected stale row still shown
- Fix: Provide detail GET/404 fallback with Couldn't load this email

## G2-10-009-046  [P2] MISSING  facet F07  effort S
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/inbound-mail.js:139-143` drawer load failure says Couldn't load this email
- vNext now: `src/components/admin/inbound-mail-list.tsx:68-89` has no detail-loading failure state
- Fix: Render warning alert on read-detail failure, keep row metadata

## G2-10-009-050  [P2] GAP  facet F08  effort S
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/inbound-mail.js:128-133` success done closes Drawer and reloads, no success toast
- vNext now: `src/components/admin/inbound-mail-list.tsx:36-38` shows Message marked done and keeps Drawer open then refreshes
- Fix: Match close-and-refresh on done, or document persistent confirmation enhancement
