# Work packet (wave 2): edit src/components/auth/login-form.tsx (part 1 of 2)

40 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-1/cross-auth.md, docs/audit/gap2/lane-1/l11-u031-cross-forms.md, docs/audit/gap2/lane-1/login.md, docs/audit/gap2/lane-1/recruiter-email-login-start-request.md, docs/audit/gap2/lane-20/index.md, docs/audit/gap2/lane-6/superadmin-login.md

## G2-1-036-005  [P2] GAP  facet F02  effort S
- Legacy: docs/legacy-source/frontend/src/loginPages/Login.js:674-740: LoginDecor, robot, mobile/email thumb selector.
- vNext now: src/components/auth/login-form.tsx:316-406: code/contact form with custom tabs, no robot.
- Fix: Clone visual login states without reducing security.

## G2-1-036-007  [P2] GAP  facet F03  effort S
- Legacy: docs/legacy-source/frontend/src/loginPages/Login.js:801-841: phone +91 prefix, primary 'Send code' action.
- vNext now: src/components/auth/login-form.tsx:407-439: phone channel shared Input, no fixed +91 prefix.
- Fix: Add prefix and exact button strings.

## G2-1-036-046  [P2] GAP  facet F13  effort S
- Legacy: docs/legacy-source/frontend/src/loginPages/Login.js:195-210: refresh restores attempt and timer.
- vNext now: src/components/auth/login-form.tsx:139-152: same, but host binding not persisted.
- Fix: Validate host before resuming and surface stale attempt guidance.

## G2-1-036-047  [P2] GAP  facet F13  effort S
- Legacy: docs/legacy-source/frontend/src/loginPages/Login.js:1086-1092: dead/suspended clears attempt.
- vNext now: src/components/auth/login-form.tsx:185-195: expired/invalid/attempts clear; account disabled handling compare.
- Fix: Reset on suspension and wrong tenant with safe next step.

## G2-1-036-059  [P2] GAP  facet F18  effort S
- Legacy: docs/legacy-source/frontend/src/loginPages/Login.js:695,702: headings Sign in / Enter your code.
- vNext now: src/components/auth/login-form.tsx:318-321: same headings; h2 instead of h1.
- Fix: Match heading hierarchy.

## G2-1-036-061  [P2] GAP  facet F18  effort S
- Legacy: docs/legacy-source/frontend/src/loginPages/Login.js:68-75: Wrong tenant / recruiter college messages.
- vNext now: src/components/auth/login-form.tsx:52-80 and 170-179: some exact copy differs or code missing.
- Fix: Map legacy error codes to new one safely.

## G2-11-031-020  [P2] GAP  facet F06  effort S
- Legacy: docs/legacy-source/frontend/src/loginPages/Login.js:853-864: OTP 4-6 digit Form rule and numeric input.
- vNext now: src/components/auth/login-form.tsx:467-483: OTP validation different length/copy.
- Fix: Align supported code length UI/server.

## G2-1-032-010  [P2] GAP  facet F03  effort S
- Legacy: docs/legacy-source/frontend/src/loginPages/Login.js:695: H1 'Sign in', L:702: H1 'Enter your code'.
- vNext now: src/components/auth/login-form.tsx:317-321: H2 headings same text.
- Fix: Match heading semantic rank and exact font sizes.

## G2-1-032-011  [P2] GAP  facet F03  effort S
- Legacy: docs/legacy-source/frontend/src/loginPages/Login.js:714-739: animated two-channel switch with moving thumb.
- vNext now: src/components/auth/login-form.tsx:353-396: role tabs grid with different pill animations.
- Fix: Restore sliding thumb/selected state and old tab spacing.

## G2-1-032-012  [P2] GAP  facet F03  effort S
- Legacy: docs/legacy-source/frontend/src/loginPages/Login.js:814-818: +91 prefix integrated in phone Input.
- vNext now: src/components/auth/login-form.tsx:407-424: contact Input without fixed visible +91 prefix.
- Fix: Add fixed +91 prefix for India phone mode.

