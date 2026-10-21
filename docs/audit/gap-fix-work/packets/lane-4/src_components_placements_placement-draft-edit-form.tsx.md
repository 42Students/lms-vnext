# Work packet: edit src/components/placements/placement-draft-edit-form.tsx

20 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-10/superadmin-jobs-jobid-settings.md, docs/audit/gap2/lane-9/college-admin-jobs-settings.md

## G2-10-014-015  [P1] GAP  facet F04  effort L
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/JobForm.js:950-1019 — Department/Program/Batch/Class dependent academic targeting.
- vNext now: src/components/placements/super-admin-published-drive-edit.tsx:55-76; src/components/placements/placement-draft-edit-form.tsx:577-625 — No targeting in published editor; draft uses programs/cohorts elsewhere.
- Fix: Restore hierarchy with proper scope/clearing.

## G2-10-014-075  [P1] GAP  facet F21  effort L
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/JobForm.js:54-62,453-559 — Single JobForm covers full create/edit, custom fields and targeting.
- vNext now: src/components/placements/super-admin-published-drive-edit.tsx:22-52; src/components/placements/placement-draft-edit-form.tsx:128-177 — Split partial published edit and draft editor in overview.
- Fix: Consolidate mapped settings form.

## G2-9-013-012  [P1] MISSING  facet F03  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/JobForm.js:1138-1183` — Update Job/Save draft/Publish now/Cancel button set varies by draft state.
- vNext now: `src/components/placements/placement-draft-edit-form.tsx:694-709` — Only Save draft changes; no Publish now or Cancel.
- Fix: Restore draft Publish now and Cancel flows with guarded preflight.

## G2-9-013-019  [P1] GAP  facet F04  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/JobForm.js:1018-1076` — Preferred degree/specialization/year/GPA/city are informational display-only preferences.
- vNext now: `src/components/placements/placement-draft-edit-form.tsx:533-688` — Only enforced eligibility-policy measurements appear; preference metadata not shown.
- Fix: Show preferences distinctly as non-gating fields.

## G2-9-013-028  [P1] GAP  facet F06  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/JobForm.js:702-710` — Job Type required from college choices (fallback for no-longer-listed type).
- vNext now: `src/components/placements/placement-draft-edit-form.tsx:393-407` — Fixed employmentType FULL_TIME/INTERNSHIP/CONTRACT select.
- Fix: Wire college job types, unknown saved option and counts-as-placed label.

## G2-9-013-031  [P1] GAP  facet F06  effort L
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/JobForm.js:724-735` — VisibilityType offers INTERNAL_ONLY/HYBRID/EXTERNAL_ONLY with college-vs-org descriptions.
- vNext now: `src/components/placements/placement-draft-edit-form.tsx:484-500` — Application mode INTERNAL/HYBRID/EXTERNAL_ONLY with platform/employer-form meaning.
- Fix: Do not conflate audience visibilityType with application submission mode.

## G2-9-013-032  [P1] MISSING  facet F06  effort S
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/JobForm.js:737-752` — Assessment URL optional http(s), maxLength 2048, showCount, allowClear.
- vNext now: `src/components/placements/placement-draft-edit-form.tsx:483-530` — Has Employer application URL, not assessment URL.
- Fix: Add separate assessment URL with validation and intended audience.

## G2-9-013-033  [P1] MISSING  facet F06  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/JobForm.js:754-783` — Assessment deadline optional DatePicker with time, after application deadline or today.
- vNext now: `src/components/placements/placement-draft-edit-form.tsx:518-530` — Only application datetime input; no assessment deadline.
- Fix: Add assessment datetime, original-unchanged exception and cross-deadline validation.

## G2-9-013-035  [P1] GAP  facet F06  effort L
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/JobForm.js:950-1014` — Target Department, Program, Batch and Class cascading selectors; blank means broad.
- vNext now: `src/components/placements/placement-draft-edit-form.tsx:540-615` — Program/cohort checkboxes; no Department or Class selectors.
- Fix: Restore exact targeting mapping, including class-level boundary.

## G2-9-013-036  [P1] GAP  facet F06  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/JobForm.js:1028-1076` — Preferred degree/specialization/year/min GPA/city have independent inputs and limits.
- vNext now: `src/components/placements/placement-draft-edit-form.tsx:620-688` — Eligibility numeric fields replace advisory preference inputs.
- Fix: Provide separate advisory preferences; never silently translate to hard eligibility.

