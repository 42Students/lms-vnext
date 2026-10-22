# CI fix packet (round 1): src/components/shell/admin-scope-switcher.tsx

These are REAL errors reported by CI (GitHub Actions) on main. Fix every one of them in this file with the smallest correct change. Keep behaviour and wording; do not touch unrelated code; never use any, @ts-ignore, @ts-expect-error or eslint-disable to silence an error; no new packages. If a fix needs another file, edit it only if it is clearly part of the same error.

File: src/components/shell/admin-scope-switcher.tsx

- [tsc] line 48:32 error TS2322: Type '"warning"' is not assignable to type 'ToastTone'.
