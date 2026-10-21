# Work packet (wave 2): edit src/components/placements/college-drive-archive-action.tsx

6 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-9/college-admin-jobs-settings.md

## G2-9-013-008  [P2] GAP  facet F02  effort S
- Legacy: `docs/legacy-source/frontend/src/pages/college-admin/jobs/[jobId]/settings.js:129-136` — Danger zone red title #cf1322, pale red head #fff1f0, red border #ffccc7, margin-top 24.
- vNext now: `src/components/placements/college-drive-archive-action.tsx:36-43` — Delete drive is neutral Disclosure with transparent background and no red warning register.
- Fix: Restore danger-zone visual hierarchy with explicit archival semantics.

## G2-9-013-011  [P2] GAP  facet F03  effort S
- Legacy: `docs/legacy-source/frontend/src/pages/college-admin/jobs/[jobId]/settings.js:139-164` — Delete drive is red primary with DeleteOutlined and destructive Popconfirm.
- vNext now: `src/components/placements/college-drive-archive-action.tsx:36-53` — View delete impact, Archive drive, Yes archive drive and Cancel replace delete icon/action.
- Fix: Use archive-safe text but visually distinguish dangerous action and icon.

## G2-9-013-020  [P2] GAP  facet F04  effort S
- Legacy: `docs/legacy-source/frontend/src/pages/college-admin/jobs/[jobId]/settings.js:139-157` — Warning shows exact n learner(s) have applied and states applications remain.
- vNext now: `src/components/placements/college-drive-archive-action.tsx:43-45` — Preview aggregates n applications, n rounds, n offers, shown after separate click.
- Fix: Expose existing applicant count in warning while retaining richer preview.

## G2-9-013-051  [P2] GAP  facet F09  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/college-admin/jobs/[jobId]/settings.js:142-163` — Delete Popconfirm title Delete {job title}?; body warns irreversible and applications retained.
- vNext now: `src/components/placements/college-drive-archive-action.tsx:43-55` — Archive confirmation is paragraph role=alert, not popover/dialog.
- Fix: Provide accessible confirmation with explicit archive-safe action and impact text.

## G2-9-013-082  [P2] GAP  facet F17  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/college-admin/jobs/[jobId]/settings.js:121-126` — Antd Popconfirm anchors destructive confirmation to trigger.
- vNext now: `src/components/placements/college-drive-archive-action.tsx:45-53` — Inline paragraph role alert and button group; no focus trap/restore.
- Fix: Make archive dialog focus-managed with escape, cancel, return focus.

## G2-9-013-086  [P2] GAP  facet F18  effort S
- Legacy: `docs/legacy-source/frontend/src/pages/college-admin/jobs/[jobId]/settings.js:129-164` — Legacy Danger zone, Delete drive, Delete, Cancel, Drive deleted.
- vNext now: `src/components/placements/college-drive-archive-action.tsx:35-54` — VNext Delete drive section with View delete impact and Archive drive wording.
- Fix: Clarify intentional archive semantics and use accurate label not Delete drive.