## G2-9-013-039  [P1] GAP  facet F07  effort S
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/JobForm.js:27-36` — Empty rich text rejected with Please enter job description after stripping HTML.
- vNext now: `src/components/placements/placement-draft-edit-form.tsx:379-389` — HTML textarea required; no stripHtml whitespace-content check.
- Fix: Validate meaningful rich text, not HTML-tag-only payload.

## G2-9-013-052  [P1] GAP  facet F09  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/JobForm.js:560-571` — 409 optimistic edit conflict Modal with Reload and Dismiss.
- vNext now: `src/components/placements/placement-draft-edit-form.tsx:346-354` — Generic Could not update draft toast; no conflict-specific modal.
- Fix: Show dedicated stale-write reload dialog and avoid partial save.

## G2-9-013-065  [P1] GAP  facet F12  effort L
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/JobForm.js:1018-1025` — Legacy candidate preferences informational, do NOT gate applications.
- vNext now: `src/components/placements/placement-draft-edit-form.tsx:533-688` — VNext eligibility policy has hard minCGPA/backlog/education thresholds.
- Fix: Separate informational preferences from enforced eligibility policies.

## G2-9-013-085  [P1] GAP  facet F18  effort S
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/JobForm.js:901-1025` — Legacy Target Audience and Candidate Preferences (informational — not enforced).
- vNext now: `src/components/placements/placement-draft-edit-form.tsx:533-537` — VNext Eligibility rules, no advisory preference copy.
- Fix: Use separate section headings and explanatory contrast.

## G2-9-013-091  [P1] GAP  facet F20  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/JobForm.js:560-571` — On 409 optimistic version failure, reload before continuing.
- vNext now: `src/components/placements/placement-draft-edit-form.tsx:346-354` — Generic toast on errors; no stale version recovery.
- Fix: Wire 409 to Reload/Dismiss conflict recovery.

## G2-9-013-040  [P2] MISSING  facet F07  effort S
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/JobForm.js:1036-1053` — Graduation year exactly 4 digits, 1990-2050 with two precise errors.
- vNext now: `src/components/placements/placement-draft-edit-form.tsx:618-687` — No advisory graduation year field/validation.
- Fix: Add identical year range and error copy.

## G2-9-013-041  [P2] GAP  facet F07  effort S
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/JobForm.js:1056-1071` — GPA min 0 max 10; error GPA must be between 0 and 10.
- vNext now: `src/components/placements/placement-draft-edit-form.tsx:618-638` — MinCGPA eligibility input has min0 but different meaning and validation.
- Fix: Validate advisory GPA independently and show exact error.

## G2-9-013-042  [P2] MISSING  facet F07  effort S
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/JobForm.js:833-870` — Important date errors Label required when date is set, Date required when label is set, reserved application deadline.
- vNext now: `src/components/placements/placement-draft-edit-form.tsx:518-529` — No custom milestone validator/messages.
- Fix: Implement paired-field/reserved-name errors literally.

## G2-9-013-043  [P2] GAP  facet F07  effort S
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/JobForm.js:737-763` — Assessment URL invalid error Must be a valid http or https URL; 2048 max.
- vNext now: `src/components/placements/placement-draft-edit-form.tsx:502-517` — External URL uses HTML url validation, no assessment link error.
- Fix: Use legacy assessment URL pattern and messages.

## G2-9-013-048  [P2] GAP  facet F08  effort S
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/JobForm.js:549-566` — Save success Job updated successfully / Job saved as draft / Job published successfully.
- vNext now: `src/components/placements/placement-draft-edit-form.tsx:338-353` — Toast Draft updated plus description Job details and eligibility rules were saved.
- Fix: Choose copy by action and lifecycle; match old phrases when same action.
