# Work packet (wave 2): edit src/modules/courses/super-admin-content-directory-model.ts

6 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-17/superadmin-lesson-content-wrapper.md, docs/audit/gap2/lane-19/lesson-content.md, docs/audit/gap2/lane-9/superadmin-admin-resources.md

## G2-17-003-002  [P2] GAP  facet F01  effort 
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/lesson-content.js:71-73 chooses AdminResources only for 'resources', LessonContent for all other types; docs/legacy-source/frontend/src/pages/superadmin/sections/LessonContent.js:105-114 defaults unrecognized to video.
- vNext now: src/modules/courses/super-admin-content-directory-model.ts:17-23 has three dedicated routes; no fallback from old /superadmin/lesson-content.
- Fix: Canonicalize missing/unknown type to Videos with explicit legacy alias and retain old valid deep links.

## G2-17-003-033  [P2] GAP  facet F12  effort 
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/LessonContent.js:105-109 default type video, unknown type falls back to Videos.
- vNext now: src/modules/courses/super-admin-content-directory-model.ts:21-34 only canonical kind routes and status queries, unknown legacy 'type' rejected in new path.
- Fix: Implement legacy URL alias normalization and preserve permitted parameters.

## G2-19-002-022  [P2] GAP  facet F05  effort M
- Legacy: Legacy paging default 10 with size-changer and `start-end of total` `docs/legacy-source/frontend/src/pages/superadmin/sections/LessonContent.js:1691-1713`
- vNext now: vNext 25 per page fixed, no size selector `src/modules/courses/super-admin-content-directory-model.ts:2` `src/components/courses/super-admin-content-directory-page.tsx:133` `src/components/courses/super-admin-content-directory-page.tsx:166-167`
- Fix: Allow default 10, size changer and legacy total range.

## G2-9-025-021  [P2] GAP  facet F05  effort S
- Legacy: Legacy Table pagination fixed pageSize15 `docs/legacy-source/frontend/src/pages/superadmin/sections/AdminResources.js:377-377`
- vNext now: Server default page size25 `src/modules/courses/super-admin-content-directory-model.ts:1-2` `src/modules/courses/super-admin-content-directory-service.ts:90-93`
- Fix: Use 15 per page for parity; keep backend cursor/limit for scale.

## G2-9-025-047  [P2] GAP  facet F12  effort M
- Legacy: Creation visible defaults true and active/enabled preserved `docs/legacy-source/frontend/src/pages/superadmin/sections/AdminResources.js:189-190,266-285`
- vNext now: New Publish Now semantics depend on publish path and ancestor state `src/modules/courses/super-admin-content-directory-model.ts:43-51` `src/components/courses/faculty-lesson-authoring.tsx:118-119`
- Fix: Map visible and active/enabled to published state exactly.

## G2-19-002-014  [P3] GAP  facet F04  effort S
- Legacy: Legacy Type display maps video->`Video`, youtube->`YouTube`, LIVE_CLASS->`Live class` `docs/legacy-source/frontend/src/pages/superadmin/sections/LessonContent.js:973-975`
- vNext now: vNext types `Video (Upload)`, `YouTube Video`, `Live class` `src/modules/courses/super-admin-content-directory-model.ts:39-41`
- Fix: Use legacy row Type labels while keeping full create-option names.
