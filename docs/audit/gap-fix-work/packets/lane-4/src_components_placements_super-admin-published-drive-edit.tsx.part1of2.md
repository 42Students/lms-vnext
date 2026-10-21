# Work packet: edit src/components/placements/super-admin-published-drive-edit.tsx (part 1 of 2)

20 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-10/superadmin-jobs-jobid-settings.md, docs/audit/gap2/lane-10/superadmin-sections-job-form.md

## G2-10-014-003  [P1] MISSING  facet F01  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/jobs/[jobId]/settings.js:120-121; docs/legacy-source/frontend/src/pages/superadmin/sections/JobForm.js:322-342 — BeforeNavigate consults dirty JobForm, including tab transitions.
- vNext now: src/app/(authenticated)/admin/placements/jobs/[jobId]/settings/page.tsx:20-23; src/components/placements/super-admin-published-drive-edit.tsx:78-83 — No nav guard on back link or published editor.
- Fix: Intercept unsaved navigation.

## G2-10-014-015  [P1] GAP  facet F04  effort L
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/JobForm.js:950-1019 — Department/Program/Batch/Class dependent academic targeting.
- vNext now: src/components/placements/super-admin-published-drive-edit.tsx:55-76; src/components/placements/placement-draft-edit-form.tsx:577-625 — No targeting in published editor; draft uses programs/cohorts elsewhere.
- Fix: Restore hierarchy with proper scope/clearing.

## G2-10-014-019  [P1] GAP  facet F05  effort L
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/JobForm.js:1140-1184 — Save/update, Save draft, Publish, Cancel vary by state.
- vNext now: src/components/placements/super-admin-published-drive-edit.tsx:76-83; src/components/placements/placement-drive-workspace.tsx:579-671 — Published edit Review and save, draft save on Overview, missing exact controls.
- Fix: Provide legacy state-aware action strip.

## G2-10-014-029  [P1] GAP  facet F07  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/JobForm.js:33-38,684-691 — Description required after stripping HTML; message Please enter job description.
- vNext now: src/components/placements/super-admin-published-drive-edit.tsx:60-61 — Published description textarea not required; max15000.
- Fix: Require substantive description or document divergence.

## G2-10-014-031  [P1] MISSING  facet F07  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/JobForm.js:703-711 — Job Type required: 'Please select job type'.
- vNext now: src/components/placements/super-admin-published-drive-edit.tsx:55-76 — Job type not editable here.
- Fix: Add required Job Type.

## G2-10-014-041  [P1] MISSING  facet F09  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/JobForm.js:322-342,1171-1184 — Cancel, browser unload, tabs require dirty confirmation.
- vNext now: src/components/placements/super-admin-published-drive-edit.tsx:53-83 — Published edit Cancel immediately hides form.
- Fix: Use unsaved-navigation guard.

## G2-10-014-045  [P1] GAP  facet F10  effort L
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/JobForm.js:498-559 — JobForm saves complete job fields with version/validation.
- vNext now: src/components/placements/super-admin-published-drive-edit.tsx:30-52 — PATCH edit published subset + required reason + expectedUpdatedAt.
- Fix: Map all full edit payload fields.

## G2-10-014-048  [P1] GAP  facet F11  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/jobs/[jobId]/settings.js:82-101 — Shared mutationRef blocks overlapping delete/status actions.
- vNext now: src/components/placements/super-admin-drive-archive.tsx:11-36; src/components/placements/super-admin-published-drive-edit.tsx:22-40 — Each modern archive/edit guarded independently.
- Fix: Enforce cross-action mutual exclusion/CAS.

## G2-10-014-055  [P1] GAP  facet F13  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/JobForm.js:595-617 — Hierarchy load failures warning; existing details fetch failure blocks unsafe saving.
- vNext now: src/components/placements/super-admin-published-drive-edit.tsx:29-52 — Inline published save errors, no hierarchy fetch.
- Fix: Prevent partial save after incomplete data.

