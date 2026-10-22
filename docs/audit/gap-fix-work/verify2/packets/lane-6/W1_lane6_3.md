# Verification packet (P1 round 2): 25 rows

For EACH row: open the vNext file(s) it cites, check that the Fix is really implemented (wording, validation, behaviour, permissions, empty/error states, wiring). If it is missing, partial or wrong, FIX it now in the file (keep valid syntax, no uninstalled packages). In your commit message list the row IDs as OK or FIXED. Rows without a vNext file describe a new feature: search the repo for it; if it does not exist, build it.

## G2-10-015-079 [P1] GAP facet F20
- Files: src/components/placements/college-application-pipeline-controls.tsx
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/JobApplications.js:718-750 — Busy mutation guard and 409 conflict retry/reload for status changes.
- Expected fix: Present stale status conflicts and retry.

## G2-10-015-081 [P1] GAP facet F21
- Files: src/components/placements/college-application-pipeline-controls.tsx
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/JobApplications.js:1800-1908 — Bulk transition preview and stage-specific CTA set.
- Expected fix: Map approved state actions to per-stage buttons.

## G2-10-015-084 [P1] GAP facet F22
- Files: src/modules/placements/college-application-stage-service.ts
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/AdminJobController.java:516-603 — Legacy bulk service operates canonical status/history and notifies by email event.
- Expected fix: Reconcile stage effect and event contract.

## G2-10-015-087 [P1] GAP facet F23
- Files: src/components/placements/college-application-pipeline-controls.tsx
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/JobApplications.js:1859-1908 — Distinct contextual bulk Passed/Failed/Hired actions, special failure states.
- Expected fix: Scope and render stage-specific actions.

## G2-10-018-005 [P1] GAP facet F02
- [x] Verified: LectureHallManager uses desktop lg grid 5fr/7fr (10/24 and 14/24), with stacked mobile create/list cards.
- Files: src/app/(authenticated)/admin/lecture-halls/page.tsx
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/LectureHalls.js:301-307 — Inline Create card left 10/24, Existing table card right 14/24.
- Expected fix: Restore desktop side-by-side create/list layout.

## G2-10-030-001 [P1] GAP facet F01
- Files: src/components/placements/placement-job-create-form.tsx, src/app/(authenticated)/admin/placements/jobs/[jobId]/settings/page.tsx
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/JobForm.js:54-60 — reusable JobForm in Super Admin Jobs and college drive settings.
- Expected fix: Unify create/edit/duplicate routes or explicitly map role-appropriate capabilities.

## G2-10-030-002 [P1] GAP facet F01
- Files: src/components/placements/placement-job-create-form.tsx
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/JobForm.js:114-116,912-949 — global SA first chooses Organization and College.
- Expected fix: Add Super Admin organization/college selection and cascading context before create.

## G2-10-030-007 [P1] GAP facet F03
- [x] Verified: Important dates have per-row Label, Date (IST), Type, Add date and Remove controls; submission validates nonblank paired label/date, unique labels, reserved application deadline, and ISO conversion.
- Files: src/components/placements/placement-job-create-form.tsx
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/JobForm.js:785-900 — Important dates structured date rows directly in form.
- Expected fix: Restore date row editor with validators and datepicker.

## G2-10-030-011 [P1] GAP facet F04
- [ ] Partial: description field is now required with 280px height; full rich-text editing remains unavailable.
- Files: src/components/placements/placement-job-create-form.tsx
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/JobForm.js:684-693 — Job Description required rich-text editor height280.
- Expected fix: Restore rich text and nonempty HTML-stripped validation.

## G2-10-030-015 [P1] MISSING facet F04
- Files: src/components/placements/placement-job-create-form.tsx
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/JobForm.js:724-735 — Visibility INTERNAL_ONLY, HYBRID, EXTERNAL_ONLY.
- Expected fix: Add explicit visibility scope with exact three descriptions.

## G2-10-030-016 [P1] GAP facet F05
- Files: src/components/placements/placement-job-create-form.tsx
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/JobForm.js:114-205,345-435 — parent organization filters college, department, program, batch, class.
- Expected fix: Map cascade and target audience semantics by role.

## G2-10-030-021 [P1] GAP facet F06
- [x] FIXED: draft creation now rejects whitespace-only/HTML-tag-only job descriptions using HTML-stripped meaningful text and the exact legacy warning.
- Files: src/components/placements/placement-job-create-form.tsx
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/JobForm.js:33-38,684-693 — whitespace-only rich HTML rejected Please enter job description.
- Expected fix: Add required HTML-stripped rule.

