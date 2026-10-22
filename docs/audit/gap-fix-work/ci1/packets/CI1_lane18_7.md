# CI fix packet (round 1): src/modules/placements/tpo-remind-not-applied-service.ts

These are REAL errors reported by CI (GitHub Actions) on main. Fix every one of them in this file with the smallest correct change. Keep behaviour and wording; do not touch unrelated code; never use any, @ts-ignore, @ts-expect-error or eslint-disable to silence an error; no new packages. If a fix needs another file, edit it only if it is clearly part of the same error.

File: src/modules/placements/tpo-remind-not-applied-service.ts

- [tsc] line 77:22 error TS2339: Property 'createdAt' does not exist on type 'PgTableWithColumns<{ name: "activity_events"; schema: undefined; columns: { id: PgColumn<{ name: "id"; tableName: "activity_events"; dataType: "string"; columnType: "PgUUID"; data: string; driverParam: string; notNull: true; ... 7 more ...; generated: undefined; }, {}, {}>; ... 32 more ...; occurredAt: PgColumn<...>...'.
- [tsc] line 109:23 error TS2339: Property 'createdAt' does not exist on type 'PgTableWithColumns<{ name: "activity_events"; schema: undefined; columns: { id: PgColumn<{ name: "id"; tableName: "activity_events"; dataType: "string"; columnType: "PgUUID"; data: string; driverParam: string; notNull: true; ... 7 more ...; generated: undefined; }, {}, {}>; ... 32 more ...; occurredAt: PgColumn<...>...'.
