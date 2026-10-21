# Work packet: edit src/app/(authenticated)/tpo/notifications/page.tsx

2 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-8/l11-u018-tpo-notifications.md

## G2-11-018-017  [P2] GAP  facet F07  effort M
- Legacy: docs/legacy-source/frontend/src/pages/tpo/notifications.js:44 error 'Could not load notifications' and :116 PanelError retry.
- vNext now: src/app/(authenticated)/tpo/notifications/page.tsx:58 directly awaits getTpoPersonalInbox, no in-page catch/Retry, error boundary handles exceptions.
- Fix: Render PanelError 'Could not load notifications' and Retry rather than unhandled section failure.

## G2-11-018-019  [P2] GAP  facet F07  effort M
- Legacy: docs/legacy-source/frontend/src/pages/tpo/notifications.js:136 failed refresh shows 'This refresh failed. Showing the last successful load.' with Retry.
- vNext now: src/app/(authenticated)/tpo/notifications/page.tsx:88 TpoNotificationRefresh reloads; server render can't preserve last snapshot or show stale banner.
- Fix: Keep last-success data for same-scope refresh and show exact stale error Alert.
