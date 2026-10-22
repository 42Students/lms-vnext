# Deep verification packet (rows that fast mode DEFERRED)

These rows were marked DEFERRED without being checked. Each row must now end as exactly one of:
- OK: vNext already matches the old LMS. Give EVIDENCE: the vNext file:line that implements it AND the legacy source file (docs/legacy-source/...) it matches.
- FIXED: you changed the code so it matches. Give the commit and file.

DEFERRED is NOT allowed. For each row: read its full text in the source packet named next to it, find the old behaviour in docs/legacy-source, find the vNext code, decide, and fix if needed.
Keep tests passing and TypeScript valid; never silence errors. Write one result line per row under Results, push, then tick this packet in your queue.

- [x] G2-11-004-077  (source: docs/audit/gap-fix-work/verify2/packets/lane-14/W1_lane14_4.md)
- [x] G2-11-004-086  (source: docs/audit/gap-fix-work/verify2/packets/lane-14/W1_lane14_4.md)
- [ ] G2-11-004-094  (source: docs/audit/gap-fix-work/verify2/packets/lane-14/W1_lane14_4.md)
- [ ] G2-11-004-096  (source: docs/audit/gap-fix-work/verify2/packets/lane-14/W1_lane14_4.md)
- [ ] G2-11-004-121  (source: docs/audit/gap-fix-work/verify2/packets/lane-14/W1_lane14_4.md)
- [ ] G2-11-009-047  (source: docs/audit/gap-fix-work/verify2/packets/lane-14/W1_lane14_4.md)
- [ ] G2-11-009-049  (source: docs/audit/gap-fix-work/verify2/packets/lane-14/W1_lane14_4.md)
- [ ] G2-11-009-050  (source: docs/audit/gap-fix-work/verify2/packets/lane-14/W1_lane14_4.md)
- [ ] G2-11-009-051  (source: docs/audit/gap-fix-work/verify2/packets/lane-14/W1_lane14_4.md)
- [ ] G2-11-010-002  (source: docs/audit/gap-fix-work/verify2/packets/lane-14/W1_lane14_4.md)

## Results

- G2-11-004-077 — FIXED: commit `2918ec896f293ed153bdcc53524178c45b4fda41`, `src/components/hr/hr-drive-draft-form.tsx` now checks PDF/DOC/DOCX extension against nonempty browser MIME before requesting a signed upload and enforces 1–5 MiB. Legacy comparison: `docs/legacy-source/frontend/src/pages/recruiter/drives/new.js:363` restricts JD to PDF/Word <=5MB.
- G2-11-004-086 — FIXED: commit `2918ec896f293ed153bdcc53524178c45b4fda41`, `src/components/hr/hr-drive-draft-form.tsx` adds on-demand scoped signed private document preview directly in the always-visible right-side card, with same-tab link and safe read-grant checks. Legacy comparison: `docs/legacy-source/frontend/src/pages/recruiter/drives/new.js:424-429` presents JD link within student preview.
