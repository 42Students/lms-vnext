# CI fix packet (round 1): src/components/projects/class-team-workspace-creator.tsx

These are REAL errors reported by CI (GitHub Actions) on main. Fix every one of them in this file with the smallest correct change. Keep behaviour and wording; do not touch unrelated code; never use any, @ts-ignore, @ts-expect-error or eslint-disable to silence an error; no new packages. If a fix needs another file, edit it only if it is clearly part of the same error.

File: src/components/projects/class-team-workspace-creator.tsx

- [tsc] line 717:8 error TS2741: Property 'empty' is missing in type '{ caption: string; rows: ClassTeamCreationResultRow[]; getRowKey: (row: ClassTeamCreationResultRow) => string; columns: ({ ...; } | { ...; })[]; }' but required in type 'DataTableProps<ClassTeamCreationResultRow>'.
