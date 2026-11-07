# SEC-11 file uploads, documents and storage: assessment (2026-11-08)

Method: code read of `src/modules/storage/*`, unit test names in CI logs, dev configuration. Nothing run for this document.

| Area | Finding | Proposed state |
|---|---|---|
| Upload path | Direct-to-object-storage uploads with a presigned PUT that binds content type, size and the owner scope; the bucket secret is never returned; size ceilings per kind (documents, lesson videos) | IMPLEMENTED_UNVERIFIED |
| Content checks | After upload the server range-reads the head of the object: declared type must match the magic bytes (mismatch is QUARANTINED), size must equal the declared size, documents up to 50 MiB are hashed whole, videos are range-read only | IMPLEMENTED_UNVERIFIED |
| Malware scanning | Designed fail-closed: in production an upload stays VERIFYING and is never served until a separate scanner posts a CLEAN verdict to `/api/internal/storage/scan-verdict` (strict schema, shared secret, file id, college id and generation must match). Outside development and test, `PRIVATE_STORAGE_SCANNER_READY=PROD_VERIFIED` must be set. **No scanner worker exists**, so in production no upload can become READY | GAP (owner: choose and run a scanner) |
| Storage location | The private bucket does not exist: the legacy R2 key is object-scoped and the legacy bucket is public, so the app answers `STORAGE_NOT_CONFIGURED` for private uploads. The code refuses a private bucket equal to the public one | GAP (owner: create `lms-vnext-private`, set `R2_PRIVATE_BUCKET`) |
| Reads | Short-lived signed GET (5 minutes ceiling, video playback up to 2 hours), safe `Content-Disposition`, read is refused if the object changed after attestation, access decided from rows, not from the URL | IMPLEMENTED_UNVERIFIED |
| Tenant isolation of files | File rows carry the college and owner; database policies cover them (`storage-files` tables are tenant or derived tables); object keys include the scope | IMPLEMENTED_UNVERIFIED |
| Dev behaviour | `APP_ENV=development` allows a dev attestation so uploads work without a scanner; this is rejected in production | IMPLEMENTED_UNVERIFIED |

Owner decisions flagged: scanner choice and where it runs (for example ClamAV in the existing cluster, which needs about 1 GB of memory and is a resource and cost decision), creation of the private bucket, and the retention period for rejected files.
CI note: 13 tests in `tests/unit/file-lifecycle.test.ts` and several `storage-files-*` integration tests fail today with `STORAGE_NOT_CONFIGURED` because the test environment lacks the private-storage variables; see `GATE0-CI-RED.md`.
