# Private object storage contract

**Owner:** infrastructure. **Consumers:** profile verification, assignment/course files, project resources.

Private files live in **Cloudflare R2**, accessed through the dependency-free S3 client in `src/modules/storage/s3-client.ts` (AWS SigV4 with `node:crypto`; verified against AWS's published test vectors). The contract is in `src/modules/storage/private-object-storage.ts`.

## Configuration

`R2_ACCOUNT_ID`, `R2_ACCESS_KEY`, `R2_SECRET_KEY` and `R2_PRIVATE_BUCKET`. The private bucket **must differ** from the legacy `R2_BUCKET_NAME`, which is served publicly through `R2_PUBLIC_URL`; the code refuses to run (`PRIVATE_STORAGE_BUCKET_UNSAFE`) if they match. Never enable public access or a public domain on the private bucket.

**All-or-nothing provisioning:** The old Spring `r2.account.id` bean condition is not sufficient for vNext. Set `R2_ACCOUNT_ID`, `R2_ACCESS_KEY`, `R2_SECRET_KEY` and `R2_PRIVATE_BUCKET` together in the same deployment's secret configuration. If even one is missing or the private bucket fails the isolation check, storage upload/read grants must return `PRIVATE_STORAGE_NOT_CONFIGURED` or `PRIVATE_STORAGE_BUCKET_UNSAFE` (sanitized HTTP 503); unrelated LMS pages remain usable. `GET /api/admin/storage/readiness` reports configuration only, **not** an actual R2 connectivity test. Do not enable file features until signed PUT/HEAD/GET and scanner acceptance are checked.

Creating the bucket needs an R2 token with bucket-create permission (the legacy object-scoped key gets AccessDenied). Once available: `R2_* node/tsx scripts/ops/r2-create-private-bucket.ts lms-vnext-private`.

## Contract

- Keys are opaque and always `private/<college UUID>/<membership UUID>/<namespace>/<object UUID>`; clients never choose paths.
- Presigned PUT grants last 1-15 minutes and bind content type, tenant/member scope, expected size, a random upload token and `malware-scan-status=PENDING` as signed `x-amz-meta-*` headers.
- Feature APIs persist only the SHA-256 **hash** of the upload token.
- A privileged scanner records its verdict with `recordPrivateObjectScanVerdict` (server-side copy onto itself with replaced metadata: `malware-scan-status`, `scan-attested-by=lms-vnext-privileged-scanner`, `sha256`). Client-supplied scan claims are never accepted.
- `readPrivateObjectAttestation` fails closed unless tenant/member scope, generation, size, MIME, scanner attestation, SHA-256 and optional token hash agree.
- "Generation" is the object's Last-Modified in epoch milliseconds (numeric, as the DB check requires); it changes on every overwrite or metadata replace.
- Reads are short-lived presigned GETs issued only after the caller's authorization and attestation; public URLs are never returned or persisted.

## Feature layer (2026-10-16)

Assignment submission files, project resource files and lesson videos use this contract through `src/modules/storage/file-lifecycle.ts` and persist their own scan/attestation state in PostgreSQL (migration 0080) instead of copying objects to replace metadata, because videos reach 4900 MiB. Outside production a clearly named dev-only attestation (`APP_ENV` development or test) marks verified uploads READY; production stays fail closed. See `docs/architecture/file-and-video-storage.md` and `file-and-video-apis.md`.

## Not yet done

- The private bucket itself (needs a bucket-create token).
- The scanner worker that calls `recordPrivateObjectScanVerdict`. Until it exists uploads stay PENDING and are never served, which is the safe default.

## Temporary dev-only use of the legacy bucket

Until a dedicated private bucket exists, development (`APP_ENV=development`, namespace `lms-dev-2026`) may share the legacy bucket: set `R2_PRIVATE_BUCKET` equal to `R2_BUCKET_NAME` and `R2_PRIVATE_PREFIX=vnext-dev/`. The `PRIVATE_STORAGE_BUCKET_UNSAFE` guard only relaxes when `APP_ENV === "development"` and the prefix is non-empty and ends with `/`; production always throws. The prefix is applied in the S3 client (`S3Config.keyPrefix`), so logical keys stored in the database stay unprefixed. Objects are served only via short-lived presigned URLs. See `storage-key-layout.md`.
