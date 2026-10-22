# CI fix packet (round 1): src/modules/storage/ui-models.ts

These are REAL errors reported by CI (GitHub Actions) on main. Fix every one of them in this file with the smallest correct change. Keep behaviour and wording; do not touch unrelated code; never use any, @ts-ignore, @ts-expect-error or eslint-disable to silence an error; no new packages. If a fix needs another file, edit it only if it is clearly part of the same error.

File: src/modules/storage/ui-models.ts

- [tsc] line 131:7 error TS2741: Property 'STORAGE_PROVIDER_UNAVAILABLE' is missing in type '{ STORAGE_NOT_FOUND: string; STORAGE_FORBIDDEN: string; STORAGE_UPLOADER_MEMBERSHIP_REQUIRED: string; STORAGE_NAME_INVALID: string; STORAGE_TYPE_NOT_ALLOWED: string; STORAGE_EXTENSION_MISMATCH: string; ... 13 more ...; STORAGE_NOT_CONFIGURED: string; }' but required in type 'Record<"STORAGE_NOT_FOUND" | "STORAGE_FORBIDDEN" |
