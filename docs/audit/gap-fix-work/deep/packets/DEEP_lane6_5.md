# Deep verification packet (rows that fast mode DEFERRED)

These rows were marked DEFERRED without being checked. Each row must now end as exactly one of:
- OK: vNext already matches the old LMS. Give EVIDENCE: the vNext file:line that implements it AND the legacy source file (docs/legacy-source/...) it matches.
- FIXED: you changed the code so it matches. Give the commit and file.

DEFERRED is NOT allowed. For each row: read its full text in the source packet named next to it, find the old behaviour in docs/legacy-source, find the vNext code, decide, and fix if needed.
Keep tests passing and TypeScript valid; never silence errors. Write one result line per row under Results, push, then tick this packet in your queue.

- [x] G2-18-029-034  (source: docs/audit/gap-fix-work/verify2/packets/lane-8/W1_lane8_7.md)
- [x] G2-4-024-024  (source: docs/audit/gap-fix-work/verify2/packets/lane-8/W1_lane8_7.md)
- [x] G2-4-024-026  (source: docs/audit/gap-fix-work/verify2/packets/lane-8/W1_lane8_7.md)
- [x] G2-4-024-069  (source: docs/audit/gap-fix-work/verify2/packets/lane-8/W1_lane8_7.md)
- [x] G2-4-024-076  (source: docs/audit/gap-fix-work/verify2/packets/lane-8/W1_lane8_7.md)
- [x] G2-4-027-002  (source: docs/audit/gap-fix-work/verify2/packets/lane-8/W1_lane8_7.md)
- [x] G2-4-027-038  (source: docs/audit/gap-fix-work/verify2/packets/lane-8/W1_lane8_7.md)
- [x] G2-4-027-046  (source: docs/audit/gap-fix-work/verify2/packets/lane-8/W1_lane8_7.md)
- [x] G2-4-027-072  (source: docs/audit/gap-fix-work/verify2/packets/lane-8/W1_lane8_7.md)
- [x] G2-5-003-012  (source: docs/audit/gap-fix-work/verify2/packets/lane-8/W1_lane8_7.md)

## Results

- G2-18-029-034: OK — vNext src/components/academics/college-semester-management.tsx:217 sends the persisted row.totalCredits unchanged on edit (field read-only, lines 308-312) and src/modules/academics/semester-mutation-model.ts:21-32 retains omitted fields; matches docs/legacy-source/frontend/src/pages/superadmin/sections/SemesterManagement.js:231-275.
- G2-4-024-024: OK — vNext src/modules/electives/college-slot-mutation-service.ts:140-180 lets program/semester/year be edited under expectedVersion CAS and throws ELECTIVE_SELECTION_LOCKED only after membership history; UI src/components/electives/college-slot-manager.tsx:67,157-160,216-233; matches ElectiveService.java:167-207.
- G2-4-024-026: OK — vNext src/modules/electives/service.ts:34-35,362,392 capacity nullable (unlimited, label No limit at :309) and positive when given, below-enrollment rejected; matches ElectiveService.java:306-317.
- G2-4-024-069: OK — vNext src/modules/electives/college-slot-mutation-service.ts:164-177 checks lmsGroupMembers and immutable lmsGroupMemberEvents across all offerings before changing identity/credits/pick limits; matches ElectiveService.java:177-212,575-589.
- G2-4-024-076: OK — same evidence as G2-4-024-024 and G2-4-024-026 (college-slot-manager.tsx:216-218 explains the lock; service.ts:34-35 unlimited capacity).
- G2-4-027-002: OK — vNext src/modules/academics/lecture-hall-service.ts:131-166 listSuperAdminOrganizationLectureHalls gives selected-organization SA read-only discovery; listLectureHalls (:248-270) is college-scoped, documented as deliberate at :167-169 (no unscoped global listing); legacy LectureHallController.java:83-108.
- G2-4-027-038: OK — same evidence as G2-4-027-002 (org read at lecture-hall-service.ts:131-166, college read :248; deliberate no-global decision documented :167-169).
- G2-4-027-046: OK — vNext src/modules/academics/lecture-hall-service.ts:25-31,398-420 replaces hard delete with ARCHIVED (rows and booking history retained, restorable) and blocks archival while upcoming SCHEDULED events exist; no historical schedule is lost; legacy LectureHallServiceImpl.java:144-153.
- G2-4-027-072: FIXED — kept the deliberate organization-scoped read-only SA listing, and repaired the escaped LIKE search in listSuperAdminOrganizationLectureHalls (replacement string had been corrupted by a comment) to "\$&" in src/modules/academics/lecture-hall-service.ts:148-149 so search for names with % or _ works; legacy LectureHallController.java:89-108.
- G2-5-003-012: OK — vNext src/components/academics/college-structure-directory.tsx:427-429 shows Name unavailable (ID X) fallbacks for missing program/batch rows; matches docs/legacy-source/frontend/src/pages/superadmin/sections/Classes.js:391-395.
