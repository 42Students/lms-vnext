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
