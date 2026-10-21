# U004 — R2Config gap audit v2

## Source mapping
- `LC` = `docs/legacy-source/backend/src/main/java/com/_42students/lms/configuration/R2Config.java`
- `LR` = `docs/legacy-source/backend/src/main/java/com/_42students/lms/config/R2Condition.java`
- `LU` = `docs/legacy-source/backend/src/main/java/com/_42students/lms/utils/R2StorageUtils.java`
- `NC` = `src/modules/storage/r2-config.ts`
- `NS` = `src/modules/storage/s3-client.ts`
- `NP` = `src/modules/storage/private-object-storage.ts`

Backend configuration unit; legacy closure R2Condition + R2StorageUtils, vNext runtime R2 config + SigV4 transport + private grant service. Citations use the path alias and 1-based lines. N/A UI facets are scoped to this server-only unit, not its consuming routes.

## Facet table
| ID | Facet | Legacy behaviour (file:line) | vNext behaviour (file:line or NONE) | Verdict | Severity | Concrete fix | Effort |
|---|---|---|---|---|---|---|---|
| G2-2-004-001 | F01 | LC:30-32 Spring @Configuration and @Conditional; no page entry | NC:17-45 server-only accessor, no page entry | MATCH | P3 | N/A no route or navigation, mapping is infrastructure. | S |
| G2-2-004-002 | F02 | LC:34-44 env fields followed by r2Client bean LC:50-70 | NC:17-45 one config resolver, NS:8-20 transport type | GAP | P3 | Document lifecycle difference; no visual section to port. | S |
| G2-2-004-003 | F03 | LC:30-75 no user-visible buttons/links/icons | NC:17-45 no user-visible elements | MATCH | P3 | N/A backend configuration. | S |
| G2-2-004-004 | F04 | LC:34-44 reads r2.account.id, r2.access.key, r2.secret.key, r2.bucket.name | NC:20-23 reads R2_ACCOUNT_ID, R2_ACCESS_KEY, R2_SECRET_KEY, R2_PRIVATE_BUCKET | GAP | P2 | Map four legacy Spring properties to vNext secrets and private bucket. | S |
| G2-2-004-005 | F04 | LC:20-25 documents optional r2.public.url | NC:7-15 explicitly separates public legacy bucket from private target | GAP | P2 | Document public URL retirement and migrate approved public consumers. | S |
| G2-2-004-006 | F04 | LC:72-74 getBucketName returns bucketName | NC:38-44 S3Config.bucket property | MATCH | P3 | No change to consumer-visible bucket identity semantics. | S |
| G2-2-004-007 | F05 | LC:30-75 no table/list/sort/search or pagination | NC:17-45 no UI list | MATCH | P3 | N/A infrastructure source only. | S |
| G2-2-004-008 | F06 | LC:34-44 @Value missing defaults empty string | NC:20-26 all four trimmed and nonblank required | GAP | P1 | Update provisioning/playbook and fail capability gracefully where unset. | S |
| G2-2-004-009 | F06 | LC:52-55 validates only accountId nonblank at bean creation | NC:24-26 validates accessKey, secret and bucket also | EXTRA | P3 | Retain strict credential checks, document intentional hardening. | S |
| G2-2-004-010 | F06 | LC:57-58 interpolates account ID into endpoint without syntax validation | NC:38-39 same endpoint after trim, no account format validator | MATCH | P3 | No difference except trimming; optional validation hardening. | S |
| G2-2-004-011 | F07 | LC:53-55 throws 'R2 account ID is required but not configured' | NC:24-26 throws PRIVATE_STORAGE_NOT_CONFIGURED | GAP | P2 | Map typed error to safe setup message and ops diagnostic. | S |
| G2-2-004-012 | F07 | LC:30-32 skips all beans when account absent via LR:15-18 | NC:17-25 throws when called with invalid config | GAP | P1 | Guard runtime upload/download operations and return 503 rather than crashing routes. | S |
| G2-2-004-013 | F07 | LC:34-70 AWS SDK constructor exceptions for invalid credentials not explicit | NC:24-26 only checks nonempty credentials | UNKNOWN | P2 | Verify live malformed-credential response and avoid claiming provider validity. | S |
| G2-2-004-014 | F08 | LC:30-75 no toast/success/confirmation UI | NC:17-45 no toast or confirmation | MATCH | P3 | N/A. | S |
| G2-2-004-015 | F09 | LC:30-75 no overlay/dialog/popover | NC:17-45 no overlay/dialog/popover | MATCH | P3 | N/A. | S |
| G2-2-004-016 | F10 | LC:50-70 singleton AmazonS3 bean static credentials, auto region, path-style | NS:84-140 per-request SigV4 URL using auto region, bucket path | GAP | P2 | Verify signing/path-style equivalence, document intentional SDK replacement. | S |
| G2-2-004-017 | F10 | LC:62-69 SDK handles network on subsequent operations | NS:152-159 signed fetch cache no-store and NS:162-211 operations | EXTRA | P3 | Retain explicit no-store and typed HTTP errors. | S |
| G2-2-004-018 | F11 | LC:30-32 global bean config, no role authorization | NC:17-45 global env config; NP:47-50,78-99 validates owner scoping | EXTRA | P3 | Keep tenant/member permissions at storage-service boundary. | S |
| G2-2-004-019 | F12 | LC:57-69 endpoint https://<account>.r2.cloudflarestorage.com, region auto, path style | NC:38-43 endpoint/bucket; NS:74-82 path-style, NS:86 region auto | MATCH | P3 | No change. | S |
| G2-2-004-020 | F12 | LC:20-25 legacy public bucket can be shared | NC:31-36 production disallows private/public bucket sharing | EXTRA | P3 | Retain security restriction; document deliberate departure. | S |
| G2-2-004-021 | F13 | LC:27-28 condition permits tests without configured R2 | NC:24-26 throws only for storage operations | GAP | P2 | Keep storage-independent routes functional and fail closed for storage requests. | S |
| G2-2-004-022 | F13 | LC:30-75 no browser loading/error/offline state | NC:17-45 no browser state | MATCH | P3 | N/A backend only. | S |
| G2-2-004-023 | F14 | LC:50-70 client backs LU:52-63 upload, LU:134-163 get/delete | NS:184-211 stream/get/delete; NP:131-152 signed upload grants | GAP | P2 | Review whether legacy server-upload/public URL workloads intentionally dropped. | S |
| G2-2-004-024 | F14 | LC:43-44 bucket no enforced private namespace | NP:116-127 tenant/owner/namespace/key format | EXTRA | P3 | Retain private scoped keys for security. | S |
| G2-2-004-025 | F15 | LC:30-75 no notification/email operation | NC:17-45 no notifications/emails | MATCH | P3 | N/A. | S |
| G2-2-004-026 | F16 | LC:30-75 no responsive/mobile output | NC:17-45 no responsive/mobile output | MATCH | P3 | N/A. | S |
| G2-2-004-027 | F17 | LC:30-75 no focus, ARIA or screen reader content | NC:17-45 no focus/ARIA surface | MATCH | P3 | N/A. | S |
| G2-2-004-028 | F18 | LC:52-55 explicit account ID missing message | NC:25 code PRIVATE_STORAGE_NOT_CONFIGURED | GAP | P2 | Map machine error to meaningful non-secret copy for storage users/operators. | S |
| G2-2-004-029 | F19 | LC:50-70 singleton SDK client initialized once | NC:17-45 creates lightweight config each call; NS:24-57 signatures | GAP | P3 | Measure overhead before optimizing; do not cache stale secrets. | S |
| G2-2-004-030 | F20 | LC:52-58 trims to validate but interpolates raw account ID | NC:20,39 trims and uses normalized ID | EXTRA | P3 | Keep trimming to prevent whitespace host errors. | S |
| G2-2-004-031 | F20 | LC:38-41 empty access/secret accepted until SDK validation | NC:21-26 rejects empty immediately | EXTRA | P3 | Retain fail-closed validation. | S |
| G2-2-004-032 | F21 | LC:62-69 AWS SDK AmazonS3 + Cloudflare R2 | NS:2-20 custom SigV4 + NS:84-140 signed requests | GAP | P2 | Check signature/header/interoperability and metadata error modes live. | S |
| G2-2-004-033 | F22 | LC:30-75 no relational DB schema/entity/migration | NC:17-45 no DB, NP:116-127 generates object keys only | MATCH | P3 | N/A relational schema. | S |
| G2-2-004-034 | F23 | LC:20-28 supports public URL settings, SDK bean and conditional skip | NC:7-16 private bucket policy; NP:265-276 short-lived signed read | EXTRA | P3 | Record intentional security architecture difference, do not expose private files. | S |

## Unit summary
- Rows: 34. Verdicts: MATCH 13; GAP 12; EXTRA 8; UNKNOWN 1. Severity: P3 23; P2 9; P1 2.
- **Top 1 (P1):** Missing secrets now fail at runtime rather than suppressing bean registration; users need safe setup/error handling (F06/F07).
- **Top 2 (P2):** Map legacy public bucket and environment properties to private R2 provisioning without exposing tenant documents (F04/F14).
- **Top 3 (P2):** Verify custom SigV4 transport against AWS SDK R2 behavior, preserving path-style endpoint and region (F10/F21).

**UNKNOWN/live:** malformed credentials and network failures require deployment/request-path verification. Intentional hardened bucket separation is EXTRA, not a defect.
