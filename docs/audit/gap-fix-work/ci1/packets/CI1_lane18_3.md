# CI fix packet (round 1): src/components/projects/super-admin-template-subview-page.tsx

These are REAL errors reported by CI (GitHub Actions) on main. Fix every one of them in this file with the smallest correct change. Keep behaviour and wording; do not touch unrelated code; never use any, @ts-ignore, @ts-expect-error or eslint-disable to silence an error; no new packages. If a fix needs another file, edit it only if it is clearly part of the same error.

File: src/components/projects/super-admin-template-subview-page.tsx

- [tsc] line 112:9 error TS2739: Type '{ template: { id: string; slug: string; title: string; summary: string | null; legacyInitialWorkspaceStatus: string | null; legacyCourseLabel: string | null; legacyPhase: string | null; ... 7 more ...; updatedAt: Date; }; ... 6 more ...; legacyEventsAvailable: boolean; }' is missing the following properties from type '{ template: { id: string; slug: string; title: string; summa
- [tsc] line 383:19 error TS18049: 'a.sprintKey' is possibly 'null' or 'undefined'.
- [tsc] line 384:21 error TS2769: No overload matches this call.
