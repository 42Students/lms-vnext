# Work packet (wave 2): edit src/components/placements/placement-job-create-workspace.tsx

14 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-11/tpo-drives-new.md, docs/audit/gap2/lane-9/college-admin-jobs-index.md

## G2-11-013-003  [P2] GAP  facet F01  effort S
- Legacy: Listing header and saved-state displayed together. `docs/legacy-source/frontend/src/components/tpo/DriveFormPage.js:485`
- vNext now: New PageHeader has fixed Create drive and new description. `src/components/placements/placement-job-create-workspace.tsx:99`
- Fix: Match header caption and save-state placement.

## G2-11-013-010  [P2] GAP  facet F03  effort M
- Legacy: Clone a past drive is searchable picker. `docs/legacy-source/frontend/src/components/tpo/DriveFormPage.js:562`
- vNext now: Clone options in standalone disclosure/list. `src/components/placements/placement-job-create-workspace.tsx:106`
- Fix: Restore search, selection and card hierarchy.

## G2-11-013-021  [P2] GAP  facet F05  effort M
- Legacy: Clonable statuses include any non REQUEST/SENT_BACK/REJECTED, newest first. `docs/legacy-source/frontend/src/components/tpo/DriveFormPage.js:53`
- vNext now: New permits only CLOSED/CANCELLED last20. `src/components/placements/placement-job-create-workspace.tsx:56`
- Fix: Include old clonable draft/published statuses or label intentional difference.

## G2-11-013-041  [P2] GAP  facet F09  effort M
- Legacy: Clone note shows dropped dates, batches/years and can dismiss. `docs/legacy-source/frontend/src/components/tpo/DriveFormPage.js:528`
- vNext now: New general clone description only, no source-specific note on destination form. `src/components/placements/placement-job-create-workspace.tsx:107`
- Fix: Show detailed cloned-from note post-clone.

## G2-11-013-047  [P2] GAP  facet F11  effort M
- Legacy: Clone picker excludes recruitment requests but permits older finished/new drafts. `docs/legacy-source/frontend/src/components/tpo/DriveFormPage.js:47`
- vNext now: New cloned source limited closed/cancelled, max20. `src/components/placements/placement-job-create-workspace.tsx:56`
- Fix: Restore same list scope.

## G2-11-013-055  [P2] GAP  facet F13  effort S
- Legacy: Loading existing details has explicit loading banner; initial create is ready. `docs/legacy-source/frontend/src/components/tpo/DriveFormPage.js:518`
- vNext now: Create waits for server supporting data, no in-form partial loading. `src/components/placements/placement-job-create-workspace.tsx:32`
- Fix: Add skeleton and partial metadata load status.

## G2-11-013-071  [P2] GAP  facet F17  effort S
- Legacy: Clone picker supports keyboard search. `docs/legacy-source/frontend/src/components/tpo/DriveFormPage.js:562`
- vNext now: Disclosure has buttons only, no search. `src/components/placements/placement-job-create-workspace.tsx:106`
- Fix: Add type-to-filter clone selector.

## G2-11-013-072  [P2] GAP  facet F18  effort S
- Legacy: Section heading Start from. `docs/legacy-source/frontend/src/components/tpo/DriveFormPage.js:559`
- vNext now: Separate Clone a past drive and company selection. `src/components/placements/placement-job-create-workspace.tsx:106`
- Fix: Match heading and grouping.

## G2-11-013-077  [P2] GAP  facet F19  effort L
- Legacy: Fetches student choices, CGPA conversion, batches and company history. `docs/legacy-source/frontend/src/components/tpo/DriveFormPage.js:166`
- vNext now: Fetches company/program/seasons and per-program cohorts, no CGPA factor. `src/components/placements/placement-job-create-workspace.tsx:32`
- Fix: Expose conversion and ensure batch/option completeness.

## G2-11-013-089  [P2] GAP  facet F22  effort M
- Legacy: Clone includes all non-request lifecycle statuses. `docs/legacy-source/frontend/src/components/tpo/DriveFormPage.js:53`
- vNext now: New only closed/cancelled last20. `src/components/placements/placement-job-create-workspace.tsx:56`
- Fix: Match history scope.

## G2-11-013-092  [P2] GAP  facet F23  effort M
- Legacy: Company and clone together in Start from card. `docs/legacy-source/frontend/src/components/tpo/DriveFormPage.js:559`
- vNext now: Separated choices. `src/components/placements/placement-job-create-workspace.tsx:106`
- Fix: Restore first-screen grouping.

## G2-9-016-054  [P2] GAP  facet F09  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/DrivesLanding.js:656-673` — Create Drive or Duplicate {jobTitle} Modal, width800, destroyOnClose.
- vNext now: `src/components/placements/placement-job-create-workspace.tsx:98-106` — Routed standalone Create drive page, separate back link.
- Fix: Provide modal option for landing create/duplicate.

## G2-9-016-074  [P2] GAP  facet F14  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/DrivesLanding.js:656-673` — Duplicate creates draft from metadata; no file upload on cards.
- vNext now: `src/components/placements/placement-job-create-workspace.tsx:104-116` — Create form has own workflows, card duplicate unavailable.
- Fix: Add metadata-only clone; ensure no learner/file artifacts copied.

## G2-11-013-004  [P3] GAP  facet F01  effort S
- Legacy: Back to drives routes to /tpo/drives. `docs/legacy-source/frontend/src/components/tpo/DriveFormPage.js:496`
- vNext now: New Back to Drives goes to /tpo/placements. `src/components/placements/placement-job-create-workspace.tsx:103`
- Fix: Restore old URL alias and exact caption.
