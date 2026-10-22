# CI fix packet (round 4): src/app/api/placements/tpo/audit/export/route.ts

These are REAL errors reported by CI (GitHub Actions) on main. Fix every one of them in this file with the smallest correct change. Keep behaviour and wording; do not touch unrelated code; never use any, @ts-ignore, @ts-expect-error or eslint-disable to silence an error; no new packages. If a fix needs another file, edit it only if it is clearly part of the same error.

File: src/app/api/placements/tpo/audit/export/route.ts

- [tsc] line 63:13 error TS2345: Argument of type '(value: string) => string' is not assignable to parameter of type '(value: string | undefined, index: number, array: (string | undefined)[]) => string'.
- [tsc] line 65:23 error TS2345: Argument of type 'string | Buffer<ArrayBufferLike>' is not assignable to parameter of type 'BodyInit | null | undefined'.
