# Work packet: edit src/app/(authenticated)/tpo/drive-day/page.tsx

11 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-11/tpo-drive-day-index.md

## G2-11-009-001  [P1] GAP  facet F01  effort L
- Legacy: Legacy drive-day home promises all today's on-campus rounds. `docs/legacy-source/frontend/src/pages/tpo/drive-day/index.js:14`
- vNext now: TPO-only route shows rounds currently happening, not all today. `src/app/(authenticated)/tpo/drive-day/page.tsx:61`
- Fix: Add a separate full today on-campus list as the primary page.

## G2-11-009-006  [P1] GAP  facet F01  effort M
- Legacy: Legacy page has a single TPO-oriented purpose. `docs/legacy-source/frontend/src/pages/tpo/drive-day/index.js:15`
- vNext now: LEARNER+TPO mixed role sent to learner coordinator view. `src/app/(authenticated)/tpo/drive-day/page.tsx:45`
- Fix: Respect active portal role when selecting list branch.

## G2-11-009-015  [P1] MISSING  facet F03  effort M
- Legacy: Stale error Alert has Retry action and dismiss affordance. `docs/legacy-source/frontend/src/pages/tpo/drive-day/index.js:54`
- vNext now: No stale alert or manual Retry on TPO snapshot. `src/app/(authenticated)/tpo/drive-day/page.tsx:78`
- Fix: Add dismissible stale-state alert with Retry.

## G2-11-009-032  [P1] GAP  facet F07  effort M
- Legacy: Failed GET displays API message/error then Could not load today's drive-day assignments. `docs/legacy-source/frontend/src/pages/tpo/drive-day/index.js:29`
- vNext now: TPO server loader error propagates; no same fallback. `src/app/(authenticated)/tpo/drive-day/page.tsx:56`
- Fix: Catch and display fallback with retry.

## G2-11-009-038  [P1] MISSING  facet F08  effort M
- Legacy: Refresh failure says This refresh failed. Showing the last successful assignments. `docs/legacy-source/frontend/src/pages/tpo/drive-day/index.js:54`
- vNext now: No previous-good-data fallback. `src/app/(authenticated)/tpo/drive-day/page.tsx:78`
- Fix: Preserve stale cards and exact error text.

## G2-11-009-047  [P1] GAP  facet F11  effort M
- Legacy: Legacy TPO view not overridden by learner capability. `docs/legacy-source/frontend/src/pages/tpo/drive-day/index.js:15`
- vNext now: Mixed roles choose student coordinator branch. `src/app/(authenticated)/tpo/drive-day/page.tsx:45`
- Fix: Route by selected role explicitly.

## G2-11-009-055  [P1] GAP  facet F13  effort M
- Legacy: Initial error has PanelError and Retry. `docs/legacy-source/frontend/src/pages/tpo/drive-day/index.js:47`
- vNext now: New server snapshot has no inline Retry. `src/app/(authenticated)/tpo/drive-day/page.tsx:56`
- Fix: Expose recoverable inline error path.

## G2-11-009-057  [P1] MISSING  facet F13  effort M
- Legacy: Failed refresh preserves previous cards with stale alert. `docs/legacy-source/frontend/src/pages/tpo/drive-day/index.js:54`
- vNext now: No same stale-data state. `src/app/(authenticated)/tpo/drive-day/page.tsx:78`
- Fix: Add last-good snapshot with warning.

## G2-11-009-093  [P1] MISSING  facet F23  effort M
- Legacy: Legacy error/loading/retry/stale/calendar fallbacks exist. `docs/legacy-source/frontend/src/pages/tpo/drive-day/index.js:47`
- vNext now: New TPO route loses all those recovery controls. `src/app/(authenticated)/tpo/drive-day/page.tsx:78`
- Fix: Reimplement UI lifecycle states.

## G2-11-009-033  [P2] GAP  facet F07  effort M
- Legacy: Load errors render inline PanelError on same route. `docs/legacy-source/frontend/src/pages/tpo/drive-day/index.js:47`
- vNext now: Inline errors only for malformed query; data errors use global boundary. `src/app/(authenticated)/tpo/drive-day/page.tsx:49`
- Fix: Differentiate transient fetch errors from invalid filters.

## G2-11-009-037  [P2] MISSING  facet F08  effort S
- Legacy: Refreshing while retaining data shows Refreshing drive-day assignments… `docs/legacy-source/frontend/src/pages/tpo/drive-day/index.js:53`
- vNext now: No incremental refresh banner in TPO route. `src/app/(authenticated)/tpo/drive-day/page.tsx:56`
- Fix: Add refresh pending status.
