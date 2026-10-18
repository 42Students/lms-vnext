# IIT Dharwad Projects — Mentor permission matrix

Owner: chat-14. Captures the **implemented authorization boundaries**, not customer acceptance. All references below are source/test evidence authored in the lane; no Vitest, TypeScript, browser, or PostgreSQL execution is claimed in this chat.

## Enforcement graph

1. At the request boundary: parse strict UUIDs, query filters, optimistic versions, and explicit destructive confirmations. `isSameOriginRequest` remains mandatory for POST/PATCH/DELETE HTTP routes; the service tests do not replace the route tests.
2. Before identifying user-supplied projects: check membership/role where appropriate and tenant Projects enablement. `requireProjectLifecycleMutationAccess` now performs module entitlement before `requireProjectLifecycleAccess`; Mentor history, feedback, resources and closeout read services have matching module-first guards.
3. For a project: `requireProjectReadAccess` checks active platform user, active college membership, matching organization/college, persisted `project_members` row, active role and role-kind mutation capability. It returns `ADMIN`, `MENTOR`, `LEARNER`, or `OBSERVER` as appropriate. Mentor-only pages/services must require `MENTOR` for their workspaces.
4. For lifecycle mutations: lock `project_instances` by `id` **and** `college_id`, then call `assertPersistedProjectMutationActor(tx,context,scope)` before loading dependent records or writing. This rechecks the live platform actor and membership and SHARE-locks the current Mentor project assignment; `ADMIN` instead requires persisted `projects.manage`.
5. For every state change: recheck the locked entity, permitted transition and `expectedUpdatedAt`, then persist atomically with activity and recipient-scoped notification. No audit/notice may survive a rejected transaction.

## Principal × capability contract

| Principal / state | Generic project read | Mentor-only private view | Mentor-specific write | Shared lifecycle mutation |
| --- | --- | --- | --- | --- |
| Active assigned Mentor, project `roleKind` mutable, current user/college role and `projects.read` grant | Conditional permit | Permit with assigned project + Projects enabled | Permit only after scoped parent lock + persisted-actor recheck + state/version validation | Permit subject to same recheck |
| Active Mentor assigned with observer/read-only role kind or `canMutate=false` | Read access via generic scope, as permitted | Mentor-only services requiring `scope.access==="MENTOR"` deny | Deny | Deny |
| Former Mentor, ended project membership / withdrawn Mentor role / suspended platform user | Deny | Deny | Deny even if a stale page was already opened | Deny |
| Learner with valid project assignment | Generic learner project scope may permit | Deny Mentor-only view and export | Deny | Deny |
| TPO-only or Recruiter-only membership | No Mentor project role; project scope denied | Deny | Deny | Deny |
| College Admin with current `projects.manage` for its own college | Admin scope may permit | Mentor-only `scope.access==="MENTOR"` pages deny | Only shared lifecycle services that explicitly allow `ADMIN` may permit | Permit only for authorized managed college, current persisted administrator and enabled module |
| Super Admin acting in an authorized college | Scoped `ADMIN` if policy allows | Mentor-only `scope.access==="MENTOR"` pages deny | No implicit Mentor assignment | Shared mutations follow acting-college `projects.manage` and persisted actor policy |
| Any role, Projects disabled for effective tenant | No Mentor-private project identity from protected services | Empty/denied without project title or row lookup | Deny prior to project identity resolution | Deny at central mutation gate prior to project resolution |
| Same actor, foreign college/project URL | Deny | Deny | Deny | Deny; lock predicates include both project ID and college |

Permission intent is subject to the effective `can()` policy. The last two admin rows do **not** imply that administrators can invoke Mentor-only endpoints. Each service's explicit `scope.access` check remains authoritative.

## Mutation / read path coverage ledger

