# CI fix packet (round 1): src/modules/projects/project-meeting-plan-service.ts

These are REAL errors reported by CI (GitHub Actions) on main. Fix every one of them in this file with the smallest correct change. Keep behaviour and wording; do not touch unrelated code; never use any, @ts-ignore, @ts-expect-error or eslint-disable to silence an error; no new packages. If a fix needs another file, edit it only if it is clearly part of the same error.

File: src/modules/projects/project-meeting-plan-service.ts

- [tsc] line 177:85 error TS2345: Argument of type '{ key: string; meetingType: "GENERAL" | "PLANNING" | "STANDUP" | "REVIEW" | "RETRO"; meetingUrl: string | null; notes: string | null; title: string; agenda: string | null; startsAt: string; endsAt: string; linkedSprintId: string | null; linkedTaskId: string | null; id?: string | undefined; }' is not assignable to parameter of type '{ id: string; key: string; meeting
