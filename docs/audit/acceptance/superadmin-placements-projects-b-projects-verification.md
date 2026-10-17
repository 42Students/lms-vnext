# Super Admin Projects — verified gap coverage (chat-4)

Authoritative page: `docs/audit/pages/superadmin/placements-projects-b-projects.md`.
Tests are authored but not run by this lane. `DONE` means that the source-backed
behavioral contract identified below is present; integrated acceptance still
depends on the orchestrator's passing tests and PostgreSQL checks.

| ID | Status | Evidence (implementation; acceptance test and name) |
|---|---|---|
| SA-placements-projects-51 | NOT-A-GAP | `src/components/projects/project-archive-control.tsx`; `tests/unit/chat4-super-admin-projects-gap-closure.test.ts`, `SA-placements-projects-51` |
| SA-placements-projects-52 | DONE | `src/app/(authenticated)/admin/projects/page.tsx`; `tests/unit/chat4-super-admin-projects-gap-closure.test.ts`, `SA-placements-projects-52` |
| SA-placements-projects-54 | DONE | `src/app/(authenticated)/admin/projects/page.tsx`; `tests/unit/chat4-super-admin-projects-gap-closure.test.ts`, `SA-placements-projects-54` |
| SA-placements-projects-59 | DONE | `src/components/projects/project-admin-at-risk-page.tsx`; `tests/unit/chat4-super-admin-projects-gap-closure.test.ts`, `SA-placements-projects-59` |
| SA-placements-projects-60 | DONE | `src/components/projects/project-admin-at-risk-page.tsx`; `tests/unit/chat4-super-admin-projects-gap-closure.test.ts`, `SA-placements-projects-60` |
| SA-placements-projects-61 | DONE | `src/components/projects/project-admin-at-risk-page.tsx`; `tests/unit/chat4-super-admin-projects-gap-closure.test.ts`, `SA-placements-projects-61` |
| SA-placements-projects-62 | DONE | `src/components/projects/project-admin-at-risk-page.tsx`; `tests/unit/chat4-super-admin-projects-gap-closure.test.ts`, `SA-placements-projects-62` |
| SA-placements-projects-63 | DONE | `src/components/projects/project-admin-at-risk-page.tsx`; `tests/unit/chat4-super-admin-projects-gap-closure.test.ts`, `SA-placements-projects-63` |
| SA-placements-projects-64 | DONE | `src/components/projects/project-admin-readiness-page.tsx`; `tests/unit/chat4-super-admin-projects-gap-closure.test.ts`, `SA-placements-projects-64` |
| SA-placements-projects-69 | DONE | `src/components/projects/project-admin-submissions-page.tsx`; `tests/unit/chat4-super-admin-projects-gap-closure.test.ts`, `SA-placements-projects-69` |
| SA-placements-projects-70 | DONE | `src/components/projects/project-admin-submissions-page.tsx`; `tests/unit/chat4-super-admin-projects-gap-closure.test.ts`, `SA-placements-projects-70` |
| SA-placements-projects-73 | DONE | `src/components/projects/project-admin-submissions-page.tsx`; `tests/unit/chat4-super-admin-projects-gap-closure.test.ts`, `SA-placements-projects-73` |
| SA-placements-projects-74 | DONE | `src/components/projects/project-admin-audit-page.tsx`; `tests/unit/chat4-super-admin-projects-gap-closure.test.ts`, `SA-placements-projects-74` |
| SA-placements-projects-76 | DONE | `src/components/projects/project-admin-audit-page.tsx`; `tests/unit/chat4-super-admin-projects-gap-closure.test.ts`, `SA-placements-projects-76` |
| SA-placements-projects-78 | DONE | `src/app/(authenticated)/admin/projects/page.tsx`; `tests/unit/chat4-super-admin-projects-gap-closure.test.ts`, `SA-placements-projects-78` |
| SA-placements-projects-79 | DONE | `src/app/(authenticated)/admin/projects/templates/page.tsx`; `tests/unit/chat4-super-admin-projects-gap-closure.test.ts`, `SA-placements-projects-79` |
| SA-placements-projects-80 | DONE | `src/app/(authenticated)/admin/projects/templates/page.tsx`; `tests/unit/chat4-super-admin-projects-gap-closure.test.ts`, `SA-placements-projects-80` |
| SA-placements-projects-85 | DONE | `src/components/projects/super-admin-template-resource-editor.tsx`; `tests/unit/chat4-super-admin-projects-gap-closure.test.ts`, `SA-placements-projects-85` |
| SA-placements-projects-90 | DONE | `src/components/projects/workspace-brief-editor.tsx`; `tests/unit/chat4-super-admin-projects-gap-closure.test.ts`, `SA-placements-projects-90` |

