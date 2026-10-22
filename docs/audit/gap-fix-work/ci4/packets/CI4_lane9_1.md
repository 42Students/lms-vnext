# CI fix packet (round 4): src/app/(authenticated)/admin/settings/page.tsx

These are REAL errors reported by CI (GitHub Actions) on main. Fix every one of them in this file with the smallest correct change. Keep behaviour and wording; do not touch unrelated code; never use any, @ts-ignore, @ts-expect-error or eslint-disable to silence an error; no new packages. If a fix needs another file, edit it only if it is clearly part of the same error.

File: src/app/(authenticated)/admin/settings/page.tsx

- [tsc] line 91:29 error TS2367: This comparison appears to be unintentional because the types 'PlatformSettingOrigin' and '"PLATFORM"' have no overlap.
- [tsc] line 91:54 error TS2367: This comparison appears to be unintentional because the types 'PlatformSettingOrigin' and '"COLLEGE"' have no overlap.
- [tsc] line 180:9 error TS2322: Type 'never[] | { value: unknown; }[]' is not assignable to type 'readonly Entry[]'.
