# U003 — ZeptoMailTemplateIdResolver gap audit v2

## File mapping and closure
- `LC` = `docs/legacy-source/backend/src/main/java/com/_42students/lms/config/ZeptoMailTemplateIdResolver.java`
- `LE` = `docs/legacy-source/backend/src/main/java/com/_42students/lms/enums/NotificationEvent.java`
- `LR` = `docs/legacy-source/backend/src/main/java/com/_42students/lms/util/NotificationEventRegistry.java`
- `LD` = `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/NotificationDispatcherServiceImpl.java`
- `NC` = `src/modules/notifications/zeptomail-email.ts`
- `NP` = `src/modules/messaging/providers.ts`
- `NB` = `src/modules/messaging/template-boundary-model.ts`

Legacy backend closure: `NotificationEvent`, `NotificationEventRegistry`, `NotificationDispatcherServiceImpl`, `ZeptoMailTemplateIdResolver`, with send event/channel policy; vNext mapped provider config `zeptomail-email.ts`, generic outbound provider `providers.ts`, authentication/campaign key boundary. This unit is a Spring server config class, so UI-only facets are explicitly N/A and are not attributed to the frontend. Source citations use the complete file path in this mapping plus the 1-based line range.

## 23 mandatory facets

| ID | Facet | Legacy behaviour (file:line) | vNext behaviour (file:line or NONE) | Verdict | Severity | Concrete fix | Effort |
|---|---|---|---|---|---|---|---|
| G2-2-003-001 | F01 | LC:14-16 @Component loaded on server startup; N/A page navigation | NC:19-33 runtime config accessor called by NP:23-24; no page | GAP | P2 | Document startup-vs-send-time validation lifecycle and expose operator diagnostics for missing templates. | S |
| G2-2-003-002 | F02 | LC:30-49 validation lifecycle then LC:55-60 lookup; no UI section | NC:19-33 provider config; NP:10-25 typed templates; no UI section | MATCH | P3 | N/A screen layout; infrastructure-only resolver. | S |
| G2-2-003-003 | F03 | LC:26-49 startup warnings, no user-facing buttons/icons | NC:19-33 no dashboard controls, NP:40-46 returns false on missing template | GAP | P2 | Add operator-visible per-event readiness status if existing deploy logs cannot be reliably inspected. | S |
| G2-2-003-004 | F04 | LE:10-36 19 event enum entries with 19 template keys | NC:11-16 only OTP key in ZeptoMailConfig, NP:21,40-46 arbitrary caller-supplied campaign mapping | MISSING | P1 | Introduce audited typed event-to-template lookup and channel matrix for 19 legacy events. | S |
| G2-2-003-005 | F04 | LC:34,57 resolves environment key zepto.template.<event.templateKey> via LR:181-184 | NC:27-29 single ZEPTOMAIL_OTP_TEMPLATE_KEY, NP:40-46 config.templates keyed by send request | GAP | P1 | Port event-specific property keys into typed provider configuration; protect OTP templates separately. | S |
| G2-2-003-006 | F04 | LC:18,55-60 placeholder TEMP_ID_PLACEHOLDER returned for null/unset event | NC:27-29 defaults to a non-placeholder OTP key; NP:40-46 missing mapping -> false | GAP | P2 | Use explicit typed disabled/no-template result for missing event instead of assuming OTP fallback. | S |
| G2-2-003-007 | F05 | LC:31-49 loops enum values, no paging, filters or lists on UI | NP:21 templates record maps keys, no UI list/paging | MATCH | P3 | N/A: no finder table/list route. | S |
| G2-2-003-008 | F06 | LC:34-40 missing/null/blank/placeholder template id flagged; value not format-checked | NP:44-46 requires non-empty campaign key with NP:8 separate key policy | GAP | P2 | Validate provider template IDs per legacy event without wrongly applying campaign identifier regex to provider opaque IDs. | S |
| G2-2-003-009 | F06 | LC:57-60 trims nonblank ID, otherwise placeholder | NC:27-29 OTP key used as provided without trim at read; NP:44-46 campaign trims inside isCampaignTemplateKey | GAP | P2 | Canonicalize all resolved template IDs once at config boundary and reject placeholder. | S |
| G2-2-003-010 | F06 | LC:14-60 no user input form, required markers, defaults, submit/cancel | NC:19-33 env accessor no form | MATCH | P3 | N/A: operator config must not be tenant-editable through UI. | S |
| G2-2-003-011 | F07 | LC:38-45 warns missing per event + total startup ERROR | NP:40-46 returns false silently on missing provider template, no equivalent startup scan | MISSING | P1 | Add startup validation enumerating each email-enabled event with missing ID and aggregate warning. | S |
| G2-2-003-012 | F07 | LC:36-40 TEMP_ID_PLACEHOLDER treated missing at startup | NP:44-46 only blank/invalid key or OTP equality rejects | GAP | P1 | Reject literal placeholder value across all email send paths. | S |
| G2-2-003-013 | F08 | LC:47 logs All ZeptoMail template IDs are configured on successful startup | NC:19-33 config lookup no success/info notification | GAP | P3 | Provide non-sensitive log/metric for complete event template provisioning. | S |
| G2-2-003-014 | F08 | LC:43-45 startup warning says transactional emails silently skipped | NP:32-41 returns false with no operator toast | GAP | P2 | Expose structured skip counts to ops without exposing recipients/credentials. | S |
| G2-2-003-015 | F09 | LC:14-60 no overlays/menus/dialogs | NC:11-43 no overlays or UI | MATCH | P3 | N/A: startup validator and provider code only. | S |
| G2-2-003-016 | F10 | LC:30 @PostConstruct validates all events at startup | NC:19-33 function only when read, NP:32 per send | MISSING | P1 | Add startup readiness audit and operational health metric, respecting non-production send restrictions. | S |
| G2-2-003-017 | F10 | LC:55-60 getTemplateId(event) returns opaque ID for dispatcher | LD:123-126 skips missing before LD:133 provider send; NP:40-60 mapping/key gating and single POST | GAP | P1 | Implement explicit legacy-event dispatch adapter with complete channel and merge-variable coverage. | S |
| G2-2-003-018 | F10 | LD:127-149 attempts up to 3 sends on transient failures; 500ms*attempt sleep | NP:47-60 outbound POST maxAttempts 1; no unconfirmed retry | EXTRA | P3 | Retain no-retry idempotency safety, document deliberate behavior change with delivery-state logging. | S |
| G2-2-003-019 | F11 | LC:14-60 server-side config never exposes template IDs in browser | NC:19-33 env values server runtime; NP:43-60 provider boundary | MATCH | P3 | Keep config keys and token out of UI, tenant payloads and logs. | S |
| G2-2-003-020 | F11 | LD:36-40 dev stage only emails allowlisted DEV_MAIL_ALLOW, LD:116-118 gate | NP:38-41 canContactRecipientAtRuntime; read send-time allowlist | MATCH | P3 | Retain recipient policy; verify exact stage mapping in runtime configuration separately. | S |
| G2-2-003-021 | F12 | LR:50-59 email only for 6 urgent events, other 13 suppressed | NP:40-46 accepts any configured campaign key if safe; no event-level channel policy | MISSING | P1 | Encode six-event email allowlist and refuse other legacy events unless owner explicitly expands. | S |
| G2-2-003-022 | F12 | LR:42-49 offer/hired/cancelled/rescheduled intentionally not email/SMS | NP:40-46 generic provider has no event-specific deny list | GAP | P1 | Enforce negative event-channel policy to prevent cost/privacy regressions. | S |
| G2-2-003-023 | F12 | LE:35-36 SYSTEM_OTP_SMS bypasses dispatcher; LD:59-61 explicit skip | NC:62-76 dedicated OTP path; NP:45-46 forbids OTP-key campaign reuse | MATCH | P3 | Keep strict OTP/campaign isolation. | S |
| G2-2-003-024 | F13 | LC:36-45 missing config warns then continues startup; dispatcher skips email LD:123-126 | NP:40-46 fails closed, returns false; no startup warning | GAP | P2 | Keep nonblocking startup while ensuring missing-event metrics and per-send skips. | S |
| G2-2-003-025 | F13 | LC:14-60 no offline/loading/session browser states | NC:19-33 no UI, returns config | MATCH | P3 | N/A: browser errors belong to pages using notifications. | S |
| G2-2-003-026 | F14 | LC:18-60 does not upload/download/import/export; templates configured through application.properties | NC:19-33 process env, NP:21 mapping provided by server code | GAP | P3 | Document config migration recipe and typed mapping validation, no user-upload template UI. | S |
| G2-2-003-027 | F15 | LE:10-36 19 events; LR:52-59 six email-enabled events | NC:27-29 OTP-specific; NP:40-46 campaign map no full notification event registry | MISSING | P1 | Implement reviewed registry of each legacy event, channel and template binding; add channel tests. | S |
| G2-2-003-028 | F15 | LD:119-133 EmailVariableValidator filters variable schema and safe merge | NP:54 request.variables provided by caller; NP:5 model parsing | UNKNOWN | P1 | Review outboundSendSchema and per-event variable schema vs legacy EmailVariableValidator before declaring parity. | S |
| G2-2-003-029 | F16 | LC:14-60 server-only resolver, no mobile/tablet behavior | NC:19-33 server-only config | MATCH | P3 | N/A: no responsive interface. | S |
| G2-2-003-030 | F17 | LC:14-60 server-only resolver, no focus/ARIA/keyboard | NC:19-33 server-only config | MATCH | P3 | N/A: no interactive DOM. | S |
| G2-2-003-031 | F18 | LC:38-47 exact startup text MISSING TEMPLATE and STARTUP WARNING / All ... configured | NP:87-90 catch returns false, no corresponding wording | GAP | P2 | Preserve operator log meaning while avoiding secrets and PII; wording need not be exposed to learners. | S |
| G2-2-003-032 | F19 | LC:33-41 iterates all enum members at startup, O(N) | NP:40 dictionary lookup for one send, O(1) | EXTRA | P3 | Keep O(1) runtime lookup and add one-time validation pass. | S |
| G2-2-003-033 | F20 | LC:34-39 for null event getTemplateId returns TEMP_ID_PLACEHOLDER; LC:55-60 null-safe | NP:32-41 request parser rejects unknown or empty mapping | GAP | P2 | Preserve harmless skip for unknown event without treating malformed caller input as success. | S |
| G2-2-003-034 | F20 | LC:36 value.trim detects literal placeholder, but mixed-case variation not caught | NP:44-46 secure key validation; OTP equality prevents reuse | EXTRA | P3 | Document deliberate hardened separation; optionally reject case-variant placeholders. | S |
| G2-2-003-035 | F21 | LC:34-40 Spring Environment props, @PostConstruct lifecycle | NC:19-33 process.env access, NP:23-24 provider mapping injected by caller | GAP | P2 | Add centralized config-lint and per-environment provisioning check in deployment, not every request. | S |
| G2-2-003-036 | F21 | LD:123-133 ZeptoMailService.sendEmailWithTemplateId receives template ID | NP:47-55 posts template_key to ZeptoMail HTTP API | MATCH | P3 | Retain opaque provider-managed template reference and bounded safe merge values. | S |
| G2-2-003-037 | F22 | LR:9-12 in-code registry; LC:18-60 environment properties, no DB rows | NP:10-25 typed config/record, no generic template table | MATCH | P3 | N/A persistence for current runtime config; do not recreate historical template DB rows without producer evidence. | S |
| G2-2-003-038 | F22 | LE:38-53 enum template keys; LR:181-184 property key construction | NP:10-25 caller-provided record; no exhaustive union/static completeness | GAP | P2 | Introduce typed event key enum and compile-time/executable completeness check. | S |
| G2-2-003-039 | F23 | LD:127-149 transient email delivery retry; NP:55-57 intentional no retry | NP:57 maxAttempts=1 to avoid duplicate dispatch | EXTRA | P3 | Document intentional risk tradeoff; do not silently reinstate duplicates. | S |
| G2-2-003-040 | F23 | LC:30-49 warns for every enum including non-email events | NP:40-46 only configured campaign key checked on send | GAP | P2 | Retain all-event diagnostics but distinguish intentionally disabled channels from missing required templates. | S |

## Unit summary

- **Rows:** 40. **Verdicts:** GAP 18; MATCH 12; MISSING 5; EXTRA 4; UNKNOWN 1. **Severities:** P2 12; P3 18; P1 10.
- **Top gap 1 (P1):** Complete 19-event source registry and six-event urgent email allowlist are missing from general vNext outbound provider, risking incorrect channel activation and missing transactional sends.
- **Top gap 2 (P1):** Startup validation and per-event missing/placeholder warnings have no vNext equivalent; operators cannot see incomplete template provisioning before deployment.
- **Top gap 3 (P1):** The legacy event-based lookup is replaced with OTP-specific config plus caller-supplied campaign template keys; provide typed event/config adapter without weakening OTP isolation.

**Unknown:** Confirm all legacy consumer paths of the resolver and full `EmailVariableValidator` merge contract versus every vNext event-specific producer; source analysis does not assert live provider delivery, SMTP acceptance or email rendering. Intentional no-retry hardening is recorded rather than removed.
