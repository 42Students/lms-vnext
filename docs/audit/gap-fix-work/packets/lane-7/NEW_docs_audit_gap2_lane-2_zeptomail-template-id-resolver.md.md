# Work packet: NEW / MISSING items from docs/audit/gap2/lane-2/zeptomail-template-id-resolver.md

11 findings. These findings have no vNext file yet: create the files, modules or routes needed, inside the feature area of this lane.
Audit documents with full context: docs/audit/gap2/lane-2/zeptomail-template-id-resolver.md

## G2-2-003-004  [P1] MISSING  facet F04  effort S
- Legacy: LE:10-36 19 event enum entries with 19 template keys
- vNext now: NC:11-16 only OTP key in ZeptoMailConfig, NP:21,40-46 arbitrary caller-supplied campaign mapping
- Fix: Introduce audited typed event-to-template lookup and channel matrix for 19 legacy events.

## G2-2-003-005  [P1] GAP  facet F04  effort S
- Legacy: LC:34,57 resolves environment key zepto.template.<event.templateKey> via LR:181-184
- vNext now: NC:27-29 single ZEPTOMAIL_OTP_TEMPLATE_KEY, NP:40-46 config.templates keyed by send request
- Fix: Port event-specific property keys into typed provider configuration; protect OTP templates separately.

## G2-2-003-011  [P1] MISSING  facet F07  effort S
- Legacy: LC:38-45 warns missing per event + total startup ERROR
- vNext now: NP:40-46 returns false silently on missing provider template, no equivalent startup scan
- Fix: Add startup validation enumerating each email-enabled event with missing ID and aggregate warning.

## G2-2-003-012  [P1] GAP  facet F07  effort S
- Legacy: LC:36-40 TEMP_ID_PLACEHOLDER treated missing at startup
- vNext now: NP:44-46 only blank/invalid key or OTP equality rejects
- Fix: Reject literal placeholder value across all email send paths.

## G2-2-003-016  [P1] MISSING  facet F10  effort S
- Legacy: LC:30 @PostConstruct validates all events at startup
- vNext now: NC:19-33 function only when read, NP:32 per send
- Fix: Add startup readiness audit and operational health metric, respecting non-production send restrictions.

## G2-2-003-017  [P1] GAP  facet F10  effort S
- Legacy: LC:55-60 getTemplateId(event) returns opaque ID for dispatcher
- vNext now: LD:123-126 skips missing before LD:133 provider send; NP:40-60 mapping/key gating and single POST
- Fix: Implement explicit legacy-event dispatch adapter with complete channel and merge-variable coverage.

## G2-2-003-021  [P1] MISSING  facet F12  effort S
- Legacy: LR:50-59 email only for 6 urgent events, other 13 suppressed
- vNext now: NP:40-46 accepts any configured campaign key if safe; no event-level channel policy
- Fix: Encode six-event email allowlist and refuse other legacy events unless owner explicitly expands.

## G2-2-003-022  [P1] GAP  facet F12  effort S
- Legacy: LR:42-49 offer/hired/cancelled/rescheduled intentionally not email/SMS
- vNext now: NP:40-46 generic provider has no event-specific deny list
- Fix: Enforce negative event-channel policy to prevent cost/privacy regressions.

## G2-2-003-027  [P1] MISSING  facet F15  effort S
- Legacy: LE:10-36 19 events; LR:52-59 six email-enabled events
- vNext now: NC:27-29 OTP-specific; NP:40-46 campaign map no full notification event registry
- Fix: Implement reviewed registry of each legacy event, channel and template binding; add channel tests.

## G2-2-003-014  [P2] GAP  facet F08  effort S
- Legacy: LC:43-45 startup warning says transactional emails silently skipped
- vNext now: NP:32-41 returns false with no operator toast
- Fix: Expose structured skip counts to ops without exposing recipients/credentials.

## G2-2-003-013  [P3] GAP  facet F08  effort S
- Legacy: LC:47 logs All ZeptoMail template IDs are configured on successful startup
- vNext now: NC:19-33 config lookup no success/info notification
- Fix: Provide non-sensitive log/metric for complete event template provisioning.
