# Work packet: edit src/components/placements/placement-job-create-workspace.tsx

7 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-11/tpo-drives-new.md, docs/audit/gap2/lane-9/college-admin-jobs-index.md

## G2-11-013-031  [P1] GAP  facet F07  effort M
- Legacy: Failure loading supporting lists shows Retry setup data, keeps form. `docs/legacy-source/frontend/src/components/tpo/DriveFormPage.js:510`
- vNext now: New companies/programs/seasons Promise.all rejects whole render. `src/components/placements/placement-job-create-workspace.tsx:32`
- Fix: Provide partial support data with warning/retry.

## G2-11-013-056  [P1] GAP  facet F13  effort M
- Legacy: Support-data errors keep available form and Retry. `docs/legacy-source/frontend/src/components/tpo/DriveFormPage.js:510`
- vNext now: Any Promise.all failure aborts page. `src/components/placements/placement-job-create-workspace.tsx:32`
- Fix: Isolate missing company/program/season fetch.

## G2-11-013-061  [P1] GAP  facet F14  effort M
- Legacy: Clone copies source rounds while clearing dates. `docs/legacy-source/frontend/src/components/tpo/DriveFormPage.js:395`
- vNext now: New copy blurb says rounds never carried over. `src/components/placements/placement-job-create-workspace.tsx:107`
- Fix: Clone round configuration unless deliberate documented change.

## G2-11-013-083  [P1] GAP  facet F21  effort L
- Legacy: JD, company history, eligibility preview and clone integrations. `docs/legacy-source/frontend/src/components/tpo/DriveFormPage.js:18`
- vNext now: New company data/clone but no JD upload and preview pre-save. `src/components/placements/placement-job-create-workspace.tsx:14`
- Fix: Restore missing integrations.

## G2-9-016-038  [P1] GAP  facet F06  effort L
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/DrivesLanding.js:656-673` — New/Duplicate form in 800px modal, duplicateFrom, empty job, collegeId, success refresh both collections.
- vNext now: `src/components/placements/placement-job-create-workspace.tsx:97-115` — Create drive separate page, no modal duplicate from live card for College Admin.
- Fix: Restore duplicateFrom data mapping and modal sequence.

## G2-9-016-061  [P1] GAP  facet F10  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/DrivesLanding.js:565-586` — Duplicate uses existing job as JobForm duplicateFrom, creates distinct new drive.
- vNext now: `src/components/placements/placement-job-create-workspace.tsx:48-57` — Recent-drive clone workspace restricted to TPO only; College Admin not offered.
- Fix: Expose duplicate to College Admin, clone only metadata/no applicants.

## G2-9-016-105  [P1] GAP  facet F23  effort L
- Legacy: `src/components/placements/placement-job-create-workspace.tsx:48-57` — Old duplicate available for active card to College Admin.
- vNext now: `src/components/placements/placement-job-create-workspace.tsx:48-57` — New clone history only TPO, completed nonarchived.
- Fix: Add college-admin clone with safe metadata-only semantics.
