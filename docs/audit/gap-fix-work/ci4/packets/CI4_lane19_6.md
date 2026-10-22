# CI fix packet (round 4): src/components/projects/project-workspace.tsx

These are REAL errors reported by CI (GitHub Actions) on main. Fix every one of them in this file with the smallest correct change. Keep behaviour and wording; do not touch unrelated code; never use any, @ts-ignore, @ts-expect-error or eslint-disable to silence an error; no new packages. If a fix needs another file, edit it only if it is clearly part of the same error.

File: src/components/projects/project-workspace.tsx

- [tsc] line 757:43 error TS2339: Property 'endedAt' does not exist on type '{ id: string; membershipId: string; role: string; roleKind: string; canMutate: boolean; isPrimary: boolean; roleLabel: string | null; displayName: string; legacyDisplayName: string | null; ... 5 more ...; startedAt: Date; }'.
- [tsc] line 2414:57 error TS2339: Property 'actorUserId' does not exist on type '{ id: string; eventType: string; importance: string; subjectType: string; subjectId: string; subjectLabel: string | null; summary: string; occurredAt: Date; actorDisplayName: string | null; actorType: string | null; sourceTab: string | null; projectSlug: string; title: string; }'.
