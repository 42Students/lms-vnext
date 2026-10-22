# Deep verification packet (round 2, Claude agent 4)

Rows still unchecked after the first deep pass. Each row ends OK (vNext file:line + docs/legacy-source file) or FIXED. DEFERRED is not allowed.

- [ ] G2-16-005-045  (source: docs/audit/gap-fix-work/verify2/packets/lane-13/W1_lane13_7.md)
- [ ] G2-16-027-031  (source: docs/audit/gap-fix-work/verify2/packets/lane-13/W1_lane13_7.md)
- [ ] G2-17-010-005  (source: docs/audit/gap-fix-work/verify2/packets/lane-13/W1_lane13_7.md)
- [ ] G2-19-002-095  (source: docs/audit/gap-fix-work/verify2/packets/lane-14/W1_lane14_13.md)
- [ ] G2-19-010-067  (source: docs/audit/gap-fix-work/verify2/packets/lane-14/W1_lane14_13.md)
- [ ] G2-19-010-068  (source: docs/audit/gap-fix-work/verify2/packets/lane-14/W1_lane14_13.md)
- [ ] G2-19-018-062  (source: docs/audit/gap-fix-work/verify2/packets/lane-14/W1_lane14_13.md)
- [ ] G2-2-006-014  (source: docs/audit/gap-fix-work/verify2/packets/lane-14/W1_lane14_13.md)
- [ ] G2-2-006-062  (source: docs/audit/gap-fix-work/verify2/packets/lane-14/W1_lane14_13.md)
- [ ] G2-2-010-025  (source: docs/audit/gap-fix-work/verify2/packets/lane-14/W1_lane14_13.md)
- [ ] G2-2-013-009  (source: docs/audit/gap-fix-work/verify2/packets/lane-14/W1_lane14_13.md)
- [ ] G2-2-014-032  (source: docs/audit/gap-fix-work/verify2/packets/lane-14/W1_lane14_13.md)
- [ ] G2-2-015-092  (source: docs/audit/gap-fix-work/verify2/packets/lane-14/W1_lane14_13.md)
- [ ] G2-2-016-134  (source: docs/audit/gap-fix-work/verify2/packets/lane-14/W1_lane14_13.md)
- [ ] G2-2-017-052  (source: docs/audit/gap-fix-work/verify2/packets/lane-14/W1_lane14_13.md)
- [ ] G2-2-017-057  (source: docs/audit/gap-fix-work/verify2/packets/lane-14/W1_lane14_13.md)
- [ ] G2-4-017-017  (source: docs/audit/gap-fix-work/verify2/packets/lane-14/W1_lane14_19.md)
- [x] G2-4-017-018  (source: docs/audit/gap-fix-work/verify2/packets/lane-14/W1_lane14_19.md)
- [ ] G2-4-017-046  (source: docs/audit/gap-fix-work/verify2/packets/lane-14/W1_lane14_19.md)
- [ ] G2-4-017-049  (source: docs/audit/gap-fix-work/verify2/packets/lane-14/W1_lane14_19.md)
- [ ] G2-4-017-070  (source: docs/audit/gap-fix-work/verify2/packets/lane-14/W1_lane14_19.md)
- [ ] G2-4-018-045  (source: docs/audit/gap-fix-work/verify2/packets/lane-14/W1_lane14_19.md)
- [ ] G2-4-018-046  (source: docs/audit/gap-fix-work/verify2/packets/lane-14/W1_lane14_19.md)
- [ ] G2-4-018-067  (source: docs/audit/gap-fix-work/verify2/packets/lane-14/W1_lane14_19.md)
- [ ] G2-4-018-072  (source: docs/audit/gap-fix-work/verify2/packets/lane-14/W1_lane14_19.md)
- [ ] G2-4-018-074  (source: docs/audit/gap-fix-work/verify2/packets/lane-14/W1_lane14_19.md)
- [ ] G2-4-025-075  (source: docs/audit/gap-fix-work/verify2/packets/lane-14/W1_lane14_19.md)
- [ ] G2-4-025-082  (source: docs/audit/gap-fix-work/verify2/packets/lane-14/W1_lane14_19.md)
- [ ] G2-4-028-012  (source: docs/audit/gap-fix-work/verify2/packets/lane-14/W1_lane14_19.md)
- [ ] G2-12-016-045  (source: docs/audit/gap-fix-work/verify2/packets/lane-14/W1_lane14_20.md)
- [ ] G2-13-031-098  (source: docs/audit/gap-fix-work/verify2/packets/lane-14/W1_lane14_20.md)

## Results

- **G2-4-017-018 FIXED (static specification):** `src/db/schema/projects.ts:229-240` records legacy recoverability separately from archive/delete, specifies retained child rows and safe restore constraints; `src/modules/projects/instance-service.ts:588-605` archives without deleting children. Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/ProjectWorkspace.java:93-95`. No restore operation or runtime parity claimed. Commit `162a5b848095119a86baad213778aa725c42f8c6`.
