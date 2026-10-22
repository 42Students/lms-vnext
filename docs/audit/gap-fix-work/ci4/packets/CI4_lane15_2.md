# CI fix packet (round 4): src/app/api/academics/schedule-events/route.ts

These are REAL errors reported by CI (GitHub Actions) on main. Fix every one of them in this file with the smallest correct change. Keep behaviour and wording; do not touch unrelated code; never use any, @ts-ignore, @ts-expect-error or eslint-disable to silence an error; no new packages. If a fix needs another file, edit it only if it is clearly part of the same error.

File: src/app/api/academics/schedule-events/route.ts

- [tsc] line 58:9 error TS2345: Argument of type 'unknown' is not assignable to parameter of type '{ sectionId: string; title: string; startsAt: string; endsAt: string; facultyMembershipId?: string | null | undefined; deliveryId?: string | null | undefined; lectureHallId?: string | null | undefined; description?: string | ... 1 more ... | undefined; location?: string | ... 1 more ... | undefined; }'.
