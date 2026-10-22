# CI fix packet (round 1): src/components/placements/placement-job-create-form.tsx

These are REAL errors reported by CI (GitHub Actions) on main. Fix every one of them in this file with the smallest correct change. Keep behaviour and wording; do not touch unrelated code; never use any, @ts-ignore, @ts-expect-error or eslint-disable to silence an error; no new packages. If a fix needs another file, edit it only if it is clearly part of the same error.

File: src/components/placements/placement-job-create-form.tsx

- [tsc] line 732:53 error TS2448: Block-scoped variable 'applicationMode' used before its declaration.
- [tsc] line 732:53 error TS2454: Variable 'applicationMode' is used before being assigned.
