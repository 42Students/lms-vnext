# Verification packet (P1 round 2): 25 rows

For EACH row: open the vNext file(s) it cites, check that the Fix is really implemented (wording, validation, behaviour, permissions, empty/error states, wiring). If it is missing, partial or wrong, FIX it now in the file (keep valid syntax, no uninstalled packages). In your commit message list the row IDs as OK or FIXED. Rows without a vNext file describe a new feature: search the repo for it; if it does not exist, build it.

## G2-1-002-042 [P1] GAP facet F10
- Files: src/modules/auth/session-service.ts, src/app/api/auth/devices/route.ts
- Legacy: `AuthController.java:1090-1116` user/admin revoke-sessions increments learner/faculty tokenVersion, including current session.
- Expected fix: Expose true own-device all-session revocation where legacy client calls require it; confirm admin endpoints use revokeAllSessionsForUser.

## G2-1-002-052 [P1] GAP facet F12
- Files: src/auth/session.ts, src/app/api/auth/memberships/route.ts
- Legacy: `AuthController.java:905-930` refresh token version per account; recruiter effective college rechecked (`:992-1009`).
- Expected fix: Verify every authenticated API enforces active selected membership/recruiter grant and never uses stale role claims from cookies.

## G2-1-024-054 [P1] GAP facet F22
- Files: src/db/schema/db01-auth-handoffs.staged.ts
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/AuthController.java:505-519: legacy auth_handoff_token raw refresh/access token material, single-use soft-deleted.
- Expected fix: Decide release of secure scoped handoff end to end, or accept no cross-host SSO and document re-login.

## G2-1-014-026 [P1] GAP facet F10
- Files: src/db/schema/db01-auth-handoffs.staged.ts
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/AuthController.java:324-333`: generates raw token, stores access+refresh JWT and expiry at issue.
- Expected fix: If reinstated, issue one-time code with target/domain scope, no transferable JWT.

## G2-1-014-046 [P1] MISSING facet F20
- Files: src/db/schema/db01-auth-handoffs.staged.ts
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/repository/AuthHandoffTokenRepository.java:24-25`: conditional claimUnused flips used once; race loser 404.
- Expected fix: Require compare-and-swap consumedAt IS NULL and expiresAt>now in single DB operation.

## G2-1-036-010 [P1] GAP facet F04
- Files: src/modules/auth/login-service.ts
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/PublicMobileAuthController.java:50-52,145-231: find eligible accounts by phone, return choices when multiple.
- Expected fix: Crosswalk multiple legacy IDs to one identity with membership choices.

## G2-1-036-011 [P1] GAP facet F04
- Files: src/modules/auth/login-service.ts
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/PublicMobileAuthController.java:252-295: email-first login returns selectable choice key for duplicate accounts.
- Expected fix: Support same-email multi-college legacy users explicitly.

## G2-12-030-052 [P1] GAP facet F22
- Files: src/db/schema/placement-round-candidate-slots.ts
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Interview.java:49-88,166-167 — Interview entity captures type/mode/location/notes/round desc/creator/255 interviewer/version
- Expected fix: Create explicit old Interview-to-slot migration/data parity matrix, including lost fields.

## G2-19-031-130 [P1] GAP facet F22
- Files: src/db/schema/tpo-collaboration.ts
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/TpoMessagesService.java:31-44` — Legacy TPO thread has reply token and email throttle marker.
- Expected fix: Add email token and sent-window fields/indexes.

## G2-19-031-131 [P1] GAP facet F22
- Files: src/db/schema/tpo-collaboration.ts
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/TpoMessagesService.java:92-123` — Legacy TPO messages have kind/event/request/via fields.
- Expected fix: Add transport, event, request data with FK guard.

## G2-19-031-138 [P1] GAP facet F23
- Files: src/components/tpo/tpo-team-forms.tsx
- Legacy: `docs/legacy-source/frontend/src/components/tpo/team/TeamConversations.jsx:197-267` — Legacy shared multi-person topics/object threads.
- Expected fix: Implement object and multi-person topic thread support.

