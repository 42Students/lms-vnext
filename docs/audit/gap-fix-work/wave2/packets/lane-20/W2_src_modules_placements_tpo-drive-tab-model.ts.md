# Work packet (wave 2): edit src/modules/placements/tpo-drive-tab-model.ts

7 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-11/tpo-drives-jobid.md, docs/audit/gap2/lane-5/u023-tpo-change-request-controller.md

## G2-11-010-001  [P2] GAP  facet F01  effort M
- Legacy: Legacy job detail has six main tabs Applicants,Rounds,Offers,Drive day,Discussion,About this drive. `docs/legacy-source/frontend/src/pages/tpo/drives/[jobId].js:38`
- vNext now: vNext has 7 route tabs, adds Overview and uses Drive day hyphen slug. `src/modules/placements/tpo-drive-tab-model.ts:6`
- Fix: Make tab count/labels/ordering match; retain Overview deep link alias.

## G2-11-010-003  [P2] GAP  facet F01  effort L
- Legacy: Changing tab replaces ?tab= via shallow router, preserves job page. `docs/legacy-source/frontend/src/pages/tpo/drives/[jobId].js:133`
- vNext now: Each tab has distinct URL/subpage. `src/modules/placements/tpo-drive-tab-model.ts:34`
- Fix: Either restore one in-page tab strip or exact navigation/active styling while preserving deep links.

## G2-11-010-029  [P2] GAP  facet F05  effort S
- Legacy: Applicant tab badge count is applicants.length. `docs/legacy-source/frontend/src/pages/tpo/drives/[jobId].js:461`
- vNext now: vNext tab link Applicants has no count. `src/modules/placements/tpo-drive-tab-model.ts:8`
- Fix: Display exact applicants count in tab.

## G2-11-010-030  [P2] GAP  facet F05  effort S
- Legacy: Rounds tab count rounds.length. `docs/legacy-source/frontend/src/pages/tpo/drives/[jobId].js:462`
- vNext now: vNext label Rounds without count. `src/modules/placements/tpo-drive-tab-model.ts:9`
- Fix: Display round count in tab.

## G2-11-010-031  [P2] GAP  facet F05  effort S
- Legacy: Offers tab count only RELEASED/ACCEPTED. `docs/legacy-source/frontend/src/pages/tpo/drives/[jobId].js:464`
- vNext now: vNext Offers label no count. `src/modules/placements/tpo-drive-tab-model.ts:10`
- Fix: Expose matching released/accepted count.

## G2-11-010-084  [P2] GAP  facet F17  effort M
- Legacy: AntD Tabs keyboard navigation and active key via URL. `docs/legacy-source/frontend/src/pages/tpo/drives/[jobId].js:459`
- vNext now: Separate link tabs use route navigation. `src/modules/placements/tpo-drive-tab-model.ts:4`
- Fix: Preserve active underline/tab semantics and keyboard roving focus.

## G2-5-023-002  [P2] GAP  facet F01  effort M
- Legacy: Legacy renders an embedded `Change requests` card within the drive, opened through a `Request a change` modal. `docs/legacy-source/frontend/src/components/tpo/drive/ChangeRequests.jsx:160-170`
- vNext now: vNext is a separate page accessed from secondary `Change requests` link, with expandable inline composer. `src/app/(authenticated)/tpo/placements/jobs/[jobId]/change-requests/page.tsx:11-25`, `src/modules/placements/tpo-drive-tab-model.ts:18-28`
- Fix: Restore contextual embedded access or provide equivalent in-drive jump/action while retaining new route.
