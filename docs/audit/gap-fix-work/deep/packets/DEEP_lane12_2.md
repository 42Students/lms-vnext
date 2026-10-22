# Deep verification packet (rows that fast mode DEFERRED)

These rows were marked DEFERRED without being checked. Each row must now end as exactly one of:
- OK: vNext already matches the old LMS. Give EVIDENCE: the vNext file:line that implements it AND the legacy source file (docs/legacy-source/...) it matches.
- FIXED: you changed the code so it matches. Give the commit and file.

DEFERRED is NOT allowed. For each row: read its full text in the source packet named next to it, find the old behaviour in docs/legacy-source, find the vNext code, decide, and fix if needed.
Keep tests passing and TypeScript valid; never silence errors. Write one result line per row under Results, push, then tick this packet in your queue.

- [ ] G2-8-018-076  (source: docs/audit/gap-fix-work/verify2/packets/lane-14/W1_lane14_24.md)
- [ ] G2-8-018-079  (source: docs/audit/gap-fix-work/verify2/packets/lane-14/W1_lane14_24.md)
- [ ] G2-8-018-084  (source: docs/audit/gap-fix-work/verify2/packets/lane-14/W1_lane14_24.md)
- [ ] G2-8-020-051  (source: docs/audit/gap-fix-work/verify2/packets/lane-14/W1_lane14_24.md)
- [ ] G2-8-020-066  (source: docs/audit/gap-fix-work/verify2/packets/lane-14/W1_lane14_24.md)
- [ ] G2-8-020-067  (source: docs/audit/gap-fix-work/verify2/packets/lane-14/W1_lane14_24.md)
- [ ] G2-8-020-068  (source: docs/audit/gap-fix-work/verify2/packets/lane-14/W1_lane14_24.md)
- [x] G2-8-020-069  (source: docs/audit/gap-fix-work/verify2/packets/lane-14/W1_lane14_24.md)
- [x] G2-8-020-070  (source: docs/audit/gap-fix-work/verify2/packets/lane-14/W1_lane14_24.md)
- [x] G2-8-020-071  (source: docs/audit/gap-fix-work/verify2/packets/lane-14/W1_lane14_24.md)

## Results

- G2-8-020-069: OK — `src/db/schema/courses.ts:60-62,74,80-83` stores enabled, allowedForDisplay, and status independently; `src/modules/courses/legacy-course-bulk-flags-service.ts:41-65` independently preserves unspecified fields during updates. Legacy `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Course.java:36-41` declares three independent fields.
- G2-8-020-070: OK — `src/db/schema/courses.ts:48-50,112-113` stores a 64-character slug independently of code and enforces unique non-null slugs globally. Legacy `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Course.java:42-43` uses a globally unique 64-character slug.
- G2-8-020-071: OK — `src/db/schema/courses.ts:80` stores bigint optimistic version; `src/modules/courses/legacy-course-bulk-flags-service.ts:41-67` uses version-matched conditional updates and increments it. Legacy `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Course.java:44-53` declares JPA optimistic locking.
