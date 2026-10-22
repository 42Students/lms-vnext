# CI fix packet (round 1): src/modules/courses/assignment-submission-service.ts

These are REAL errors reported by CI (GitHub Actions) on main. Fix every one of them in this file with the smallest correct change. Keep behaviour and wording; do not touch unrelated code; never use any, @ts-ignore, @ts-expect-error or eslint-disable to silence an error; no new packages. If a fix needs another file, edit it only if it is clearly part of the same error.

File: src/modules/courses/assignment-submission-service.ts

- [tsc] line 224:44 error TS7006: Parameter 'receiptId' implicitly has an 'any' type.
- [tsc] line 259:46 error TS7006: Parameter 'link' implicitly has an 'any' type.
- [tsc] line 385:28 error TS7006: Parameter 'link' implicitly has an 'any' type.
- [tsc] line 385:34 error TS7006: Parameter 'sequence' implicitly has an 'any' type.
