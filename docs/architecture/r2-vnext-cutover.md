# R2 storage cutover — legacy Spring to vNext

The legacy LMS initialized a singleton AWS `AmazonS3` client. vNext initializes no storage client at application startup: it resolves the private R2 configuration only when a storage operation is authorized, and uses Node `crypto` SigV4 signing with S3-compatible path-style bucket URLs. This intentionally allows non-storage pages to work without R2 secrets and **fails closed** for any upload, read grant, head or delete when a key is unavailable. No new npm package is required.

| Legacy application property | vNext deployment environment |
| --- | --- |
| `r2.account.id` | `R2_ACCOUNT_ID` |
| `r2.access.key` | `R2_ACCESS_KEY` |
| `r2.secret.key` | `R2_SECRET_KEY` |
| `r2.bucket.name` | `R2_PRIVATE_BUCKET` (use a separate non-public bucket, **not** the old public one) |
| `r2.public.url` | **No vNext equivalent**. Retire `R2_PUBLIC_URL` for private vNext storage. |

Legacy public URLs remain historical data and must not silently be reused as signed private grants. Consumers intentionally moved from public/server-upload operations to resource-authorized, short-lived PUT/GET grants and private HEAD/GET/DELETE transport. An approved public asset needing continued access must be migrated to a separate published asset workflow; this private storage service does not create public URLs.

## Configuration and runtime behaviour

`src/modules/storage/r2-config.ts` checks all four required variables only when storage is used. A missing value yields `PRIVATE_STORAGE_NOT_CONFIGURED`; user-facing copy is **“Private document storage is not set up yet. Please try again later.”** Never include missing variable values, account IDs, access keys or the provider response body in end-user error messages. The shared-bucket exception is **development-only**, requires `APP_ENV=development`, a nonempty slash-terminated `R2_PRIVATE_PREFIX`, and no public URL. Production requires an isolated private bucket.

`src/modules/storage/s3-client.ts` signs `GET`, `PUT`, `HEAD` and `DELETE` with the R2 `auto` region, AWS4-HMAC-SHA256, `UNSIGNED-PAYLOAD`, RFC-3986 encoded object paths and path-style `/<bucket>/<key>` addressing. The configuration object is lightweight and constructed per operation rather than retaining long-lived singleton credentials. Do **not** cache secrets without a documented rotation strategy; measure overhead before changing this boundary.


## Dev readiness visibility (no secret exposure)

A selected, authenticated Super Admin can request `GET /api/admin/storage/readiness`.
It returns `{storage:"private-r2",configured,status,message}` and HTTP 200 if
required private R2 configuration is present and safe, or HTTP 503 with the
sanitized `PRIVATE_R2_SETUP_MESSAGE` if unavailable. The endpoint does not
probe live R2 connectivity, echo environment values, or change the global
`/ready` status: optional file features are checked at the time they are used.
Do not mistake configured=true for a successful PUT/HEAD/GET interoperability
check. Run the non-CI operator checklist below before enabling file features.

## Operator interoperability verification (non-CI)

In a nonproduction private bucket only, verify a signed PUT followed by HEAD and a signed GET of matching content and MIME, then DELETE and confirm HEAD returns 404. Include keys containing spaces, non-ASCII and nested prefixes; exercise expected 403, 404 and provider-unavailable errors, expiration, clock skew, metadata handling, empty configuration and secret rotation. Confirm an unsigned request and old public URL cannot read the private object. Check redaction of errors, and that unrelated public/academic endpoints work while R2 is unconfigured. This is an **operator validation checklist**, not a claim that live interoperability was tested.

No new legacy SDK bean, public bucket fallback or production-open seed path is introduced by the cutover.
