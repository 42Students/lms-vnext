# Deep verification packet (rows that fast mode DEFERRED)

These rows were marked DEFERRED without being checked. Each row must now end as exactly one of:
- OK: vNext already matches the old LMS. Give EVIDENCE: the vNext file:line that implements it AND the legacy source file (docs/legacy-source/...) it matches.
- FIXED: you changed the code so it matches. Give the commit and file.

DEFERRED is NOT allowed. For each row: read its full text in the source packet named next to it, find the old behaviour in docs/legacy-source, find the vNext code, decide, and fix if needed.
Keep tests passing and TypeScript valid; never silence errors. Write one result line per row under Results, push, then tick this packet in your queue.

- [x] G2-4-014-048  (source: docs/audit/gap-fix-work/verify2/packets/lane-13/W1_lane13_12.md)
- [ ] G2-4-015-001  (source: docs/audit/gap-fix-work/verify2/packets/lane-13/W1_lane13_12.md)
- [x] G2-4-020-016  (source: docs/audit/gap-fix-work/verify2/packets/lane-13/W1_lane13_12.md)
- [ ] G2-4-020-035  (source: docs/audit/gap-fix-work/verify2/packets/lane-13/W1_lane13_12.md)
- [ ] G2-4-020-059  (source: docs/audit/gap-fix-work/verify2/packets/lane-13/W1_lane13_12.md)
- [x] G2-4-024-028  (source: docs/audit/gap-fix-work/verify2/packets/lane-13/W1_lane13_12.md)
- [x] G2-4-024-045  (source: docs/audit/gap-fix-work/verify2/packets/lane-13/W1_lane13_12.md)
- [ ] G2-4-033-016  (source: docs/audit/gap-fix-work/verify2/packets/lane-13/W1_lane13_12.md)
- [ ] G2-4-033-028  (source: docs/audit/gap-fix-work/verify2/packets/lane-13/W1_lane13_12.md)
- [ ] G2-13-031-096  (source: docs/audit/gap-fix-work/verify2/packets/lane-13/W1_lane13_13.md)

## Results

- G2-4-014-048: FIXED — 861c231b57bc7d393627f62433453e643cec1548; `src/app/(authenticated)/admin/colleges/page.tsx` (bounded activity bonus applies to ranked text/fuzzy matches), legacy `docs/legacy-source/backend/src/main/java/com/_42students/lms/search/core/GenericSearchCache.java:310-352`.

- G2-4-020-016: OK — `src/modules/people/faculty-profile-document.ts:48-72,509-511` retains distinct contactMobile (primary), contactPhone (alternate), and contactMail (email) fields, including legacy import mapping; `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Faculty.java:88-96` declares the three separate strings. The edit schema prevents replacing primary with unverified alternate data.

- G2-4-024-028: OK — `src/modules/groups/service.ts:784-860` validates learner IDs (UUID or legacy integer), college-bound rollNumbers, fromClassId and optional audit note, resolves membership within the requested group college; matches `docs/legacy-source/backend/src/main/java/com/_42students/lms/dto/electives/ElectiveRequests.java:38-45` and `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/electives/ElectiveService.java:479-508`.
- G2-4-024-045: FIXED — commit `10db09655bb68044cc0eb1d069d2c3b05c7ee2d3`, `src/modules/groups/service.ts:828-876`: unmatched roll numbers are returned as per-row FAILED entries rather than silently dropped; per-learner transactions and failure results already existed. Compared with `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/electives/ElectiveService.java:469-545`.
