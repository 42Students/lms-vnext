# Deep verification packet (rows that fast mode DEFERRED)

These rows were marked DEFERRED without being checked. Each row must now end as exactly one of:
- OK: vNext already matches the old LMS. Give EVIDENCE: the vNext file:line that implements it AND the legacy source file (docs/legacy-source/...) it matches.
- FIXED: you changed the code so it matches. Give the commit and file.

DEFERRED is NOT allowed. For each row: read its full text in the source packet named next to it, find the old behaviour in docs/legacy-source, find the vNext code, decide, and fix if needed.
Keep tests passing and TypeScript valid; never silence errors. Write one result line per row under Results, push, then tick this packet in your queue.

- [ ] G2-2-006-052  (source: docs/audit/gap-fix-work/verify2/packets/lane-8/W1_lane8_5.md)
- [ ] G2-2-009-038  (source: docs/audit/gap-fix-work/verify2/packets/lane-8/W1_lane8_5.md)
- [ ] G2-2-012-011  (source: docs/audit/gap-fix-work/verify2/packets/lane-8/W1_lane8_5.md)
- [ ] G2-2-014-019  (source: docs/audit/gap-fix-work/verify2/packets/lane-8/W1_lane8_5.md)
- [ ] G2-2-017-006  (source: docs/audit/gap-fix-work/verify2/packets/lane-8/W1_lane8_5.md)
- [ ] G2-2-029-016  (source: docs/audit/gap-fix-work/verify2/packets/lane-8/W1_lane8_5.md)
- [x] G2-2-029-059  (source: docs/audit/gap-fix-work/verify2/packets/lane-8/W1_lane8_5.md)
- [ ] G2-2-029-065  (source: docs/audit/gap-fix-work/verify2/packets/lane-8/W1_lane8_5.md)
- [ ] G2-2-029-102  (source: docs/audit/gap-fix-work/verify2/packets/lane-8/W1_lane8_5.md)
- [ ] G2-2-031-016  (source: docs/audit/gap-fix-work/verify2/packets/lane-8/W1_lane8_5.md)

## Results

- G2-2-029-059: OK — vNext `src/modules/academics/college-batch-retire-service.ts:33-44` resolves acting-college Super Admin with `academics.manage` and scopes the batch lookup to the resolved college through department and program; legacy `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/BatchController.java:308-321` permits scoped Super Admin actions. The separate delete-versus-archive retention difference remains explicitly documented in the same vNext service at lines 12-20; this verification covers the scoped SA authorization requirement, not hard-delete parity.

