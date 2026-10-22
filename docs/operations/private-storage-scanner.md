# Privileged private-object malware scanner — deployment contract

Production file and video uploads must remain in **Checking file** (`VERIFYING` / `PROCESSING`) until an independently operated scanner has inspected the **entire uploaded object**. The vNext API has no embedded malware-detection engine. A successful private-R2 credentials probe **does not** constitute scanning readiness.

## Worker and callback

1. Deploy an isolated scanner with read-only access to the dedicated **private** R2 bucket. Do not grant it the application database write role, expose private object URLs, or include scanner secrets in browser state.
2. Provision `APP_ENV=production`, `PRIVATE_STORAGE_SCANNER_READY=PROD_VERIFIED`, and an independently generated 32+ character `PRIVATE_STORAGE_SCANNER_WEBHOOK_SECRET` **only after** real-world end-to-end scanner verification. Rotate the secret independently of the R2 keys.
3. Find `VERIFYING` assignment/project file rows or `PROCESSING` lesson-video assets with `scan_status=PENDING`; read the privately scoped object, validate its generation, length and type, scan **all bytes**, and calculate the SHA-256 digest.
4. Wait until the upload's presigned PUT has expired **plus 60 seconds**, then **re-read and re-scan that exact generation**. A previously scanned object can be overwritten until the original presigned PUT expires; an old digest is not sufficient.
5. POST a JSON verdict to `/api/internal/storage/scan-verdict` over TLS with header `x-private-storage-scanner-key` set to the private scanner webhook secret. Example payload fields: `kind` = `ASSIGNMENT_SUBMISSION_FILE` / `PROJECT_RESOURCE_FILE` / `LESSON_VIDEO`; `fileId` and `collegeId` = scoped UUIDs; `generation` = original R2 Last-Modified millisecond generation as a decimal string; `verdict` = `CLEAN` or `REJECTED`; `sha256Hex` = whole-object digest (required for `CLEAN`); `completedAt` = current UTC ISO instant.
6. Treat a 2xx response as an accepted or idempotent attestation; a 409 is a non-applied verdict and needs fresh object/DB reconciliation, **not** a blind repeat against a new generation. Do not emit secrets, raw object keys, file names or digests in logs.

The callback compares the persisted tenant, owner, object generation, upload token hash, content type, length, status and scan state against a server-side R2 HEAD before an optimistic conditional state change. It records the fixed privileged scanner identifier, scan verdict and attestation time. It cannot be used from an authenticated learner/teacher session. A rejected artifact is unusable; private-bucket quarantine/deletion should be handled by the deployment cleanup worker.

## Release gates

- With `APP_ENV` missing or in production and no vetted scanner, the upload stays pending and download/playback grants **must not** be issued.
- `GET /api/admin/storage/readiness` returns an authorized, no-store 503 scanner warning until the production callback is provisioned, or development-only attestation is explicitly enabled in a non-production environment.
- Before setting `PROD_VERIFIED`, test clean and infected fixtures, mislabeled MIME, wrong college/owner, unknown/expired generation, replay, same object overwritten before upload URL expiry, malformed JSON, rejected scan, scanner timeout, duplicate delivery, secret rotation and revoked scanner.
- This contract describes the application integration; it does **not** deploy a scanning engine or change bucket policies. Deployment owners must verify malware detection and incident handling before accepting production uploads.

No legacy publicly accessible R2 URLs, untrusted client-provided scan flags, token defaults, or fail-open scanner substitutes are permitted.
