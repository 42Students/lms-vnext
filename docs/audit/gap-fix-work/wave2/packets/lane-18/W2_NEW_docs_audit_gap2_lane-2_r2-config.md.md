# Work packet (wave 2): NEW / MISSING items from docs/audit/gap2/lane-2/r2-config.md

9 findings. No vNext file yet: create the needed files, modules or routes inside the feature area of this lane.
Audit documents with full context: docs/audit/gap2/lane-2/r2-config.md

## G2-2-004-004  [P2] GAP  facet F04  effort S
- Legacy: LC:34-44 reads r2.account.id, r2.access.key, r2.secret.key, r2.bucket.name
- vNext now: NC:20-23 reads R2_ACCOUNT_ID, R2_ACCESS_KEY, R2_SECRET_KEY, R2_PRIVATE_BUCKET
- Fix: Map four legacy Spring properties to vNext secrets and private bucket.

## G2-2-004-005  [P2] GAP  facet F04  effort S
- Legacy: LC:20-25 documents optional r2.public.url
- vNext now: NC:7-15 explicitly separates public legacy bucket from private target
- Fix: Document public URL retirement and migrate approved public consumers.

## G2-2-004-016  [P2] GAP  facet F10  effort S
- Legacy: LC:50-70 singleton AmazonS3 bean static credentials, auto region, path-style
- vNext now: NS:84-140 per-request SigV4 URL using auto region, bucket path
- Fix: Verify signing/path-style equivalence, document intentional SDK replacement.

## G2-2-004-021  [P2] GAP  facet F13  effort S
- Legacy: LC:27-28 condition permits tests without configured R2
- vNext now: NC:24-26 throws only for storage operations
- Fix: Keep storage-independent routes functional and fail closed for storage requests.

## G2-2-004-023  [P2] GAP  facet F14  effort S
- Legacy: LC:50-70 client backs LU:52-63 upload, LU:134-163 get/delete
- vNext now: NS:184-211 stream/get/delete; NP:131-152 signed upload grants
- Fix: Review whether legacy server-upload/public URL workloads intentionally dropped.

## G2-2-004-028  [P2] GAP  facet F18  effort S
- Legacy: LC:52-55 explicit account ID missing message
- vNext now: NC:25 code PRIVATE_STORAGE_NOT_CONFIGURED
- Fix: Map machine error to meaningful non-secret copy for storage users/operators.

## G2-2-004-032  [P2] GAP  facet F21  effort S
- Legacy: LC:62-69 AWS SDK AmazonS3 + Cloudflare R2
- vNext now: NS:2-20 custom SigV4 + NS:84-140 signed requests
- Fix: Check signature/header/interoperability and metadata error modes live.

## G2-2-004-002  [P3] GAP  facet F02  effort S
- Legacy: LC:34-44 env fields followed by r2Client bean LC:50-70
- vNext now: NC:17-45 one config resolver, NS:8-20 transport type
- Fix: Document lifecycle difference; no visual section to port.

## G2-2-004-029  [P3] GAP  facet F19  effort S
- Legacy: LC:50-70 singleton SDK client initialized once
- vNext now: NC:17-45 creates lightweight config each call; NS:24-57 signatures
- Fix: Measure overhead before optimizing; do not cache stale secrets.