## G2-10-014-064  [P1] MISSING  facet F17  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/JobForm.js:322-342 — Beforeunload dirty guard and Cancel confirmation.
- vNext now: src/components/placements/super-admin-published-drive-edit.tsx:76-83 — Published Cancel closes immediately.
- Fix: Implement keyboard-safe leave confirmation.

## G2-10-014-070  [P1] GAP  facet F19  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/JobForm.js:300-319 — Edit disabled until source details and hierarchy arrive.
- vNext now: src/components/placements/super-admin-published-drive-edit.tsx:20-55 — Server prefills basic info, omits legacy hierarchy.
- Fix: Disallow saving incomplete forms.

## G2-10-014-071  [P1] GAP  facet F20  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/jobs/[jobId]/settings.js:25-26,59-101 — Shared lock prevents delete and status actions concurrently.
- vNext now: src/components/placements/super-admin-drive-archive.tsx:11-36; src/components/placements/super-admin-published-drive-edit.tsx:22-52 — Each control separate action guard.
- Fix: Use shared global entity mutation lock.

## G2-10-014-073  [P1] MISSING  facet F20  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/JobForm.js:322-342 — Browser unload and navigation dirty guard.
- vNext now: src/components/placements/super-admin-published-drive-edit.tsx:76-83 — Editor Cancel lacks dirty guard.
- Fix: Guard dirty state.

## G2-10-014-075  [P1] GAP  facet F21  effort L
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/JobForm.js:54-62,453-559 — Single JobForm covers full create/edit, custom fields and targeting.
- vNext now: src/components/placements/super-admin-published-drive-edit.tsx:22-52; src/components/placements/placement-draft-edit-form.tsx:128-177 — Split partial published edit and draft editor in overview.
- Fix: Consolidate mapped settings form.

## G2-10-014-082  [P1] MISSING  facet F23  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/JobForm.js:322-342 — Unsaved change guard protects forms and tabs.
- vNext now: src/components/placements/super-admin-published-drive-edit.tsx:76-83 — No such guard in published editor.
- Fix: Implement dirty navigation interception.

## G2-10-030-018  [P1] MISSING  facet F05  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/JobForm.js:233-256 — edit prefill existing targetDept/Program/Batch/Class and employer.
- vNext now: src/components/placements/super-admin-published-drive-edit.tsx:24-43 — published-edit form only title/description/deadline/locations/CTC/openings; cannot edit audience.
- Fix: Provide complete edit parity or documented immutable field restrictions.

## G2-10-030-029  [P1] GAP  facet F07  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/JobForm.js:64-72,293-296 — edit prefill failure blocks Save to prevent dropping fields.
- vNext now: src/components/placements/super-admin-published-drive-edit.tsx:24-43 — reduced published edit form; no source comprehensive prefill/lock.
- Fix: Block editing when required saved details could not prefill.

## G2-10-030-039  [P1] GAP  facet F10  effort L
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/JobForm.js:54-66,528-546 — same form handles create and update.
- vNext now: src/components/placements/super-admin-published-drive-edit.tsx:24-43 — separate PATCH /api/admin/placements/jobs/:id/edit-published with reason.
- Fix: Provide full edit parity with authorization/audit constraints.

## G2-10-030-043  [P1] GAP  facet F12  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/JobForm.js:99-105,763-771,796-803 — deadline validator permits unchanged expired dates in edit.
- vNext now: src/components/placements/super-admin-published-drive-edit.tsx:60-64 — published edit requires deadline; no unchanged bypass shown.
- Fix: Allow editing unrelated fields after deadline without forcing future date.

## G2-10-014-030  [P2] GAP  facet F07  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Job.java:29-52 — Job Title length3-100, Company2-100, Description max5000.
- vNext now: src/components/placements/super-admin-published-drive-edit.tsx:58-61 — Title3-100, Description max15000, company absent.
- Fix: Reconcile validation at input/server.
