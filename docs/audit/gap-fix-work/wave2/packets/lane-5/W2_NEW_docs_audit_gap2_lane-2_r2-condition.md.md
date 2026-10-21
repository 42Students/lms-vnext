# Work packet (wave 2): NEW / MISSING items from docs/audit/gap2/lane-2/r2-condition.md

8 findings. No vNext file yet: create the needed files, modules or routes inside the feature area of this lane.
Audit documents with full context: docs/audit/gap2/lane-2/r2-condition.md

## G2-2-002-001  [P2] GAP  facet F01  effort S
- Legacy: LC:12-18 framework Condition used on LU:26-31; no user-facing route
- vNext now: NC:17-45 called via NP:131-135 private storage functions; no UI
- Fix: Document configuration gate moving from bean-registration time to feature-call time; make feature readiness visible to consuming routes.

## G2-2-002-004  [P2] GAP  facet F04  effort S
- Legacy: LC:16 reads r2.account.id as a string
- vNext now: NC:20 reads R2_ACCOUNT_ID, :21-23 reads 3 more values
- Fix: Map env var names in deployment secret configuration with no accidental fallback to legacy properties.

## G2-2-002-014  [P2] GAP  facet F10  effort M
- Legacy: LC:15-18 invoked by Spring bean auto-configuration, no network/write side effects
- vNext now: NC:17-45 config evaluation on runtime calls; NP:131-152 issues signed PUT grant
- Fix: Note lifecycle change: probe storage readiness at startup/health if parity requires bean available only when configured.

## G2-2-002-021  [P2] GAP  facet F14  effort S
- Legacy: LU:29-34 @Conditional gate controls utility used for file uploads/downloads
- vNext now: NP:131-152 private presigned uploads, NP:259-287 private read grants
- Fix: Audit whether legacy-public file workloads are deliberately dropped; route formerly-public consumers to approved private grants.

## G2-2-002-025  [P2] GAP  facet F18  effort S
- Legacy: LC:8-10 Javadoc labels R2 account ID configured and non-empty; no user strings
- vNext now: NC:25,29,35 uses PRIVATE_STORAGE_* machine codes
- Fix: Map machine codes to user-visible copy at upload consumers; static gate itself has no legacy copy.

## G2-2-002-029  [P2] GAP  facet F21  effort S
- Legacy: LC:12-18 Spring `@Conditional` evaluation (LU:26-31)
- vNext now: NP:4,133 and NS:84-140 Cloudflare R2 SigV4, no Spring bean system
- Fix: Map legacy conditional bean wiring to vNext runtime storage readiness; verify environment variables provisioned in dev.

## G2-2-002-033  [P2] GAP  facet F23  effort S
- Legacy: LU:29-40 legacy R2StorageUtils conditional and public URL fallback (LU:102-125)
- vNext now: NC:7-16 explicitly refuses public bucket in production; NP:259-276 signed private read only
- Fix: Document intentional removal of public object URL behavior for vNext private files and inspect any public-material regression.

## G2-2-002-026  [P3] GAP  facet F19  effort S
- Legacy: LC:15-18 O(1) getProperty+hasText at bean setup
- vNext now: NC:17-45 O(1) env reads/config on per-operation path
- Fix: Optional config memoization only if profiling shows repeated overhead; never cache stale secrets blindly.
