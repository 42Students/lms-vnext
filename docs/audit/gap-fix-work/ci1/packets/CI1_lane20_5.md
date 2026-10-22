# CI fix packet (round 1): src/modules/projects/college-projects-query-model.ts

These are REAL errors reported by CI (GitHub Actions) on main. Fix every one of them in this file with the smallest correct change. Keep behaviour and wording; do not touch unrelated code; never use any, @ts-ignore, @ts-expect-error or eslint-disable to silence an error; no new packages. If a fix needs another file, edit it only if it is clearly part of the same error.

File: src/modules/projects/college-projects-query-model.ts

- [tsc] line 19:36 error TS2304: Cannot find name 'COLLEGE_PROJECTS_PAGE_SIZES'.
- [tsc] line 19:69 error TS7006: Parameter 'size' implicitly has an 'any' type.
- [tsc] line 21:14 error TS2304: Cannot find name 'DEFAULT_COLLEGE_PROJECTS_PAGE_SIZE'.
- [tsc] line 78:26 error TS2304: Cannot find name 'DEFAULT_COLLEGE_PROJECTS_PAGE_SIZE'.
