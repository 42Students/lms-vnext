# Verification packet (P1 round 2): 25 rows

For EACH row: open the vNext file(s) it cites, check that the Fix is really implemented (wording, validation, behaviour, permissions, empty/error states, wiring). If it is missing, partial or wrong, FIX it now in the file (keep valid syntax, no uninstalled packages). In your commit message list the row IDs as OK or FIXED. Rows without a vNext file describe a new feature: search the repo for it; if it does not exist, build it.

## G2-1-009-007 [P1] MISSING facet F03
- Files: src/app/(authenticated)/learn/profile/academic-record/page.tsx
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/tpo/LearnerAcademicRecord.java:58-60`,`docs/legacy-source/backend/src/main/java/com/_42students/lms/model/tpo/LearnerAcademicRecord.java:72-74`: source VERIFIED versus SELF status exists.
- Expected fix: Display actual evidence source/verified state with nonmisleading badge and explanation.

## G2-1-010-027 [P1] GAP facet F07
- Files: src/app/(authenticated)/learn/profile/verification/page.tsx, src/modules/profile-verification/service.ts
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/ProfileVerificationService.java:169-185`: identity must have Aadhaar or PAN number+document; education needs 10th, 12th/diploma, degree, resume.
- Expected fix: Compare each field-level requirement against private-object scan readiness and exact messages.

## G2-18-014-021 [P1] GAP facet F12
- Files: src/modules/messaging/tpo-campaign-send-policy.ts
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/model/tpo/EmailSuppressionEntity.java:13 — ‘Stop all emails’ global by normalized address.
- Expected fix: Add active global-HMAC suppression gate to campaign dispatch pre-send.

## G2-10-026-022 [P1] GAP facet F07
- Files: src/app/campaign-unsubscribe/[token]/page.tsx
- Legacy: docs/legacy-source/frontend/src/pages/campaign-unsubscribe/[token].js:18-31 — GET never indicates token invalid before POST.
- Expected fix: Review validity-oracle privacy and messaging.

## G2-10-026-072 [P1] GAP facet F23
- Files: src/app/campaign-unsubscribe/[token]/page.tsx, src/app/api/public/campaign-unsubscribe/route.ts
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/PublicCampaignUnsubscribeController.java:12-27 — Legacy always says unsubscribed.
- Expected fix: Reconcile privacy guarantee.

## G2-10-025-047 [P1] GAP facet F10
- Files: src/app/(authenticated)/hr/home/page.tsx
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/RecruiterSelfController.java:102-107 — GET /api/v1/recruiter/home cross-college totals.
- Expected fix: Build permitted cross-college aggregation

## G2-10-009-059 [P1] GAP facet F10
- Files: src/app/(authenticated)/admin/inbound-mail/page.tsx
- Legacy: `docs/legacy-source/frontend/src/api/Services/SuperAdminInboundMailService.js:7` GET /api/v1/superadmin/inbound-mail with show,q,page
- Expected fix: Map OPEN/REPLIES/DONE/ALL compound legacy filters to new query contract

## G2-10-012-021 [P1] GAP facet F05
- Files: src/modules/placements/tpo-drive-header-model.ts, src/components/placements/placement-drive-workspace.tsx
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/jobs/[jobId]/index.js:197-200 — Open · Expired indicator depends on active, not-draft, applicationDeadline < now.
- Expected fix: Project Open · Expired precisely when deadline has passed but drive stays active.

## G2-10-012-047 [P1] GAP facet F12
- Files: src/modules/placements/tpo-drive-header-model.ts
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/jobs/[jobId]/index.js:196-200 — Distinct Draft, Open, Open · Expired, Closed statuses from isDraft, isActive, applicationDeadline.
- Expected fix: Add projection to mirror active/open/expired source status logic.

## G2-10-014-015 [P1] GAP facet F04
- Files: src/components/placements/super-admin-published-drive-edit.tsx, src/components/placements/placement-draft-edit-form.tsx
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/JobForm.js:950-1019 — Department/Program/Batch/Class dependent academic targeting.
- Expected fix: Restore hierarchy with proper scope/clearing.

