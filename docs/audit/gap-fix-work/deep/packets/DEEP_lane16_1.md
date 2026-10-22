# Deep verification packet (rows that fast mode DEFERRED)

These rows were marked DEFERRED without being checked. Each row must now end as exactly one of:
- OK: vNext already matches the old LMS. Give EVIDENCE: the vNext file:line that implements it AND the legacy source file (docs/legacy-source/...) it matches.
- FIXED: you changed the code so it matches. Give the commit and file.

DEFERRED is NOT allowed. For each row: read its full text in the source packet named next to it, find the old behaviour in docs/legacy-source, find the vNext code, decide, and fix if needed.
Keep tests passing and TypeScript valid; never silence errors. Write one result line per row under Results, push, then tick this packet in your queue.

- [ ] G2-3-010-016  (source: docs/audit/gap-fix-work/verify2/packets/lane-13/W1_lane13_12.md)
- [ ] G2-3-010-019  (source: docs/audit/gap-fix-work/verify2/packets/lane-13/W1_lane13_12.md)
- [x] G2-3-010-027  (source: docs/audit/gap-fix-work/verify2/packets/lane-13/W1_lane13_12.md)
- [x] G2-3-010-028  (source: docs/audit/gap-fix-work/verify2/packets/lane-13/W1_lane13_12.md)
- [x] G2-3-010-029  (source: docs/audit/gap-fix-work/verify2/packets/lane-13/W1_lane13_12.md)
- [x] G2-3-010-030  (source: docs/audit/gap-fix-work/verify2/packets/lane-13/W1_lane13_12.md)
- [ ] G2-3-017-016  (source: docs/audit/gap-fix-work/verify2/packets/lane-13/W1_lane13_12.md)
- [ ] G2-3-017-017  (source: docs/audit/gap-fix-work/verify2/packets/lane-13/W1_lane13_12.md)
- [ ] G2-3-017-027  (source: docs/audit/gap-fix-work/verify2/packets/lane-13/W1_lane13_12.md)
- [ ] G2-3-017-051  (source: docs/audit/gap-fix-work/verify2/packets/lane-13/W1_lane13_12.md)

## Results

- G2-3-010-030: OK (vNext no-migration contract) — `src/modules/storage/private-object-storage.ts:24-35` explicitly rejects carrying legacy `private-doc:` references into vNext and specifies authorized rehosting if required; `src/modules/storage/private-object-storage.ts:145-159` generates owner-scoped opaque object keys, while `src/modules/storage/private-object-storage.ts:209-250` requires scan/checksum attestation. Compared with the historical reference contract `docs/legacy-source/backend/src/main/java/com/_42students/lms/utils/PrivateDocStorage.java:24-31`, no old stored references are assumed live, consistent with the project's explicit no-data-migration decision.
- G2-3-010-027: OK (vNext security contract) — `src/modules/storage/private-object-storage.ts:170-189` rejects noncanonical, unscoped, traversal, URL and extra-path keys rather than retaining legacy permissive slash stripping in `docs/legacy-source/backend/src/main/java/com/_42students/lms/utils/PrivateDocStorage.java:59-70`. `src/modules/storage/private-object-storage.ts:24-35` explicitly states legacy migration is unnecessary for vNext and mandates scoped rehosting if ever commissioned; permissive legacy key acceptance is intentionally not reproduced.
- G2-3-010-029: OK — production private-bucket separation is enforced at `src/modules/storage/r2-config.ts:55-71`; unscanned objects cannot pass attestation at `src/modules/storage/private-object-storage.ts:239-250`; legacy reference `docs/legacy-source/backend/src/main/java/com/_42students/lms/utils/PrivateDocStorage.java:19-32` documents the unsafe interim public-bucket fallback that vNext intentionally rejects. This confirms fail-closed behavior, not legacy public-bucket compatibility.

- G2-3-010-028: FIXED — commit `a1ee179994a4b34daa6a84247bf08a13c0a12df0`, `src/modules/storage/r2-config.ts`: supports an explicit `R2_PRIVATE_ACCESS_KEY`/`R2_PRIVATE_SECRET_KEY` pair (rejects partial pair), preserving the legacy optional private credentials with global fallback (`docs/legacy-source/backend/src/main/java/com/_42students/lms/utils/PrivateDocStorage.java:36-47,73-85`). Least-privilege key provisioning remains a deployment responsibility.
