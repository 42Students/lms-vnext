# CI fix packet (round 1): src/components/projects/project-meeting-plan-editor.tsx

These are REAL errors reported by CI (GitHub Actions) on main. Fix every one of them in this file with the smallest correct change. Keep behaviour and wording; do not touch unrelated code; never use any, @ts-ignore, @ts-expect-error or eslint-disable to silence an error; no new packages. If a fix needs another file, edit it only if it is clearly part of the same error.

File: src/components/projects/project-meeting-plan-editor.tsx

- [tsc] line 40:3 error TS2322: Type '{ id: string; title: string; agenda: string | null; meetingType: string; meetingUrl: string | null; notes: string | null; key: string; startsAt: string; endsAt: string; linkedSprintId: string | null; linkedTaskId: string | null; }' is not assignable to type 'Draft'.
