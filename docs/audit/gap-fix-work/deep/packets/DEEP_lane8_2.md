# Deep verification packet (rows that fast mode DEFERRED)

These rows were marked DEFERRED without being checked. Each row must now end as exactly one of:
- OK: vNext already matches the old LMS. Give EVIDENCE: the vNext file:line that implements it AND the legacy source file (docs/legacy-source/...) it matches.
- FIXED: you changed the code so it matches. Give the commit and file.

DEFERRED is NOT allowed. For each row: read its full text in the source packet named next to it, find the old behaviour in docs/legacy-source, find the vNext code, decide, and fix if needed.
Keep tests passing and TypeScript valid; never silence errors. Write one result line per row under Results, push, then tick this packet in your queue.

- [ ] G2-4-017-046  (source: docs/audit/gap-fix-work/verify2/packets/lane-14/W1_lane14_19.md)
- [x] G2-4-017-049  (source: docs/audit/gap-fix-work/verify2/packets/lane-14/W1_lane14_19.md)
- [x] G2-4-017-070  (source: docs/audit/gap-fix-work/verify2/packets/lane-14/W1_lane14_19.md)
- [ ] G2-4-018-045  (source: docs/audit/gap-fix-work/verify2/packets/lane-14/W1_lane14_19.md)
- [ ] G2-4-018-046  (source: docs/audit/gap-fix-work/verify2/packets/lane-14/W1_lane14_19.md)
- [ ] G2-4-018-067  (source: docs/audit/gap-fix-work/verify2/packets/lane-14/W1_lane14_19.md)
- [ ] G2-4-018-072  (source: docs/audit/gap-fix-work/verify2/packets/lane-14/W1_lane14_19.md)
- [ ] G2-4-018-074  (source: docs/audit/gap-fix-work/verify2/packets/lane-14/W1_lane14_19.md)
- [ ] G2-4-025-075  (source: docs/audit/gap-fix-work/verify2/packets/lane-14/W1_lane14_19.md)
- [ ] G2-4-025-082  (source: docs/audit/gap-fix-work/verify2/packets/lane-14/W1_lane14_19.md)

## Results


- OK G2-4-017-049 — `src/db/schema/projects.ts:230-232,261-263,302-304` records the independent historical `legacyRecoverableContent` indicator alongside deletion and archive timestamps; the legacy source `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/ProjectWorkspace.java:93-95` defaults recoverable content false. Neither historical recoverability nor archiving alone grants a restore operation.
- OK G2-4-017-070 — `src/db/schema/projects.ts:215-231,237-274,279-289,320-345` documents the verified legacy integer-to-UUID crosswalk, imported legacy identifiers, org/class associations, template-version binding, and tenant-scoped constraints; matches `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/ProjectWorkspace.java:13-125`.
