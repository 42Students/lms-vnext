# CI fix packet (round 1): src/modules/placements/tpo-bulk-application-stage-service.ts

These are REAL errors reported by CI (GitHub Actions) on main. Fix every one of them in this file with the smallest correct change. Keep behaviour and wording; do not touch unrelated code; never use any, @ts-ignore, @ts-expect-error or eslint-disable to silence an error; no new packages. If a fix needs another file, edit it only if it is clearly part of the same error.

File: src/modules/placements/tpo-bulk-application-stage-service.ts

- [tsc] line 200:64 error TS2322: Type 'string' is not assignable to type '"TEST" | "INTERVIEW" | null'.
- [tsc] line 350:5 error TS2358: The left-hand side of an 'instanceof' expression must be of type 'any', an object type or a type parameter.
- [tsc] line 350:47 error TS2339: Property 'code' does not exist on type 'never'.
- [tsc] line 351:5 error TS2358: The left-hand side of an 'instanceof' expression must be of type 'any', an object type or a type parameter.
- [tsc] line 351:52 error TS2339: Property 'code' does not exist on type 'never'.
