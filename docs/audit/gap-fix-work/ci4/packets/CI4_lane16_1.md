# CI fix packet (round 4): src/app/(authenticated)/hr/drives/page.tsx

These are REAL errors reported by CI (GitHub Actions) on main. Fix every one of them in this file with the smallest correct change. Keep behaviour and wording; do not touch unrelated code; never use any, @ts-ignore, @ts-expect-error or eslint-disable to silence an error; no new packages. If a fix needs another file, edit it only if it is clearly part of the same error.

File: src/app/(authenticated)/hr/drives/page.tsx

- [tsc] line 278:42 error TS2345: Argument of type 'string' is not assignable to parameter of type '"DRAFT" | "CANCELLED" | "REQUEST" | "REJECTED" | "SENT_BACK"'.
