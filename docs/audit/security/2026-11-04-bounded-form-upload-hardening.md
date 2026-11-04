# Security slice — bounded upload/form streams

**Date:** 2026-11-04
**Repo:** 42Students/lms-vnext, main
**Scope:** resource exhaustion on three existing file/placement request boundaries.
**Status:** SOURCE CHANGE + REGRESSION TESTS, NOT RUNTIME CERTIFICATION.

## Original source defect

The assignment server-assisted multipart upload checked declared Content-Length and then called Request.formData() before checking actual file size. An untruthful/missing length allows a larger streamed request to be parsed in memory. The TPO round results importer checked a 3 MB file only AFTER form parsing. Recorded-outside placement forms had no request-body cap. Assignment upload-grant JSON used unbounded Request.json().

## Fix

- src/lib/bounded-form-data.ts parses only multipart with a boundary or ordinary urlencoded HTML forms; validates an advertised length but **also counts actual streamed bytes** and cancels over-limit input before invoking the FormData parser.
- Assignment multipart POST: total body 11 MiB; existing 10 MiB actual-file cap remains. JSON presign POST: 8 KiB, strict UTF-8.
- TPO results import: 4,000,000-byte total form cap; existing 3,000,000-byte file cap remains; authenticate before parser.
- Recorded-outside: 64 KiB total form cap, including urlencoded form support; authenticate before parser.
- Tests assert binary preservation, urlencoded compatibility, spoofed/suppressed Content-Length, malformed boundaries and data, early reject, bad limit settings, and route wiring. A dedicated workflow runs tests and typecheck.

## Unverified / not claimed

GitHub Actions runners, deployed ingress/WAF body limits, actual production monitoring, database privileges and RLS were **not** verified by writing this slice. A success status requires a green run on exact commit plus deployed/adversarial runtime checks. This slice does not replace resource/object permission tests, virus scanning, tenant isolation or privileged session reauthentication. docs/tracker.json remains the sole execution tracker.

Reproduction: npx vitest run tests/unit/security-bounded-form-data.test.ts ; npm run typecheck.
