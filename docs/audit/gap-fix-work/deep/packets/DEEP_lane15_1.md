# Deep verification packet (rows that fast mode DEFERRED)

These rows were marked DEFERRED without being checked. Each row must now end as exactly one of:
- OK: vNext already matches the old LMS. Give EVIDENCE: the vNext file:line that implements it AND the legacy source file (docs/legacy-source/...) it matches.
- FIXED: you changed the code so it matches. Give the commit and file.

DEFERRED is NOT allowed. For each row: read its full text in the source packet named next to it, find the old behaviour in docs/legacy-source, find the vNext code, decide, and fix if needed.
Keep tests passing and TypeScript valid; never silence errors. Write one result line per row under Results, push, then tick this packet in your queue.

- [x] G2-3-024-016  (source: docs/audit/gap-fix-work/verify2/packets/lane-13/W1_lane13_11.md)
- [x] G2-3-024-021  (source: docs/audit/gap-fix-work/verify2/packets/lane-13/W1_lane13_11.md)
- [x] G2-3-024-029  (source: docs/audit/gap-fix-work/verify2/packets/lane-13/W1_lane13_11.md)
- [x] G2-3-024-047  (source: docs/audit/gap-fix-work/verify2/packets/lane-13/W1_lane13_11.md)
- [ ] G2-15-031-062  (source: docs/audit/gap-fix-work/verify2/packets/lane-13/W1_lane13_12.md)
- [ ] G2-19-023-025  (source: docs/audit/gap-fix-work/verify2/packets/lane-13/W1_lane13_12.md)
- [ ] G2-19-023-031  (source: docs/audit/gap-fix-work/verify2/packets/lane-13/W1_lane13_12.md)
- [ ] G2-3-010-004  (source: docs/audit/gap-fix-work/verify2/packets/lane-13/W1_lane13_12.md)
- [ ] G2-3-010-005  (source: docs/audit/gap-fix-work/verify2/packets/lane-13/W1_lane13_12.md)
- [x] G2-3-010-010  (source: docs/audit/gap-fix-work/verify2/packets/lane-13/W1_lane13_12.md)

## Results

- G2-3-024-016: OK — `src/components/groups/college-group-import-preview.tsx:176-196` renders durable requested/added/waitlisted/errors and per-row outcomes returned by `src/modules/groups/college-group-import-service.ts:39-72`; matches `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/groups/AdminGroupController.java:184-200`.
- G2-3-024-021: OK — `src/modules/groups/college-group-import-service.ts:39-72` individually writes through `joinGroup`, preserves successful rows and errors; matches `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/groups/AdminGroupController.java:168-201`.
- G2-3-024-029: OK — `src/components/groups/college-group-import-preview.tsx:75-98,153-160,183-196` confirms the CSV via POST `/api/college/groups/import` and allows error CSV download; matches `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/groups/AdminGroupController.java:156-201`.
- G2-3-024-047: OK — `src/components/groups/college-group-import-preview.tsx:75-98,199-237` contains confirmed CSV and manual bulk addition; matches `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/groups/AdminGroupController.java:156-201`.
- G2-3-010-010: OK — `src/modules/storage/r2-config.ts:43-70` requires account, both credential components and a dedicated private bucket (except explicit development-only isolation), with a fail-closed setup error; the legacy `docs/legacy-source/backend/src/main/java/com/_42students/lms/utils/PrivateDocStorage.java:55-57` checked only account, bucket and a single access key. This verifies the intended safe replacement, not identical permissive legacy configuration semantics; deployment must supply all required secrets.
