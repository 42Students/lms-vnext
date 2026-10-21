# Work packet: edit src/app/api/admin/announcements/broadcast/route.ts

2 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-10/superadmin-announcements.md, docs/audit/gap2/lane-11/l19-u024-super-admin-announcement-controller.md

## G2-10-002-043  [P1] GAP  facet F10  effort M
- Legacy: Legacy POST one broadcast to /api/v1/superadmin/announcements with title body pinned link showUntil audience collegeIds `docs/legacy-source/frontend/src/pages/superadmin/announcements.js:44-55` `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/SuperAdminAnnouncementController.java:40-44`
- vNext now: New POST /api/admin/announcements/broadcast with audienceMode collegeIds reviewedCollegeIds title message scheduledAt expiresAt publishConsent `src/components/announcements/super-admin-college-broadcast-form.tsx:33-44` `src/app/api/admin/announcements/broadcast/route.ts:8-16`
- Fix: Define migration-compatible broadcast contract and map fields exactly including immutable target semantics

## G2-19-024-021  [P2] GAP  facet F08  effort M
- Legacy: PUT returns `status: UPDATED`, DELETE `status: DELETED`; SuperAdminAnnouncementController.java:46-55
- vNext now: Broadcast POST returns 201 `{result:{count,noticeIds}}`; broadcast/route.ts:7-17
- Fix: Preserve client action semantics via explicit response mapper; don't treat per-college generic response as group mutation.
