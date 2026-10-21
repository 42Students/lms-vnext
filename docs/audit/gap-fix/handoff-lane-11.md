# Lane 11 — cross-owner gap fix handoffs

- `src/modules/activity/notification-service.ts` | G2-17-026-002 | Audit and implement class/course-to-membership delivery eligibility for class bell notifications and compatible action deep links; do not use client-selected class IDs.
- `src/modules/activity/notification-service.ts` | G2-18-004-027 | Fan out class/course notices to authorized learner user IDs in current college and merge them with membership notifications.
- `src/components/activity/learner-notifications-inbox.tsx` | G2-18-004-034 | Once class notices are independently sourced, preserve partial failure banner "Couldn't load class notifications" and Retry while other notices stay usable.
- `src/components/activity/learner-notifications-inbox.tsx` | G2-18-004-071 | Provide safe scoped refresh/polling or SSE for new and edited/deleted class notifications; prevent stale personal data crossing membership changes.
- `src/modules/activity/notification-service.ts` | G2-18-004-093 | Inventory legacy class/announcement producers and deliver scheduled/released notices with their tenant-safe refresh lifecycle.
- `src/modules/activity/notification-service.ts` | G2-18-004-024 | Expose complete college-scoped notification count by source/category for the learner tab labels without treating a 60-row preview as total.
- `src/components/activity/learner-notifications-inbox.tsx` | G2-18-004-036 | Retain previously loaded learner list when a refresh fails and show "Couldn't refresh notifications"; avoid false empty state.
- `src/app/api/admin/recycle-bin/restore/route.ts` | G2-2-023-004 | Add an authorized generic archive restore route/dispatcher for recognized entity types, invoking their distinct per-entity restore transitions (do not toggle a generic deleted boolean).
- `src/modules/colleges/search-popularity-service.ts` | G2-4-014-023 | Plan trusted college selection metrics and popularity-based picker ranking; no existing selection-frequency data source, do not fabricate counts or reorder unrelated directory lists.
- `src/app/api/colleges/route.ts` | G2-3-028-034 | Restore precise safe "Clear college scope" feedback for super-admin college creation and organization mismatch; do not loosen authorization.
- `src/app/api/colleges/route.ts` | G2-4-014-027 | Translate non-super-admin missing organization context into legacy-compatible 403 public error copy.