## G2-1-032-015  [P2] GAP  facet F03  effort S
- Legacy: docs/legacy-source/frontend/src/loginPages/Login.js:886: Email me instead link when phone OTP.
- vNext now: src/components/auth/login-form.tsx:535-544: email fallback Button; differing wording.
- Fix: Use exact old fallback CTA.

## G2-1-032-023  [P2] GAP  facet F05  effort S
- Legacy: docs/legacy-source/frontend/src/loginPages/Login.js:599-645: no paged accounts, grouped per college/domain.
- vNext now: src/components/auth/login-form.tsx:114-572: canonical account chosen at login, memberships handled later.
- Fix: Document membership/college choice and stable ordering.

## G2-1-032-024  [P2] GAP  facet F06  effort S
- Legacy: docs/legacy-source/frontend/src/loginPages/Login.js:801-820: Mobile number required, 10-digit validation, +91 prefix and numeric keypad.
- vNext now: src/components/auth/login-form.tsx:407-424: input contact validation also allows international + number.
- Fix: Align country-code affordance and exact validation.

## G2-1-032-026  [P2] GAP  facet F06  effort M
- Legacy: docs/legacy-source/frontend/src/loginPages/Login.js:853-864: OTP Form rule 4–6 digits; max field likely 6.
- vNext now: src/components/auth/login-form.tsx:467-483: OTP field, server verify schema 4–8 digits.
- Fix: Constrain to exact old 4–6 or document new server range and UI.

## G2-1-032-046  [P2] GAP  facet F10  effort S
- Legacy: docs/legacy-source/frontend/src/loginPages/Login.js:1291-1362: resend can restart attempt, preserve same choice; different role retry flows.
- vNext now: src/components/auth/login-form.tsx:24-49,525-544: resend on same canonical user/contact.
- Fix: Keep account-specific resend if choice UX restored.

## G2-1-032-050  [P2] GAP  facet F12  effort S
- Legacy: docs/legacy-source/frontend/src/loginPages/Login.js:29-30: DEAD_ATTEMPT includes OTP/EMAIL expiry, WRONG_TENANT, suspension.
- vNext now: src/components/auth/login-form.tsx:82-86: restart errors OTP_EXPIRED, INVALID_ATTEMPT, ATTEMPTS_EXCEEDED; WRONG_TENANT separately handled.
- Fix: Confirm suspension and email-expired reset consistent with legacy.

## G2-1-032-067  [P2] GAP  facet F18  effort S
- Legacy: docs/legacy-source/frontend/src/loginPages/Login.js:853-854: 'One-time code', 'The code is 4 to 6 digits'.
- vNext now: src/components/auth/login-form.tsx:467-484: code field and separate UI errors, potential different length feedback.
- Fix: Match code label/validation strings.

## G2-1-032-068  [P2] GAP  facet F18  effort S
- Legacy: docs/legacy-source/frontend/src/loginPages/Login.js:882: resendLabel dynamic, L:885 fallback 'Use email instead' semantics.
- vNext now: src/components/auth/login-form.tsx:532-544: 'Resend code in 0:xx' and email option, differing words.
- Fix: Align exact resend and fallback labels.

## G2-1-013-002  [P2] GAP  facet F01  effort S
- Legacy: `docs/legacy-source/frontend/src/api/Services/MobileAuthService.js:52-55`: recruiterEmailLoginStart(email) specific client API.
- vNext now: `src/components/auth/login-form.tsx:224-228`: shared generic login start called for email or phone.
- Fix: Add old-client adapter or migration note.

## G2-1-013-003  [P2] GAP  facet F02  effort S
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/dto/request/RecruiterEmailLoginStartRequest.java:7`: recruiter-specific email flow indicated in DTO comment.
- vNext now: `src/components/auth/login-form.tsx:317-324`: shared Sign in with registered email copy, no recruiter context.
- Fix: Include recruiter-specific entry language without duplicating form.

## G2-1-013-004  [P2] GAP  facet F03  effort S
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/dto/request/RecruiterEmailLoginStartRequest.java:7`: `Recruiter? Sign in with email.`
- vNext now: `src/components/auth/login-form.tsx:321-324`: `Use your registered email address.`
- Fix: Match recruiter landing prompt exactly where applicable.

