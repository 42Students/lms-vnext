# Verification packet (P1 round 2): 25 rows

For EACH row: open the vNext file(s) it cites, check that the Fix is really implemented (wording, validation, behaviour, permissions, empty/error states, wiring). If it is missing, partial or wrong, FIX it now in the file (keep valid syntax, no uninstalled packages). In your commit message list the row IDs as OK or FIXED. Rows without a vNext file describe a new feature: search the repo for it; if it does not exist, build it.

## G2-1-026-015 [P1] GAP facet F04
- Files: src/components/college/college-admin-profile-editor.tsx
- Legacy: docs/legacy-source/frontend/src/components/profile/about/personalDetails.js:95-130: gender Select, DOB DD-MM-YYYY, blood group Select.
- Expected fix: Implement exact gender/DOB/blood group fields with back-end persistence.

## G2-1-026-016 [P1] GAP facet F04
- Files: src/components/college/college-admin-profile-editor.tsx
- Legacy: docs/legacy-source/frontend/src/components/profile/about/contacts.js:130-170: editable 10-digit primary mobile and alternate 10–15 digit phone.
- Expected fix: Add verified primary-contact change path and phone validation.

## G2-1-026-018 [P1] GAP facet F04
- Files: src/components/college/college-admin-profile-editor.tsx
- Legacy: docs/legacy-source/frontend/src/components/profile/about/address.js:58-65,110-117: separate currentAddress and permanentAddress textareas.
- Expected fix: Preserve independent current/permanent addresses.

## G2-1-026-021 [P1] GAP facet F04
- Files: src/components/college/college-admin-profile-editor.tsx
- Legacy: docs/legacy-source/frontend/src/components/profile/about/socialProfiles.js:169-200: Portfolio and Twitter URLs.
- Expected fix: Define Portfolio mapping and add Twitter if still required.

## G2-1-026-026 [P1] GAP facet F06
- Files: src/components/college/college-admin-profile-editor.tsx
- Legacy: docs/legacy-source/frontend/src/components/profile/about/personalDetails.js:97-130: selects Gender, Blood group; DatePicker DOB in DD-MM-YYYY.
- Expected fix: Restore typed pickers/required/default policies.

## G2-1-026-031 [P1] GAP facet F06
- Files: src/components/college/college-admin-profile-editor.tsx
- Legacy: docs/legacy-source/frontend/src/components/profile/about.js:941-946,1298-1301,1345-1349,1366-1369: per-card Edit Save Cancel.
- Expected fix: Provide card-local edit/cancel and non-lossy section update.

## G2-1-026-038 [P1] GAP facet F09
- Files: src/components/college/college-admin-profile-editor.tsx
- Legacy: docs/legacy-source/frontend/src/components/profile/about/personalDetails.js:40-48, CT:38-47, SO:39-47, AD:26-35: 'Discard changes'/'Keep editing' cancel Modal.
- Expected fix: Restore cancel and unsaved-discard confirmation.

## G2-1-026-039 [P1] GAP facet F09
- Files: src/components/college/college-admin-profile-editor.tsx
- Legacy: docs/legacy-source/frontend/src/components/profile/about.js:117-140: beforeunload and routeChangeStart prompt 'Discard your unsaved profile changes?'.
- Expected fix: Track dirty fields and block navigation until user confirms.

## G2-1-026-069 [P1] GAP facet F20
- Files: src/components/college/college-admin-profile-editor.tsx
- Legacy: docs/legacy-source/frontend/src/components/profile/about.js:117-140: dirty route guard protects drafts.
- Expected fix: Add unsaved guard and document CAS conflict handling.

## G2-14-024-026 [P1] GAP facet F12
- Files: src/modules/module-access/admin-college-rule-write.ts
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/SuperAdminFeatureController.java:178-205 — ancestors or own lock prevents dormant college override
- Expected fix: Define and enforce college-level own-lock edit/unlock permissions explicitly.

## G2-14-024-037 [P1] GAP facet F19
- Files: src/app/(authenticated)/admin/features/[collegeId]/page.tsx
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/SuperAdminFeatureController.java:243-247 — counts across active jobs, applications, offers, interviews
- Expected fix: Provide bounded aggregate counts from verified data source.

## G2-1-034-029 [P1] GAP facet F10
- Files: src/modules/placements/public-recruiter-invite-accept-service.ts
- Legacy: docs/legacy-source/frontend/src/pages/recruiter-invite/[token].js:94-102: accept can return PENDING_HR not immediate active grant.
- Expected fix: Split acceptance workflow when existing identity requires explicit authenticated yes.

