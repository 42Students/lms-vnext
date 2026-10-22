# Verification packet (P1 round 2): 25 rows

For EACH row: open the vNext file(s) it cites, check that the Fix is really implemented (wording, validation, behaviour, permissions, empty/error states, wiring). If it is missing, partial or wrong, FIX it now in the file (keep valid syntax, no uninstalled packages). In your commit message list the row IDs as OK or FIXED. Rows without a vNext file describe a new feature: search the repo for it; if it does not exist, build it.

## G2-10-027-050 [P1] GAP facet F12
- Files: src/modules/storage/file-policy.ts
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/FileUploadController.java:167-174 — Folder cap5MiB for JD/branding/marksheet and10MiB for offers.
- Expected fix: Enforce semantic folder limits

## G2-10-025-004 [P1] GAP facet F01
- Files: src/app/(authenticated)/hr/home/page.tsx
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/RecruiterSelfController.java:102-107 — GET /home dashboard across accessible colleges inside selected session.
- Expected fix: Offer old cross-college Home metrics while preserving tenancy

## G2-10-002-015 [P1] GAP facet F04
- Files: src/modules/announcements/super-admin-broadcast-receipts-service.ts, src/app/(authenticated)/admin/announcements/page.tsx
- Legacy: Legacy read totals are distinct college IDs not individual faculty readers `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/PlacementAnnouncementService.java:338-349`
- Expected fix: Group per-college DB10 rows to one broadcast ID and count distinct college reads across audience

## G2-10-002-019 [P1] GAP facet F05
- Files: src/modules/announcements/super-admin-college-broadcast-service.ts, src/components/announcements/announcement-admin-workspace.tsx
- Legacy: One card per broadcast regardless selected colleges `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/PlacementAnnouncementService.java:338-349`
- Expected fix: Add logical broadcast group ID and collapse all per-college records into one card with shared actions

## G2-10-002-020 [P1] GAP facet F06
- Files: src/components/announcements/super-admin-college-broadcast-form.tsx
- Legacy: New modal defaults target To ALL; radio options Every placement cell N and Some placement cells `docs/legacy-source/frontend/src/pages/superadmin/announcements.js:37-41` `docs/legacy-source/frontend/src/pages/superadmin/announcements.js:86-95`
- Expected fix: Default to ALL and render legacy radio options with counts

## G2-10-002-026 [P1] GAP facet F06
- Files: src/components/announcements/super-admin-college-broadcast-form.tsx, src/modules/announcements/super-admin-college-broadcast-model.ts
- Legacy: Optional link with valid URL but blank label accepted and auto-fills Open `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/PlacementAnnouncementService.java:571-583`
- Expected fix: Allow blank label with HTTPS URL and store default Open as in legacy

## G2-10-002-029 [P1] GAP facet F06
- Files: src/components/announcements/announcement-admin-workspace.tsx
- Legacy: Legacy edit modal pre-fills old title body pin button link and expiry; audience immutable `docs/legacy-source/frontend/src/pages/superadmin/announcements.js:37-41` `docs/legacy-source/frontend/src/pages/superadmin/announcements.js:96-108`
- Expected fix: Use broadcast-specific editor: lock audience and allow changing existing button label and URL

## G2-10-002-030 [P1] GAP facet F06
- Files: src/components/announcements/announcement-admin-workspace.tsx
- Legacy: Legacy edit title 200 and body 8000 limits inherited from same form `docs/legacy-source/frontend/src/pages/superadmin/announcements.js:81-85`
- Expected fix: Use broadcast-specific 200 and 8000 max values in generic editor when senderType SUPER_ADMIN broadcast

## G2-10-002-040 [P1] GAP facet F09
- Files: src/components/announcements/announcement-admin-workspace.tsx
- Legacy: Legacy delete uses Popconfirm Delete this announcement? and Placement cells stop seeing it. `docs/legacy-source/frontend/src/components/tpo/announcements/AnnouncementList.jsx:93-103`
- Expected fix: Show confirmation with legacy title description and danger Delete before mutation

## G2-10-002-044 [P1] GAP facet F10
- Files: src/modules/announcements/super-admin-college-broadcast-service.ts
- Legacy: Legacy post inserts one placement_announcement plus join rows per college then bell audit `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/PlacementAnnouncementService.java:379-388`
- Expected fix: Introduce stable campaign/broadcast group identity and audit correlation across all per-college rows

## G2-10-002-048 [P1] GAP facet F11
- Files: src/modules/announcements/super-admin-college-broadcast-service.ts
- Legacy: Legacy placement-cell audience is any college with type-14 faculty or TPO team member `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/PlacementAnnouncementService.java:314-318`
- Expected fix: Determine owner-approved targeting exclusions and show omitted legacy placement cells clearly

## G2-10-002-052 [P1] GAP facet F12
- Files: src/components/announcements/super-admin-college-broadcast-form.tsx, src/modules/announcements/super-admin-college-broadcast-service.ts
- Legacy: Legacy superadmin broadcast has no scheduling and is inserted sent_at UTC_TIMESTAMP `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/PlacementAnnouncementService.java:375-388`
- Expected fix: Do not claim scheduled bell delivery until worker processes scheduled broadcasts