## G2-1-009-004 [P1] GAP facet F02
- Files: src/app/(authenticated)/learn/profile/data-access/page.tsx
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/LearnerPlacementProfileService.java:13-18`: academic record, provenance and sharing disclosure are two concerns.
- Expected fix: Restore third-party share disclosure as separate section ahead of generic membership activity.

## G2-1-009-056 [P1] GAP facet F22
- Files: src/db/schema/tpo-collaboration.ts
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/LearnerPlacementProfileService.java:46-55`: relational job/share/event/application log.
- Expected fix: Implement learner-level read joins with safe share-record eligibility and timestamp indexes.

## G2-1-004-036 [P1] GAP facet F10
- Files: src/app/api/profile/me/route.ts
- Legacy: `LearnerProfileController.java:328-1237` individual CRUD endpoints across ~20 groups.
- Expected fix: Publish complete route/method replacement list and repair every consumer.

## G2-1-032-078 [P1] GAP facet F22
- Files: src/modules/auth/login-service.ts
- Legacy: docs/legacy-source/frontend/src/loginPages/Login.js:600-645: legacy accountChoices and stable choiceKey refer numeric role-specific users.
- Expected fix: Create explicit mapping of legacy account choice to canonical membership selection.

## G2-1-012-021 [P1] GAP facet F12
- Files: src/modules/auth/login-service.ts
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/PublicMobileAuthController.java:585-590`: code expires 5 min from email-send time.
- Expected fix: Ensure email code expiry independently honors 300s even near attempt expiration.

## G2-1-019-041 [P1] GAP facet F11
- Files: src/modules/auth/login-service.ts
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/PublicMobileAuthController.java:479-497: recruiter email only on college domain and work email; fake attempt response for ineligible recruiter.
- Expected fix: Review recruiter enumeration/privacy parity and restrict college-host recruiter method as necessary.

## G2-1-010-075 [P1] GAP facet F22
- Files: src/db/schema/profile-verification.ts, src/modules/profile-verification/transaction-writer.ts
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/ProfileVerificationService.java:481-521`: verified qualification marks written learner_academic_record, earned marks store.
- Expected fix: Crosswalk gradingType/maxGrade/raw grade/PG passingYear exactly; validate decimal conversion.

## G2-1-006-021 [P1] GAP facet F07
- Files: src/modules/auth/login-service.ts
- Legacy: `PublicMobileAuthController.java:483-488` recruiter global host `RECRUITER_COLLEGE_ADDRESS` and disposable email `COMPANY_EMAIL_REQUIRED`.
- Expected fix: Add explicit recruiter-specific host and work-email guidance without account enumeration.

## G2-1-006-032 [P1] GAP facet F10
- Files: src/modules/auth/login-service.ts
- Legacy: `PublicMobileAuthController.java:817-822` pending recruiter invite can auto-accept on verified email sign-in.
- Expected fix: Verify/recreate approved invite acceptance transition on first recruiter college sign-in without unintended grants.

## G2-1-006-035 [P1] GAP facet F11
- Files: src/modules/auth/login-service.ts
- Legacy: `PublicMobileAuthController.java:479-498` recruiter restricted to college domain and active grant/pending invite.
- Expected fix: Trace recruiter invited-but-not-accepted path and enforce college-specific invitation/grant policy.

## G2-1-006-042 [P1] GAP facet F13
- Files: src/modules/auth/login-service.ts
- Legacy: `PublicMobileAuthController.java:495-498` unauthorized recruiter email gets dummy attemptId, no code sent (anti-enumeration).
- Expected fix: Decide anti-enumeration contract for recruiter emails, restore indistinguishable response if threat model requires.

## G2-1-006-061 [P1] GAP facet F23
- Files: src/modules/auth/login-service.ts
- Legacy: `PublicMobileAuthController.java:817-822` verified recruiter email can accept pending college invite during sign-in.
- Expected fix: Verify intent and build explicit secure acceptance transition or separate invitation action.

## G2-1-013-021 [P1] GAP facet F10
- Files: src/modules/auth/login-service.ts
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/PublicMobileAuthController.java:490-497`: suspended/not-granted/unrecognized recruiter returns fake unused UUID success to resist enumeration.
- Expected fix: Use uniform unauthorized-recruiter response with nonfunctional challenge and no timing leak.

## G2-1-013-028 [P1] GAP facet F11
- Files: src/modules/auth/login-service.ts
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/PublicMobileAuthController.java:486-488`: corporate domain restriction applies before account lookup.
- Expected fix: Apply recruiter-only domain policy pre/post lookup without revealing account status.
