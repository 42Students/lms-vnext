# CI fix packet (round 1): src/app/api/projects/[projectId]/members/route.ts

These are REAL errors reported by CI (GitHub Actions) on main. Fix every one of them in this file with the smallest correct change. Keep behaviour and wording; do not touch unrelated code; never use any, @ts-ignore, @ts-expect-error or eslint-disable to silence an error; no new packages. If a fix needs another file, edit it only if it is clearly part of the same error.

File: src/app/api/projects/[projectId]/members/route.ts

- [tsc] line 69:7 error TS2345: Argument of type 'unknown' is not assignable to parameter of type '{ membershipId: string; role: "LEARNER" | "MENTOR"; isPrimary?: boolean | undefined; roleKind?: "LEARNER" | "MENTOR" | "CO_MENTOR" | "OBSERVER" | "REVIEWER" | "QA" | undefined; canMutate?: boolean | undefined; roleLabel?: string | undefined; }'.
