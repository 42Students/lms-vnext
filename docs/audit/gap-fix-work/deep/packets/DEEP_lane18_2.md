# Deep verification packet (rows that fast mode DEFERRED)

These rows were marked DEFERRED without being checked. Each row must now end as exactly one of:
- OK: vNext already matches the old LMS. Give EVIDENCE: the vNext file:line that implements it AND the legacy source file (docs/legacy-source/...) it matches.
- FIXED: you changed the code so it matches. Give the commit and file.

DEFERRED is NOT allowed. For each row: read its full text in the source packet named next to it, find the old behaviour in docs/legacy-source, find the vNext code, decide, and fix if needed.
Keep tests passing and TypeScript valid; never silence errors. Write one result line per row under Results, push, then tick this packet in your queue.

- [ ] G2-13-018-031  (source: docs/audit/gap-fix-work/verify2/packets/lane-14/W1_lane14_6.md)
- [ ] G2-13-018-055  (source: docs/audit/gap-fix-work/verify2/packets/lane-14/W1_lane14_6.md)
- [ ] G2-17-23-077  (source: docs/audit/gap-fix-work/verify2/packets/lane-14/W1_lane14_6.md)
- [ ] G2-18-019-006  (source: docs/audit/gap-fix-work/verify2/packets/lane-14/W1_lane14_6.md)
- [ ] G2-18-026-026  (source: docs/audit/gap-fix-work/verify2/packets/lane-14/W1_lane14_6.md)
- [ ] G2-19-029-022  (source: docs/audit/gap-fix-work/verify2/packets/lane-14/W1_lane14_6.md)
- [ ] G2-14-014-061  (source: docs/audit/gap-fix-work/verify2/packets/lane-14/W1_lane14_7.md)
- [ ] G2-2-010-030  (source: docs/audit/gap-fix-work/verify2/packets/lane-16/W1_lane16_3.md)
- [ ] G2-18-023-070  (source: docs/audit/gap-fix-work/verify2/packets/lane-17/W1_lane17_10.md)
- [ ] G2-8-002-021  (source: docs/audit/gap-fix-work/verify2/packets/lane-17/W1_lane17_10.md)

## Results
- G2-14-014-061: OK — `src/db/schema/db10-announcements.ts:55-68,77-89,98-125` preserves original sender type and ID, source timestamps, deletion tombstone and scheduling/expiry/pin data, matching `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Announcement.java:36-68`.
- G2-8-002-021: OK — `src/app/(authenticated)/admin/people/directory/page.tsx:24-27,51-77` redirects non-Super-Admins and requires a selected college; `src/modules/people/admin-user-directory-service.ts` applies the selected-college boundary, matching staff-only and denied-directory rules from `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/UserController.java:441-447`.
