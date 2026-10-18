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
| SA-placements-projects-55 | DONE | `src/app/(authenticated)/admin/projects/page.tsx`, `src/components/projects/project-admin-collection-controls.tsx`; `tests/unit/chat4-super-admin-projects-gap-closure.test.ts` test `SA-placements-projects-55` | 10/20/50/100 selector, default 20, canonical `search` URL and preserved pagination |
| SA-placements-projects-58 | DONE | `src/components/projects/project-admin-reassign-mentor-page.tsx`, `src/components/projects/project-mentor-reassignment.tsx`, `src/modules/projects/mentor-overload-model.ts`; `tests/unit/chat4-super-admin-projects-gap-closure.test.ts` tests `SA-placements-projects-58` | Dynamic >150% mentor overload, scoped mentor filter and deep links, named success toast, partial-failure modal and retry-only-failures selection |
| SA-placements-projects-65 | DONE | `src/modules/projects/readiness-override-service.ts`, `src/components/projects/project-workspace-readiness.tsx`; `tests/unit/chat4-super-admin-projects-gap-closure.test.ts` test `SA-placements-projects-65` | Override actor and timestamp, note, state, task/sprint/release bars and submission status shown |
| SA-placements-projects-66 | DONE | `src/components/projects/project-admin-readiness-page.tsx`, `src/components/projects/admin-readiness-workspace-picker.tsx`; `tests/unit/chat4-super-admin-projects-gap-closure.test.ts` test `SA-placements-projects-66` | Scoped unavailable-workspace message, 25-row picker, Releases context, target dates |
| SA-placements-projects-71 | PARTIAL | `src/components/projects/project-admin-submissions-page.tsx`, `src/components/projects/project-submissions-page-export.tsx`; `tests/unit/chat4-super-admin-projects-gap-closure.test.ts` test `SA-placements-projects-71` | Pending age, review, revisions, reviewer, safe link/evidence and CSV implemented; mentor-name search and exact full table columns remain open |
| SA-placements-projects-75 | PARTIAL | `src/components/projects/project-admin-audit-page.tsx`; `tests/unit/chat4-super-admin-projects-gap-closure.test.ts` test `SA-placements-projects-75` | Summary cards, Refresh and global View activity log present; day-grouped details and full destructive badges remain open |
| SA-placements-projects-81 | PARTIAL | `src/components/projects/super-admin-template-create-form.tsx`; `tests/unit/chat4-super-admin-projects-gap-closure.test.ts` test `SA-placements-projects-81` | Repeating sprint/task/resource editors and lifecycle settings remain incomplete |
| SA-placements-projects-82 | PARTIAL | `src/components/projects/super-admin-template-overview-editor.tsx`; `tests/unit/chat4-super-admin-projects-gap-closure.test.ts` test `SA-placements-projects-82` | Slug lifecycle and initial-workspace fields remain incomplete |
| SA-placements-projects-86 | PARTIAL | `src/components/projects/project-template-controls.tsx`; `tests/unit/chat4-super-admin-projects-gap-closure.test.ts` test `SA-placements-projects-86` | Full preview and duplicate metadata modal remain incomplete |
| SA-placements-projects-88 | PARTIAL | `src/components/projects/super-admin-template-rollback-control.tsx`; `tests/unit/chat4-super-admin-projects-gap-closure.test.ts` test `SA-placements-projects-88` | Compare-before-rollback approval and impact details still require acceptance |
| SA-placements-projects-89 | PARTIAL | `src/components/projects/college-project-summary-editor-full.tsx`; `tests/unit/chat4-super-admin-projects-gap-closure.test.ts` test `SA-placements-projects-89` | Change-template and deletion flows still missing |

### Round 4: concrete open-gap fixes (tests written, NOT run)

| ID | Status | Evidence |
|---|---|---|
| SA-placements-projects-67 | DONE | `src/components/projects/project-readiness-override-form.tsx`, `src/components/projects/project-admin-readiness-page.tsx`; `tests/unit/chat4-super-admin-projects-gap-closure.test.ts` test `SA-placements-projects-67`: accessible confirmation, safe apiFetch, note reset/draft retention, existing-submission warning, projectId deep link |
| SA-placements-projects-68 | DONE | `src/components/projects/project-workspace-readiness.tsx`; `tests/unit/chat4-super-admin-projects-gap-closure.test.ts` test `SA-placements-projects-68`: ten section tabs remain reachable on the static readiness route |
| SA-placements-projects-92 | DONE | `src/app/(authenticated)/admin/projects/[projectId]/[section]/page.tsx`, `src/components/projects/admin-project-section-page.tsx`, `src/components/projects/project-workspace.tsx`; `tests/unit/chat4-super-admin-projects-gap-closure.test.ts` test `SA-placements-projects-92`: sanitized origin/reason, contextual back link, workspace breadcrumb, readiness and full-audit shortcuts |

