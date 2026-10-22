# Deep verification packet (rows that fast mode DEFERRED)

These rows were marked DEFERRED without being checked. Each row must now end as exactly one of:
- OK: vNext already matches the old LMS. Give EVIDENCE: the vNext file:line that implements it AND the legacy source file (docs/legacy-source/...) it matches.
- FIXED: you changed the code so it matches. Give the commit and file.

DEFERRED is NOT allowed. For each row: read its full text in the source packet named next to it, find the old behaviour in docs/legacy-source, find the vNext code, decide, and fix if needed.
Keep tests passing and TypeScript valid; never silence errors. Write one result line per row under Results, push, then tick this packet in your queue.

- [x] G2-5-022-014  (source: docs/audit/gap-fix-work/verify2/packets/lane-20/W1_lane20_5.md)
- [x] G2-5-022-026  (source: docs/audit/gap-fix-work/verify2/packets/lane-20/W1_lane20_5.md)
- [ ] G2-5-023-038  (source: docs/audit/gap-fix-work/verify2/packets/lane-20/W1_lane20_5.md)
- [ ] G2-5-030-024  (source: docs/audit/gap-fix-work/verify2/packets/lane-20/W1_lane20_5.md)
- [ ] G2-6-020-015  (source: docs/audit/gap-fix-work/verify2/packets/lane-20/W1_lane20_5.md)
- [x] G2-6-025-049  (source: docs/audit/gap-fix-work/verify2/packets/lane-20/W1_lane20_5.md)
- [ ] G2-6-027-044  (source: docs/audit/gap-fix-work/verify2/packets/lane-20/W1_lane20_5.md)
- [x] G2-6-029-056  (source: docs/audit/gap-fix-work/verify2/packets/lane-20/W1_lane20_5.md)
- [ ] G2-6-030-050  (source: docs/audit/gap-fix-work/verify2/packets/lane-20/W1_lane20_5.md)
- [ ] G2-9-034-064  (source: docs/audit/gap-fix-work/verify2/packets/lane-20/W1_lane20_8.md)

## Results

- G2-6-029-056 — FIXED: commit `f31efab4c2b163f42a427e44efccd99d8ea407ec`, `src/components/projects/super-admin-template-page-export.tsx` explicitly says "Export current page CSV" for its client-side current visible dataset, rather than suggesting a full filtered server export. Legacy comparison: `docs/legacy-source/frontend/src/pages/superadmin/projects/templates/index.js:270-295` exports its full currently fetched filtered array.
- G2-5-022-014 — OK: `src/modules/placements/tpo-academic-import-service.ts:18-49,151-162,183-220` accepts single-edit partial corrections for CGPA, active/past backlogs, school/diploma/undergrad/postgrad percentages, gap years, lateral-entry flag and passing year; only supplied keys are put in the insert-on-conflict update. Legacy comparison: `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/TpoStudentService.java:45-61` updates only provided nonnull academic values.
- G2-6-025-049 — OK (secure replacement for legacy publicUrl): `src/modules/courses/lesson-resource-file-upload-service.ts:89-198` creates FILE material and private signed PUT, verifies object ownership, size, scan and generation before READY; `src/components/courses/lesson-resource-file-uploader.tsx:119-158` performs grant→PUT→complete; `src/modules/courses/lesson-resource-materials-service.ts:198-256` grants scoped short-lived CLEAN READY downloads, wired by `src/app/api/courses/lesson-contents/[contentId]/materials/[materialId]/url/route.ts`. Legacy comparison: `docs/legacy-source/backend/src/main/java/com/_42students/lms/dto/PresignUploadResponseDTO.java:11-31` specifies upload URL/key/receipt; vNext does not expose insecure raw key/publicUrl.

- G2-5-022-026 — FIXED: commit `366aa5de985555a4c605417a4671433663d7c08b`, `src/modules/placements/tpo-academic-import-service.ts` now updates `importedAt` on verified SINGLE corrections, as on BULK import; the same transaction already reevaluates submitted applications before and after the evidence write and flags newly ineligible cases without deleting applications. Legacy comparison: `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/TpoStudentService.java:43-61` sets VERIFIED source and fresh importedAt on every upsert (with nullable importBatchId).
