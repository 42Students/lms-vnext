# CI fix packet (round 1): src/app/api/placements/recruiter/profile/route.ts

These are REAL errors reported by CI (GitHub Actions) on main. Fix every one of them in this file with the smallest correct change. Keep behaviour and wording; do not touch unrelated code; never use any, @ts-ignore, @ts-expect-error or eslint-disable to silence an error; no new packages. If a fix needs another file, edit it only if it is clearly part of the same error.

File: src/app/api/placements/recruiter/profile/route.ts

- [tsc] line 29:48 error TS2339: Property 'displayName' does not exist on type 'AuthenticatedUser'.
- [tsc] line 30:23 error TS2339: Property 'email' does not exist on type 'AuthenticatedUser'.
