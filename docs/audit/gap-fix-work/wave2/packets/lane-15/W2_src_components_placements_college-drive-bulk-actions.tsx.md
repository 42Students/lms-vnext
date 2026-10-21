# Work packet (wave 2): edit src/components/placements/college-drive-bulk-actions.tsx

7 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-9/college-admin-jobs-all.md

## G2-9-015-008  [P2] GAP  facet F02  effort S
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/Jobs.js:722-763` — When selected, blue #e6f4ff bulk strip before StudentPlacementLookup.
- vNext now: `src/components/placements/college-drive-bulk-actions.tsx:39-63` — Bulk widget always rendered on every list view, with neutral top border and selector.
- Fix: Show selected-only blue action strip in legacy position.

## G2-9-015-016  [P2] GAP  facet F03  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/Jobs.js:722-754` — Open/Close buttons inside selected-count blue highlight with Popconfirm.
- vNext now: `src/components/placements/college-drive-bulk-actions.tsx:39-70` — Bulk widget offers Preview change then Confirm close/open, no blue highlight.
- Fix: Match legacy bulk selection visuals while retaining impact preview.

## G2-9-015-036  [P2] GAP  facet F05  effort S
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/Jobs.js:838-850` — Row checkboxes disabled for drafts.
- vNext now: `src/components/placements/college-drive-bulk-actions.tsx:18-21` — Eligible rows depend chosen OPEN/CLOSE and include closed or published; drafts ineligible.
- Fix: Clarify exclusion with tooltip; keep draft disabled.

## G2-9-015-057  [P2] GAP  facet F09  effort S
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/Jobs.js:721-755` — Bulk Popconfirm warns learners can/cannot apply after Open/Close.
- vNext now: `src/components/placements/college-drive-bulk-actions.tsx:64-69` — Preview offers to be withdrawn, but no plain learner apply visibility summary.
- Fix: Add old learner visibility consequence to modern offer warning.

## G2-9-015-061  [P2] GAP  facet F10  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/AdminJobController.java:288-330` — Legacy bulk status endpoint max100 IDs.
- vNext now: `src/components/placements/college-drive-bulk-actions.tsx:38-54` — VNext list UI caps 25 IDs; backend bulk API distinct.
- Fix: Expose cap explanation; support cross-page batch if requirements demand.

## G2-9-015-083  [P2] GAP  facet F17  effort S
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/Jobs.js:829-850` — Row checkbox disabled for draft, fixed Actions, Ant pagination labelled.
- vNext now: `src/components/placements/college-drive-bulk-actions.tsx:40-59` — Bulk checkbox label has selected count, separately lists eligible drives.
- Fix: Present eligible/disabled reason accessibly and tie to row identity.

## G2-9-015-104  [P2] GAP  facet F22  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/AdminJobController.java:288-330` — Bulk status accepts up to100, partial success.
- vNext now: `src/components/placements/college-drive-bulk-actions.tsx:38-54` — Client caps25 selected/page.
- Fix: Document cap intentionally reduced and assess multi-page flow.
