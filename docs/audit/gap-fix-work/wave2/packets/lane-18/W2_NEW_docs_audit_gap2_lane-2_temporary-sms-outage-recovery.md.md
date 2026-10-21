# Work packet (wave 2): NEW / MISSING items from docs/audit/gap2/lane-2/temporary-sms-outage-recovery.md

11 findings. No vNext file yet: create the needed files, modules or routes inside the feature area of this lane.
Audit documents with full context: docs/audit/gap2/lane-2/temporary-sms-outage-recovery.md

## G2-2-005-007  [P2] GAP  facet F06  effort S
- Legacy: LC:42-43 enabled property: anything except string false case-insensitive after trim
- vNext now: NN:41-50 checks six Exotel credentials trimmed
- Fix: Do not silently treat old flag as supported; document new fail-closed SMS configuration.

## G2-2-005-015  [P2] GAP  facet F10  effort S
- Legacy: LC:51-76 Spring bean interceptor around all SmsService methods
- vNext now: NN:52-140 standalone Exotel adapter, no global intercepting proxy
- Fix: Verify no other adapter's exception behavior depends on old global proxy; do not port expired interception.

## G2-2-005-016  [P2] GAP  facet F10  effort S
- Legacy: LC:57-71 intercept only method named sendOtp, false or thrown runtime becomes false
- vNext now: NN:57-137 sendOtp itself catches provider errors; NL:358-361 throws OTP_DELIVERY_FAILED on false
- Fix: Keep login failure explicit when provider not accepted; legacy fallback never bypasses after expiry.

## G2-2-005-021  [P2] GAP  facet F13  effort S
- Legacy: LC:65-74 non-RuntimeException and all non-sendOtp errors propagate
- vNext now: NN:131-137 catches send exception and returns false; NL:359-360 user-visible error code
- Fix: Review error classification at auth boundary; preserve no-silent-success.

## G2-2-005-022  [P2] GAP  facet F13  effort S
- Legacy: LC:60-64 false is propagated; legacy controller saves OTP even false LU:238-241
- vNext now: NL:358-361 stops startLogin when provider fails
- Fix: Document changed outage UX; provider delivery rejection must not be mistaken for success.

## G2-2-005-025  [P2] GAP  facet F15  effort S
- Legacy: LS:19,29 sendOtp overloads; LC:57 matches name both overloads
- vNext now: NN:57 sendOtp(phoneE164,code) only
- Fix: Verify callers of legacy context overload are migrated to approved DLT SMS path.

## G2-2-005-031  [P2] GAP  facet F20  effort S
- Legacy: LC:65-73 unwraps InvocationTargetException; swallows only RuntimeException from OTP
- vNext now: NN:131-137 catches any provider error; NL:359-360 treats false as failure
- Fix: Test exception variants: timeout, malformed response, provider 503 and unexpected coding errors.

## G2-2-005-032  [P2] GAP  facet F21  effort S
- Legacy: LC:51-76 intercepts legacy SmsService bean and would apply to any configured SMS vendor
- vNext now: NN:87-104 Exotel direct HTTP provider; no interceptor
- Fix: Confirm non-Exotel provider adapters are obsolete; keep safety behavior explicit.

## G2-2-005-004  [P3] GAP  facet F04  effort S
- Legacy: LC:31 EXPIRES_AT 2026-09-28T00:00:00Z
- vNext now: NN:52-140 no recovery expiry; normal send path
- Fix: Document expiration as retired behavior; do not port expired temporary workaround.

## G2-2-005-005  [P3] GAP  facet F04  effort S
- Legacy: LC:42-43 APP_TEMPORARY_SMS_OUTAGE_ENABLED default true unless false
- vNext now: NN:26-38 EXOTEL_* normal provider configuration
- Fix: Record removal of temporary feature flag after 2026-09-28.

## G2-2-005-028  [P3] GAP  facet F18  effort S
- Legacy: LC:16-26 developer-only warning text and expiration notice
- vNext now: NN:131-137 structured logging, user-facing login error elsewhere NL:359-360
- Fix: Document retired operator log copy; do not surface workaround language.
