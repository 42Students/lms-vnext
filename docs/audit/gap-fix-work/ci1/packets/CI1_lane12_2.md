# CI fix packet (round 1): src/components/activity/learner-notifications-inbox.tsx

These are REAL errors reported by CI (GitHub Actions) on main. Fix every one of them in this file with the smallest correct change. Keep behaviour and wording; do not touch unrelated code; never use any, @ts-ignore, @ts-expect-error or eslint-disable to silence an error; no new packages. If a fix needs another file, edit it only if it is clearly part of the same error.

File: src/components/activity/learner-notifications-inbox.tsx

- [tsc] line 134:37 error TS2551: Property 'toISOString' does not exist on type 'string | Date | readonly [number, number, number]'. Did you mean 'toString'?
