# Work packet: edit src/components/auth/login-form.tsx (part 2 of 3)

20 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-1/cross-auth.md, docs/audit/gap2/lane-1/login.md, docs/audit/gap2/lane-1/recruiter-email-login-start-request.md, docs/audit/gap2/lane-20/index.md

## G2-1-036-028  [P2] GAP  facet F08  effort S
- Legacy: docs/legacy-source/frontend/src/loginPages/Login.js:1055-1076: interrupted OTP uses explicit resend/restart notices.
- vNext now: src/components/auth/login-form.tsx:139-151: generic still-in-progress notice.
- Fix: Align interrupted session guidance.

## G2-1-032-029  [P2] GAP  facet F07  effort S
- Legacy: docs/legacy-source/frontend/src/loginPages/Login.js:37-79: explicit per-code loginErrorMessage.
- vNext now: src/components/auth/login-form.tsx:52-80,166-195: ERROR_MESSAGES mapping with some changed text.
- Fix: Diff every code-to-string and mirror exact errors where safe.

## G2-1-032-031  [P2] GAP  facet F07  effort S
- Legacy: docs/legacy-source/frontend/src/loginPages/Login.js:64-67: OTP_EXPIRED 'This code has expired. Ask for a new one.'
- vNext now: src/components/auth/login-form.tsx:67-68: 'This code can't be used any more. Ask for a new one to continue.'
- Fix: Preserve old expiry wording or approved new copy.

## G2-1-032-032  [P2] GAP  facet F07  effort S
- Legacy: docs/legacy-source/frontend/src/loginPages/Login.js:47-49: ACCOUNT_UNAVAILABLE/USER_NOT_FOUND 'This account can't sign in right now…'.
- vNext now: src/components/auth/login-form.tsx:52-80: no matching codes, default generic message.
- Fix: Map legacy user-unavailable states to safe expected copy.

## G2-1-032-033  [P2] GAP  facet F07  effort S
- Legacy: docs/legacy-source/frontend/src/loginPages/Login.js:74-75: RECRUITER_COLLEGE_ADDRESS displays college placement address example.
- vNext now: src/components/auth/login-form.tsx:52-80: lacks specific recruiter-host failure code.
- Fix: Provide exact recruiter domain instruction where needed.

## G2-1-032-036  [P2] GAP  facet F07  effort S
- Legacy: docs/legacy-source/frontend/src/loginPages/Login.js:104-107: AntD message errors deduplicated key ln2-error.
- vNext now: src/components/auth/login-form.tsx:329-331: single inline error summary, no floating toast.
- Fix: Match toast placement/duration or record approved inline state.

## G2-1-032-038  [P2] GAP  facet F08  effort S
- Legacy: docs/legacy-source/frontend/src/loginPages/Login.js:1055-1064: interrupted OTP sent fresh code, explicit toast.
- vNext now: src/components/auth/login-form.tsx:145-150: stored attempt recovery notice, no same interrupted-code toast.
- Fix: Restore interrupted session guidance.

