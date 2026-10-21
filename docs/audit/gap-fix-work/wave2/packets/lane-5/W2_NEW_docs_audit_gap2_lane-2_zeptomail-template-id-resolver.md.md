# Work packet (wave 2): NEW / MISSING items from docs/audit/gap2/lane-2/zeptomail-template-id-resolver.md

12 findings. No vNext file yet: create the needed files, modules or routes inside the feature area of this lane.
Audit documents with full context: docs/audit/gap2/lane-2/zeptomail-template-id-resolver.md

## G2-2-003-001  [P2] GAP  facet F01  effort S
- Legacy: LC:14-16 @Component loaded on server startup; N/A page navigation
- vNext now: NC:19-33 runtime config accessor called by NP:23-24; no page
- Fix: Document startup-vs-send-time validation lifecycle and expose operator diagnostics for missing templates.

## G2-2-003-003  [P2] GAP  facet F03  effort S
- Legacy: LC:26-49 startup warnings, no user-facing buttons/icons
- vNext now: NC:19-33 no dashboard controls, NP:40-46 returns false on missing template
- Fix: Add operator-visible per-event readiness status if existing deploy logs cannot be reliably inspected.

## G2-2-003-006  [P2] GAP  facet F04  effort S
- Legacy: LC:18,55-60 placeholder TEMP_ID_PLACEHOLDER returned for null/unset event
- vNext now: NC:27-29 defaults to a non-placeholder OTP key; NP:40-46 missing mapping -> false
- Fix: Use explicit typed disabled/no-template result for missing event instead of assuming OTP fallback.

## G2-2-003-008  [P2] GAP  facet F06  effort S
- Legacy: LC:34-40 missing/null/blank/placeholder template id flagged; value not format-checked
- vNext now: NP:44-46 requires non-empty campaign key with NP:8 separate key policy
- Fix: Validate provider template IDs per legacy event without wrongly applying campaign identifier regex to provider opaque IDs.

## G2-2-003-009  [P2] GAP  facet F06  effort S
- Legacy: LC:57-60 trims nonblank ID, otherwise placeholder
- vNext now: NC:27-29 OTP key used as provided without trim at read; NP:44-46 campaign trims inside isCampaignTemplateKey
- Fix: Canonicalize all resolved template IDs once at config boundary and reject placeholder.

## G2-2-003-024  [P2] GAP  facet F13  effort S
- Legacy: LC:36-45 missing config warns then continues startup; dispatcher skips email LD:123-126
- vNext now: NP:40-46 fails closed, returns false; no startup warning
- Fix: Keep nonblocking startup while ensuring missing-event metrics and per-send skips.

## G2-2-003-031  [P2] GAP  facet F18  effort S
- Legacy: LC:38-47 exact startup text MISSING TEMPLATE and STARTUP WARNING / All ... configured
- vNext now: NP:87-90 catch returns false, no corresponding wording
- Fix: Preserve operator log meaning while avoiding secrets and PII; wording need not be exposed to learners.

## G2-2-003-033  [P2] GAP  facet F20  effort S
- Legacy: LC:34-39 for null event getTemplateId returns TEMP_ID_PLACEHOLDER; LC:55-60 null-safe
- vNext now: NP:32-41 request parser rejects unknown or empty mapping
- Fix: Preserve harmless skip for unknown event without treating malformed caller input as success.

## G2-2-003-035  [P2] GAP  facet F21  effort S
- Legacy: LC:34-40 Spring Environment props, @PostConstruct lifecycle
- vNext now: NC:19-33 process.env access, NP:23-24 provider mapping injected by caller
- Fix: Add centralized config-lint and per-environment provisioning check in deployment, not every request.

## G2-2-003-038  [P2] GAP  facet F22  effort S
- Legacy: LE:38-53 enum template keys; LR:181-184 property key construction
- vNext now: NP:10-25 caller-provided record; no exhaustive union/static completeness
- Fix: Introduce typed event key enum and compile-time/executable completeness check.

## G2-2-003-040  [P2] GAP  facet F23  effort S
- Legacy: LC:30-49 warns for every enum including non-email events
- vNext now: NP:40-46 only configured campaign key checked on send
- Fix: Retain all-event diagnostics but distinguish intentionally disabled channels from missing required templates.

## G2-2-003-026  [P3] GAP  facet F14  effort S
- Legacy: LC:18-60 does not upload/download/import/export; templates configured through application.properties
- vNext now: NC:19-33 process env, NP:21 mapping provided by server code
- Fix: Document config migration recipe and typed mapping validation, no user-upload template UI.
