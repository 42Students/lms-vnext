# CI fix packet (round 1): src/components/tracker/independent-finding-sync-action.tsx

These are REAL errors reported by CI (GitHub Actions) on main. Fix every one of them in this file with the smallest correct change. Keep behaviour and wording; do not touch unrelated code; never use any, @ts-ignore, @ts-expect-error or eslint-disable to silence an error; no new packages. If a fix needs another file, edit it only if it is clearly part of the same error.

File: src/components/tracker/independent-finding-sync-action.tsx

- [tsc] line 50:27 error TS2322: Type '"error" | "success" | "warning"' is not assignable to type '"error" | "success" | "info"'.
