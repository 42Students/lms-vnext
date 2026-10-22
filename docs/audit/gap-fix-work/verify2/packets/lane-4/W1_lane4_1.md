# Verification packet (P1 round 2): 25 rows

For EACH row: open the vNext file(s) it cites, check that the Fix is really implemented (wording, validation, behaviour, permissions, empty/error states, wiring). If it is missing, partial or wrong, FIX it now in the file (keep valid syntax, no uninstalled packages). In your commit message list the row IDs as OK or FIXED. Rows without a vNext file describe a new feature: search the repo for it; if it does not exist, build it.

## G2-1-026-070 [P1] GAP facet F20
- Files: (none, new feature)
- Legacy: src/modules/people/college-admin-profile-edit-service.ts:75-85: locks account+profile but no if-version check; later save can overwrite.
- Expected fix: Require optimistic profileDocumentVersion on PATCH.

## G2-12-030-001 [P1] GAP facet F01
- Files: src/components/placements/college-interview-appointments.tsx
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/InterviewForm.js:35-50 — reusable Superadmin InterviewForm receives fixed application/job/organization
- Expected fix: Decide whether superadmin selected-college job/application action must open the same preselected form and whether selection may be changed.

## G2-12-030-005 [P1] MISSING facet F03
- Files: src/components/placements/college-interview-appointments.tsx
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/InterviewForm.js:249-260 — Interview Type five labels Screening Technical HR Managerial Final
- Expected fix: Represent interview type separately or define explicit mapping from round kind and sequence.

## G2-12-030-006 [P1] MISSING facet F03
- Files: src/components/placements/college-interview-appointments.tsx
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/InterviewForm.js:263-277 — What this round is about, 3 rows, example placeholder, max 500 with count
- Expected fix: Store/show required round description and candidate reminder context.

## G2-12-030-015 [P1] MISSING facet F05
- Files: src/components/placements/college-interview-appointments.tsx
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/InterviewForm.js:318-326 — warning Possible scheduling conflict with overlap count before saving
- Expected fix: Add nonblocking candidate/interviewer overlap preview scoped to full college and company.

## G2-12-030-024 [P1] MISSING facet F07
- Files: src/components/placements/college-interview-appointments.tsx
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/InterviewForm.js:265-269 — Please describe what this round is about; min 10 characters
- Expected fix: Show exact required/min-length validation.

## G2-12-030-028 [P1] GAP facet F09
- Files: src/components/placements/college-interview-appointments.tsx
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/InterviewForm.js:183-200 — unsaved fields trigger Discard interview setup? confirmation (danger Discard changes / Keep editing)
- Expected fix: Add before-close dirty guard for all modified fields and keyboard escape/backdrop.

## G2-1-010-016 [P1] GAP facet F04
- Files: src/app/(authenticated)/learn/profile/verification/page.tsx
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/ProfileVerificationService.java:248-257`: note, submittedAt, verifiedAt, verifiedByName, decidedAt/ByName, submitted and verified snapshots, changedSinceVerification.
- Expected fix: Restore approved snapshot comparison and changed-since-verification notice.

## G2-10-006-007 [P1] GAP facet F03
- Files: src/app/(authenticated)/admin/electives/page.tsx
- Legacy: Old slot Table has Slot Program Sem Year Credits Pick Offerings Students Status Actions `docs/legacy-source/frontend/src/components/admin/electives/ElectivesConsole.jsx:204-226`
- Expected fix: Restore exact 10-column table and interactive slot-name and action columns

## G2-10-010-045 [P1] GAP facet F20
- Files: src/app/(authenticated)/superadmin/page.tsx
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/index.js:11-14` 302 redirect reusable bookmark always resolves same landing
- Expected fix: Ensure stable Overview endpoint for global, org and college scopes

## G2-10-016-021 [P1] GAP facet F05
- Files: src/modules/placements/admin-drive-directory-model.ts
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/Jobs.js:250-269 — Server paginates/filter/sort postedDate desc before returning page.
- Expected fix: Stable posted-date descending order before slicing pages.

