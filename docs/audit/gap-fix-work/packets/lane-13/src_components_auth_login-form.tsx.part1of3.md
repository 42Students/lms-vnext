# Work packet: edit src/components/auth/login-form.tsx (part 1 of 3)

20 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-1/cross-auth.md, docs/audit/gap2/lane-1/login.md, docs/audit/gap2/lane-1/recruiter-email-login-start-request.md, docs/audit/gap2/lane-20/index.md

## G2-1-036-001  [P1] GAP  facet F01  effort L
- Legacy: docs/legacy-source/frontend/src/loginPages/Login.js:658-907: public login first role selection and OTP, optional membership chooser after verification.
- vNext now: src/components/auth/login-form.tsx:316-556: same login + OTP form but no pre-OTP account-choice screen.
- Fix: Retain multi-account role/college chooser where needed by legacy identities.

## G2-1-036-019  [P1] GAP  facet F06  effort M
- Legacy: docs/legacy-source/frontend/src/loginPages/Login.js:195-210: sessionStorage attempt ID, choice, host and 5min expiry.
- vNext now: src/components/auth/login-form.tsx:24-49: attempt+expiry+cooldown persisted; host not stored.
- Fix: Persist host binding for resuming challenge; still enforce on server.

## G2-1-036-066  [P1] GAP  facet F20  effort S
- Legacy: docs/legacy-source/frontend/src/loginPages/Login.js:195-210: attempt stored per host, 5min TTL.
- vNext now: src/components/auth/login-form.tsx:26-49: host missing from storage (though server tenant-scoped).
- Fix: Prevent cross-host client restoration.

## G2-1-032-004  [P1] GAP  facet F01  effort L
- Legacy: docs/legacy-source/frontend/src/loginPages/Login.js:580-644: multiple matching accounts get chooser with grouped colleges and role.
- vNext now: src/components/auth/login-form.tsx:114-572: no multi-account choice UI, canonical user selects membership later.
- Fix: Provide role/college chooser with last-used badges or formal new identity-flow UX.

## G2-1-032-019  [P1] GAP  facet F04  effort M
- Legacy: docs/legacy-source/frontend/src/loginPages/Login.js:195-210: sessionStorage stores attempt ID, choice key, phone, host, expiresAt, cooldown.
- vNext now: src/components/auth/login-form.tsx:24-49: stores attempt, expiresAt, cooldown but no host/choiceKey.
- Fix: Bind resume attempt to origin/tenant to prevent cross-host confusion.

## G2-1-032-034  [P1] MISSING  facet F07  effort M
- Legacy: docs/legacy-source/frontend/src/loginPages/Login.js:58-59: INVALID_CHOICE tells user accounts list changed.
- vNext now: src/components/auth/login-form.tsx:52-80: no chooser error code.
- Fix: Handle stale multi-account selection with reload guidance.

## G2-1-032-040  [P1] MISSING  facet F09  effort S
- Legacy: docs/legacy-source/frontend/src/loginPages/Login.js:599-644: chooser card/list inside login view, no modal.
- vNext now: src/components/auth/login-form.tsx:317-572: method/OTP form only.
- Fix: Build chooser state inside card.

## G2-1-032-044  [P1] GAP  facet F10  effort M
- Legacy: docs/legacy-source/frontend/src/loginPages/Login.js:194-212: persists one attempt per host plus choice ID key.
- vNext now: src/components/auth/login-form.tsx:27-49: new attempt record lacks stored host/tenant binding.
- Fix: Store and validate expected host on resume.

## G2-1-032-063  [P1] MISSING  facet F17  effort S
- Legacy: docs/legacy-source/frontend/src/loginPages/Login.js:603: chooser radiogroup, buttons with aria-label role/college/status.
- vNext now: src/components/auth/login-form.tsx:354-406: tablist keyboard semantics, no account radiogroup.
- Fix: Restore accessible chooser keyboard and announcements.

## G2-1-032-070  [P1] GAP  facet F19  effort M
- Legacy: docs/legacy-source/frontend/src/loginPages/Login.js:195-210: sessionStorage challenge saves host to prevent cross-host reuse.
- vNext now: src/components/auth/login-form.tsx:26-49: stores attempt without host, potential cross-host continuation.
- Fix: Require host + tenant identifier in saved challenge.

