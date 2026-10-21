# Work packet: edit src/components/placements/placement-job-create-form.tsx (part 1 of 2)

20 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-10/superadmin-sections-job-form.md, docs/audit/gap2/lane-11/tpo-drives-new.md

## G2-10-030-001  [P1] GAP  facet F01  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/JobForm.js:54-60 — reusable JobForm in Super Admin Jobs and college drive settings.
- vNext now: src/components/placements/placement-job-create-form.tsx:99-115 and src/app/(authenticated)/admin/placements/jobs/[jobId]/settings/page.tsx:14-35 — college-scoped create form plus separate Super Admin edit UI.
- Fix: Unify create/edit/duplicate routes or explicitly map role-appropriate capabilities.

## G2-10-030-002  [P1] GAP  facet F01  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/JobForm.js:114-116,912-949 — global SA first chooses Organization and College.
- vNext now: src/components/placements/placement-job-create-form.tsx:109-114,712-739 — college supplied, active season; no organization selector.
- Fix: Add Super Admin organization/college selection and cascading context before create.

## G2-10-030-007  [P1] GAP  facet F03  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/JobForm.js:785-900 — Important dates structured date rows directly in form.
- vNext now: src/components/placements/placement-job-create-form.tsx:1170-1173 — Important dates raw multiline textarea inside closed details.
- Fix: Restore date row editor with validators and datepicker.

## G2-10-030-011  [P1] GAP  facet F04  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/JobForm.js:684-693 — Job Description required rich-text editor height280.
- vNext now: src/components/placements/placement-job-create-form.tsx:928-937 — plain textarea, max15000, description not required.
- Fix: Restore rich text and nonempty HTML-stripped validation.

## G2-10-030-013  [P1] GAP  facet F04  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/JobForm.js:702-709 — Job Type from college Settings choices, including placed-count labels.
- vNext now: src/components/placements/placement-job-create-form.tsx:939-959 — Employment type only FULL_TIME/INTERNSHIP/CONTRACT, custom types omitted.
- Fix: Wire configurable job types and placed-counting policy.

## G2-10-030-015  [P1] MISSING  facet F04  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/JobForm.js:724-735 — Visibility INTERNAL_ONLY, HYBRID, EXTERNAL_ONLY.
- vNext now: src/components/placements/placement-job-create-form.tsx:1193-1195 — no corresponding visibility select, college-targeted applicationMode.
- Fix: Add explicit visibility scope with exact three descriptions.

## G2-10-030-016  [P1] GAP  facet F05  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/JobForm.js:114-205,345-435 — parent organization filters college, department, program, batch, class.
- vNext now: src/components/placements/placement-job-create-form.tsx:161-186,1196-1320 — department filter, multi-select programs/cohorts/sections; no org selector.
- Fix: Map cascade and target audience semantics by role.

## G2-10-030-021  [P1] GAP  facet F06  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/JobForm.js:33-38,684-693 — whitespace-only rich HTML rejected Please enter job description.
- vNext now: src/components/placements/placement-job-create-form.tsx:928-937 — optional plain description; no stripHtml validation.
- Fix: Add required HTML-stripped rule.

## G2-10-030-038  [P1] GAP  facet F10  effort L
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/JobForm.js:498-540 — createAdminJob/updateAdminJob with college ID and version, jobData includes legacy details.
- vNext now: src/components/placements/placement-job-create-form.tsx:416-668 — create company relationship and placement job via POST /api/placements/jobs plus metadata.
- Fix: Map every legacy field and edit CAS into vNext write route.

## G2-10-030-040  [P1] MISSING  facet F11  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/JobForm.js:114-116,912-949 — Super Admin can select org and college to create job.
- vNext now: src/components/placements/placement-job-create-form.tsx:101-114 — requires preselected college and season, not global SA mode.
- Fix: Enable admin-global-scoped workflow via selected college.

