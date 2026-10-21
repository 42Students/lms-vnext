# Work packet: edit src/components/placements/college-drive-attention-cards.tsx

10 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-9/college-admin-jobs-index.md

## G2-9-016-004  [P1] GAP  facet F01  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/DrivesLanding.js:227-230` — Drive card routes to detail /college-admin/jobs/{jobId} preserving safe returnTo.
- vNext now: `src/components/placements/college-drive-attention-cards.tsx:56-59` — Only Applications link in drive preview cards, no overview/card click.
- Fix: Make card itself navigate overview with safe returnTo.

## G2-9-016-017  [P1] GAP  facet F03  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/DrivesLanding.js:410-457` — Attention category rows include learnerName, jobTitle, detail, RightOutlined.
- vNext now: `src/components/placements/college-drive-attention-cards.tsx:22-27` — Rows only drive title/count, no named affected learner/detail.
- Fix: Restore candidate-level attention details and deep links.

## G2-9-016-021  [P1] MISSING  facet F03  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/DrivesLanding.js:566-586` — MoreOutlined dropdown Duplicate as new drive, Extend deadline.
- vNext now: `src/components/placements/college-drive-attention-cards.tsx:56-60` — Only Applications and direct deadline action; Duplicate missing.
- Fix: Add icon dropdown with duplicate/extend.

## G2-9-016-028  [P1] MISSING  facet F04  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/DrivesLanding.js:203-208` — Client search matches jobTitle/companyName, only first60, count shown.
- vNext now: `src/components/placements/college-drive-attention-cards.tsx:42-63` — No active drive search.
- Fix: Add q search with bounded count and warning beyond first60.

## G2-9-016-035  [P1] MISSING  facet F05  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/DrivesLanding.js:565-584` — Drive menu offers duplicate and deadline, not row-level stage mutation.
- vNext now: `src/components/placements/college-drive-attention-cards.tsx:56-60` — Direct Applications link and deadline component, no duplicate.
- Fix: Add full options dropdown and stateful duplicate modal.

## G2-9-016-090  [P1] GAP  facet F19  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/DrivesLanding.js:199-208` — Client filters active top60; explicitly warns when more active results than loaded.
- vNext now: `src/components/placements/college-drive-attention-cards.tsx:48-63` — No search, implicit cap60.
- Fix: Surface cap notice/search-all link, prevent invisible older drives.

## G2-9-016-045  [P2] GAP  facet F07  effort S
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/DrivesLanding.js:390-407` — Attention zero shows green success alert, failure red alert, loading skeleton.
- vNext now: `src/components/placements/college-drive-attention-cards.tsx:14-21` — No flags shows plain paragraph within disclosure.
- Fix: Restore distinct icon/status/banner tri-state.

## G2-9-016-047  [P2] GAP  facet F07  effort S
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/DrivesLanding.js:510-523` — No drives title No active drives yet and CTA Create your first drive.
- vNext now: `src/components/placements/college-drive-attention-cards.tsx:62-63` — No active drives yet. Create your first drive. static paragraph.
- Fix: Render actionable empty state with primary CTA.

## G2-9-016-051  [P2] GAP  facet F08  effort S
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/DrivesLanding.js:402-404` — Attention no issues exact No drives currently flagged in this view. green success.
- vNext now: `src/components/placements/college-drive-attention-cards.tsx:15-17` — Same sentence in plain paragraph; no success treatment.
- Fix: Use Ant green success alert styling.

## G2-9-016-052  [P2] MISSING  facet F08  effort S
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/DrivesLanding.js:515-522` — Empty search message Try a different drive or company name, or clear the current search.
- vNext now: `src/components/placements/college-drive-attention-cards.tsx:62-63` — Only unfiltered no active drives paragraph.
- Fix: Add filtered/unfiltered empty variants and clear action.
