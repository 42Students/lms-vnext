# Deep verification packet (rows that fast mode DEFERRED)

These rows were marked DEFERRED without being checked. Each row must now end as exactly one of:
- OK: vNext already matches the old LMS. Give EVIDENCE: the vNext file:line that implements it AND the legacy source file (docs/legacy-source/...) it matches.
- FIXED: you changed the code so it matches. Give the commit and file.

DEFERRED is NOT allowed. For each row: read its full text in the source packet named next to it, find the old behaviour in docs/legacy-source, find the vNext code, decide, and fix if needed.
Keep tests passing and TypeScript valid; never silence errors. Write one result line per row under Results, push, then tick this packet in your queue.

- [ ] G2-11-010-019  (source: docs/audit/gap-fix-work/verify2/packets/lane-14/W1_lane14_4.md)
- [ ] G2-11-010-022  (source: docs/audit/gap-fix-work/verify2/packets/lane-14/W1_lane14_4.md)
- [ ] G2-12-003-055  (source: docs/audit/gap-fix-work/verify2/packets/lane-14/W1_lane14_4.md)
- [ ] G2-12-003-084  (source: docs/audit/gap-fix-work/verify2/packets/lane-14/W1_lane14_4.md)
- [x] G2-12-020-005  (source: docs/audit/gap-fix-work/verify2/packets/lane-14/W1_lane14_4.md)
- [x] G2-12-020-009  (source: docs/audit/gap-fix-work/verify2/packets/lane-14/W1_lane14_4.md)
- [ ] G2-12-020-020  (source: docs/audit/gap-fix-work/verify2/packets/lane-14/W1_lane14_4.md)
- [ ] G2-12-020-037  (source: docs/audit/gap-fix-work/verify2/packets/lane-14/W1_lane14_4.md)
- [ ] G2-12-020-051  (source: docs/audit/gap-fix-work/verify2/packets/lane-14/W1_lane14_4.md)
- [ ] G2-12-020-052  (source: docs/audit/gap-fix-work/verify2/packets/lane-14/W1_lane14_4.md)

## Results

- G2-12-020-005: OK — `src/db/schema/placement-company-identities.ts:7-14` persists independent domain-level `verifiedBy42`, `verifiedAt` and verifier separate from `placementCompanies`; matches `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/CompanyDomain.java:24-35`.
- G2-12-020-009: OK — `src/db/schema/placement-company-identities.ts:11-14` implements non-null `verified_by_42` with `.default(false)` plus `verified_at`; matches `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/CompanyDomain.java:34-35`.