## G2-1-013-015  [P2] GAP  facet F07  effort S
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/PublicMobileAuthController.java:482-484`: RECRUITER_COLLEGE_ADDRESS has invitation guidance.
- vNext now: `src/components/auth/login-form.tsx:170-177`,`src/components/auth/login-form.tsx:335-341`: generic wrong-domain or main-site hint.
- Fix: Use special error and custom college-placement address remedy.

## G2-20-006-027  [P2] GAP  facet F07  effort S
- Legacy: Legacy error code INVALID_EMAIL maps to same not registered copy as NOT_REGISTERED; `docs/legacy-source/frontend/src/loginPages/Login.js:37-43`
- vNext now: New ERROR_MESSAGES list has NOT_REGISTERED but not INVALID_EMAIL; `src/components/auth/login-form.tsx:52-80,166-183`
- Fix: Map INVALID_EMAIL to supported user-friendly email refusal string or document server code never emitted.

## G2-20-006-028  [P2] GAP  facet F07  effort S
- Legacy: Legacy LOGIN_METHOD_DISABLED error code; `docs/legacy-source/frontend/src/loginPages/Login.js:56-57`
- vNext now: New CHANNEL_DISABLED code with equivalent channel copy; `src/components/auth/login-form.tsx:77,175-178`
- Fix: Verify protocol error-code mapping in auth runtime so disabled method displays correct copy rather than generic error.

## G2-20-006-029  [P2] GAP  facet F07  effort S
- Legacy: Legacy dead attempt after OTP_EXPIRED, EMAIL_OTP_EXPIRED, INVALID_ATTEMPT, OTP_ATTEMPTS_EXCEEDED, WRONG_TENANT, ACCOUNT_SUSPENDED; `docs/legacy-source/frontend/src/loginPages/Login.js:29-30`
- vNext now: New RESTART_ERRORS only OTP_EXPIRED, INVALID_ATTEMPT, OTP_ATTEMPTS_EXCEEDED, wrong tenant separately; `src/components/auth/login-form.tsx:82-86,185-195`
- Fix: Handle EMAIL_OTP_EXPIRED and ACCOUNT_SUSPENDED attempt reset consistently if emitted by service.

## G2-20-006-034  [P2] GAP  facet F08  effort S
- Legacy: Legacy login errors use message.error keyed `ln2-error`, prevent stacked toasts, trigger robot 'oops'; `docs/legacy-source/frontend/src/loginPages/Login.js:99-108`
- vNext now: New inline error state and focused summary, no robot; `src/components/auth/login-form.tsx:123-139,166-185`
- Fix: Restore/to intentionally waive toast placement/robot feedback; avoid duplicate notifications.

## G2-1-036-023  [P3] GAP  facet F07  effort S
- Legacy: docs/legacy-source/frontend/src/loginPages/Login.js:64-67: expired code 'This code has expired. Ask for a new one.'
- vNext now: src/components/auth/login-form.tsx:67-68: 'This code can't be used any more. Ask for a new one to continue.'
- Fix: Match legacy copy if user-facing clone requires.

## G2-1-036-027  [P3] GAP  facet F08  effort S
- Legacy: docs/legacy-source/frontend/src/loginPages/Login.js:99-108: deduped AntD error toast key ln2-error.
- vNext now: src/components/auth/login-form.tsx:329-335: focused inline error Alert.
- Fix: Restore exact toast/robot notification only if visual clone.

## G2-1-032-037  [P3] GAP  facet F08  effort S
- Legacy: docs/legacy-source/frontend/src/loginPages/Login.js:929: error toast duration4; L:1362 resend error duration5.
- vNext now: src/components/auth/login-form.tsx:329-331: inline alert persists until next action.
- Fix: Match transient toast duration and deduplication.

## G2-1-013-014  [P3] GAP  facet F07  effort S
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/PublicMobileAuthController.java:476-477`: backend invalid email returns code INVALID_EMAIL.
- vNext now: `src/components/auth/login-form.tsx:209-211`: `Enter your email` / `Enter a valid email address`.
- Fix: Map exact invalid email API code to UI validation.

## G2-1-013-017  [P3] GAP  facet F07  effort S
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/PublicMobileAuthController.java:522-527`: email delivery failure 503 OTP_DELIVERY_FAILED with Try again.
- vNext now: `src/components/auth/login-form.tsx:170-172`: channel=email replaces error with `We couldn't send the email just now. Try again.`
- Fix: Retain delivery retry while documenting exact wording drift.

## G2-1-013-019  [P3] GAP  facet F08  effort S
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/PublicMobileAuthController.java:529-534`: success maskedEmail immediately.
- vNext now: `src/components/auth/login-form.tsx:232-238`: `Your email code is on its way` and generic maskedContact on next step.
- Fix: Use masked recruiter work email in confirmation and timer.

## G2-20-006-030  [P3] GAP  facet F07  effort S
- Legacy: Legacy 'This code has expired. Ask for a new one.'; `docs/legacy-source/frontend/src/loginPages/Login.js:64-67`
- vNext now: New 'This code can't be used any more. Ask for a new one to continue.'; `src/components/auth/login-form.tsx:67-68`
- Fix: Restore exact legacy expiration text if copy parity strict.

## G2-20-006-031  [P3] GAP  facet F07  effort S
- Legacy: Legacy JNTU required phone error `Mobile number is required`; `docs/legacy-source/frontend/src/loginPages/JntuLogin.js:97-103`
- vNext now: New generic empty phone error `Enter your mobile number`; `src/components/auth/login-form.tsx:205-211`
- Fix: Restore per-host error string for JNTU if flow retained.
