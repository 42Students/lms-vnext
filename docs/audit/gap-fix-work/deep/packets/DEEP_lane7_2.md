# Deep verification packet (rows that fast mode DEFERRED)

These rows were marked DEFERRED without being checked. Each row must now end as exactly one of:
- OK: vNext already matches the old LMS. Give EVIDENCE: the vNext file:line that implements it AND the legacy source file (docs/legacy-source/...) it matches.
- FIXED: you changed the code so it matches. Give the commit and file.

DEFERRED is NOT allowed. For each row: read its full text in the source packet named next to it, find the old behaviour in docs/legacy-source, find the vNext code, decide, and fix if needed.
Keep tests passing and TypeScript valid; never silence errors. Write one result line per row under Results, push, then tick this packet in your queue.

- [x] G2-12-016-008  (source: docs/audit/gap-fix-work/verify2/packets/lane-14/W1_lane14_19.md)
- [x] G2-12-016-009  (source: docs/audit/gap-fix-work/verify2/packets/lane-14/W1_lane14_19.md)
- [x] G2-4-010-097  (source: docs/audit/gap-fix-work/verify2/packets/lane-14/W1_lane14_19.md)
- [ ] G2-4-011-080  (source: docs/audit/gap-fix-work/verify2/packets/lane-14/W1_lane14_19.md)
- [ ] G2-4-011-082  (source: docs/audit/gap-fix-work/verify2/packets/lane-14/W1_lane14_19.md)
- [x] G2-4-016-017  (source: docs/audit/gap-fix-work/verify2/packets/lane-14/W1_lane14_19.md)
- [x] G2-4-017-006  (source: docs/audit/gap-fix-work/verify2/packets/lane-14/W1_lane14_19.md)
- [x] G2-4-017-008  (source: docs/audit/gap-fix-work/verify2/packets/lane-14/W1_lane14_19.md)
- [ ] G2-4-017-017  (source: docs/audit/gap-fix-work/verify2/packets/lane-14/W1_lane14_19.md)
- [ ] G2-4-017-018  (source: docs/audit/gap-fix-work/verify2/packets/lane-14/W1_lane14_19.md)

## Results
- G2-12-016-008: OK — `src/db/schema/academic-terms.ts:10-42` preserves `legacySemesterId`, program ownership, term number, name, nullable `totalCredits`, and active state; `docs/audit/gap-fix/academic-term-crosswalk-lane-14.md:5-17` specifies the scoped integer-ID-to-UUID migration, nullable-source handling, and semester-number uniqueness. This is a verified *field map*, not a claim that imports have run. Matches `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Semester.java:22-39`.
- G2-4-016-017: OK — `src/modules/messaging/receipt-history-service.ts:105-123` passes both sanitized recipient suffix and purpose to the provider; `src/modules/notifications/exotel-sms.ts:158-176` combines suffix and purpose as `AND` conditions in the append-only ledger query; matches `docs/legacy-source/backend/src/main/java/com/_42students/lms/repository/SmsDeliveryLogRepository.java:17-24` and `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/AdminSmsLogController.java:53-71`.

- G2-4-010-097: OK — `src/db/schema/course-assignment-materials.ts:10-16,29-30` preserves separate LINK URL, FILE object key, original filename, MIME type, size, ordered sequence and unmodified `legacyFileDto` JSON; matches legacy JSON-backed content in `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/LessonContents.java:33-41` and legacy file DTO assembly in `docs/legacy-source/frontend/src/components/admin/AdminAssignmentBuilderModal.jsx:149-161`. This verifies storage fields, not an executed historical import.
- G2-4-017-006: OK — `src/db/schema/projects.ts:229-232,264-265,288` keeps mutable `authoredBrief` distinct from historical `legacyOverview` and immutable `legacyTemplateSnapshot`; matches the two independent JSON source fields in `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/ProjectWorkspace.java:87-105`. This establishes mapping, not an executed historical import.

- G2-12-016-009: OK — `src/db/schema/academic-terms.ts:11-14,23-24,40` makes current term names non-null/nonblank and active state non-null; `docs/audit/gap-fix/academic-term-crosswalk-lane-14.md:8-10,31-39` explicitly quarantines null/empty legacy names and nullable source active values for reviewed backfill, forbidding invented names, automatic false status or silent import. This is an import contract, not a claim that legacy data was imported. Matches nullable fields in `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Semester.java:32-39`.
- G2-4-017-008: OK — `src/db/schema/projects.ts:209-220,247-269,335-336` explicitly crosswalks historic `IN_PROGRESS` to canonical `ACTIVE` while preserving the exact legacy token in `legacyStatus`, records historical progress independently, and restricts canonical lifecycle to PLANNED/ACTIVE/COMPLETED/ARCHIVED; matching source default and free-text width in `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/ProjectWorkspace.java:31-32`. New vNext projects intentionally default PLANNED; historical source rows use the documented import mapping, not that default. No historical import execution claimed.
