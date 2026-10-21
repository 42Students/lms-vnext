# Work packet: edit src/app/api/tracker/issues/route.ts

4 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-16/u002-tracker-report.md, docs/audit/gap2/lane-16/u004-tracker-issues-index.md, docs/audit/gap2/lane-6/l11-u026-public-bug-tracker-controller.md

## G2-16-002-045  [P1] GAP  facet F10  effort L
- Legacy: `BugTrackerService.js:54-56`; `PublicBugTrackerController.java:31-35`: PUBLIC POST `/api/v1/public/bug-tracker/issues`, response issue itself.
- vNext now: `src/app/api/tracker/issues/route.ts:30-47`: authenticated same-origin POST `/api/tracker/issues`, 201 envelope `{issue}`.
- Fix: Provide approved public/reporter-session intake contract or record authenticated redesign; adapt client response envelope.

## G2-16-004-042  [P1] GAP  facet F10  effort L
- Legacy: `BugTrackerService.js:58-65`; `PublicBugTrackerController.java:37-47`: public GET `/api/v1/public/bug-tracker/issues?page&size&...`.
- vNext now: `src/app/api/tracker/issues/route.ts:12-27`; `admin-service.ts:134-206`: signed-in Super Admin GET and opaque cursor.
- Fix: Provide policy-approved searchable reporter view; map legacy page param/API semantics or intentional migration.

## G2-16-004-076  [P1] GAP  facet F21  effort L
- Legacy: `issues/index.js:99-122`; `BugTrackerService.js:58-65`: bug tracker issues endpoint.
- vNext now: `src/app/api/tracker/issues/route.ts:12-27`: private admin endpoint using same DB10 data model.
- Fix: Restore approved public list/related endpoint for nonmanager reporters if external tracker retained.

## G2-11-026-014  [P2] GAP  facet F07  effort M
- Legacy: Invalid status/environment/account role/severity has 'Invalid <field>' (BugTrackerService.java:156-170).
- vNext now: Zod enum validation and INVALID_REQUEST response (report-input-model.ts:9-19; issues/route.ts:21-22,44).
- Fix: Normalize public API validation errors and field messages.