## G2-10-016-028 [P1] GAP facet F06
- Files: src/components/placements/super-admin-bulk-drive-actions.tsx
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/Jobs.js:334-362 — Toggle job status directly from table and toast success.
- Expected fix: Reintroduce single Close/Open status action with guard.

## G2-10-016-029 [P1] MISSING facet F06
- Files: src/components/placements/super-admin-bulk-drive-actions.tsx
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/Jobs.js:421-475 — Delete preview counts active apps/learners/open interviews, Popconfirm and retry.
- Expected fix: Bring scoped impact-preview Delete action to row if policy allows.

## G2-10-016-034 [P1] GAP facet F07
- Files: src/modules/placements/admin-drive-directory-model.ts
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/Jobs.js:250-269 — Server validates sortBy=postedDate, sortDir=desc, page/size; clamps last page.
- Expected fix: Apply deterministic sort and safe bounds.

## G2-10-016-052 [P1] GAP facet F12
- Files: src/components/placements/super-admin-bulk-drive-actions.tsx
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/Jobs.js:421-475 — Legacy delete preview retains apps and informs recipients, lists open interview cancellation.
- Expected fix: Review behavioral differences and show exact truthful impact.

## G2-10-016-059 [P1] GAP facet F15
- Files: src/components/placements/super-admin-bulk-drive-actions.tsx
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/Jobs.js:723-751 — Bulk Close warns learners will no longer be able to apply.
- Expected fix: Present all immediate user consequences.

## G2-10-016-060 [P1] GAP facet F15
- Files: src/components/placements/super-admin-bulk-drive-actions.tsx
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/Jobs.js:421-457 — Deletion preview promises affected learners notified and interviews cancelled.
- Expected fix: Check actual email/in-app recipients/template and describe added offer effects.

## G2-10-016-077 [P1] GAP facet F20
- Files: src/components/placements/super-admin-bulk-drive-actions.tsx
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/Jobs.js:334-395 — Per-job mutation guard plus bulk lock prevents duplicate writes.
- Expected fix: Preserve per-entity concurrency protection.

## G2-10-016-082 [P1] GAP facet F22
- Files: src/components/placements/super-admin-bulk-drive-actions.tsx
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/Jobs.js:421-475 — Legacy deletion uses numeric job record ID with impact and service side effects.
- Expected fix: Document model and side-effect migration.

## G2-10-016-086 [P1] GAP facet F23
- Files: src/modules/placements/admin-drive-directory-model.ts
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/Jobs.js:233-269 — Explicit newest postedDate descending list.
- Expected fix: Introduce stable sort, test snapshots.

## G2-10-017-017 [P1] GAP facet F04
- Files: src/components/placements/super-admin-needs-attention.tsx
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/DrivesLanding.js:19-27 — Four attention categories in order stale, unscheduled, missing letters, closing soon; missing offer letters links ALL (includes HIRED).
- Expected fix: Map offered-no-letter to ALL, filter affected candidates correctly.

## G2-10-017-018 [P1] GAP facet F04
- Files: src/components/placements/super-admin-needs-attention.tsx
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/DrivesLanding.js:210-215 — Needs attention total = sum of category `count` (affected items).
- Expected fix: Sum each item.count, report distinct drives separately if desired.

## G2-10-017-025 [P1] GAP facet F05
- Files: src/components/placements/super-admin-needs-attention.tsx
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/DrivesLanding.js:19-27,227-234 — Attention drilldowns use ?status=APPLIED/INTERVIEW/ALL and no status for closing soon.
- Expected fix: Map all category destinations, especially closing soon to drive instead of filtered app list.

## G2-10-017-037 [P1] GAP facet F08
- Files: src/components/placements/super-admin-needs-attention.tsx
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/DrivesLanding.js:145-153 — Attention error 'Couldn't check for anything that needs attention.' and Retry button.
- Expected fix: Catch attention separately; retain active cards.

## G2-10-017-052 [P1] GAP facet F12
- Files: src/components/placements/super-admin-needs-attention.tsx
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/DrivesLanding.js:19-27 — Missing-offer-letter category includes OFFERED and HIRED; ALL deep link avoids exclusion.
- Expected fix: Link to ALL and add keyed attention reason so affected rows visible.
