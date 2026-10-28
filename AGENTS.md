# LMS vNext engineering rules

## Single current execution plan — owner-approved 29 October 2026

**Read the [single master execution plan and tracker](docs/tracker.json) first.** Its `execution` section owns the full five-stage roadmap, ten worker lanes, claims, handoffs and milestones. The old closure-first strategy and October 28 locked task order have been retired. Do not invent another status tracker or execution plan.

- **Close domain packages, not serial 81-task investigations:** preserve each task's exact engineering acceptance. `npm run progress -- --lanes` displays ten lanes; `npm run progress -- --lane=L03` shows one, and `npm run progress -- --check` validates all assignments. Skip accepted `done:true` work absent a reproducible regression or owner rescope.
- **Safe domain vertical slices are allowed during DATABASE:** implement needed domain-local registered persistence, API and functional UI producer→consumer paths together. This is not permission to certify global API/UI or RELEASE early. `currentPhase` remains DATABASE until its independent gate passes.
- **Evidence not ceremony:** only genuine executed PG/tenant/privacy/security/state/race/consumer tests at a known code SHA and required product decisions can accept a task. Final release-only independent signatures/live-provider/browser freeze may be `deferredRelease` under the existing strict structured receipt. Missing functionality, code/schema or failing core security may never be deferred.
- **Ten chats, ten exclusive lanes:** use L01–L10 in `docs/tracker.json.execution.lanes`, claim a lane, write only owned domain code, send shared-file requests to L01, and commit using a fresh expected-head/no-force check. Claims are advisory; Git conflict protection is mandatory. Use non-force optimistic ref checks, never clobber concurrent changes.
- **Freeze and move:** one cohesive code/service/consumer/test batch; close individually accepted tasks, then next ready work. After two no-closure passes, isolate and fix the precise blocker or move to independent ready work. No full re-audit of earlier accepted code, duplicate plans or invented percentages.
- **Global phases:** DATABASE → API/user jobs → UI Implementation Green → final Design Green → RELEASE. Detailed UI green-and-move contracts live in `docs/parity/README.md`. Approved greenfield: no old LMS production data migration.

## Non-negotiable architecture rules

- Keep one repository and one deployable application.
- Keep the system a modular monolith.
- TypeScript is the application language.
- PostgreSQL is the system of record.
- Do not add microservices, Redis, Pub/Sub, Kafka, GKE, GraphQL, or a second database without a demonstrated production requirement.
- Do not split frontend and backend into separate repositories.
- Do not port legacy Java classes file-for-file.
- Preserve business behavior, not legacy implementation structure.

## Module rules

- Core business logic belongs in `src/modules/*`.
- React components should orchestrate UI, not encode domain invariants.
- Validate untrusted inputs with Zod at boundaries.
- Authorization must be explicit and centralized; avoid scattered role string checks.
- Tenant-owned data must be scoped by college/tenant context.
- Database access must use shared pooled Drizzle/Postgres infrastructure.
- New abstractions require a concrete use case.

## Quality gates — targeted during implementation, full at acceptance

- **Inside a cohesive batch:** run the relevant focused lint/typecheck/unit or SQL/database tests that can detect the touched regression quickly. Keep the known full-suite failures visible; do not add skip flags to hide them.
- **Before declaring a database migration or a task DONE:** independently execute the required **registered-journal replay, drift check, tenant/FK/history/state/concurrency and affected service tests on disposable PostgreSQL**, plus all other task-specific acceptance and approvals. A staged-only test is not promotion proof.
- **Before phase or release sign-off:** execute and pass the complete applicable lint, typecheck, unit, build and relevant browser/Playwright matrix on an identified revision. Unrelated red CI jobs remain blockers to global acceptance, even if the focused batch succeeds.
- Commit and test **one coherent batch**, rather than causing a full serial GitHub Actions run on every small document/test adjustment.

Every migrated legacy rule should gain a meaningful regression test where practical.

## Migration principle

For each legacy feature:

1. understand current behavior
2. classify it as business rule, intentional legacy behavior, or bug
3. design the vNext domain model
4. implement cleanly
5. verify against the legacy system
6. migrate data separately
7. cut over only after reconciliation

During clone parity, never silently change user-visible legacy behavior merely because it appears buggy. Record the behavior first. Security, privacy or data-corruption defects may be corrected immediately, but the deviation must be documented as a parity exception. Non-critical product quirks should be preserved until parity is proven or the user explicitly approves a redesign.

## UI visual identity rules

- The existing LMS production palette is the vNext color source of truth.
- Canonical mapping lives in `docs/design-system/lms-color-parity.md` and `src/app/globals.css`.
- Use semantic LMS tokens instead of raw Tailwind zinc/slate/blue palettes for product UI.
- Never accept shadcn default colors as a substitute for the LMS brand palette.
- Do not introduce a new raw UI color without a concrete semantic need and a documented parity decision.
- Treat palette mismatch as an implementation defect in the same batch, not later polish.


## Greenfield data rule