## G2-10-014-019 [P1] GAP facet F05
- Files: src/components/placements/super-admin-published-drive-edit.tsx, src/components/placements/placement-drive-workspace.tsx
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/JobForm.js:1140-1184 — Save/update, Save draft, Publish, Cancel vary by state.
- Expected fix: Provide legacy state-aware action strip.

## G2-10-014-026 [P1] MISSING facet F06
- Files: src/app/(authenticated)/admin/placements/jobs/[jobId]/settings/page.tsx
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/JobForm.js:737-782 — Assessment URL 2048 max http(s), optional assessment deadline.
- Expected fix: Restore URL and deadline form.

## G2-10-014-029 [P1] GAP facet F07
- Files: src/components/placements/super-admin-published-drive-edit.tsx
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/JobForm.js:33-38,684-691 — Description required after stripping HTML; message Please enter job description.
- Expected fix: Require substantive description or document divergence.

## G2-10-014-031 [P1] MISSING facet F07
- Files: src/components/placements/super-admin-published-drive-edit.tsx
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/JobForm.js:703-711 — Job Type required: 'Please select job type'.
- Expected fix: Add required Job Type.

## G2-10-014-041 [P1] MISSING facet F09
- Files: src/components/placements/super-admin-published-drive-edit.tsx
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/JobForm.js:322-342,1171-1184 — Cancel, browser unload, tabs require dirty confirmation.
- Expected fix: Use unsaved-navigation guard.

## G2-10-014-045 [P1] GAP facet F10
- Files: src/components/placements/super-admin-published-drive-edit.tsx
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/JobForm.js:498-559 — JobForm saves complete job fields with version/validation.
- Expected fix: Map all full edit payload fields.

## G2-10-014-055 [P1] GAP facet F13
- Files: src/components/placements/super-admin-published-drive-edit.tsx
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/JobForm.js:595-617 — Hierarchy load failures warning; existing details fetch failure blocks unsafe saving.
- Expected fix: Prevent partial save after incomplete data.

## G2-10-014-064 [P1] MISSING facet F17
- Files: src/components/placements/super-admin-published-drive-edit.tsx
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/JobForm.js:322-342 — Beforeunload dirty guard and Cancel confirmation.
- Expected fix: Implement keyboard-safe leave confirmation.

## G2-10-014-070 [P1] GAP facet F19
- Files: src/components/placements/super-admin-published-drive-edit.tsx
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/JobForm.js:300-319 — Edit disabled until source details and hierarchy arrive.
- Expected fix: Disallow saving incomplete forms.

## G2-10-014-075 [P1] GAP facet F21
- Files: src/components/placements/super-admin-published-drive-edit.tsx, src/components/placements/placement-draft-edit-form.tsx
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/JobForm.js:54-62,453-559 — Single JobForm covers full create/edit, custom fields and targeting.
- Expected fix: Consolidate mapped settings form.

## G2-10-014-082 [P1] MISSING facet F23
- Files: src/components/placements/super-admin-published-drive-edit.tsx
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/JobForm.js:322-342 — Unsaved change guard protects forms and tabs.
- Expected fix: Implement dirty navigation interception.

## G2-10-019-018 [P1] GAP facet F04
- Files: src/app/(authenticated)/admin/module-access/page.tsx
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/ModuleAccess.js:611-615 — Student overrides metric counts distinct learners with rules or legacy locks.
- Expected fix: Count distinct learner memberships including lock-only cases.

## G2-10-030-018 [P1] MISSING facet F05
- Files: src/components/placements/super-admin-published-drive-edit.tsx
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/JobForm.js:233-256 — edit prefill existing targetDept/Program/Batch/Class and employer.
- Expected fix: Provide complete edit parity or documented immutable field restrictions.

## G2-10-030-029 [P1] GAP facet F07
- Files: src/components/placements/super-admin-published-drive-edit.tsx
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/JobForm.js:64-72,293-296 — edit prefill failure blocks Save to prevent dropping fields.
- Expected fix: Block editing when required saved details could not prefill.

## G2-10-030-039 [P1] GAP facet F10
- Files: src/components/placements/super-admin-published-drive-edit.tsx
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/JobForm.js:54-66,528-546 — same form handles create and update.
- Expected fix: Provide full edit parity with authorization/audit constraints.