## G2-10-030-062  [P1] GAP  facet F23  effort L
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/JobForm.js:578-1193 — single legacy form supports duplicate/edit/create with visibility, important date row editing.
- vNext now: src/components/placements/placement-job-create-form.tsx:669-1490 — adds seasons, round presets, browser backup, company canonical IDs but fragments old form.
- Fix: Restate explicit parity decision for source modes and restore missing fields.

## G2-11-013-009  [P1] GAP  facet F03  effort M
- Legacy: Publish button available after draft saved and checked. `docs/legacy-source/frontend/src/components/tpo/DriveFormPage.js:503`
- vNext now: New Create draft button only; publish happens later. `src/components/placements/placement-job-create-form.tsx:1454`
- Fix: Expose Review & publish CTA with preflight after create.

## G2-11-013-017  [P1] GAP  facet F04  effort L
- Legacy: Regular/Dream/Super-dream tiers determined by max CTC >=10/>=20. `docs/legacy-source/frontend/src/components/tpo/DriveFormPage.js:35`
- vNext now: New boolean Dream drive tied to held-offer exception. `src/components/placements/placement-job-create-form.tsx:1040`
- Fix: Restore separate 3-tier pay category model.

## G2-11-013-018  [P1] MISSING  facet F04  effort M
- Legacy: Override tier requires category reason. `docs/legacy-source/frontend/src/components/tpo/DriveFormPage.js:647`
- vNext now: No tier override/reason. `src/components/placements/placement-job-create-form.tsx:1040`
- Fix: Implement reason-required manual tier override.

## G2-11-013-019  [P1] GAP  facet F05  effort M
- Legacy: Default drive mode ON_CAMPUS. `docs/legacy-source/frontend/src/components/tpo/DriveFormPage.js:195`
- vNext now: New work mode values ONSITE/HYBRID/REMOTE. `src/components/placements/placement-job-create-form.tsx:960`
- Fix: Provide distinct ON_CAMPUS/POOL/OFF_CAMPUS selector.

## G2-11-013-029  [P1] MISSING  facet F06  effort M
- Legacy: Override Category requires reason. `docs/legacy-source/frontend/src/components/tpo/DriveFormPage.js:651`
- vNext now: Dream checkbox with no category reason. `src/components/placements/placement-job-create-form.tsx:1040`
- Fix: Require manual category reason at client/server boundary.

## G2-11-013-030  [P1] GAP  facet F06  effort L
- Legacy: Round kind/name/mode independently editable on create. `docs/legacy-source/frontend/src/components/tpo/DriveFormPage.js:711`
- vNext now: New round template rows created pending; mode/schedule set later. `src/components/placements/placement-job-create-form.tsx:1439`
- Fix: Restore per-round name/kind/mode before save.

## G2-11-013-043  [P1] GAP  facet F10  effort L
- Legacy: Create drive submits company, job, eligibility and initial rounds. `docs/legacy-source/frontend/src/components/tpo/DriveFormPage.js:17`
- vNext now: New POST job then separate policy and rounds calls. `src/components/placements/placement-job-create-form.tsx:471`
- Fix: Implement resumable atomic-equivalent create with full reporting.

## G2-11-013-044  [P1] GAP  facet F10  effort L
- Legacy: Draft autosaves to server 1200ms after entry. `docs/legacy-source/frontend/src/components/tpo/DriveFormPage.js:327`
- vNext now: New 400ms browser-local backup, server only on Create draft. `src/components/placements/placement-job-create-form.tsx:272`
- Fix: Restore server draft autosave as parity decision, keep local backup.

## G2-11-013-045  [P1] GAP  facet F10  effort L
- Legacy: Eligibility preview fetched pre-publish after draft changes. `docs/legacy-source/frontend/src/components/tpo/DriveFormPage.js:18`
- vNext now: New reach verification deferred to saved workspace. `src/components/placements/placement-job-create-form.tsx:1446`
- Fix: Add preview server endpoint before final publication.
