# Deep verification packet (rows that fast mode DEFERRED)

These rows were marked DEFERRED without being checked. Each row must now end as exactly one of:
- OK: vNext already matches the old LMS. Give EVIDENCE: the vNext file:line that implements it AND the legacy source file (docs/legacy-source/...) it matches.
- FIXED: you changed the code so it matches. Give the commit and file.

DEFERRED is NOT allowed. For each row: read its full text in the source packet named next to it, find the old behaviour in docs/legacy-source, find the vNext code, decide, and fix if needed.
Keep tests passing and TypeScript valid; never silence errors. Write one result line per row under Results, push, then tick this packet in your queue.

- [x] G2-20-009-057  (source: docs/audit/gap-fix-work/verify2/packets/lane-13/W1_lane13_11.md)
- [ ] G2-20-023-002  (source: docs/audit/gap-fix-work/verify2/packets/lane-13/W1_lane13_11.md)
- [x] G2-20-028-020  (source: docs/audit/gap-fix-work/verify2/packets/lane-13/W1_lane13_11.md)
- [ ] G2-20-030-006  (source: docs/audit/gap-fix-work/verify2/packets/lane-13/W1_lane13_11.md)
- [ ] G2-20-030-017  (source: docs/audit/gap-fix-work/verify2/packets/lane-13/W1_lane13_11.md)
- [ ] G2-20-030-038  (source: docs/audit/gap-fix-work/verify2/packets/lane-13/W1_lane13_11.md)
- [ ] G2-20-030-057  (source: docs/audit/gap-fix-work/verify2/packets/lane-13/W1_lane13_11.md)
- [ ] G2-20-030-090  (source: docs/audit/gap-fix-work/verify2/packets/lane-13/W1_lane13_11.md)
- [ ] G2-3-009-028  (source: docs/audit/gap-fix-work/verify2/packets/lane-13/W1_lane13_11.md)
- [ ] G2-3-024-012  (source: docs/audit/gap-fix-work/verify2/packets/lane-13/W1_lane13_11.md)

## Results

- G2-20-009-057 — OK (intentional security divergence): `src/modules/storage/r2-config.ts:5-19,51-79` removes legacy public-URL/bucket access from private grants and enforces a separate private production bucket. `docs/architecture/r2-vnext-cutover.md:8-20,51-65` explicitly documents legacy URL disposition and the required inventory, scoped migration and depublication if historical assets are ever migrated; no migration or operator depublication is claimed. Legacy comparison: `docs/legacy-source/backend/src/main/java/com/_42students/lms/utils/R2StorageUtils.java:269-300` provides getPublicUrl/getBucketName/getPublicUrlBase. The row explicitly calls for retiring that API by design, not copying its public access.
- G2-20-028-020 — OK: `src/app/(authenticated)/admin/projects/[projectId]/page.tsx:70-80` explicitly allowlists `from` and `reason`, rejects arrays, invalid values and values over 120 characters before forwarding to the authorized canonical summary. This is the safe subset of the legacy query forwarding from `docs/legacy-source/frontend/src/pages/superadmin/projects/workspaces/[workspaceId]/index.js:15-22`; unrecognized params are intentionally excluded per row's expected fix.
