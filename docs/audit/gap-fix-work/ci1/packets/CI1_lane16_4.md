# CI fix packet (round 1): src/modules/placements/college-placement-student-lookup-service.ts

These are REAL errors reported by CI (GitHub Actions) on main. Fix every one of them in this file with the smallest correct change. Keep behaviour and wording; do not touch unrelated code; never use any, @ts-ignore, @ts-expect-error or eslint-disable to silence an error; no new packages. If a fix needs another file, edit it only if it is clearly part of the same error.

File: src/modules/placements/college-placement-student-lookup-service.ts

- [tsc] line 203:33 error TS2339: Property 'createdAt' does not exist on type 'PgTableWithColumns<{ name: "placement_offers"; schema: undefined; columns: { id: PgColumn<{ name: "id"; tableName: "placement_offers"; dataType: "string"; columnType: "PgUUID"; data: string; driverParam: string; notNull: true; ... 7 more ...; generated: undefined; }, {}, {}>; ... 35 more ...; updatedAt: PgColumn<......'.