### Round 4: creator and multi-college actions

| ID | Status | Evidence |
|---|---|---|
| SA-placements-projects-56 | PARTIAL | `src/modules/projects/cohort-preflight-service.ts`, `src/components/projects/class-team-workspace-creator.tsx`; `tests/unit/chat4-super-admin-projects-gap-closure.test.ts` tests `SA-placements-projects-56`: scoped server preflight, per-learner decision table (to create, covered, duplicate), partial outcome/export. The legacy standalone team creation fields and per-student failure detail still need implementation |
| SA-placements-projects-57 | DONE | `src/app/(authenticated)/admin/projects/workspaces/new/page.tsx`, `src/components/projects/class-team-workspace-creator.tsx`; `tests/unit/chat4-super-admin-projects-gap-closure.test.ts` test `SA-placements-projects-57`: legacy heading, mode names, team help text |
| SA-placements-projects-87 | DONE | `src/app/(authenticated)/admin/projects/templates/[templateId]/colleges/page.tsx`, `src/components/projects/super-admin-template-college-bulk.tsx`; `tests/unit/chat4-super-admin-projects-gap-closure.test.ts` test `SA-placements-projects-87`: per-college authorization, bulk page selection, confirm, partial-failure retry |

### Round 5: transactional roster parity

| ID | Status | Evidence |
|---|---|---|
| SA-placements-projects-93 | DONE | `src/components/projects/college-project-student-roster-dialog.tsx`, `src/components/projects/college-project-mentor-dialog.tsx`, `src/components/projects/project-workspace.tsx`; `tests/unit/chat4-super-admin-projects-gap-closure.test.ts` test `SA-placements-projects-93`: searchable multi-select roster with role label; expected version and single transactional API mutation; removal-count confirmation with exact Replace roster label; in-tab mentor reassignment dialog |

| SA-placements-projects-72 | DONE | `src/components/projects/project-admin-submission-review.tsx`, `src/components/projects/project-admin-submissions-page.tsx`; `tests/unit/chat4-super-admin-projects-gap-closure.test.ts` test `SA-placements-projects-72`: scoped review dialog, feedback, request changes, accept and confirmed lock, draft-safe API mutation |

## Chat-6 UNCONFIRMED decisions, 2026-10-18

| SA-placements-projects-58 | DONE (source) | Mentor workload, fromMentorId and per-workspace report; decision evidence: `docs/audit/acceptance/chat-6-unconfirmed-decisions.md`; test: `tests/unit/chat6-unconfirmed-decisions-round13.test.ts` → `SA-placements-projects-58` |
| SA-placements-projects-68 | DONE (source) | Readiness route shows shared workspace section tabs; decision evidence: `docs/audit/acceptance/chat-6-unconfirmed-decisions.md`; test: `tests/unit/chat6-unconfirmed-decisions-round13.test.ts` → `SA-placements-projects-68` |
| SA-placements-projects-72 | OPEN (partial) | Confirmed accept and request changes restored; distinct durable lock action still absent; decision evidence: `docs/audit/acceptance/chat-6-unconfirmed-decisions.md`; test: `tests/unit/chat6-unconfirmed-decisions-round13.test.ts` → `SA-placements-projects-72` |
| SA-placements-projects-77 | OPEN | Template, mentor, review and release mutation audits need complete database-backed coverage; decision evidence: `docs/audit/acceptance/chat-6-unconfirmed-decisions.md`; test: `tests/unit/chat6-unconfirmed-decisions-round13.test.ts` → `SA-placements-projects-77` |

