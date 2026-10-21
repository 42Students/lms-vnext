# Work packet (wave 2): edit src/modules/placements/tpo-audit-service.ts

9 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-11/tpo-audit.md, docs/audit/gap2/lane-20/tpo-workspace-controller.md, docs/audit/gap2/lane-8/cross-08-audit-activity-tracker-analytics.md

## G2-11-006-047  [P2] GAP  facet F12  effort M
- Legacy: Range shows max 5000, recent max 500, sorted created_at DESC then id DESC. `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/TpoAuditService.java:72`
- vNext now: Default 25 page, occurred_at DESC/event_id DESC/kind ASC. `src/modules/placements/tpo-audit-service.ts:545`
- Fix: Align sorting and complete period semantics.

## G2-11-006-073  [P2] GAP  facet F20  effort S
- Legacy: Legacy log detail max1000 chars. `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/TpoAuditService.java:41`
- vNext now: VNext source detail has no uniform max, may overflow grid. `src/modules/placements/tpo-audit-service.ts:176`
- Fix: Set wrapping/overflow and explicit max metadata policy.

## G2-11-006-075  [P2] GAP  facet F21  effort M
- Legacy: Legacy tpo_share_event tracks downloads/share access as operations. `docs/legacy-source/backend/src/main/resources/db/migration/V165__tpo_v1_complete.sql:48`
- vNext now: vNext UNION reads placement_tpo_share_events only when both share tables exist. `src/modules/placements/tpo-audit-service.ts:346`
- Fix: Document missing-table fallback and map share access actions.

## G2-20-021-006  [P2] GAP  facet F05  effort S
- Legacy: Audit limit200 `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/tpo/TpoWorkspaceController.java:241-254`
- vNext now: New pageSize25 `src/modules/placements/tpo-audit-service.ts:34-55`
- Fix: Display totals and pagination

## G2-20-021-007  [P2] GAP  facet F05  effort M
- Legacy: Audit entity/date filters `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/tpo/TpoWorkspaceController.java:241-254`
- vNext now: New kind/date/who/q filters `src/modules/placements/tpo-audit-service.ts:34-55`
- Fix: Map entity filter

## G2-20-021-026  [P2] GAP  facet F19  effort S
- Legacy: Old audit/activity caps100/200 `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/tpo/TpoWorkspaceController.java:67-71,241-254`
- vNext now: New audit cursor/page25 max100 `src/modules/placements/tpo-audit-service.ts:34-55`
- Fix: Show truncated warning

## G2-8-031-003  [P2] GAP  facet F01  effort M
- Legacy: docs/legacy-source/frontend/src/pages/tpo/audit.js:15-18 deep links to /tpo/drives/{id}, recruiter leads and students.
- vNext now: src/modules/placements/tpo-audit-service.ts:579-581 creates entityHref from normalized subject; src/app/(authenticated)/tpo/audit/page.tsx:166-171 still Audit Log.
- Fix: Map old action entity links to new equivalent and preserve default visible link action per row.

## G2-8-031-011  [P2] GAP  facet F03  effort S
- Legacy: docs/legacy-source/frontend/src/pages/tpo/audit.js:80-118 quick looks for Drives, Recruiters, Students, Offers, Rounds, Shares, Settings, Bulk, General.
- vNext now: src/app/(authenticated)/tpo/audit/page.tsx:166-180 dedicated Actor/entity filters and CSV navigation; subject types summarized by src/modules/placements/tpo-audit-service.ts:557-581.
- Fix: Show one-click TPO quick-look chips and active selection indicators in page header.

## G2-11-006-049  [P3] GAP  facet F12  effort S
- Legacy: singular() changes `1 students` to `1 student` before persistence. `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/TpoAuditService.java:44`
- vNext now: No equivalent text normalizer in history SQL. `src/modules/placements/tpo-audit-service.ts:190`
- Fix: Normalize rendered detail safely.
