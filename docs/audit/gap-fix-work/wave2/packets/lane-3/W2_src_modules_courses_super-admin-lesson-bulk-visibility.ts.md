# Work packet (wave 2): edit src/modules/courses/super-admin-lesson-bulk-visibility.ts

4 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-2/admin-lesson-bulk-controller.md

## G2-2-018-019  [P2] GAP  facet F06  effort M
- Legacy: AdminLessonBulkController.java:70-72 legacy max defaults 100 and can be app-configured
- vNext now: super-admin-lesson-bulk-visibility.ts:12-14 hard max 25 UUID lesson IDs
- Fix: Honor configurable batch maximum (default 100), or document explicit divergence.

## G2-2-018-044  [P2] GAP  facet F12  effort M
- Legacy: AdminLessonBulkController.java:99-120 updates even if same flags already set; increments updated for success
- vNext now: super-admin-lesson-bulk-visibility.ts:46 skips no-op content and counts changed only
- Fix: Define lesson-level updated semantics counting processed successful lessons, with unchanged separately if desired.

## G2-2-018-060  [P2] GAP  facet F19  effort M
- Legacy: AdminLessonBulkController.java:70-85 up to configured max default100 requested IDs
- vNext now: super-admin-lesson-bulk-visibility.ts:13 max 25; query limit 501 content records
- Fix: Batch lesson writes up to configured cap without cross-item content multiplier.

## G2-2-018-066  [P2] GAP  facet F21  effort M
- Legacy: AdminLessonBulkController.java:56-60 optional AppSettingsService and AdminAuditLogService integrations
- vNext now: super-admin-lesson-bulk-visibility.ts:16-55 uses acting-college and content visibility service; no configured settings/audit call
- Fix: Read bulkStatusMax from tenant/platform setting and log single batch event.