| Workflow | Required guard | Authored test or proof | Release evidence still missing |
| --- | --- | --- | --- |
| Meeting notes read/write | module-first; Mentor scope; persisted write recheck | `PROJ-BREAK-chat14-mentor-notes-service.test.ts` / 205 | Real PostgreSQL same-tx revocation; mobile/browser |
| Meeting decision / reschedule | module-first, project+college parent lock, persisted Mentor | `PROJ-BREAK-chat14-mentor-release-meeting-revocation.test.ts` / 211,214,215 | Concurrent scheduling, actor revocation replay |
| Sprint details / release writes | module-first, lock parent, persisted actor, CAS | Same test file / 210,212,213 | Actual SQL, full transition matrix against PG |
| Sprint creation / transition | lifecycle mutation gate, lock, state/version | `PROJ-BREAK-chat14-mentor-core-state-matrix.test.ts` / 222–224 (pure model) | Service transaction behavioral and PG integration |
| Task creation / metadata edit | module-first (creation), project lock, persisted actor and tenant-specific child queries | `PROJ-BREAK-chat14-mentor-task-write-revocation.test.ts` / 218–221 | Real duplicate/race and version CAS |
| Task transitions and blockers | only TODO, IN_PROGRESS, BLOCKED transitions, strict status/confirm/blocker | `PROJ-BREAK-chat14-mentor-core-state-matrix.test.ts` / 225–228 | Full transaction conflict and role matrix |
| Task/sprint deletion | project lock, persisted actor, strict confirmation, dependent records preserved or blocked | `PROJ-BREAK-chat14-mentor-destructive-revocation.test.ts` / 231,232 | Real rollback and concurrent deletion |
| Final delivery approve/request changes | project+college lock, persisted Mentor, latest submission, CAS, audit, notification | `PROJ-BREAK-chat14-mentor-final-review-revocation.test.ts` / 206–209 | Real PG race, duplicate notification checks |
| Final delivery lock | scoped parent lock, persisted actor, no child read before authorization | `PROJ-BREAK-chat14-mentor-destructive-revocation.test.ts` / 233 | Live race against learner resubmit |
| Project overview / closeout | scoped parent, persisted actor, strict terminal-state/version/checklist | `PROJ-BREAK-chat14-mentor-destructive-revocation.test.ts` / 230; `PROJ-BREAK-chat14-mentor-closeout-revocation.test.ts` / 235–238 | Real release/checklist race |
| Activity history, resource directory, review overview | module-first, hide private title, Mentor-only scope | `PROJ-BREAK-chat14-mentor-history-module-off.test.ts` / 239–242 | HTTP IDOR and browser evidence |
| Shared project mutation access | module entitlement before *any* project ID lookup | `PROJ-BREAK-chat14-project-lifecycle-mutation-gate.test.ts` / 250–251 | Integration across every caller |
| Review / risk / closeout / resources pages | duplicate filter reject, denied/empty/disabled, correct controls | `PROJ-BREAK-chat14-mentor-project-pages-hardening.test.tsx` / 243–249 | Browser keyboard, reduced-motion, 375px, loading/error and route middleware |
| Mentor team, attention, board, calendar, approvals, reports | active Mentor + current college scope; data only from registered rows | Per-function rows in `docs/audit/coverage/projects-ledger.md` | Several page mappings and real cross-college PG cases remain GAP |

## Release gates and ownership boundaries

- **Not yet acceptance-complete:** No code was executed locally. Run cloud strict TypeScript, Vitest (including all new `PROJ-BREAK-chat14-*` suites), existing project routes, and the PostgreSQL integration harness against a disposable migrated database. Test revocation while a page is open, same-college role mutation, foreign tenant IDOR, concurrent sprint completion/closeout, delivery review CAS, and audit/notification exactly-once behavior.
- Run Mentor pages on a real authenticated browser at narrow and desktop widths, keyboard-only navigation and reduced-motion; screen-level source/static tests are not a substitute.
- Drizzle and PostgreSQL fixture ownership belongs to lane chat-17; chat-14 contributes Mentor use cases/expected outcomes to that harness. No fixture persistence or production DB changes should occur.
- Avoid claiming mentor-safe completion of all coverage rows until their exact tests are executed and marked. Audit defect list: `docs/audit/projects-defects.md`.

Last authored review: 2026-10-18.
