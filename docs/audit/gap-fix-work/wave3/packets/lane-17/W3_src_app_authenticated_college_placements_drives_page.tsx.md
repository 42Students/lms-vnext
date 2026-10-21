# Work packet (wave 3): edit src/app/(authenticated)/college/placements/drives/page.tsx

3 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-9/college-admin-jobs-all.md

## G2-9-015-041  [P1] MISSING  facet F06  effort L
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/Jobs.js:878-903` — Create/edit modal embeds JobForm and closes on success/cancel.
- vNext now: `src/app/(authenticated)/college/placements/drives/page.tsx:43-47` — Edit navigates settings; create absent.
- Fix: Add modal with JobForm-equivalent fields or routed sheet.

## G2-9-015-062  [P1] MISSING  facet F10  effort L
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/AdminJobController.java:1020-1076` — Delete impact+soft delete uses preview, cancels active interviews, notifies learners.
- vNext now: `src/app/(authenticated)/college/placements/drives/page.tsx:43-51` — No matching remove/delete operation from this list.
- Fix: Expose safe archive with operationally equivalent cancel/notify behavior.

## G2-9-015-078  [P1] MISSING  facet F15  effort L
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/AdminJobServiceImpl.java:1045-1077` — Deletion notifies affected learners after transaction commit.
- vNext now: `src/app/(authenticated)/college/placements/drives/page.tsx:43-51` — No corresponding action in list UI.
- Fix: Trace equivalent archive learner notifications with same recipient scope.
