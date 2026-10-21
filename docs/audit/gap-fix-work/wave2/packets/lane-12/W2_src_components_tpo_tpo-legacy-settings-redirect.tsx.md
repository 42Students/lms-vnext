# Work packet (wave 2): edit src/components/tpo/tpo-legacy-settings-redirect.tsx

4 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-8/l11-u024-tpo-settings.md

## G2-11-024-001  [P2] GAP  facet F01  effort M
- Legacy: docs/legacy-source/frontend/src/pages/tpo/settings.js:94-100 /tpo/settings selected ?tab or # fragment
- vNext now: src/components/tpo/tpo-legacy-settings-redirect.tsx:5-24 client-side redirect to distinct URLs instead of same page
- Fix: Retain same-screen section navigation/deep-link semantics.

## G2-11-024-002  [P2] GAP  facet F01  effort M
- Legacy: docs/legacy-source/frontend/src/pages/tpo/settings.js:73-74 hidden sections and trusted/templates/notifications aliases redirect to rules/recruiters
- vNext now: src/components/tpo/tpo-legacy-settings-redirect.tsx:5-15 sends hidden keys directly to standalone pages
- Fix: Honor MOVED alias mapping and owner-approved hidden visibility.

## G2-11-024-033  [P2] GAP  facet F13  effort M
- Legacy: docs/legacy-source/frontend/src/pages/tpo/settings.js:186-201 eight-row skeleton until access known
- vNext now: src/components/tpo/tpo-legacy-settings-redirect.tsx:17-24 shows Opening settings spinner and redirect
- Fix: Restore skeleton and destination panel frame.

## G2-11-024-046  [P2] GAP  facet F19  effort M
- Legacy: docs/legacy-source/frontend/src/pages/tpo/settings.js:124-129 shallow tab change without remount
- vNext now: src/components/tpo/tpo-legacy-settings-redirect.tsx:17-24 client router.replace causes new server page
- Fix: Preserve in-place tabs or minimize route-loading shifts.