- LMS vNext is a fresh system. No production/legacy LMS data needs to be migrated.
- Do not build legacy DB connections, extractors, reconciliation tooling, migration runners, or data backfills unless the user explicitly changes this decision later.
- The legacy `lms` / `lms2-fe` repositories remain behavior, UX and regression references only.
- New vNext data should be created through vNext application flows, seeds, fixtures, or test factories.
- The existing `legacy_id_map` schema artifact is not an active product dependency and must not be used as justification to restart migration work.


## Legacy account-surface parity — release gate

Until account parity is closed, `42Students/lms2-fe@prod-2026` is the user-facing product oracle for Learner, Faculty, Mentor, College Admin, Super Admin, TPO and HR/Recruiter.

For every legacy page, tab, section, card, modal, action and meaningful workflow:
1. classify the route in `docs/planning/legacy-ui-route-manifest.md` and inventory the user job in `docs/planning/account-surface-parity.md`;
2. open the matching account spec under `docs/parity/` and account for the page's sections, tabs, actions, forms, filters, modals, drawers, states, permissions, responsive behavior and regression coverage;
3. recreate the user-visible capability in vNext before redesigning it away;
4. implement it with the vNext architecture — do not paste legacy Pages Router, Redux, Ant Design or service-layer code;
5. update the master matrix and the detailed page checklist in the same implementation commit;
6. preserve tenant/role safety and add regression coverage where practical;
7. classify intentional deviations explicitly as REDESIGNED or RETIRED with a reason.

No legacy surface may disappear silently. A consolidated vNext workspace does not automatically count as page parity when the legacy product had a distinct daily-use surface. First reach parity; then consolidate/redesign as a separate pass.

Do not call LMS vNext feature-complete while `npm run parity:status` reports PARTIAL, MISSING, VERIFY or BLOCKED rows, while `npm run parity:pages` reports any open detailed checks, or while any account parity checkbox remains open. A master-matrix DONE row is not deeply closed if its corresponding `docs/parity/*.md` contract still has unresolved required behavior. Refresh the frozen legacy route manifest and affected page specs when `lms2-fe/prod-2026` materially moves.




## No-surprise clone protocol — highest parity authority

Read `docs/planning/clone-parity-protocol.md` before account parity work. It is the release gate above the route manifest, master matrix, detailed page specs and account ledgers.

Key rules:
- exact legacy FE/BE SHAs are evidence, not branch names;
- a family-level verification record is required in addition to surface checkboxes;
- when legacy `prod-2026` materially moves, affected family evidence becomes STALE even if individual rows remain historically CLOSED;
- source comparison alone cannot close browser-sensitive UI;
- consumer UI cannot be final-verified if the upstream producer workflow is missing;
- REDESIGNED/RETIRED cannot hide a daily-use feature;
- final cutover freezes exact legacy oracle SHAs and re-diffs every earlier family against that frozen oracle;
- `npm run parity:clone-gate` must report READY: YES before vNext may be called an as-is replacement.

## Learner parity execution ledger — mandatory workflow

For Learner work, `docs/planning/learner-ui-surface-ledger.md` is the operational queue and `docs/planning/learner-family-verification.md` is the freshness/evidence gate above it. It is intentionally more granular than the route manifest or the prose parity spec.

Every coding chat working on Learner parity must:
1. read the ledger before editing;
2. refresh `lms2-fe/prod-2026`, `lms/prod-2026`, and `lms-vnext/main` heads;
3. continue from the first unresolved ledger row unless the user explicitly selects another row/family;
4. compare the exact legacy page/component behavior before coding;
5. add newly discovered UI surfaces to the ledger before implementing them;
6. move a row through `UNCHECKED → AUDITING → GAP → FIXED → CLOSED` as appropriate;
7. mark `CLOSED` only after a second legacy-vNext comparison and required regression/browser verification;
8. update the ledger and affected parity docs in the same commit as the implementation;
9. update the matching family verification row with exact legacy FE/BE SHA, vNext SHA, source/test/browser/cross-role evidence before marking a family VERIFIED;
10. if legacy moved since that family was verified, mark the family STALE and diff old verified SHA → current SHA;
11. hand off the current row ID + next unresolved row when chat context is ending.

Run `npm run parity:learner` for the machine-counted Learner ledger + family-evidence status. `FIXED` is not closed; `BLOCKED` and `STALE` are not release-ready.

## Authentication rule

- Sign-in is **first-party phone/email one-time codes**, as in the legacy LMS: Exotel SMS and ZeptoMail email, opaque per-device sessions. See `docs/architecture/first-party-login.md`.
- Do **not** reintroduce Firebase / Google Identity Platform for sign-in, session cookies or user creation. Older handoff and checklist text that mentions Identity Platform is superseded by this rule.
- A college host serves only that college, enforced at login and on every authenticated request (`src/modules/auth/tenant-access.ts`). Do not bypass it.
- Test one-time codes exist only when `APP_ENV=development` and are never accepted in production. Never send a real SMS or email from tests; use the fakes.
- Production SUPER_ADMIN access needs a second factor before launch (`docs/architecture/privileged-authentication.md`).
