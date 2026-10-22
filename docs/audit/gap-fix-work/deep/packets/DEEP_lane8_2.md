# Deep verification packet (rows that fast mode DEFERRED)

These rows were marked DEFERRED without being checked. Each row must now end as exactly one of:
- OK: vNext already matches the old LMS. Give EVIDENCE: the vNext file:line that implements it AND the legacy source file (docs/legacy-source/...) it matches.
- FIXED: you changed the code so it matches. Give the commit and file.

DEFERRED is NOT allowed. For each row: read its full text in the source packet named next to it, find the old behaviour in docs/legacy-source, find the vNext code, decide, and fix if needed.
Keep tests passing and TypeScript valid; never silence errors. Write one result line per row under Results, push, then tick this packet in your queue.

- [ ] G2-4-017-046  (source: docs/audit/gap-fix-work/verify2/packets/lane-14/W1_lane14_19.md)
- [x] G2-4-017-049  (source: docs/audit/gap-fix-work/verify2/packets/lane-14/W1_lane14_19.md)
- [x] G2-4-017-070  (source: docs/audit/gap-fix-work/verify2/packets/lane-14/W1_lane14_19.md)
- [ ] G2-4-018-045  (source: docs/audit/gap-fix-work/verify2/packets/lane-14/W1_lane14_19.md)
- [x] G2-4-018-046  (source: docs/audit/gap-fix-work/verify2/packets/lane-14/W1_lane14_19.md)
- [x] G2-4-018-067  (source: docs/audit/gap-fix-work/verify2/packets/lane-14/W1_lane14_19.md)
- [ ] G2-4-018-072  (source: docs/audit/gap-fix-work/verify2/packets/lane-14/W1_lane14_19.md)
- [x] G2-4-018-074  (source: docs/audit/gap-fix-work/verify2/packets/lane-14/W1_lane14_19.md)
- [x] G2-4-025-075  (source: docs/audit/gap-fix-work/verify2/packets/lane-14/W1_lane14_19.md)
- [x] G2-4-025-082  (source: docs/audit/gap-fix-work/verify2/packets/lane-14/W1_lane14_19.md)

## Results


- OK G2-4-017-049 — `src/db/schema/projects.ts:230-232,261-263,302-304` records the independent historical `legacyRecoverableContent` indicator alongside deletion and archive timestamps; the legacy source `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/ProjectWorkspace.java:93-95` defaults recoverable content false. Neither historical recoverability nor archiving alone grants a restore operation.
- OK G2-4-017-070 — `src/db/schema/projects.ts:215-231,237-274,279-289,320-345` documents the verified legacy integer-to-UUID crosswalk, imported legacy identifiers, org/class associations, template-version binding, and tenant-scoped constraints; matches `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/ProjectWorkspace.java:13-125`.
- OK G2-4-018-046 — `src/db/schema/projects.ts:1016-1029,1081-1092` stores source `legacyRevisionCount` independently from per-project version ordinal and the separate `legacyOptimisticVersion`; matches `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/ProjectDelivery.java:63-64,123-129`.
- OK G2-4-018-074 — `src/db/schema/projects.ts:1039-1047` keeps each historical delivery's `deletedAt` separate from immutable review/history events at `src/db/schema/projects.ts:1128-1178`; matches legacy soft-delete and active finder semantics in `docs/legacy-source/backend/src/main/java/com/_42students/lms/repository/ProjectDeliveryRepository.java:13-22`.
- OK G2-4-018-067 — `src/db/schema/projects.ts:1016-1030` separates native delivery ordinals from imported JPA optimistic row versions, while `src/modules/projects/submission-service.ts:117-207,523-569` serializes creation and uses expected-version guards inside transactions; matches nullable new-row `@Version` in `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/ProjectDelivery.java:123-129`.

- OK G2-4-025-075 — `src/db/schema/db10-skills-catalog.draft.ts:1-13,32-70` registers the legacy integer skill ID crosswalk, preserves normalized unique names and active/category/display/popularity/search-priority indexing with canonical migration 0195; matches `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Skill.java:10-51`.
- OK G2-4-025-082 — `src/components/profile/learner-skill-catalog-input.tsx:20-37,108-137` persists recent explicit catalog selections in client history and sends idempotent selection receipts to `/api/skills/selection` without duplicating text input/profile saves; matches `docs/legacy-source/frontend/src/components/Global/SkillsAutocomplete.jsx:313-350`.
