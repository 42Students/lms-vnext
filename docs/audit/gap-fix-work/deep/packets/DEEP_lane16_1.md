# Deep verification packet (rows that fast mode DEFERRED)

These rows were marked DEFERRED without being checked. Each row must now end as exactly one of:
- OK: vNext already matches the old LMS. Give EVIDENCE: the vNext file:line that implements it AND the legacy source file (docs/legacy-source/...) it matches.
- FIXED: you changed the code so it matches. Give the commit and file.

DEFERRED is NOT allowed. For each row: read its full text in the source packet named next to it, find the old behaviour in docs/legacy-source, find the vNext code, decide, and fix if needed.
Keep tests passing and TypeScript valid; never silence errors. Write one result line per row under Results, push, then tick this packet in your queue.

- [ ] G2-3-010-016  (source: docs/audit/gap-fix-work/verify2/packets/lane-13/W1_lane13_12.md)
- [ ] G2-3-010-019  (source: docs/audit/gap-fix-work/verify2/packets/lane-13/W1_lane13_12.md)
- [ ] G2-3-010-027  (source: docs/audit/gap-fix-work/verify2/packets/lane-13/W1_lane13_12.md)
- [ ] G2-3-010-028  (source: docs/audit/gap-fix-work/verify2/packets/lane-13/W1_lane13_12.md)
- [x] G2-3-010-029  (source: docs/audit/gap-fix-work/verify2/packets/lane-13/W1_lane13_12.md)
- [ ] G2-3-010-030  (source: docs/audit/gap-fix-work/verify2/packets/lane-13/W1_lane13_12.md)
- [ ] G2-3-017-016  (source: docs/audit/gap-fix-work/verify2/packets/lane-13/W1_lane13_12.md)
- [ ] G2-3-017-017  (source: docs/audit/gap-fix-work/verify2/packets/lane-13/W1_lane13_12.md)
- [ ] G2-3-017-027  (source: docs/audit/gap-fix-work/verify2/packets/lane-13/W1_lane13_12.md)
- [ ] G2-3-017-051  (source: docs/audit/gap-fix-work/verify2/packets/lane-13/W1_lane13_12.md)

## Results

- G2-3-010-029: OK — production private-bucket separation is enforced at `src/modules/storage/r2-config.ts:55-71`; unscanned objects cannot pass attestation at `src/modules/storage/private-object-storage.ts:211-217`; legacy reference `docs/legacy-source/backend/src/main/java/com/_42students/lms/utils/PrivateDocStorage.java:19-32` documents the unsafe interim public-bucket fallback that vNext intentionally rejects. This confirms fail-closed behavior, not legacy public-bucket compatibility.
