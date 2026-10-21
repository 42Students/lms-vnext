# Work packet (wave 2): edit src/modules/announcements/super-admin-college-broadcast-model.ts

3 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-10/superadmin-announcements.md, docs/audit/gap2/lane-11/l19-u024-super-admin-announcement-controller.md

## G2-10-002-050  [P2] GAP  facet F12  effort M
- Legacy: Legacy one broadcast audience ALL_COLLEGES dynamically resolved to current cells when sent `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/PlacementAnnouncementService.java:352-388`
- vNext now: New ALL_COLLEGES resolved to current active authorized colleges with exact reviewed set `src/modules/announcements/super-admin-college-broadcast-service.ts:47-68` `src/modules/announcements/super-admin-college-broadcast-model.ts:26-34`
- Fix: State exact timing of recipient resolution and avoid presenting selected or all as identical after targets change

## G2-19-024-012  [P2] GAP  facet F06  effort S
- Legacy: Create/edit Title required ≤200, body required ≤8000; frontend rules `Give it a title`, `Write the announcement`; superadmin/announcements.js:82-85; PlacementAnnouncementService.java:605-615
- vNext now: Zod min1/max200, min1/max8000; super-admin-college-broadcast-model.ts:2-13; super-admin-college-broadcast-form.tsx:71-77
- Fix: Keep lengths but emit exact field-level wording and old `Announcement` label.

## G2-19-024-014  [P2] GAP  facet F06  effort S
- Legacy: Link optional HTTPS; max label60 URL500; label defaults Open; PlacementAnnouncementService.java:568-581
- vNext now: Client requires both button label and URL, server Zod requires paired inputs; super-admin-college-broadcast-model.ts:14-21
- Fix: Permit URL with empty label and synthesize `Open` as legacy; keep HTTPS/length checks.
