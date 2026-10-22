# Deep verification packet (rows that fast mode DEFERRED)

These rows were marked DEFERRED without being checked. Each row must now end as exactly one of:
- OK: vNext already matches the old LMS. Give EVIDENCE: the vNext file:line that implements it AND the legacy source file (docs/legacy-source/...) it matches.
- FIXED: you changed the code so it matches. Give the commit and file.

DEFERRED is NOT allowed. For each row: read its full text in the source packet named next to it, find the old behaviour in docs/legacy-source, find the vNext code, decide, and fix if needed.
Keep tests passing and TypeScript valid; never silence errors. Write one result line per row under Results, push, then tick this packet in your queue.

- [ ] G2-2-012-049  (source: docs/audit/gap-fix-work/verify2/packets/lane-12/W1_lane12_4.md)
- [ ] G2-2-014-028  (source: docs/audit/gap-fix-work/verify2/packets/lane-12/W1_lane12_4.md)
- [ ] G2-2-019-001  (source: docs/audit/gap-fix-work/verify2/packets/lane-12/W1_lane12_4.md)
- [x] G2-20-004-049  (source: docs/audit/gap-fix-work/verify2/packets/lane-12/W1_lane12_4.md)
- [x] G2-20-008-040  (source: docs/audit/gap-fix-work/verify2/packets/lane-12/W1_lane12_4.md)
- [ ] G2-20-028-010  (source: docs/audit/gap-fix-work/verify2/packets/lane-12/W1_lane12_4.md)
- [ ] G2-3-021-010  (source: docs/audit/gap-fix-work/verify2/packets/lane-12/W1_lane12_4.md)
- [ ] G2-3-021-044  (source: docs/audit/gap-fix-work/verify2/packets/lane-12/W1_lane12_4.md)
- [ ] G2-7-012-035  (source: docs/audit/gap-fix-work/verify2/packets/lane-12/W1_lane12_6.md)
- [ ] G2-9-014-004  (source: docs/audit/gap-fix-work/verify2/packets/lane-12/W1_lane12_7.md)

## Results

- G2-20-004-049: OK — `src/app/request-demo/page.tsx:6-18,111-115` retains exact demo subject and structured `mailto:` body from `docs/legacy-source/frontend/src/components/marketing/data.js:10-18` and the CTA of `docs/legacy-source/frontend/src/pages/request-demo.js:73-82`.
- G2-20-008-040: OK — `src/app/request-demo/page.tsx:13-18,111-115` uses the five legacy fields (Name, Organization, Role, Phone, What you're looking to solve) and exact subject from `docs/legacy-source/frontend/src/components/marketing/data.js:10-18`.
