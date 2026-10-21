# U005 — TemporarySmsOutageRecovery gap audit v2

## Source mapping
- `LC` = `docs/legacy-source/backend/src/main/java/com/_42students/lms/configuration/TemporarySmsOutageRecovery.java`
- `LS` = `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/SmsService.java`
- `LU` = `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/UserController.java`
- `NN` = `src/modules/notifications/exotel-sms.ts`
- `NL` = `src/modules/auth/login-service.ts`

This legacy Java BeanPostProcessor is explicitly testing-only and expired **2026-09-28 00:00 UTC**. Its functional outage suppression is no longer active as of 2026-10-21; absence in vNext is an intentional retirement candidate, not a requirement to weaken production authentication. Closure: SmsService interface, UserController OTP initiation, vNext Exotel OTP provider and login-service challenge. File aliases map directly to file:1-based line citations below.

## Facet comparison
| ID | Facet | Legacy behaviour (file:line) | vNext behaviour (file:line or NONE) | Verdict | Severity | Concrete fix | Effort |
|---|---|---|---|---|---|---|---|
| G2-2-005-001 | F01 | LC:28-30 infrastructure BeanPostProcessor, no screen/route/menu | NN:52-55 SMS provider adapter; no recovery screen | MATCH | P3 | N/A backend temporary adapter, no page navigation. | S |
| G2-2-005-002 | F02 | LC:31-49 config/expiry and 51-76 interception; no sections | NN:26-50 config validation, 52-140 send implementation; no UI | MATCH | P3 | N/A UI section order. | S |
| G2-2-005-003 | F03 | LC:15-26 comment, no buttons, badges, tooltips | NN:52-140 no user-facing controls | MATCH | P3 | N/A UI components. | S |
| G2-2-005-004 | F04 | LC:31 EXPIRES_AT 2026-09-28T00:00:00Z | NN:52-140 no recovery expiry; normal send path | GAP | P3 | Document expiration as retired behavior; do not port expired temporary workaround. | S |
| G2-2-005-005 | F04 | LC:42-43 APP_TEMPORARY_SMS_OUTAGE_ENABLED default true unless false | NN:26-38 EXOTEL_* normal provider configuration | GAP | P3 | Record removal of temporary feature flag after 2026-09-28. | S |
| G2-2-005-006 | F05 | LC:28-76 no list, filter, sort/paging | NN:52-140 no list or paging | MATCH | P3 | N/A. | S |
| G2-2-005-007 | F06 | LC:42-43 enabled property: anything except string false case-insensitive after trim | NN:41-50 checks six Exotel credentials trimmed | GAP | P2 | Do not silently treat old flag as supported; document new fail-closed SMS configuration. | S |
| G2-2-005-008 | F06 | LC:47-49 requires enabled AND current UTC instant before EXPIRES_AT | NN:52-140 no temporary enabled/date option | EXTRA | P3 | Keep expired fallback removed; vNext need not add testing bypass. | S |
| G2-2-005-009 | F06 | LC:41-45 Clock injectable in package unit tests | NN:52-55 provider fetch/config injectable | MATCH | P3 | No live form; both expose testable dependencies. | S |
| G2-2-005-010 | F07 | LC:67-73 suppresses only RuntimeException in sendOtp and returns false; all other causes rethrow | NN:131-137 catches provider errors and returns false | GAP | P2 | Confirm business-level handling of provider false and non-runtime exceptions; avoid swallowing unrelated runtime exceptions. | S |
| G2-2-005-011 | F07 | LC:62 warning `SMS OTP delivery returned false; temporary testing fallback is active` | NN:106-110 logs sms.otp_not_accepted with provider status | GAP | P3 | Record intentional log format change; no obsolete fallback wording required. | S |
| G2-2-005-012 | F07 | LC:69-70 warning `SMS OTP provider threw {}; temporary testing fallback is active` | NN:133-136 warns sms.otp_request_failed with errorType | GAP | P3 | Retain non-PII error class observability but do not mention expired bypass. | S |
| G2-2-005-013 | F08 | LC:60-64 provider false only logs and returns false; no success toast | NN:106-130 accepted/failed structured log, no toast | MATCH | P3 | N/A UI feedback belongs to login route. | S |
| G2-2-005-014 | F09 | LC:28-76 no dialogs/popovers/overlays | NN:52-140 no overlays | MATCH | P3 | N/A. | S |
| G2-2-005-015 | F10 | LC:51-76 Spring bean interceptor around all SmsService methods | NN:52-140 standalone Exotel adapter, no global intercepting proxy | GAP | P2 | Verify no other adapter's exception behavior depends on old global proxy; do not port expired interception. | S |
| G2-2-005-016 | F10 | LC:57-71 intercept only method named sendOtp, false or thrown runtime becomes false | NN:57-137 sendOtp itself catches provider errors; NL:358-361 throws OTP_DELIVERY_FAILED on false | GAP | P2 | Keep login failure explicit when provider not accepted; legacy fallback never bypasses after expiry. | S |
| G2-2-005-017 | F10 | LU:238-241 superadmin SMS send then verification record; LU:253-259 faculty similar | NL:338-360 stores attempt before provider call, then fails on no acceptance | EXTRA | P2 | Document transactional ordering change; ensure failed sends cannot be used to verify unless policy permits. | S |
| G2-2-005-018 | F11 | LC:51-53 proxy applies regardless of user type; no tenant scope checks | NL:317-321 super-admin dual-factor requirement, 333-370 channel-based challenge | EXTRA | P3 | Keep stronger sign-in policy and rate/tenant guards. | S |
| G2-2-005-019 | F12 | LC:31 permanent 2026-09-28Z cutoff (before current audit date 2026-10-21) | NN:57-137 ordinary provider send, no exception fallback | MATCH | P3 | No functional parity gap today; never re-enable expired temporary behavior. | S |
| G2-2-005-020 | F12 | LC:23-26 explicitly does not add OTP, issue tokens, change verification or rate limits | NL:338-355 persists keyed attempt and shared rate limits, NL:358-371 requires accepted send | MATCH | P3 | Do not introduce bypass or test OTP. | S |
| G2-2-005-021 | F13 | LC:65-74 non-RuntimeException and all non-sendOtp errors propagate | NN:131-137 catches send exception and returns false; NL:359-360 user-visible error code | GAP | P2 | Review error classification at auth boundary; preserve no-silent-success. | S |
| G2-2-005-022 | F13 | LC:60-64 false is propagated; legacy controller saves OTP even false LU:238-241 | NL:358-361 stops startLogin when provider fails | GAP | P2 | Document changed outage UX; provider delivery rejection must not be mistaken for success. | S |
| G2-2-005-023 | F14 | LC:15-76 no export/upload/download/import files | NN:52-140 no file management | MATCH | P3 | N/A. | S |
| G2-2-005-024 | F15 | LC:57-73 intercepts SMS OTP only (not notification sends) | NN:76-104 posts OTP Exotel SMS, no email | MATCH | P3 | Maintain no notification/email side effects in this adapter. | S |
| G2-2-005-025 | F15 | LS:19,29 sendOtp overloads; LC:57 matches name both overloads | NN:57 sendOtp(phoneE164,code) only | GAP | P2 | Verify callers of legacy context overload are migrated to approved DLT SMS path. | S |
| G2-2-005-026 | F16 | LC:28-76 backend only no mobile/responsive output | NN:52-140 backend only | MATCH | P3 | N/A. | S |
| G2-2-005-027 | F17 | LC:28-76 no keyboard/focus/screen reader output | NN:52-140 backend only | MATCH | P3 | N/A. | S |
| G2-2-005-028 | F18 | LC:16-26 developer-only warning text and expiration notice | NN:131-137 structured logging, user-facing login error elsewhere NL:359-360 | GAP | P3 | Document retired operator log copy; do not surface workaround language. | S |
| G2-2-005-029 | F19 | LC:51-76 dynamic proxy invoked on each SmsService call before expiry | NN:52-140 direct provider implementation, no proxy | EXTRA | P3 | Keep simpler path, no performance parity obligation. | S |
| G2-2-005-030 | F20 | LC:47-49 injected UTC Clock and strict instant.isBefore(expiry) | NN:52-140 no clock cutoff; current date after expiry | MATCH | P3 | N/A expired feature; verify legacy clock is not spoofed in deployed environment. | S |
| G2-2-005-031 | F20 | LC:65-73 unwraps InvocationTargetException; swallows only RuntimeException from OTP | NN:131-137 catches any provider error; NL:359-360 treats false as failure | GAP | P2 | Test exception variants: timeout, malformed response, provider 503 and unexpected coding errors. | S |
| G2-2-005-032 | F21 | LC:51-76 intercepts legacy SmsService bean and would apply to any configured SMS vendor | NN:87-104 Exotel direct HTTP provider; no interceptor | GAP | P2 | Confirm non-Exotel provider adapters are obsolete; keep safety behavior explicit. | S |
| G2-2-005-033 | F21 | LC:31 automatically disables at UTC expiry with no redeploy | NN:52-140 no scheduled job or time-based workaround | MATCH | P3 | N/A retired temporary functionality. | S |
| G2-2-005-034 | F22 | LC:28-76 no table/entity/index/migration; rate attempts belong to LU:213-219 | NL:338-355 rate limit/createAttempt persisted via repository | MATCH | P3 | N/A persistence for temporary interceptor; credential/challenge model audited separately. | S |
| G2-2-005-035 | F23 | LC:15-26 explicitly says remove once billing restored, hard cutoff Sep 28 | NN:52-140 no equivalent, provider fails closed and logs | EXTRA | P3 | Classify removal as intentional retirement; do not implement obsolete test-mode fallback. | S |
| G2-2-005-036 | F23 | LC:18-26 legacy 9999 test OTP accepted separately; fallback only provider exception handling | NL:324-336 test contacts use dedicated configured test OTP | UNKNOWN | P2 | Verify test-contact policy externally; never assume legacy 9999 is allowed in vNext. | S |

## Unit summary
- Rows 36; verdicts MATCH 16, GAP 14, EXTRA 5, UNKNOWN 1; severity P3 25, P2 11.
- **Most important 1:** Expired temporary bypass should NOT be reintroduced; new provider fail-closed semantics are desirable (F12/F23).
- **Most important 2:** New auth persists attempted challenge before provider acceptance and then surfaces failure, unlike legacy controller saving on provider false; validate outstanding attempt safety, login UX and rate limits (F10/F13).
- **Most important 3:** Legacy proxy covered both sendOtp overloads, whereas vNext has a distinct typed Exotel path; verify all former callers and providers (F15/F21).

**Unknown/live:** 9999 test OTP provider policy and exception/non-Exception error handling cannot be certified without live/deployed auth configuration; do not treat the retired interceptor as a current security requirement.