`SA-placements-projects-51` is **NOT-A-GAP** under owner decision OD-38: archive / restore preserves project work, while a second soft-delete bin is intentionally not needed. It is not described as restored legacy deletion.

Remaining gaps are tracked in `docs/orchestrator/queues/gap-closure-chat-4.md`. Previously claimed fixes missing material legacy behavior (e.g. template create, admin task writes, deleted-bin distinction) are not recorded as DONE.

### Next open-gap regression coverage (tests written, NOT run)

| Gap | Status | Verified foundation | Remaining |
|---|---|---|---|
| SA-placements-projects-53 | PARTIAL | `src/components/projects/project-admin-workspace-list.tsx`; `tests/unit/chat4-super-admin-projects-gap-closure.test.ts` test `SA-placements-projects-53` | Missing-template action/cue still absent |
| SA-placements-projects-55 | PARTIAL | `src/components/projects/project-admin-collection-controls.tsx`; `tests/unit/chat4-super-admin-projects-gap-closure.test.ts` test `SA-placements-projects-55` | Legacy default 20 and search URL semantics still differ |
| SA-placements-projects-58 | PARTIAL | `src/components/projects/project-admin-at-risk-page.tsx`; `tests/unit/chat4-super-admin-projects-gap-closure.test.ts` test `SA-placements-projects-58` | Mentor workload and overload calculation still unverified |
| SA-placements-projects-65 | PARTIAL | `src/components/projects/project-workspace-readiness.tsx`; `tests/unit/chat4-super-admin-projects-gap-closure.test.ts` test `SA-placements-projects-65` | Override actor attribution not yet shown in readiness card |
| SA-placements-projects-66 | PARTIAL | `src/components/projects/project-admin-readiness-page.tsx`; `tests/unit/chat4-super-admin-projects-gap-closure.test.ts` test `SA-placements-projects-66` | Different-college 403 hint and picker paging still incomplete |
| SA-placements-projects-71 | PARTIAL | `src/components/projects/project-admin-submissions-page.tsx`; `tests/unit/chat4-super-admin-projects-gap-closure.test.ts` test `SA-placements-projects-71` | Full pending-age/export/action columns still incomplete |
| SA-placements-projects-75 | PARTIAL | `src/components/projects/project-admin-audit-page.tsx`; `tests/unit/chat4-super-admin-projects-gap-closure.test.ts` test `SA-placements-projects-75` | Day grouped detail table and all legacy action indicators remain incomplete |
| SA-placements-projects-81 | PARTIAL | `src/components/projects/super-admin-template-create-form.tsx`; `tests/unit/chat4-super-admin-projects-gap-closure.test.ts` test `SA-placements-projects-81` | Repeating sprint/task/resource editors and lifecycle settings remain incomplete |
| SA-placements-projects-82 | PARTIAL | `src/components/projects/super-admin-template-overview-editor.tsx`; `tests/unit/chat4-super-admin-projects-gap-closure.test.ts` test `SA-placements-projects-82` | Slug lifecycle and initial-workspace fields remain incomplete |
| SA-placements-projects-86 | PARTIAL | `src/components/projects/project-template-controls.tsx`; `tests/unit/chat4-super-admin-projects-gap-closure.test.ts` test `SA-placements-projects-86` | Full preview and duplicate metadata modal remain incomplete |
| SA-placements-projects-88 | PARTIAL | `src/components/projects/super-admin-template-rollback-control.tsx`; `tests/unit/chat4-super-admin-projects-gap-closure.test.ts` test `SA-placements-projects-88` | Compare-before-rollback approval and impact details still require acceptance |
| SA-placements-projects-89 | PARTIAL | `src/components/projects/college-project-summary-editor-full.tsx`; `tests/unit/chat4-super-admin-projects-gap-closure.test.ts` test `SA-placements-projects-89` | Change-template and deletion flows still missing |
