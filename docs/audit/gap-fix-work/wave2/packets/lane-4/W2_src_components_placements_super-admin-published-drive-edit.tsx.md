# Work packet (wave 2): edit src/components/placements/super-admin-published-drive-edit.tsx

9 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-10/superadmin-jobs-jobid-settings.md, docs/audit/gap2/lane-10/superadmin-sections-job-form.md

## G2-10-014-004  [P2] GAP  facet F01  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/jobs/[jobId]/settings.js:141-143 — Save/Cancel returns to /superadmin/jobs/:jobId.
- vNext now: src/components/placements/super-admin-published-drive-edit.tsx:36-52 — Save refreshes current settings; cancel hides editor.
- Fix: Restore legacy-facing behavior through selected-college-scoped services.

## G2-10-014-014  [P2] MISSING  facet F04  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/JobForm.js:724-733 — Visibility controls in edit form.
- vNext now: src/components/placements/super-admin-published-drive-edit.tsx:55-76 — No visibility field in published editor.
- Fix: Expose configured visibility mode.

## G2-10-014-025  [P2] GAP  facet F06  effort L
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/JobForm.js:684-700 — Rich text editors with example Job Description and Responsibilities placeholders.
- vNext now: src/components/placements/super-admin-published-drive-edit.tsx:60-61 — Description plain textarea; responsibilities read-only.
- Fix: Restore rich editor with sanitizer.

## G2-10-014-052  [P2] GAP  facet F12  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/JobForm.js:100-102,476-491 — Unchanged past deadlines can remain while editing unrelated fields.
- vNext now: src/components/placements/super-admin-drive-deadline.tsx:13-23; src/components/placements/super-admin-published-drive-edit.tsx:59-60 — Extend deadline strictly > existing; published form requires deadline.
- Fix: Permit unchanged past deadline when editing unrelated properties.

## G2-10-014-056  [P2] GAP  facet F14  effort L
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/JobForm.js:689-700 — Rich HTML description/responsibilities, no upload in page.
- vNext now: src/components/placements/super-admin-published-drive-edit.tsx:60-61; src/app/(authenticated)/admin/placements/jobs/[jobId]/settings/page.tsx:37-63 — Plain description, read-only legacy HTML details.
- Fix: Preserve legitimate formatted content.

## G2-10-014-061  [P2] GAP  facet F16  effort L
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/JobForm.js:619-1137 — Ant Row/Col form grid and many responsive hierarchy inputs.
- vNext now: src/components/placements/super-admin-published-drive-edit.tsx:53-83 — sm:grid-cols-2 with fewer fields.
- Fix: Recreate grid and fields at 768/992px.

## G2-10-030-057  [P2] GAP  facet F20  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/JobForm.js:517-520,558-569 — version optimistic token, 409 reload recovery.
- vNext now: src/components/placements/super-admin-published-drive-edit.tsx:33-49 — expectedUpdatedAt token and inline conflict feedback.
- Fix: Match reload recovery and stale form protection.

## G2-10-014-023  [P3] GAP  facet F06  effort S
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/JobForm.js:619-627 — Job Title placeholder 'e.g., Software Engineer', autofocus, max100.
- vNext now: src/components/placements/super-admin-published-drive-edit.tsx:58-59 — Title has no placeholder/autoFocus; max100.
- Fix: Restore placeholder and focus.

## G2-10-014-067  [P3] GAP  facet F18  effort S
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/JobForm.js:621-627 — Job Title; placeholder 'e.g., Software Engineer'.
- vNext now: src/components/placements/super-admin-published-drive-edit.tsx:58-59 — Title with no placeholder.
- Fix: Restore exact copy.