## G2-10-030-038 [P1] GAP facet F10
- Files: src/components/placements/placement-job-create-form.tsx
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/JobForm.js:498-540 — createAdminJob/updateAdminJob with college ID and version, jobData includes legacy details.
- Expected fix: Map every legacy field and edit CAS into vNext write route.

## G2-10-030-040 [P1] MISSING facet F11
- Files: src/components/placements/placement-job-create-form.tsx
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/JobForm.js:114-116,912-949 — Super Admin can select org and college to create job.
- Expected fix: Enable admin-global-scoped workflow via selected college.

## G2-10-030-061 [P1] GAP facet F22
- Files: src/modules/placements/validation.ts
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/JobForm.js:702-709 — college-custom jobType including placed-counting.
- Expected fix: Persist source jobType and placed-count flag separately.

## G2-10-030-062 [P1] GAP facet F23
- Files: src/components/placements/placement-job-create-form.tsx
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/JobForm.js:578-1193 — single legacy form supports duplicate/edit/create with visibility, important date row editing.
- Expected fix: Restate explicit parity decision for source modes and restore missing fields.

## G2-10-023-008 [P1] GAP facet F02
- Files: src/app/(authenticated)/admin/tenants/setup/page.tsx
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/TenantsHub.js:183-201 — Identity: readiness full width, domain and sign-in half, branding half.
- Expected fix: Embed readiness, subdomain, sign-in, branding controls in launch tab

## G2-15-022-050 [P1] MISSING facet F23
- Files: (none, new feature)
- Legacy: Legacy indefinite extension (0), 24-month quick option, revoke reason and provenance absent/newly constrained; TpoRecruiterAccessController.java:87-105,114-135; settings.js:607,729-736
- Expected fix: Do not mark parity done until owner signs off on removal or features restored with tests.

## G2-18-023-001 [P1] GAP facet F01
- Files: src/modules/placements/learner-job-service.ts, src/app/(authenticated)/learn/my-placements/rules/page.tsx
- Legacy: GET `/api/v1/learner/drives/{jobId}/eligibility`, `/apply-check`, bulk `/apply-checks`, `/placement-rules`, `/{jobId}/company-preview`, `/calendar-extras`; LearnerEligibilityController.java:59-155
- Expected fix: Write endpoint-to-server-action/route contract matrix, including preview/extras absences and authorized fallback.

## G2-18-023-005 [P1] GAP facet F03
- Files: src/modules/placements/learner-job-apply-blockers-model.ts, src/components/placements/learner-placement-job-detail.tsx
- Legacy: Legacy apply button blocks with `reason` and `action` REGISTER/RULES; ApplyGate.java:28-45,61-83
- Expected fix: Make CTA use same canonical denial and action code as actual apply service, including REGISTER/RULES link.

## G2-18-023-007 [P1] GAP facet F04
- Files: src/modules/placements/learner-job-service.ts
- Legacy: Apply-check JSON `canApply,code,reason,action` from one gate; ApplyGate.java:38-46
- Expected fix: Expose canonical denial codes and one actionable CTA; avoid page / server divergence.

## G2-18-023-008 [P1] GAP facet F04
- Files: src/modules/placements/learner-job-service.ts
- Legacy: Bulk apply-check keyed by integer drive ID; omits invisible, max100; LearnerEligibilityController.java:79-100
- Expected fix: Implement batched mapped canApply checks with explicit max100 and invisible-job omission for list and home.

## G2-18-023-012 [P1] GAP facet F05
- Files: src/modules/placements/learner-job-service.ts
- Legacy: Bulk apply-checks deduplicates IDs via LinkedHashSet, truncates 100, omits hidden; LearnerEligibilityController.java:84-100
- Expected fix: Avoid O(drives) serial/duplicate evaluate overhead, enforce 100 and stable requested ordering.

## G2-18-023-020 [P1] GAP facet F08
- Files: src/modules/placements/learner-job-apply-blockers-model.ts, src/components/placements/learner-placement-job-detail.tsx
- Legacy: ApplyGate returns actionable human reason and action `REGISTER`/`RULES` not success toast; ApplyGate.java:28-79
- Expected fix: Keep denial reason as primary inline text, map actionCode to exact URL and don't declare OPEN from eligibility alone.

## G2-18-023-024 [P1] GAP facet F10
- Files: src/modules/placements/learner-job-service.ts
- Legacy: Bulk applyChecks excludes hidden drives after guard and returns per-drive map; LearnerEligibilityController.java:84-100
- Expected fix: Build internal bulk response keyed drive ID with per-role decisions; prevent inflated open-job counts.
