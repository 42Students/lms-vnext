# CI fix packet (round 1): src/modules/attendance/policy-service.ts

These are REAL errors reported by CI (GitHub Actions) on main. Fix every one of them in this file with the smallest correct change. Keep behaviour and wording; do not touch unrelated code; never use any, @ts-ignore, @ts-expect-error or eslint-disable to silence an error; no new packages. If a fix needs another file, edit it only if it is clearly part of the same error.

File: src/modules/attendance/policy-service.ts

- [tsc] line 143:11 error TS18047: 'context.membership' is possibly 'null'.
- [tsc] line 213:68 error TS18047: 'context.membership' is possibly 'null'.
- [tsc] line 252:65 error TS18047: 'context.membership' is possibly 'null'.