## G2-1-034-035 [P1] GAP facet F12
- Files: src/modules/placements/public-recruiter-invite-accept-service.ts
- Legacy: docs/legacy-source/frontend/src/pages/recruiter-invite/[token].js:102: accepts PENDING_HR as distinct transition.
- Expected fix: Restore status transition/contract to avoid bypassing recruiter consent.

## G2-15-018-029 [P1] GAP facet F13
- Files: src/app/api/tracker/logs/known-errors/[signatureId]/route.ts
- Legacy: docs/legacy-source/backend/src/main/resources/db/migration/V157__log_alerting.sql:6-16 — table exists after V157 migration on deployed legacy.
- Expected fix: Register migration and verify live runtime readiness.

## G2-18-014-024 [P1] GAP facet F13
- Files: src/app/api/public/campaign-unsubscribe/route.ts
- Legacy: docs/legacy-source/backend/src/main/resources/db/migration/V161__tpo_v1_drives.sql:345-349 — repository SQL row can be queried once migration ran.
- Expected fix: Provide safe unavailable-state UI, do not accept but forget unsubscribe.

## G2-18-014-037 [P1] GAP facet F21
- Files: src/modules/operations/outbound-delivery-queue.ts
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/TpoEmailCampaignService.java:20-23,93-111 — campaign email provider and tokenized unsubscribe.
- Expected fix: Wire provider delivery and recheck global suppression at final send boundary.

## G2-19-030-019 [P1] MISSING facet F06
- Files: src/app/(authenticated)/tpo/profile/page.tsx
- Legacy: docs/legacy-source/frontend/src/components/tpo/TpoProfileCard.jsx:22-44 — photo upload file or photoFromLink; rest of profile read-only.
- Expected fix: Restore authorized photo edit only, keep login contact admin-owned.

## G2-10-001-006 [P1] GAP facet F02
- Files: src/app/platform/page.tsx
- Legacy: Sequence hero then AI agents then pillars then integrations then lifecycle then CTA `docs/legacy-source/frontend/src/pages/platform.js:40-51`
- Expected fix: Map all old visual sections to approved non-AI equivalents with explicit exceptions

## G2-10-001-016 [P1] GAP facet F04
- Files: src/app/platform/page.tsx
- Legacy: Seven AGENTS titles and descriptions are rendered `docs/legacy-source/frontend/src/components/marketing/data.js:27-63` `docs/legacy-source/frontend/src/components/marketing/sections.jsx:112-118`
- Expected fix: Document approved non-AI copy replacement for each retired agent claim

## G2-10-001-017 [P1] GAP facet F04
- Files: src/app/platform/page.tsx
- Legacy: Six PILLARS titles and descriptions `docs/legacy-source/frontend/src/components/marketing/data.js:78-109`
- Expected fix: Map old content to approved four-pillar product scope

## G2-10-001-040 [P1] GAP facet F18
- Files: src/app/platform/page.tsx
- Legacy: Hero title One autonomous AI platform for talent and workforce development `docs/legacy-source/frontend/src/pages/platform.js:43-43`
- Expected fix: Preserve only owner-approved AI-retirement copy exception

## G2-10-001-041 [P1] GAP facet F18
- Files: src/app/platform/page.tsx
- Legacy: Hero lede lists AI assessments skills intelligence and AI agents `docs/legacy-source/frontend/src/pages/platform.js:44-44`
- Expected fix: Record explicit intentional replacement rather than claiming content parity

## G2-10-001-042 [P1] GAP facet F18
- Files: src/app/platform/page.tsx
- Legacy: Agent section title Specialized AI agents that develop talent together `docs/legacy-source/frontend/src/components/marketing/sections.jsx:106-110`
- Expected fix: Approve canonical non-AI replacement wording

## G2-10-026-001 [P1] GAP facet F01
- Files: src/app/api/public/campaign-unsubscribe/route.ts
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/PublicCampaignUnsubscribeController.java:12-26 — POST /api/v1/public/campaign-unsubscribe/{token}, path-bound token.
- Expected fix: Add compatibility adapter and migrate all emailed URLs.

## G2-10-026-010 [P1] GAP facet F04
- Files: src/app/api/public/campaign-unsubscribe/route.ts
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/PublicCampaignUnsubscribeController.java:23-27 — JSON {status:UNSUBSCRIBED}, HTTP200 even unknown/used.
- Expected fix: Align legacy client contract or negotiate response.
