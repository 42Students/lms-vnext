# Deep verification packet (rows that fast mode DEFERRED)

These rows were marked DEFERRED without being checked. Each row must now end as exactly one of:
- OK: vNext already matches the old LMS. Give EVIDENCE: the vNext file:line that implements it AND the legacy source file (docs/legacy-source/...) it matches.
- FIXED: you changed the code so it matches. Give the commit and file.

DEFERRED is NOT allowed. For each row: read its full text in the source packet named next to it, find the old behaviour in docs/legacy-source, find the vNext code, decide, and fix if needed.
Keep tests passing and TypeScript valid; never silence errors. Write one result line per row under Results, push, then tick this packet in your queue.

- [ ] G2-9-007-050  (source: docs/audit/gap-fix-work/verify2/packets/lane-10/W1_lane10_14.md)
- [ ] G2-9-012-026  (source: docs/audit/gap-fix-work/verify2/packets/lane-10/W1_lane10_14.md)
- [ ] G2-9-013-060  (source: docs/audit/gap-fix-work/verify2/packets/lane-10/W1_lane10_14.md)
- [ ] G2-9-014-049  (source: docs/audit/gap-fix-work/verify2/packets/lane-10/W1_lane10_14.md)
- [x] G2-9-015-065  (source: docs/audit/gap-fix-work/verify2/packets/lane-10/W1_lane10_14.md)
- [ ] G2-9-036-018  (source: docs/audit/gap-fix-work/verify2/packets/lane-10/W1_lane10_14.md)
- [ ] G2-9-036-047  (source: docs/audit/gap-fix-work/verify2/packets/lane-10/W1_lane10_14.md)
- [ ] G2-9-036-049  (source: docs/audit/gap-fix-work/verify2/packets/lane-10/W1_lane10_14.md)
- [ ] G2-9-036-057  (source: docs/audit/gap-fix-work/verify2/packets/lane-10/W1_lane10_14.md)
- [ ] G2-9-036-058  (source: docs/audit/gap-fix-work/verify2/packets/lane-10/W1_lane10_14.md)

## Results

- G2-9-015-065: FIXED — `4dc297fca80a883188615aece15e0de87711e785`, `src/app/(authenticated)/college/placements/drives/page.tsx`; guards the directory when Placements is disabled and provides Super Admin recovery guidance. Legacy: `docs/legacy-source/frontend/src/pages/college-admin/jobs/all.js:35-43`.

