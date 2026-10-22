# CI fix packet (round 1): src/db/schema/memberships.ts

These are REAL errors reported by CI (GitHub Actions) on main. Fix every one of them in this file with the smallest correct change. Keep behaviour and wording; do not touch unrelated code; never use any, @ts-ignore, @ts-expect-error or eslint-disable to silence an error; no new packages. If a fix needs another file, edit it only if it is clearly part of the same error.

File: src/db/schema/memberships.ts

- [tsc] line 20:14 error TS7022: 'collegeMemberships' implicitly has type 'any' because it does not have a type annotation and is referenced directly or indirectly in its own initializer.
- [tsc] line 29:19 error TS7024: Function implicitly has return type 'any' because it does not have a return type annotation and is referenced directly or indirectly in one of its return expressions.
