# Work packet: edit src/modules/placements/public-recruiter-invite-accept-service.ts

15 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-1/recruiter-invite-token.md, docs/audit/gap2/lane-3/public-recruiter-invite-controller.md, docs/audit/gap2/lane-9/l13-u025-recruiter-pending-invite-controller.md

## G2-1-034-029  [P1] GAP  facet F10  effort L
- Legacy: docs/legacy-source/frontend/src/pages/recruiter-invite/[token].js:94-102: accept can return PENDING_HR not immediate active grant.
- vNext now: src/modules/placements/public-recruiter-invite-accept-service.ts:26,88-112: always grant now to active/new identity or error, no pending.
- Fix: Split acceptance workflow when existing identity requires explicit authenticated yes.

## G2-1-034-033  [P1] GAP  facet F11  effort L
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/RecruiterPendingInviteController.java:12-33: existing recruiter pending invitations require authenticated explicit accept/decline.
- vNext now: src/modules/placements/public-recruiter-invite-accept-service.ts:96-108: if existing ACTIVE grant throw invalid; no pending branch.
- Fix: Ensure existing account invitations transition through authenticated pending workflow.

## G2-1-034-035  [P1] GAP  facet F12  effort L
- Legacy: docs/legacy-source/frontend/src/pages/recruiter-invite/[token].js:102: accepts PENDING_HR as distinct transition.
- vNext now: src/modules/placements/public-recruiter-invite-accept-service.ts:146-149: only JOINED outcome.
- Fix: Restore status transition/contract to avoid bypassing recruiter consent.

## G2-3-026-016  [P1] MISSING  facet F04  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/RecruiterInviteService.java:241-245`
- vNext now: `src/modules/placements/public-recruiter-invite-accept-service.ts:103-107`
- Fix: Legacy PENDING_HR includes collegeName and signInEmail for existing account; vNext can only report JOINED and active college grant.

## G2-3-026-039  [P1] GAP  facet F10  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/RecruiterInviteService.java:219-245`
- vNext now: `src/modules/placements/public-recruiter-invite-accept-service.ts:96-107`
- Fix: Existing recruiter account without current college access must become pending until signed-in recruiter accepts, not receive immediate ACTIVE grant.

## G2-3-026-040  [P1] GAP  facet F10  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/RecruiterInviteService.java:270-280`
- vNext now: `src/modules/placements/public-recruiter-invite-accept-service.ts:121-149`
- Fix: Legacy attaches review drive and emails recruiter-welcome only for brand-new recruiter; vNext acceptance writes activity and notifications but lacks these side effects.

## G2-3-026-046  [P1] GAP  facet F11  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/RecruiterInviteService.java:185-187`
- vNext now: `src/modules/placements/public-recruiter-invite-accept-service.ts:80-102`
- Fix: Legacy rejects suspended/deleted existing recruiter and requires consent for new college; vNext checks ACTIVE user/profile/company with different grant policy; close exact consent/role matrix.

## G2-3-026-058  [P1] MISSING  facet F15  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/RecruiterInviteService.java:277-280`
- vNext now: `src/modules/placements/public-recruiter-invite-accept-service.ts:121-149`
- Fix: Restore recruiter-welcome one-time email after successful new account activation or write explicit omission decision.

## G2-13-025-003  [P1] GAP  facet F02  effort L
- Legacy: Legacy pending grant created only for existing recruiter accounts `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/RecruiterInviteService.java:219-245`
- vNext now: New invite acceptance immediately creates ACTIVE grant for existing identity `src/modules/placements/public-recruiter-invite-accept-service.ts:79-108`
- Fix: Stage existing-account invitation as PENDING_RECRUITER until signed-in yes.

## G2-13-025-022  [P1] GAP  facet F10  effort L
- Legacy: Accept PENDING_HR->ACTIVE, reset grantedAt & validity `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/RecruiterInviteService.java:303-309`
- vNext now: Public flow INSERT ACTIVE grant immediately `src/modules/placements/public-recruiter-invite-accept-service.ts:103-108`
- Fix: UPDATE pending row atomically rather than insert duplicate.

## G2-13-025-024  [P1] GAP  facet F10  effort L
- Legacy: Accept links pending recruiter lead, invalidates token and attaches review drive `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/RecruiterInviteService.java:310-320`
- vNext now: Token accept links lead immediately, no delayed attach `src/modules/placements/public-recruiter-invite-accept-service.ts:109-146`
- Fix: Delay lead completion, review-drive attachment and joined activity until consent.

## G2-13-025-027  [P1] GAP  facet F12  effort L
- Legacy: Existing work-email identity still needs post-sign-in consent `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/RecruiterInviteService.java:184-192,219-245`
- vNext now: New existing work-email account is joined immediately `src/modules/placements/public-recruiter-invite-accept-service.ts:79-108`
- Fix: Preserve explicit existing-account consent boundary.

## G2-13-025-033  [P1] GAP  facet F15  effort M
- Legacy: Accept logs SYSTEM recruiter accepted & bell RECRUITER_JOINED to TPO `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/RecruiterInviteService.java:313-320`
- vNext now: Public token acceptance fires JOINED immediately `src/modules/placements/public-recruiter-invite-accept-service.ts:121-145`
- Fix: Move JOINED activity and TPO bell to actual second-step acceptance.

## G2-13-025-042  [P1] GAP  facet F21  effort L
- Legacy: Accept synchronously updates review job, lead activity and bell `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/RecruiterInviteService.java:310-320`
- vNext now: New token join side effects happen in public transaction `src/modules/placements/public-recruiter-invite-accept-service.ts:121-145`
- Fix: Rehome effects in post-login consent transaction.

## G2-13-025-045  [P1] GAP  facet F23  effort L
- Legacy: Existing recruiter's invite is two separate explicit stages `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/RecruiterInviteService.java:219-245,295-331`
- vNext now: vNext public OTP collapses them into immediate ACTIVE `src/modules/placements/public-recruiter-invite-accept-service.ts:79-119`
- Fix: Restore pending-consent step after code verification, even for existing account.
