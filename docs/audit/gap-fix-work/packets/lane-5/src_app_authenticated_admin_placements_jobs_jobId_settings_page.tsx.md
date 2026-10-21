# Work packet: edit src/app/(authenticated)/admin/placements/jobs/[jobId]/settings/page.tsx

19 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-10/superadmin-jobs-jobid-settings.md, docs/audit/gap2/lane-10/superadmin-sections-job-form.md

## G2-10-014-002  [P1] GAP  facet F01  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/jobs/[jobId]/settings.js:104-110 — Selected college missing shows yellow 'Select a college to continue' warning.
- vNext now: src/app/(authenticated)/admin/placements/jobs/[jobId]/settings/page.tsx:14-18 — Selected-college helper throws before any friendly no-college view.
- Fix: Keep guard while showing actionable warning.

## G2-10-014-003  [P1] MISSING  facet F01  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/jobs/[jobId]/settings.js:120-121; docs/legacy-source/frontend/src/pages/superadmin/sections/JobForm.js:322-342 — BeforeNavigate consults dirty JobForm, including tab transitions.
- vNext now: src/app/(authenticated)/admin/placements/jobs/[jobId]/settings/page.tsx:20-23; src/components/placements/super-admin-published-drive-edit.tsx:78-83 — No nav guard on back link or published editor.
- Fix: Intercept unsaved navigation.

## G2-10-014-005  [P1] GAP  facet F02  effort L
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/jobs/[jobId]/settings.js:112-145 — Settings tab, full JobForm immediately visible, Drive status card, Danger zone card.
- vNext now: src/app/(authenticated)/admin/placements/jobs/[jobId]/settings/page.tsx:20-71 — Status text, partial published edit, supplementary details, deadline, accordion actions.
- Fix: Match full section order and forms.

## G2-10-014-006  [P1] MISSING  facet F02  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/jobs/[jobId]/settings.js:164-193 — Danger zone red #cf1322 heading, #ffccc7 border, #fff1f0 background.
- vNext now: src/app/(authenticated)/admin/placements/jobs/[jobId]/settings/page.tsx:65-71; src/components/placements/super-admin-drive-archive.tsx:43-67 — Archive action nested inside neutral More drive actions accordion.
- Fix: Restore prominent destructive region.

## G2-10-014-007  [P1] MISSING  facet F02  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/jobs/[jobId]/settings.js:145-159 — Drive status Card with one reversible Open/Close button.
- vNext now: src/app/(authenticated)/admin/placements/jobs/[jobId]/settings/page.tsx:24-29 — Only StatusBadge; no status action.
- Fix: Reinstate visible lifecycle controls.

## G2-10-014-008  [P1] GAP  facet F02  effort L
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/jobs/[jobId]/settings.js:137-143; docs/legacy-source/frontend/src/pages/superadmin/sections/JobForm.js:580-618 — Legacy full JobForm visible for edit, including draft state.
- vNext now: src/app/(authenticated)/admin/placements/jobs/[jobId]/settings/page.tsx:30-36; src/components/placements/placement-drive-workspace.tsx:579-671 — Published edit shortened; draft edit moved to overview disclosure.
- Fix: Put complete editor in Settings for relevant lifecycle states.

## G2-10-014-009  [P1] MISSING  facet F03  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/jobs/[jobId]/settings.js:147-159 — Close drive danger button and Open drive primary with Yes/No Popconfirm.
- vNext now: src/app/(authenticated)/admin/placements/jobs/[jobId]/settings/page.tsx:24-29 — No button available here.
- Fix: Use context-specific lifecycle button.

## G2-10-014-020  [P1] MISSING  facet F05  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/jobs/[jobId]/settings.js:145-159 — Non-draft statuses have Close/Open reversible button.
- vNext now: src/app/(authenticated)/admin/placements/jobs/[jobId]/settings/page.tsx:24-71 — Closed and published have no equivalent status action in settings.
- Fix: Support controlled reopen/close.

