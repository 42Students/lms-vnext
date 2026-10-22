# CI fix packet (round 1): src/modules/groups/service.ts

These are REAL errors reported by CI (GitHub Actions) on main. Fix every one of them in this file with the smallest correct change. Keep behaviour and wording; do not touch unrelated code; never use any, @ts-ignore, @ts-expect-error or eslint-disable to silence an error; no new packages. If a fix needs another file, edit it only if it is clearly part of the same error.

File: src/modules/groups/service.ts

- [tsc] line 846:17 error TS2339: Property 'collegeId' does not exist on type 'PgTableWithColumns<{ name: "sections"; schema: undefined; columns: { id: PgColumn<{ name: "id"; tableName: "sections"; dataType: "string"; columnType: "PgUUID"; data: string; driverParam: string; notNull: true; hasDefault: true; ... 6 more ...; generated: undefined; }, {}, {}>; ... 15 more ...; updatedAt: PgColumn<....'.