## G2-1-013-005  [P2] GAP  facet F03  effort S
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/PublicMobileAuthController.java:482-484`: error cites college placement hostname `klu.42lms.com` in invitation.
- vNext now: `src/components/auth/login-form.tsx:335-341`: wrong-tenant copy points to main login page.
- Fix: Add recruiter-specific invitation-host guidance; avoid misleading global fallback.

## G2-1-013-032  [P2] GAP  facet F13  effort S
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/PublicMobileAuthController.java:529-534`: success mode EMAIL_OTP_SENT.
- vNext now: `src/components/auth/login-form.tsx:225-232`: generic success notice with channel and attempt.
- Fix: Preserve 5-minute expiry/resend guidance on recruiter flow.

## G2-1-013-039  [P2] GAP  facet F18  effort S
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/dto/request/RecruiterEmailLoginStartRequest.java:7`: `Recruiter? Sign in with email.`
- vNext now: `src/components/auth/login-form.tsx:319-324`: `Sign in`, `Use your registered email address.`
- Fix: Show exact recruiter account CTA at college address.

## G2-1-013-040  [P2] GAP  facet F18  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/PublicMobileAuthController.java:482-489`: explicit host and work-email error wording.
- vNext now: `src/components/auth/login-form.tsx:53-80`: generic NOT_REGISTERED and NO_ACCOUNT_FOR_DOMAIN messages.
- Fix: Add distinct recruiter error codes and copy without leaking actual access grant.

## G2-20-006-012  [P2] GAP  facet F03  effort S
- Legacy: Legacy default card uses phone/email tab switch, robot and consent text; `docs/legacy-source/frontend/src/loginPages/Login.js:649-654,713-725`
- vNext now: New form channel tabs and card styles plus footer legal links; `src/components/auth/login-form.tsx:114-123`, `src/app/login-shell.module.css:117-133`, `src/app/page.tsx:181-188`
- Fix: Verify consent sentence present next to each submit CTA, not merely Privacy footer; preserve tab presentation.

## G2-20-006-020  [P2] GAP  facet F05  effort S
- Legacy: Legacy account choices sorted with remembered prior account; `docs/legacy-source/frontend/src/loginPages/Login.js:465-547`
- vNext now: New LoginForm POST /auth/login/start and verify with attemptId, no sorted choices in StartResult; `src/components/auth/login-form.tsx:13-22,225-238,250-271`
- Fix: Define equivalent stable choice key, deterministic ordering and remembered account selection.

## G2-20-006-022  [P2] GAP  facet F06  effort S
- Legacy: Legacy form Phone or Email toggle; phone forced default and recruiter email activated via ?recruiter=email; `docs/legacy-source/frontend/src/loginPages/Login.js:81-96,125-130,713-725`
- vNext now: New channel default based on tenant policy primary, recruiter=email only if signin.email, can restrict channels; `src/app/page.tsx:173-176`, `src/components/auth/login-form.tsx:114-123`
- Fix: Treat channel-policy override as intended, test default when both methods available on each host.

## G2-20-006-036  [P2] GAP  facet F09  effort S
- Legacy: Legacy account chooser appears inline within form, not separate modal; `docs/legacy-source/frontend/src/loginPages/Login.js:599-647`
- vNext now: New LoginForm has form states, no menu/overlay in start result; `src/components/auth/login-form.tsx:13-27,114-137`
- Fix: Recreate inline choice panel, not drawer, if server returns multiple memberships.

## G2-20-006-040  [P2] GAP  facet F10  effort L
- Legacy: Legacy OTP uses mobileAuthStart/send/verify and email fallback; `docs/legacy-source/frontend/src/loginPages/Login.js:15-16,934-936`
- vNext now: New POST /api/auth/login/start, verify, email endpoint; `src/components/auth/login-form.tsx:225-228,255-264,285-291`, `src/app/api/auth/login/start/route.ts:19-43`
- Fix: Compare auth service/controller semantics and deliverability per tenant; UI may retain changed wire contract.

## G2-20-006-044  [P2] GAP  facet F12  effort S
- Legacy: Legacy login session stored in localStorage Redux on OTP success; `docs/legacy-source/frontend/src/loginPages/Login.js:946-971`
- vNext now: New credentials established via server auth route/cookies, client uses attemptId and redirect; `src/components/auth/login-form.tsx:250-271`
- Fix: Do not clone insecure storage; verify cross-tab sign-in and role landing parity.

