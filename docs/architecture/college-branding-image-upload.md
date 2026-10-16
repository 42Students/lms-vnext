# College branding logo upload (SA-tenants-modules-22)

The first-party college-logo path uses the existing signed S3/R2 transport primitives in `src/modules/storage/s3-client.ts` and the private R2 configuration in `src/modules/storage/r2-config.ts`. Assignment, project-resource and lesson-video upload routes are **not** repurposed: their foreign-key parent and membership authorization scopes are incompatible with Super Admin branding. No changes were made to the protected storage modules.

1. A privileged College Admin or scoped Super Admin opens the Branding page, chooses PNG/JPEG/WebP, and crops locally to a square PNG (200–1024 px) using the browser canvas. The displayed crop position and zoom are editable. The resulting PNG must be at most 2 MiB.
2. `POST /api/colleges/{collegeId}/branding/logo` accepts one file, enforces the registered `college.manage` scope, validates PNG magic bytes and a square IHDR width/height at least 200 px, then uploads it to private R2 using a short-lived server-side presigned PUT. The signed URL and object key never reach the client.
3. The server HEAD-checks the uploaded object against the private college scope and its expected size/content-type, then atomically switches the existing `colleges.logo_object_path` and writes a scoped branding audit event. The previous private object is deleted best effort **after** the switch commits.
4. Anonymous `GET /api/colleges/{collegeId}/branding/logo` streams only the active private PNG with `image/png`, `nosniff`, and short public cache headers. No R2 signed GET is exposed. `getPublicCollegeBranding` preferentially supplies this same-origin route when a managed logo exists.
5. `DELETE` on the same route (same-origin, authenticated, college.manage) removes the managed logo and audit-records that change.

**Deployment prerequisites:** private R2 bucket credentials and endpoint must be configured per `getPrivateR2Config`. In production the public image proxy and actual image rendering must be browser-verified, and malware/content policy should be reviewed before release; this source work did not provision scanner credentials or demonstrate runtime acceptance. Failures must not be mislabeled as successful uploads.

Existing externally hosted HTTPS logo URLs remain editable via `PUT /api/colleges/{collegeId}/branding`; managed uploads override only the public display path without silently overwriting support colours, terms, favicon, or the other branding fields.
