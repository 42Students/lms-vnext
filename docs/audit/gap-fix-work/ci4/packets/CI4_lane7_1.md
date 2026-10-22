# CI fix packet (round 4): src/app/(authenticated)/admin/electives/page.tsx

These are REAL errors reported by CI (GitHub Actions) on main. Fix every one of them in this file with the smallest correct change. Keep behaviour and wording; do not touch unrelated code; never use any, @ts-ignore, @ts-expect-error or eslint-disable to silence an error; no new packages. If a fix needs another file, edit it only if it is clearly part of the same error.

File: src/app/(authenticated)/admin/electives/page.tsx

- [tsc] line 171:13 error TS2339: Property 'description' does not exist on type 'AdminElectiveRow'.
- [tsc] line 171:90 error TS2339: Property 'description' does not exist on type 'AdminElectiveRow'.
- [tsc] line 180:43 error TS2339: Property 'version' does not exist on type 'AdminElectiveRow'.
- [tsc] line 209:62 error TS2339: Property 'description' does not exist on type 'AdminElectiveRow'.
- [tsc] line 209:97 error TS2339: Property 'version' does not exist on type 'AdminElectiveRow'.
