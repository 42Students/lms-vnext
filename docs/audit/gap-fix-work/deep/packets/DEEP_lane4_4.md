# Deep verification packet (rows that fast mode DEFERRED)

These rows were marked DEFERRED without being checked. Each row must now end as exactly one of:
- OK: vNext already matches the old LMS. Give EVIDENCE: the vNext file:line that implements it AND the legacy source file (docs/legacy-source/...) it matches.
- FIXED: you changed the code so it matches. Give the commit and file.

DEFERRED is NOT allowed. For each row: read its full text in the source packet named next to it, find the old behaviour in docs/legacy-source, find the vNext code, decide, and fix if needed.
Keep tests passing and TypeScript valid; never silence errors. Write one result line per row under Results, push, then tick this packet in your queue.

- [x] G2-13-012-006  (source: docs/audit/gap-fix-work/verify2/packets/lane-4/W1_lane4_4.md)
- [ ] G2-13-012-007  (source: docs/audit/gap-fix-work/verify2/packets/lane-4/W1_lane4_4.md)
- [ ] G2-13-030-001  (source: docs/audit/gap-fix-work/verify2/packets/lane-4/W1_lane4_8.md)
- [ ] G2-2-001-028  (source: docs/audit/gap-fix-work/verify2/packets/lane-4/W1_lane4_8.md)
- [ ] G2-2-003-027  (source: docs/audit/gap-fix-work/verify2/packets/lane-4/W1_lane4_8.md)
- [ ] G2-20-010-008  (source: docs/audit/gap-fix-work/verify2/packets/lane-4/W1_lane4_8.md)
- [ ] G2-20-010-015  (source: docs/audit/gap-fix-work/verify2/packets/lane-4/W1_lane4_8.md)
- [ ] G2-20-010-019  (source: docs/audit/gap-fix-work/verify2/packets/lane-4/W1_lane4_8.md)
- [ ] G2-20-010-034  (source: docs/audit/gap-fix-work/verify2/packets/lane-4/W1_lane4_8.md)
- [ ] G2-20-010-052  (source: docs/audit/gap-fix-work/verify2/packets/lane-4/W1_lane4_8.md)

## Results

- G2-13-012-006: OK — vNext `src/modules/placements/company-mail-domain-resolver.ts:10-16,42-85` models ACCEPTS_MAIL/NO_MAIL/UNKNOWN, bounded caching and typed policy, called by `src/modules/placements/public-join/send-code-service.ts:94-102`; legacy `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/company/DnsMailDomainResolver.java:34-43` uses the three-state cached resolver.

