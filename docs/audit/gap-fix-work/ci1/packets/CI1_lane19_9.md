# CI fix packet (round 1): src/modules/admin-ui/college-dashboard-attendance-service.ts

These are REAL errors reported by CI (GitHub Actions) on main. Fix every one of them in this file with the smallest correct change. Keep behaviour and wording; do not touch unrelated code; never use any, @ts-ignore, @ts-expect-error or eslint-disable to silence an error; no new packages. If a fix needs another file, edit it only if it is clearly part of the same error.

File: src/modules/admin-ui/college-dashboard-attendance-service.ts

- [tsc] line 78:95 error TS2339: Property 'deliveryId' does not exist on type 'PgTableWithColumns<{ name: "section_schedule_events"; schema: undefined; columns: { id: PgColumn<{ name: "id"; tableName: "section_schedule_events"; dataType: "string"; columnType: "PgUUID"; data: string; driverParam: string; ... 8 more ...; generated: undefined; }, {}, {}>; ... 14 more ...; updatedAt: PgColumn<...>...'.