## G2-10-014-026  [P1] MISSING  facet F06  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/JobForm.js:737-782 — Assessment URL 2048 max http(s), optional assessment deadline.
- vNext now: src/app/(authenticated)/admin/placements/jobs/[jobId]/settings/page.tsx:46-51 — No editable assessment controls.
- Fix: Restore URL and deadline form.

## G2-10-014-035  [P1] MISSING  facet F08  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/jobs/[jobId]/settings.js:68-75 — Status update success 'Drive opened/closed' toast and failure toast plus Alert.
- vNext now: src/app/(authenticated)/admin/placements/jobs/[jobId]/settings/page.tsx:24-72 — No status action/error copy on settings.
- Fix: Restore feedback when close/open returns.

## G2-10-014-038  [P1] MISSING  facet F08  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/jobs/[jobId]/settings.js:123-135 — Load error Retry; dismissible mutation errors with specific title.
- vNext now: src/app/(authenticated)/admin/placements/jobs/[jobId]/settings/page.tsx:14-18 — Server load errors bubble, no Retry on page.
- Fix: Add error recovery and preserve draft.

## G2-10-014-043  [P1] MISSING  facet F10  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/jobs/[jobId]/settings.js:59-79 — Legacy POST job status to Open/Close by college.
- vNext now: src/app/(authenticated)/admin/placements/jobs/[jobId]/settings/page.tsx:24-72 — No status request on this settings page.
- Fix: Wire authorized lifecycle action.

## G2-10-014-049  [P1] MISSING  facet F12  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/jobs/[jobId]/settings.js:145-159 — Open/Close reversible for non-drafts.
- vNext now: src/app/(authenticated)/admin/placements/jobs/[jobId]/settings/page.tsx:24-29 — Settings no reopen control.
- Fix: Restore permitted reopen.

## G2-10-014-074  [P1] GAP  facet F21  effort L
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/jobs/[jobId]/settings.js:10,31-53 — AdminService GET job+metrics, status toggle and delete action.
- vNext now: src/app/(authenticated)/admin/placements/jobs/[jobId]/settings/page.tsx:17-18; src/components/placements/super-admin-drive-archive.tsx:22-42 — JobService, archive and partial PATCH; no status route here.
- Fix: Map all legacy operations.

## G2-10-014-078  [P1] GAP  facet F22  effort L
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/JobForm.js:498-544 — Saves importantDates, candidatePreferences, customRules.
- vNext now: src/app/(authenticated)/admin/placements/jobs/[jobId]/settings/page.tsx:37-63 — Published edit excludes those; read-only legacyPostingDetails.
- Fix: Map/edit JSON with constraints.

## G2-10-014-081  [P1] GAP  facet F23  effort L
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/jobs/[jobId]/settings.js:145-193 — Visible Close/Open and Danger zone.
- vNext now: src/app/(authenticated)/admin/placements/jobs/[jobId]/settings/page.tsx:24-71 — No Close/Open, archive hidden.
- Fix: Rebuild visible controls and keep stronger modern delete protection.

## G2-10-030-001  [P1] GAP  facet F01  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/JobForm.js:54-60 — reusable JobForm in Super Admin Jobs and college drive settings.
- vNext now: src/components/placements/placement-job-create-form.tsx:99-115 and src/app/(authenticated)/admin/placements/jobs/[jobId]/settings/page.tsx:14-35 — college-scoped create form plus separate Super Admin edit UI.
- Fix: Unify create/edit/duplicate routes or explicitly map role-appropriate capabilities.

## G2-10-014-032  [P2] MISSING  facet F07  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/JobForm.js:737-748 — URL validation error Must be a valid http or https URL, max2048.
- vNext now: src/app/(authenticated)/admin/placements/jobs/[jobId]/settings/page.tsx:46-48 — Link only, no validation.
- Fix: Restore legacy-facing behavior through selected-college-scoped services.

## G2-10-014-033  [P2] MISSING  facet F07  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/JobForm.js:818-900 — At most 20 Important date rows and cannot remove last row.
- vNext now: src/app/(authenticated)/admin/placements/jobs/[jobId]/settings/page.tsx:52-56 — Read-only list; no row validation.
- Fix: Restore legacy-facing behavior through selected-college-scoped services.
