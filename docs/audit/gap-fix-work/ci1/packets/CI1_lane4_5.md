# CI fix packet (round 1): src/modules/colleges/legacy-domain-login-readiness.ts

These are REAL errors reported by CI (GitHub Actions) on main. Fix every one of them in this file with the smallest correct change. Keep behaviour and wording; do not touch unrelated code; never use any, @ts-ignore, @ts-expect-error or eslint-disable to silence an error; no new packages. If a fix needs another file, edit it only if it is clearly part of the same error.

File: src/modules/colleges/legacy-domain-login-readiness.ts

- [tsc] line 27:6 error TS18047: 'f.domainTotal' is possibly 'null'.
- [tsc] line 31:6 error TS18047: 'f.domainPrimary' is possibly 'null'.
- [tsc] line 35:32 error TS18047: 'f.domainTotal' is possibly 'null'.
- [tsc] line 38:12 error TS18047: 'f.domainTotal' is possibly 'null'.
- [tsc] line 38:59 error TS18047: 'f.domainVerified' is possibly 'null'.
- [tsc] line 41:12 error TS18047: 'f.domainTotal' is possibly 'null'.
