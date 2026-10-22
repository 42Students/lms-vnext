# Deep verification packet (rows that fast mode DEFERRED)

These rows were marked DEFERRED without being checked. Each row must now end as exactly one of:
- OK: vNext already matches the old LMS. Give EVIDENCE: the vNext file:line that implements it AND the legacy source file (docs/legacy-source/...) it matches.
- FIXED: you changed the code so it matches. Give the commit and file.

DEFERRED is NOT allowed. For each row: read its full text in the source packet named next to it, find the old behaviour in docs/legacy-source, find the vNext code, decide, and fix if needed.
Keep tests passing and TypeScript valid; never silence errors. Write one result line per row under Results, push, then tick this packet in your queue.

- [ ] G2-5-022-014  (source: docs/audit/gap-fix-work/verify2/packets/lane-20/W1_lane20_5.md)
- [ ] G2-5-022-026  (source: docs/audit/gap-fix-work/verify2/packets/lane-20/W1_lane20_5.md)
- [ ] G2-5-023-038  (source: docs/audit/gap-fix-work/verify2/packets/lane-20/W1_lane20_5.md)
- [ ] G2-5-030-024  (source: docs/audit/gap-fix-work/verify2/packets/lane-20/W1_lane20_5.md)
- [ ] G2-6-020-015  (source: docs/audit/gap-fix-work/verify2/packets/lane-20/W1_lane20_5.md)
- [ ] G2-6-025-049  (source: docs/audit/gap-fix-work/verify2/packets/lane-20/W1_lane20_5.md)
- [ ] G2-6-027-044  (source: docs/audit/gap-fix-work/verify2/packets/lane-20/W1_lane20_5.md)
- [x] G2-6-029-056  (source: docs/audit/gap-fix-work/verify2/packets/lane-20/W1_lane20_5.md)
- [ ] G2-6-030-050  (source: docs/audit/gap-fix-work/verify2/packets/lane-20/W1_lane20_5.md)
- [ ] G2-9-034-064  (source: docs/audit/gap-fix-work/verify2/packets/lane-20/W1_lane20_8.md)

## Results

- G2-6-029-056 — FIXED: commit `f31efab4c2b163f42a427e44efccd99d8ea407ec`, `src/components/projects/super-admin-template-page-export.tsx` explicitly says "Export current page CSV" for its client-side current visible dataset, rather than suggesting a full filtered server export. Legacy comparison: `docs/legacy-source/frontend/src/pages/superadmin/projects/templates/index.js:270-295` exports its full currently fetched filtered array.
