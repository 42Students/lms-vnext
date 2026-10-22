# CI fix packet (round 1): src/modules/colleges/admin-today-attention-service.ts

These are REAL errors reported by CI (GitHub Actions) on main. Fix every one of them in this file with the smallest correct change. Keep behaviour and wording; do not touch unrelated code; never use any, @ts-ignore, @ts-expect-error or eslint-disable to silence an error; no new packages. If a fix needs another file, edit it only if it is clearly part of the same error.

File: src/modules/colleges/admin-today-attention-service.ts

- [tsc] line 56:66 error TS2339: Property 'id' does not exist on type 'PgTableWithColumns<Required<Update<{ name: "attendance_sessions"; schema: undefined; columns: { legacyClassScheduleId: PgColumn<{ name: "legacy_class_schedule_id"; tableName: "attendance_sessions"; dataType: "number"; columnType: "PgInteger"; ... 10 more ...; generated: undefined; }, {}, {}>; ... 8 more ...; updated...'.
- [tsc] line 141:63 error TS2339: Property 'id' does not exist on type 'PgTableWithColumns<Required<Update<{ name: "attendance_sessions"; schema: undefined; columns: { legacyClassScheduleId: PgColumn<{ name: "legacy_class_schedule_id"; tableName: "attendance_sessions"; dataType: "number"; columnType: "PgInteger"; ... 10 more ...; generated: undefined; }, {}, {}>; ... 8 more ...; updated...'.