## G2-1-032-073  [P1] GAP  facet F20  effort M
- Legacy: docs/legacy-source/frontend/src/loginPages/Login.js:193-210: per-host 5min resume prevents account mix.
- vNext now: src/components/auth/login-form.tsx:34-49: checks UUID/channel/expiry but no host.
- Fix: Add host check and clear on mismatch.

## G2-1-013-006  [P1] MISSING  facet F03  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/PublicMobileAuthController.java:486-488`: `Use your work email...` plus personal-provider examples.
- vNext now: `src/components/auth/login-form.tsx:53-79`: error map lacks COMPANY_EMAIL_REQUIRED.
- Fix: Add corporate email guidance to recruiter flow.

## G2-1-013-016  [P1] MISSING  facet F07  effort S
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/PublicMobileAuthController.java:486-489`: COMPANY_EMAIL_REQUIRED has distinct message.
- vNext now: `src/components/auth/login-form.tsx:53-80`: no matching company email error key.
- Fix: Display work-email rule with blocked provider names, not generic invalid email.

## G2-1-013-031  [P1] GAP  facet F13  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/PublicMobileAuthController.java:495-497`: never found recruiter still sees success and expires in300.
- vNext now: `src/components/auth/login-form.tsx:170-177`: NO_ACCOUNT_FOR_DOMAIN and not registered branches show error.
- Fix: Suppress recruiter existence disclosure including college grant existence.

## G2-1-013-048  [P1] GAP  facet F23  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/PublicMobileAuthController.java:479-489`: recruiter-only corporate email and tenant-host restriction.
- vNext now: `src/components/auth/login-form.tsx:354-401`: shared PHONE/EMAIL UI can expose phone selection based on tenant policy.
- Fix: Force recruiter login to email-only at college placement address, while other roles retain policy.

## G2-20-006-017  [P1] GAP  facet F04  effort L
- Legacy: Legacy DGIPUC student field `Roll Number`, PIN (maxLength 6), labels Next/Login; `docs/legacy-source/frontend/src/loginPages/DgipucLogin.js:93-160`
- vNext now: New LoginForm only contact PHONE/EMAIL and OTP, no roll-number field or Student/Teacher switch; `src/components/auth/login-form.tsx:11-18,114-129,198-212`
- Fix: Audit underlying roll-number API availability then implement equivalent scoped login path if still required.

## G2-20-006-019  [P1] GAP  facet F05  effort L
- Legacy: Legacy account-choice list may appear after identifying contact; `docs/legacy-source/frontend/src/loginPages/Login.js:465-547,599-647`
- vNext now: New LoginForm stores one attemptId and channels; no account chooser in source initial-state excerpt; `src/components/auth/login-form.tsx:11-27,114-137`
- Fix: Restore multi-membership/account choice when same contact belongs to multiple colleges, or document exact vNext post-login membership chooser.

## G2-20-006-032  [P1] MISSING  facet F07  effort S
- Legacy: Legacy DGIPUC roll number required `Roll number is required`; `docs/legacy-source/frontend/src/loginPages/DgipucLogin.js:105-121`
- vNext now: New no roll number validation, phone/email validation instead; `src/components/auth/login-form.tsx:203-211`
- Fix: Implement roll-number validation and exact message if DGIPUC login preserved.

## G2-20-006-039  [P1] GAP  facet F10  effort M
- Legacy: Legacy redirects signed-in user to role-specific home via stored identity and postLoginPath; `docs/legacy-source/frontend/src/loginPages/Login.js:140-166,307-325`
- vNext now: New root signed-in redirect `/dashboard` unless validated returnTo; form verification uses service next or /dashboard; `src/app/page.tsx:91-92`, `src/components/auth/login-form.tsx:269-271`
- Fix: Ensure dashboard server router resolves seven roles equivalently; test each role including TPO guests and recruiter.

## G2-1-036-022  [P2] GAP  facet F07  effort S
- Legacy: docs/legacy-source/frontend/src/loginPages/Login.js:37-79: codes NOT_REGISTERED, NO_ACCOUNT_FOR_DOMAIN, ACCOUNT_SUSPENDED, TOO_SOON, OTP_EXPIRED, WRONG_TENANT etc.
- vNext now: src/components/auth/login-form.tsx:52-80,166-195: mostly same codes with changed copy and status mappings.
- Fix: Produce exhaustive literal error-copy mapping and align strings.
