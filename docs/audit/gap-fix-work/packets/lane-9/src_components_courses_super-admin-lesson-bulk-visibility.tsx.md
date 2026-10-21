# Work packet: edit src/components/courses/super-admin-lesson-bulk-visibility.tsx

11 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-15/u003-superadmin-lessons.md, docs/audit/gap2/lane-18/u002-superadmin-lessons.md, docs/audit/gap2/lane-2/admin-lesson-bulk-controller.md

## G2-15-003-043  [P1] GAP  facet F08  effort M
- Legacy: Bulk success `Show/Hide to students: {updatedCount} lesson(s) updated.` (`sections/Lessons.js:346-369`).
- vNext now: Inline report `X content records updated · Y unchanged · Z failed` (`super-admin-lesson-bulk-visibility.tsx:52-56`).
- Fix: Preserve per-lesson update semantics and counts; report content-level changes separately.

## G2-15-003-052  [P1] GAP  facet F10  effort L
- Legacy: Bulk `bulkUpdateLessonStatus({lessonIds,active,enabled})` updates lessons (`sections/Lessons.js:346-369`; `AdminService.js:536-537`).
- vNext now: Bulk POST `/api/admin/lessons/bulk-status` with `visibleToStudents`, `confirmed`, affects published content (`super-admin-lesson-bulk-visibility.tsx:11-25,33-56`).
- Fix: Treat lesson visibility and child-content publish flags separately and display affected row types.

## G2-15-003-065  [P1] GAP  facet F13  effort M
- Legacy: Bulk partial failure retains failed IDs selected; `Retry failed`, first five reasons (`sections/Lessons.js:346-379,473-491`).
- vNext now: Report shows first25 generic `Lesson update was not applied...` without reason, `selected` not reduced to failed (`super-admin-lesson-bulk-visibility.tsx:13-27,52-56`).
- Fix: Keep exact failed IDs/reasons and retry only failed subset with summary counts.

## G2-15-003-082  [P1] GAP  facet F20  effort M
- Legacy: Bulk disables on loadError and selected IDs only; failure IDs carried to retry (`sections/Lessons.js:346-379,473-505`).
- vNext now: Page selection independent; `pending` and selection check only; report lacks targeted retry (`super-admin-lesson-bulk-visibility.tsx:13-27,48-56`).
- Fix: Retry only failed IDs; reject stale/invalid selections and prevent bulk during degraded view.

## G2-18-002-113  [P1] GAP  facet F20  effort M
- Legacy: Legacy hide/show partial failure retains only failed IDs selected for Retry failed. `docs/legacy-source/frontend/src/pages/superadmin/sections/Lessons.js:353-375`, `docs/legacy-source/frontend/src/pages/superadmin/sections/Lessons.js:473-490`
- vNext now: vNext superadmin bulk shows up to 25 failures but selection remains unchanged, no `Retry failed` action. `src/components/courses/super-admin-lesson-bulk-visibility.tsx:17-27`, `src/components/courses/super-admin-lesson-bulk-visibility.tsx:52-55`
- Fix: Store failed IDs and per-item retry without repeating successful changes, preserve error reason.

## G2-2-018-007  [P1] GAP  facet F03  effort S
- Legacy: Lessons.js:499-502 hides when loadError; pending spinner on both controls
- vNext now: super-admin-lesson-bulk-visibility.tsx:49-50 disabled for pending/empty but not directory partial-error
- Fix: Disable bulk edits whenever underlying list is known incomplete or stale.

## G2-2-018-018  [P1] GAP  facet F06  effort M
- Legacy: Lessons.js:499-502 bulk buttons set both active and enabled true/false
- vNext now: super-admin-lesson-bulk-visibility.tsx:17-25 uses one content-visibility switch
- Fix: Make bulk Show/Hide update lesson's own visibility/status, not content visibility.

## G2-2-018-027  [P1] GAP  facet F08  effort M
- Legacy: Lessons.js:362-364 partial `N of M updated. Retry will target only the failed lessons.`
- vNext now: super-admin-lesson-bulk-visibility.tsx:53-55 gives changed/unchanged/content-fail count, no retry link
- Fix: Restore partial update notice and failed-only retry.

## G2-18-002-055  [P2] GAP  facet F08  effort S
- Legacy: Legacy bulk complete success `Show to students: N lesson(s) updated.` `docs/legacy-source/frontend/src/pages/superadmin/sections/Lessons.js:346-375`
- vNext now: vNext report `X content records updated · Y unchanged · Z failed`. `src/components/courses/super-admin-lesson-bulk-visibility.tsx:53-55`
- Fix: Use lesson-level summary plus content-level detail, not swap metric units without explanation.

## G2-18-002-056  [P2] GAP  facet F08  effort S
- Legacy: Legacy confirm bulk content says no files are deleted. `docs/legacy-source/frontend/src/pages/superadmin/sections/Lessons.js:381-388`
- vNext now: vNext browser confirm is a short question lacking file-preservation explanation. `src/components/courses/super-admin-lesson-bulk-visibility.tsx:17-25`
- Fix: Use modal with selected lessons, no-files-deleted reassurance and proper danger styling.

## G2-2-018-026  [P2] GAP  facet F08  effort S
- Legacy: Lessons.js:366-368 `Show to students: N lesson(s) updated.` success toast
- vNext now: super-admin-lesson-bulk-visibility.tsx:53-55 alert gives `N content records updated`
- Fix: Use legacy success toast and count lessons.
