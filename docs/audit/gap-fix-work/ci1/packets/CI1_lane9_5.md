# CI fix packet (round 1): src/components/courses/learner-course-list.tsx

These are REAL errors reported by CI (GitHub Actions) on main. Fix every one of them in this file with the smallest correct change. Keep behaviour and wording; do not touch unrelated code; never use any, @ts-ignore, @ts-expect-error or eslint-disable to silence an error; no new packages. If a fix needs another file, edit it only if it is clearly part of the same error.

File: src/components/courses/learner-course-list.tsx

- [tsc] line 275:42 error TS18047: 'target.selectionEnd' is possibly 'null'.
- [tsc] line 275:62 error TS18047: 'target.selectionStart' is possibly 'null'.
