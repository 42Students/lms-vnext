# CI fix packet (round 1): src/app/api/placements/learner/schedule/route.ts

These are REAL errors reported by CI (GitHub Actions) on main. Fix every one of them in this file with the smallest correct change. Keep behaviour and wording; do not touch unrelated code; never use any, @ts-ignore, @ts-expect-error or eslint-disable to silence an error; no new packages. If a fix needs another file, edit it only if it is clearly part of the same error.

File: src/app/api/placements/learner/schedule/route.ts

- [tsc] line 27:43 error TS2551: Property 'roundKind' does not exist on type 'PlacementScheduleRow'. Did you mean 'roundId'?
- [tsc] line 32:29 error TS2339: Property 'timezone' does not exist on type '{ scheduledAt: Date; }'.
- [tsc] line 32:43 error TS2339: Property 'timezone' does not exist on type 'PlacementScheduleRow'.
- [tsc] line 33:26 error TS2339: Property 'venue' does not exist on type '{ scheduledAt: Date; }'.
- [tsc] line 33:37 error TS2339: Property 'venue' does not exist on type 'PlacementScheduleRow'.
- [tsc] line 34:31 error TS2339: Property 'meetingUrl' does not exist on type '{ scheduledAt: Date; }'.
- [tsc] line 34:47 error TS2339: Property 'meetingUrl' does not exist on type 'PlacementScheduleRow'.
- [tsc] line 35:21 error TS2339: Property 'whatToBring' does not exist on type 'PlacementScheduleRow'.
- [tsc] line 36:16 error TS2339: Property 'booked' does not exist on type 'PlacementScheduleRow'.
- [tsc] line 36:44 error TS2339: Property 'learnerConfirmedAt' does not exist on type 'PlacementScheduleRow'.
