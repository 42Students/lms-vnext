# Deep verification packet (rows that fast mode DEFERRED)

These rows were marked DEFERRED without being checked. Each row must now end as exactly one of:
- OK: vNext already matches the old LMS. Give EVIDENCE: the vNext file:line that implements it AND the legacy source file (docs/legacy-source/...) it matches.
- FIXED: you changed the code so it matches. Give the commit and file.

DEFERRED is NOT allowed. For each row: read its full text in the source packet named next to it, find the old behaviour in docs/legacy-source, find the vNext code, decide, and fix if needed.
Keep tests passing and TypeScript valid; never silence errors. Write one result line per row under Results, push, then tick this packet in your queue.

- [ ] G2-9-025-069  (source: docs/audit/gap-fix-work/verify2/packets/lane-17/W1_lane17_10.md)
- [ ] G2-9-025-070  (source: docs/audit/gap-fix-work/verify2/packets/lane-17/W1_lane17_10.md)
- [ ] G2-9-027-034  (source: docs/audit/gap-fix-work/verify2/packets/lane-17/W1_lane17_10.md)
- [ ] G2-19-028-004  (source: docs/audit/gap-fix-work/verify2/packets/lane-18/W1_lane18_6.md)
- [ ] G2-8-017-050  (source: docs/audit/gap-fix-work/verify2/packets/lane-18/W1_lane18_6.md)
- [ ] G2-8-022-025  (source: docs/audit/gap-fix-work/verify2/packets/lane-18/W1_lane18_6.md)
- [ ] G2-8-023-009  (source: docs/audit/gap-fix-work/verify2/packets/lane-18/W1_lane18_6.md)
- [ ] G2-8-030-012  (source: docs/audit/gap-fix-work/verify2/packets/lane-18/W1_lane18_6.md)
- [ ] G2-8-030-017  (source: docs/audit/gap-fix-work/verify2/packets/lane-18/W1_lane18_6.md)
- [ ] G2-8-030-051  (source: docs/audit/gap-fix-work/verify2/packets/lane-18/W1_lane18_6.md)

## Results

- G2-9-025-069: OK — vNext src/modules/courses/super-admin-content-directory-service.ts:31-34,72-76 resolves content to course/section relations by new UUIDs with every join pinned to the super-admin's selected collegeId (tenant ownership verified), matching docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/LessonContentController.java:214-281 (class/course college match + scoped superadmin college/org check); legacy integer IDs are not carried, by design.
- G2-9-025-070: OK — vNext src/modules/courses/super-admin-content-directory-service.ts:110-119 selects title, kind, mimeType, sizeBytes, originalName, uploadStatus per material, matching docs/legacy-source/frontend/src/pages/superadmin/sections/AdminResources.js:266-285 (resource_materials metadata).
- G2-9-027-034: FIXED — added a legacy raw-audit query crosswalk (actionKey->eventType, entityType/type->subjectType, entityId->subjectId, since/until->from/to date part; current names win) in src/app/(authenticated)/activity/page.tsx.
- G2-19-028-004: OK — vNext src/components/projects/project-meeting-controls.tsx:546-668 exposes Status, Ceremony, Meeting link, Linked sprint, Linked task, Agenda, Notes and times; matches docs/legacy-source/frontend/src/components/admin/projects/projectSectionFieldConfigs.js:176-215 (the legacy free-text "Key" is replaced by system UUIDs, deliberately).
- G2-8-017-050: OK — vNext src/components/projects/super-admin-template-page-export.tsx:6-12 exports project-templates.csv with Title/Version/Lifecycle/Summary in legacy order and is explicitly labelled "Export current page CSV" (page.tsx:78 notes scope), matching docs/legacy-source/frontend/src/pages/superadmin/projects/templates/index.js:270-300.
- G2-8-022-025: OK — vNext deliberately enforces a single ACTIVE season per college (drizzle/0027_placements_p9_seasons.sql:37 partial unique index + src/modules/placements/season-service.ts:100-119 PLACEMENT_SEASON_ACTIVE_EXISTS), so "current season" is unambiguous; legacy docs/legacy-source/backend/.../tpo/TpoSeasonService.java:32-41 only picks the latest current season via findFirst...OrderByStartDateDesc, which vNext season-service.ts:31-37 reproduces. Safe, intentional behaviour.
- G2-8-023-009: FIXED — bulk application rejection now has a separate optional private "Internal rejection reason" field (never shown to candidates) distinct from the candidate-facing message; threaded through src/components/tpo/tpo-bulk-action-panel.tsx, src/modules/placements/tpo-bulk-workflow-model.ts, tpo-bulk-preview-token.ts and tpo-bulk-action-confirm-service.ts into reviewTpoApplicant (internalReason), matching legacy ApplicationTransitionService/TpoApplicantService.bulkReject split.
- G2-8-030-012: OK — vNext src/modules/placements/tpo-operations-service.ts:987 counts ALL application statuses (count(*)) as metrics.applicants, rendered at src/app/(authenticated)/admin/placements/drives/page.tsx:106-108; matches docs/legacy-source/frontend/src/pages/superadmin/sections/Jobs.js:556-562.
- G2-8-030-017: OK — vNext src/modules/placements/tpo-operations-service.ts:977-982 orders by coalesce(publishedAt, legacyPostedAt, createdAt) desc with id tiebreakers and applies limit/offset in SQL; matches docs/legacy-source/frontend/src/pages/superadmin/sections/Jobs.js:249-260.
- G2-8-030-051: OK — vNext src/modules/placements/tpo-operations-service.ts:982-993 pages first and counts applicants only for the page's job ids (inArray ids); matches docs/legacy-source/frontend/src/pages/superadmin/sections/Jobs.js:233-283 (stale-request abort is a client concern; server page is bounded).
