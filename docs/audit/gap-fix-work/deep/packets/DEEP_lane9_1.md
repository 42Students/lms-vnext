# Deep verification packet (rows that fast mode DEFERRED)

These rows were marked DEFERRED without being checked. Each row must now end as exactly one of:
- OK: vNext already matches the old LMS. Give EVIDENCE: the vNext file:line that implements it AND the legacy source file (docs/legacy-source/...) it matches.
- FIXED: you changed the code so it matches. Give the commit and file.

DEFERRED is NOT allowed. For each row: read its full text in the source packet named next to it, find the old behaviour in docs/legacy-source, find the vNext code, decide, and fix if needed.
Keep tests passing and TypeScript valid; never silence errors. Write one result line per row under Results, push, then tick this packet in your queue.

- [ ] G2-5-024-042  (source: docs/audit/gap-fix-work/verify2/packets/lane-11/W1_lane11_6.md)
- [ ] G2-5-024-049  (source: docs/audit/gap-fix-work/verify2/packets/lane-11/W1_lane11_6.md)
- [x] G2-5-024-066  (source: docs/audit/gap-fix-work/verify2/packets/lane-11/W1_lane11_6.md)
- [x] G2-5-030-039  (source: docs/audit/gap-fix-work/verify2/packets/lane-11/W1_lane11_6.md)
- [ ] G2-5-031-037  (source: docs/audit/gap-fix-work/verify2/packets/lane-11/W1_lane11_6.md)
- [ ] G2-5-031-038  (source: docs/audit/gap-fix-work/verify2/packets/lane-11/W1_lane11_6.md)
- [ ] G2-5-031-042  (source: docs/audit/gap-fix-work/verify2/packets/lane-11/W1_lane11_6.md)
- [x] G2-5-031-059  (source: docs/audit/gap-fix-work/verify2/packets/lane-11/W1_lane11_6.md)
- [x] G2-6-008-006  (source: docs/audit/gap-fix-work/verify2/packets/lane-11/W1_lane11_6.md)
- [ ] G2-6-015-032  (source: docs/audit/gap-fix-work/verify2/packets/lane-11/W1_lane11_6.md)

## Results
- OK G2-5-030-039 — `src/components/admin/college-edit-dialog.tsx:49-62,64-110` tracks every editable college field as dirty, blocks close/navigation during pending mutations, and requests discard confirmation for unsaved changes; legacy `docs/legacy-source/frontend/src/pages/superadmin/sections/ManageCollegeDrawer.js:13-33,58-81`.
- OK G2-5-024-066 — `src/modules/tenant-domains/service.ts:315-342` permits confirmed custom-host edits only by rotating verification and clearing the previous trust; legacy `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/TenantAdminController.java:462-505`. Primary verification remains deliberately stronger than legacy relaxed policy.
- OK G2-5-031-059 — `src/modules/colleges/admin-session-service.ts:90-139` implements server-side 25-person pagination, distinct membership counting and independent role loading; legacy `docs/legacy-source/frontend/src/pages/superadmin/sections/AdminUsers.js:469-475`.
- FIXED G2-6-008-006 — commit `4c73e5a47ba009e5254e81a6ba628b4292db6819`, `src/app/(authenticated)/teacher/notifications/page.tsx:90-111` merges personal notifications and announcements by createdAt with deterministic ID tie-break; legacy `docs/legacy-source/frontend/src/components/Notifications/NotificationsContent.jsx:517-575,612-709`.