## G2-10-002-059 [P1] GAP facet F15
- Files: src/modules/announcements/super-admin-college-broadcast-service.ts
- Legacy: Legacy sends bell audit once per placement cell with From 42 title and /tpo/announcements?tab=from42 `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/PlacementAnnouncementService.java:379-388`
- Expected fix: Deep-link to From 42 view and verify exact once-per-cell bell vs per-member notification policy

## G2-10-002-060 [P1] GAP facet F15
- Files: src/modules/announcements/super-admin-broadcast-receipts-service.ts, src/modules/announcements/placement-cell-receipt-service.ts
- Legacy: Legacy allFrom42 has unread state per faculty and distinct college read count `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/PlacementAnnouncementService.java:320-349`
- Expected fix: Expose same recipient read metric and mark-read semantics to author and recipient

## G2-10-002-078 [P1] GAP facet F21
- Files: src/modules/announcements/super-admin-college-broadcast-service.ts
- Legacy: Legacy broadcasts write bell audit immediately; superadmin broadcast path does not run scheduling worker `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/PlacementAnnouncementService.java:352-389`
- Expected fix: Implement and test scheduled dispatch worker or remove scheduled UI until delivery supported

## G2-10-008-080 [P1] GAP facet F13
- Files: src/app/(authenticated)/admin/placements/analytics/error.tsx
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/HiringDashboard.js:413-425` partial filter/metric/funnel/report alerts alongside last-good data
- Expected fix: Render per-section failures and retain same-scope previous data

## G2-10-014-007 [P1] MISSING facet F02
- Files: src/app/(authenticated)/admin/placements/jobs/[jobId]/settings/page.tsx
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/jobs/[jobId]/settings.js:145-159 — Drive status Card with one reversible Open/Close button.
- Expected fix: Reinstate visible lifecycle controls.

## G2-10-019-006 [P1] GAP facet F02
- Files: src/app/(authenticated)/admin/features/[collegeId]/page.tsx
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/ModuleAccess.js:641-702 — info banner, warning/status banners, Ant hierarchical table without pagination.
- Expected fix: Replace split-list layout with expandable full hierarchy tree.

## G2-10-023-037 [P1] GAP facet F07
- Files: src/app/(authenticated)/admin/tenants/setup/page.tsx
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/Organizations.js:188-191; docs/legacy-source/frontend/src/pages/superadmin/sections/Colleges.js:584-590 — Org/college lists have separate inline error Alerts with Retry.
- Expected fix: Isolate Org, College and readiness failures with separate Retry

## G2-19-024-004 [P1] GAP facet F03
- Files: src/app/(authenticated)/admin/announcements/page.tsx, src/modules/announcements/super-admin-broadcast-receipts-service.ts
- Legacy: Pinned icon/Updated tag, edit/delete actions, N of M cells read progress; superadmin/announcements.js:70-75; PlacementAnnouncementService.java:338-350
- Expected fix: Render one original broadcast card with pinned, updated, exact reach and read counts plus direct row actions.

## G2-19-024-006 [P1] GAP facet F04
- Files: src/modules/announcements/super-admin-college-broadcast-service.ts, src/app/(authenticated)/admin/announcements/page.tsx
- Legacy: Single broadcast result contains id, title, body, pinned, authorName=42, createdAt, updatedAt, audienceKind/Label, recipientCount, readCount, link and expiry; PlacementAnnouncementService.java:338-350
- Expected fix: Introduce broadcastGroupId and aggregate metadata/receipts to one logical author-facing item, preserving original audience label.

## G2-19-024-007 [P1] GAP facet F04
- Files: src/modules/announcements/super-admin-broadcast-receipts-service.ts
- Legacy: Read count DISTINCT college IDs where any faculty reads, not TPO user count; PlacementAnnouncementService.java:338-344
- Expected fix: Compute N distinct colleges that first-read the broadcast across all grouped college notices.

## G2-19-024-010 [P1] GAP facet F05
- Files: src/modules/announcements/super-admin-college-broadcast-service.ts
- Legacy: Legacy picker lists colleges with faculty type14 or tpo_team_member alphabetically; PlacementAnnouncementService.java:314-318
- Expected fix: Explain and reconcile colleges with team members but no active TPO membership; do not silently omit.

## G2-19-024-025 [P1] GAP facet F10
- Files: src/modules/announcements/super-admin-college-broadcast-service.ts
- Legacy: POST creates ONE placement_announcement + placement_announcement_college target rows, bell for each college; PlacementAnnouncementService.java:379-388
- Expected fix: Add atomic group identity and stable audience snapshot, avoid duplicate broadcast objects in admin history.

## G2-19-024-035 [P1] GAP facet F15
- Files: (none, new feature)
- Legacy: On create bell once per target cell, title `From 42:`, body preview140, link `/tpo/announcements?tab=from42`; PlacementAnnouncementService.java:383-388,620-627
- Expected fix: Match From 42 deep-link, preview text semantics; decide per-college bell vs per-user count equivalence.
