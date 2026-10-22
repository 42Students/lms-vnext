# CI fix packet (round 4): src/app/(authenticated)/teacher/profile/page.tsx

These are REAL errors reported by CI (GitHub Actions) on main. Fix every one of them in this file with the smallest correct change. Keep behaviour and wording; do not touch unrelated code; never use any, @ts-ignore, @ts-expect-error or eslint-disable to silence an error; no new packages. If a fix needs another file, edit it only if it is clearly part of the same error.

File: src/app/(authenticated)/teacher/profile/page.tsx

- [tsc] line 50:20 error TS18047: 'person.user.displayName' is possibly 'null'.
- [tsc] line 56:12 error TS18047: 'person.user.displayName' is possibly 'null'.
