# CI fix packet (round 4): src/app/(authenticated)/notifications/page.tsx

These are REAL errors reported by CI (GitHub Actions) on main. Fix every one of them in this file with the smallest correct change. Keep behaviour and wording; do not touch unrelated code; never use any, @ts-ignore, @ts-expect-error or eslint-disable to silence an error; no new packages. If a fix needs another file, edit it only if it is clearly part of the same error.

File: src/app/(authenticated)/notifications/page.tsx

- [tsc] line 98:27 error TS2783: 'actionHref' is specified more than once, so this usage will be overwritten.
- [tsc] line 102:75 error TS2339: Property 'metadata' does not exist on type '{ id: string; module: string; eventType: string; importance: string; occurredAt: Date; }'.
