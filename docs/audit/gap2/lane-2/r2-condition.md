# U002 — R2Condition gap audit v2

## Source mapping
- `LC` = `docs/legacy-source/backend/src/main/java/com/_42students/lms/config/R2Condition.java`
- `LU` = `docs/legacy-source/backend/src/main/java/com/_42students/lms/utils/R2StorageUtils.java`
- `NC` = `src/modules/storage/r2-config.ts`
- `NP` = `src/modules/storage/private-object-storage.ts`
- `NS` = `src/modules/storage/s3-client.ts`

Legacy class is an infrastructure bean-registration predicate rather than a page. Its direct closure is `R2StorageUtils` (`@Conditional(R2Condition.class)`, file operations and injected AWS SDK client). vNext equivalent is runtime private-object storage configuration; `getPrivateR2Config` is called from read/write services, backed by the SigV4 client. Citations use alias + 1-based line (`LC:16` means the full `LC` path above at line 16). No source/code changes performed. Live/DDL facts not inferred from source are marked UNKNOWN.

## Facet comparison

| ID | Facet | Legacy behaviour (file:line) | vNext behaviour (file:line or NONE) | Verdict | Severity | Concrete fix | Effort |
|---|---|---|---|---|---|---|---|
| G2-2-002-001 | F01 | LC:12-18 framework Condition used on LU:26-31; no user-facing route | NC:17-45 called via NP:131-135 private storage functions; no UI | GAP | P2 | Document configuration gate moving from bean-registration time to feature-call time; make feature readiness visible to consuming routes. | S |
| G2-2-002-002 | F02 | LC:12-18 pure framework predicate; N/A screen sections | NC:17-45 pure config function; N/A screen sections | MATCH | P3 | N/A: backend-only configuration gate, no page layout. | S |
| G2-2-002-003 | F03 | LC:12-18 no visible button, badge, icon or helper | NC:17-45 no visible UI; errors from NP:133 | MATCH | P3 | N/A: backend-only conditional; user-facing storage errors audited at consuming surfaces. | S |
| G2-2-002-004 | F04 | LC:16 reads r2.account.id as a string | NC:20 reads R2_ACCOUNT_ID, :21-23 reads 3 more values | GAP | P2 | Map env var names in deployment secret configuration with no accidental fallback to legacy properties. | S |
| G2-2-002-005 | F04 | LC:16-17 hasText accepts non-empty-with-text original value | NC:20 trims accountId and checks non-empty | MATCH | P3 | No action; both reject blank-only account identifiers. | S |
| G2-2-002-006 | F05 | LC:12-18 no tables/search/sort/pagination | NC:17-45 no table/list; object key prefixes handled NP:116-127 | MATCH | P3 | N/A: no table/list surface in this configuration gate. | S |
| G2-2-002-007 | F06 | LC:15-18 only one condition input r2.account.id | NC:20-26 requires account, access key, secret key, private bucket | GAP | P1 | Align deployment readiness semantics; ensure missing secret/bucket fails closed with explicit setup instructions. | S |
| G2-2-002-008 | F06 | LC:16-17 no type pattern/length validation beyond hasText | NC:20-23 trims values but does not validate R2 account format | UNKNOWN | P2 | Check live legacy bean initialization and invalid account ID behavior; add safe endpoint validation if policy requires. | S |
| G2-2-002-009 | F06 | LC:15-18 no user form, required markers, cancel/submit | NC:17-45 no user form | MATCH | P3 | N/A: server environment configuration, not user-entered fields. | S |
| G2-2-002-010 | F07 | LC:15-18 false returns silent exclusion; no error message | NC:24-26 throws PRIVATE_STORAGE_NOT_CONFIGURED | GAP | P1 | Handle missing config at per-feature boundary with typed 503/configure message; ensure other unrelated routes remain functional. | S |
| G2-2-002-011 | F07 | LC:16-17 no unsafe-prefix checks | NC:27-35 throws PRIVATE_STORAGE_BUCKET_UNSAFE for unsafe prefixes/shared buckets | EXTRA | P3 | Keep safety constraints; document intentional stricter validation. | S |
| G2-2-002-012 | F08 | LC:12-18 no success/info/confirmation toast | NC:17-45 no toast | MATCH | P3 | N/A: backend-only condition does not emit UI messages. | S |
| G2-2-002-013 | F09 | LC:12-18 no modals/drawers/popovers/menus | NC:17-45 no overlays | MATCH | P3 | N/A: storage configuration gate never opens UI. | S |
| G2-2-002-014 | F10 | LC:15-18 invoked by Spring bean auto-configuration, no network/write side effects | NC:17-45 config evaluation on runtime calls; NP:131-152 issues signed PUT grant | GAP | P2 | Note lifecycle change: probe storage readiness at startup/health if parity requires bean available only when configured. | M |
| G2-2-002-015 | F10 | LC:12-18 no controller/API endpoints | NC:17-45 no controller endpoints | MATCH | P3 | N/A: consumers implement storage actions; audit their routes separately. | S |
| G2-2-002-016 | F11 | LC:15-18 property gate applies independent of caller role, all beans subject to conditional | NC:17-45 env gate applies regardless of identity; NP:47-127 tenant/member-scoped validations | EXTRA | P3 | Keep separate per-request tenant access checks; configuration gate itself remains role neutral. | S |
| G2-2-002-017 | F12 | LC:16-17 property hasText for r2.account.id, ignores credentials and bucket | NC:20-26 all 4 secrets required | GAP | P1 | Document new all-or-nothing readiness invariant and ensure all provisioning guides reflect it. | S |
| G2-2-002-018 | F12 | LC:16-17 accepts any nonwhitespace accountId | NC:31-36 production forbids public legacy bucket and dev shares only with safe prefix | EXTRA | P3 | Keep fail-closed private-bucket policy; mark as intentional security divergence. | S |
| G2-2-002-019 | F13 | LC:16-17 false makes R2StorageUtils bean absent (LU:29-31) | NC:24-26 missing R2 config throws only when getPrivateR2Config called | GAP | P1 | Ensure consumers show unavailable capability rather than 500, and avoid loading dependent route before guard. | S |
| G2-2-002-020 | F13 | LC:12-18 no browser spinner/offline/session state | NC:17-45 no browser state | MATCH | P3 | N/A: these states belong to upload/download UI, not condition. | S |
| G2-2-002-021 | F14 | LU:29-34 @Conditional gate controls utility used for file uploads/downloads | NP:131-152 private presigned uploads, NP:259-287 private read grants | GAP | P2 | Audit whether legacy-public file workloads are deliberately dropped; route formerly-public consumers to approved private grants. | S |
| G2-2-002-022 | F15 | LC:12-18 no email/SMS templates, recipients or notices | NC:17-45 no notification dispatch | MATCH | P3 | N/A: does not trigger email or alerts. | S |
| G2-2-002-023 | F16 | LC:12-18 server bean gate, no responsive/touch layout | NC:17-45 server function, no responsive/touch layout | MATCH | P3 | N/A: no rendered interface. | S |
| G2-2-002-024 | F17 | LC:12-18 server class with no focus/keyboard/ARIA output | NC:17-45 server-only import; no DOM | MATCH | P3 | N/A: accessible feedback should be added to consuming upload UIs. | S |
| G2-2-002-025 | F18 | LC:8-10 Javadoc labels R2 account ID configured and non-empty; no user strings | NC:25,29,35 uses PRIVATE_STORAGE_* machine codes | GAP | P2 | Map machine codes to user-visible copy at upload consumers; static gate itself has no legacy copy. | S |
| G2-2-002-026 | F19 | LC:15-18 O(1) getProperty+hasText at bean setup | NC:17-45 O(1) env reads/config on per-operation path | GAP | P3 | Optional config memoization only if profiling shows repeated overhead; never cache stale secrets blindly. | S |
| G2-2-002-027 | F20 | LC:17 `StringUtils.hasText` considers tabs/spaces empty | NC:20-23 `.trim()` rejects ASCII whitespace; Unicode trimming may differ | UNKNOWN | P3 | Confirm Java hasText versus JS trim on Unicode whitespace in live configuration if such values may occur. | S |
| G2-2-002-028 | F20 | LC:16 one-property condition can evaluate true while invalid credentials missing | NC:24-26 fails closed if any credential absent | EXTRA | P3 | Keep hardened validation, document changed initialization failure semantics. | S |
| G2-2-002-029 | F21 | LC:12-18 Spring `@Conditional` evaluation (LU:26-31) | NP:4,133 and NS:84-140 Cloudflare R2 SigV4, no Spring bean system | GAP | P2 | Map legacy conditional bean wiring to vNext runtime storage readiness; verify environment variables provisioned in dev. | S |
| G2-2-002-030 | F21 | LU:34-42 AWS S3 `AmazonS3` injection and bucket/playback properties | NS:2-20 custom SigV4 S3 compatibility client; NC:38-45 endpoint from accountId | EXTRA | P3 | Retain dependency-free client; document transport replacement and verify interoperability. | S |
| G2-2-002-031 | F22 | LC:12-18 no DB table, entity, migration, index or enum | NC:17-45 no DB operation; NP:131-152 returns object key/grant | MATCH | P3 | N/A: R2 bean condition has no data model; downstream stored objects audited separately. | S |
| G2-2-002-032 | F23 | LC:15-18 bean registration only; NC:24-36 adds secret and bucket safety validation | NC:24-36 stricter private-bucket rules, no legacy-public URL path | EXTRA | P3 | Mark intentionally hardened private storage config; do not remove guard for pixel parity. | S |
| G2-2-002-033 | F23 | LU:29-40 legacy R2StorageUtils conditional and public URL fallback (LU:102-125) | NC:7-16 explicitly refuses public bucket in production; NP:259-276 signed private read only | GAP | P2 | Document intentional removal of public object URL behavior for vNext private files and inspect any public-material regression. | S |

## Unit summary

- **Rows:** 33; **verdicts:** GAP 12, MATCH 13, UNKNOWN 2, EXTRA 6; **severity:** P2 8, P3 21, P1 4.
- **Top 1:** Startup bean absence vs runtime typed failure requires consumer-side graceful setup UX and explicit health/readiness strategy (F07/F13, P1).
- **Top 2:** The condition changed from one nonblank `r2.account.id` to four mandatory environment values and separate bucket safety rules; synchronize deploy secrets/docs (F06/F12, P1).
- **Top 3:** Legacy public/long-lived object storage access and R2 bucket behavior differ deliberately from vNext attested private storage; verify all migration consumers (F14/F23, P2).

**Live checks:** Test a missing or whitespace-only R2 account ID at Spring startup versus vNext on a storage action; verify actual HTTP error mapping from upload consumers. This class has no frontend, email, persistence or migration of its own; N/A claims refer only to this predicate rather than all storage features.
