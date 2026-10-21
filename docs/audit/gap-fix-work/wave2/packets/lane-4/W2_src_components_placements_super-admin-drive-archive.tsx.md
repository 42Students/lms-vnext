# Work packet (wave 2): edit src/components/placements/super-admin-drive-archive.tsx

7 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-10/superadmin-jobs-jobid-settings.md

## G2-10-014-022  [P2] GAP  facet F05  effort S
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/jobs/[jobId]/settings.js:90-92 — After delete navigate /superadmin/jobs.
- vNext now: src/components/placements/super-admin-drive-archive.tsx:32-36 — After archive navigate /admin/placements/drives.
- Fix: Restore route-list context.

## G2-10-014-028  [P2] GAP  facet F06  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/jobs/[jobId]/settings.js:175-185 — Delete '<jobTitle>'? inline Popconfirm; Delete/Cancel.
- vNext now: src/components/placements/super-admin-drive-archive.tsx:45-66 — Expanded impact preview with required reason, explicit archive wording.
- Fix: Keep modern confirmation safety, add legacy visual prominence.

## G2-10-014-040  [P2] GAP  facet F09  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/jobs/[jobId]/settings.js:175-191 — Delete confirmation with job title and dynamic impact description.
- vNext now: src/components/placements/super-admin-drive-archive.tsx:46-66 — Impact form shows counts and reason, different presentation.
- Fix: Align confirm labels while keeping safety.

## G2-10-014-042  [P2] GAP  facet F10  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/jobs/[jobId]/settings.js:31-53 — Independent GET job and hiring metrics via Promise.allSettled; count failure not fatal.
- vNext now: src/app/(authenticated)/admin/placements/jobs/[jobId]/settings/page.tsx:17-18; src/components/placements/super-admin-drive-archive.tsx:18-32 — Job GET only; archive preview count fetched on demand.
- Fix: Show count independently.

## G2-10-014-054  [P2] GAP  facet F13  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/jobs/[jobId]/settings.js:48-49,123-145 — Metrics count unknown doesn't block loaded JobForm.
- vNext now: src/components/placements/super-admin-drive-archive.tsx:22-37 — Archive impact fetched separately, no initial applicant count.
- Fix: Preserve nonfatal metric context.

## G2-10-014-063  [P2] GAP  facet F17  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/jobs/[jobId]/settings.js:175-191 — Popconfirm explicitly labeled Delete/Cancel, anchored to red CTA.
- vNext now: src/components/placements/super-admin-drive-archive.tsx:46-66 — Inline impact form with Cancel, less discoverable under accordion.
- Fix: Restore legacy-facing behavior through selected-college-scoped services.

## G2-10-014-066  [P2] GAP  facet F18  effort S
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/jobs/[jobId]/settings.js:164-190 — Danger zone and Delete drive with quoted job title in Popconfirm.
- vNext now: src/app/(authenticated)/admin/placements/jobs/[jobId]/settings/page.tsx:65-71; src/components/placements/super-admin-drive-archive.tsx:43-63 — More drive actions and Delete without danger styling.
- Fix: Match label prominence and punctuation.
