# Work packet: edit src/app/(authenticated)/tpo/drive-day/[roundId]/page.tsx

4 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-11/tpo-drive-day-roundid.md

## G2-11-008-003  [P1] GAP  facet F01  effort M
- Legacy: Operator screen and restricted learner field-mode share legacy page. `docs/legacy-source/frontend/src/pages/tpo/drive-day/[roundId].js:22`
- vNext now: TPO-only renders new overview, LEARNER or mixed-role renders coordinator page. `src/app/(authenticated)/tpo/drive-day/[roundId]/page.tsx:29`
- Fix: Route by active workspace, not mere mixed role; preserve full operator surface.

## G2-11-008-038  [P1] GAP  facet F07  effort M
- Legacy: Roster denial shows `This drive day isn't available to you.` inline. `docs/legacy-source/frontend/src/pages/tpo/drive-day/[roundId].js:46`
- vNext now: Not-found throws 404; learner load failures redirect. `src/app/(authenticated)/tpo/drive-day/[roundId]/page.tsx:46`
- Fix: Render in-workflow error panel and retry.

## G2-11-008-048  [P1] GAP  facet F10  effort M
- Legacy: GET `/api/v1/tpo/drive-day/{roundId}/roster` refreshes every 20s. `docs/legacy-source/frontend/src/api/Services/TpoHubService.js:123`
- vNext now: TPO server fetch only at navigation/refresh. `src/app/(authenticated)/tpo/drive-day/[roundId]/page.tsx:41`
- Fix: Provide guarded 20s refresh for TPO with stale-previous-data state.

## G2-11-008-056  [P1] GAP  facet F11  effort M
- Legacy: Legacy URL opens operator experience for TPO. `src/app/(authenticated)/tpo/drive-day/[roundId]/page.tsx:33`
- vNext now: Mixed TPO+LEARNER membership prefers limited coordinator page. `src/app/(authenticated)/tpo/drive-day/[roundId]/page.tsx:29`
- Fix: Use selected TPO role, not implicit learner priority.