## G2-20-006-046  [P2] GAP  facet F12  effort S
- Legacy: Legacy backend choices may change between listing and confirmation, stable choice key supplied; `docs/legacy-source/frontend/src/loginPages/Login.js:119-124,465-547`
- vNext now: New StartResult has no choiceKey field; `src/components/auth/login-form.tsx:13-22`
- Fix: Verify vNext membership choice is handled only after auth; protect cross-tenant account selection against stale list.

## G2-20-006-058  [P2] MISSING  facet F17  effort S
- Legacy: DGIPUC Student/Teacher Switch has checkedChildren/unCheckedChildren visible; `docs/legacy-source/frontend/src/loginPages/DgipucLogin.js:75-91`
- vNext now: New channel tab state is PHONE/EMAIL only; `src/components/auth/login-form.tsx:114-123`
- Fix: If retained, expose keyboard-operable Student/Teacher control with announced state.

## G2-20-006-062  [P2] GAP  facet F18  effort S
- Legacy: Legacy auth errors include `EMAIL_NOT_FOUND`, `LOGIN_METHOD_DISABLED`, `ACCOUNT_UNAVAILABLE`, `MOBILE_AUTH_TIMEOUT`; `docs/legacy-source/frontend/src/loginPages/Login.js:37-78`
- vNext now: New table uses `EMAIL_NOT_AVAILABLE`, `CHANNEL_DISABLED`, `ACCOUNT_DISABLED`, generic timeout; `src/components/auth/login-form.tsx:52-80`
- Fix: Map older codes to canonical errors and preserve verified exact copy where server can emit legacy codes.

## G2-20-006-071  [P2] GAP  facet F23  effort S
- Legacy: Legacy default mascot and consent text, error toasts; `docs/legacy-source/frontend/src/loginPages/Login.js:99-108,649-654,680-695`
- vNext now: New single secure uniform card, inline errors, static branding; `src/app/page.tsx:130-190`, `src/components/auth/login-form.tsx:123-139`
- Fix: List changed microinteractions/visual assets for clone decision, retain accessibility and security improvements.

## G2-6-031-048  [P2] GAP  facet F18  effort S
- Legacy: Legacy footer Terms & Conditions &#124; Privacy Policy and JRSPF Technologies Pvt. Ltd. All rights reserved. (SuperAdminLogin.js:219-240).
- vNext now: vNext Terms of Use and Privacy Policy links plus copyright with 42LMS and year (app/page.tsx:182-190; login-form.tsx:561-570).
- Fix: Match exact link labels/text, prevent duplicate consent lines.

## G2-1-036-060  [P3] GAP  facet F18  effort S
- Legacy: docs/legacy-source/frontend/src/loginPages/Login.js:650-655: Terms and Privacy Policy static routes.
- vNext now: src/components/auth/login-form.tsx:561-570: Terms static HTML, Privacy /privacy-policy.
- Fix: Fix legally approved route parity.

## G2-1-032-016  [P3] GAP  facet F03  effort S
- Legacy: docs/legacy-source/frontend/src/loginPages/Login.js:902-906: legal footer under card.
- vNext now: src/components/auth/login-form.tsx:561-572: LoginConsent directly below form, footer remains separate.
- Fix: Place legal copy/links in correct order and hierarchy.

## G2-1-032-060  [P3] GAP  facet F15  effort S
- Legacy: docs/legacy-source/frontend/src/loginPages/Login.js:650-655: consent legal links to local static Terms/Privacy.
- vNext now: src/components/auth/login-form.tsx:563-568: Terms local, privacy route /privacy-policy not old static HTML.
- Fix: Match Privacy Policy destination if original mandated.

## G2-1-032-069  [P3] GAP  facet F18  effort S
- Legacy: docs/legacy-source/frontend/src/loginPages/Login.js:650-655: Terms of Use, Privacy Policy links under each button.
- vNext now: src/components/auth/login-form.tsx:561-570: similar consent with Privacy Policy direct route.
- Fix: Match link text and destinations.