## 2026-10-18 chat-13 independent Projects source sweep — not runtime verification
| ID | Result | Evidence |
|---|---|---|
| SA-placements-projects-55 | DONE | 10/20/50/100 and canonical search/page size; `tests/unit/chat13-superadmin-gap-register-reconcile-b.test.ts` test `SA-placements-projects-55` (source, unrun). |
| SA-placements-projects-56 | PARTIAL | Individual creation preflight exists; per-learner failure detail and standalone team fields incomplete; `tests/unit/chat13-superadmin-gap-register-reconcile-b.test.ts` test `SA-placements-projects-56` (source, unrun). |
| SA-placements-projects-58 | DONE | Mentor workload average-based overload and mentor filter; `tests/unit/chat13-superadmin-gap-register-reconcile-b.test.ts` test `SA-placements-projects-58` (source, unrun). |
| SA-placements-projects-66 | DONE | Releases readiness and selected-workspace picker; `tests/unit/chat13-superadmin-gap-register-reconcile-b.test.ts` test `SA-placements-projects-66` (source, unrun). |
| SA-placements-projects-67 | DONE | Override warnings and guarded confirmation; `tests/unit/chat13-superadmin-gap-register-reconcile-b.test.ts` test `SA-placements-projects-67` (source, unrun). |
| SA-placements-projects-68 | DONE | Readiness section route retained through shared workspace component; `tests/unit/chat13-superadmin-gap-register-reconcile-b.test.ts` test `SA-placements-projects-68` (source, unrun). |
| SA-placements-projects-77 | OPEN | Full template, mentor, submission, release and review mutation audit coverage not yet proven end-to-end; full integration coverage still necessary. |
| SA-placements-projects-87 | DONE | Template-college assignment/removal selection and retry; `tests/unit/chat13-superadmin-gap-register-reconcile-b.test.ts` test `SA-placements-projects-87` (source, unrun). |
| SA-placements-projects-93 | DONE | Student roster replacement with scoped selection and confirm; `tests/unit/chat13-superadmin-gap-register-reconcile-b.test.ts` test `SA-placements-projects-93` (source, unrun). |


## chat-13 functional closure round — 2026-10-18
| Gap | Decision | Implementation and gap-ID tests |
|---|---|---|
| SA-placements-projects-56 | PARTIAL — safer individual creation | `src/modules/projects/cohort-creation-outcome-model.ts` strictly maps every authorized learner to CREATED or ALREADY_COVERED, refusing a synthetic successful partial response. `class-team-workspace-service.ts` returns this within its serializable creation transaction; `class-team-workspace-creator.tsx` shows each learner and exports every result. Preflight is now bound to the exact college, class, template and roster revision; stale responses cannot be confirmed. `tests/unit/chat13-cohort-creation-outcomes-gap56.test.ts` (5 gap-named checks). Standalone team creation fields and full legacy partial retry behavior remain incomplete, so do not mark DONE. |
| SA-placements-projects-77 | DONE in audited source; DB verification pending | `src/modules/projects/template-service.ts` now records template create, revise, publish, unpublish, duplicate, archive, college assign and revoke in the same transaction as the mutation; the archive and assignment paths use template locks. `template-rollback-service.ts` records restored prior version, new version and preservation of workspaces in-transaction. `mentor-release-write-service.ts` now emits distinct RELEASE_CREATED / UPDATED / DELETED activity rather than a sprint update. Existing persisted mentor reassignment, task assignment, resource, readiness and submission activity writers were independently checked. Event types live in `src/modules/activity/taxonomy.ts`. Source tests: `tests/unit/chat13-superadmin-projects-template-audit-gap77.test.ts` (ten checks), `tests/unit/chat13-superadmin-project-release-audit-gap77.test.ts` (three checks), `tests/unit/chat13-superadmin-projects-provenance-gap77.test.ts` (seven checks). Transactional rollback and event consistency must still be verified with real Postgres; source tests were not run. |

No existing migration was modified and the UX playbook is still awaiting audit approval.


## chat-15 final sprint independent verification (not runtime-certified)

| ID | Status | Evidence |
|---|---|---|
| SA-placements-projects-91 | DONE (source) | `src/components/projects/project-workspace.tsx` exposes sprint creation/edit/delete, task editing/reassignment and admin submission review for writable admin scope; `src/modules/projects/access.ts` retains ADMIN/MENTOR-only lifecycle mutation authorization. `tests/unit/chat15-final-sprint-sa-projects-91.test.ts` → `SA-placements-projects-91 allows admin sprint/task authoring while preserving read-only denial`. Test authored but not executed by this lane; PostgreSQL role matrix/browser acceptance outstanding. |
