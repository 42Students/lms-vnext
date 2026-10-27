# LMS vNext — Detailed Page Parity Specs

## Cross-chat master closure operating contract (27 October 2026)

**Canonical entry point:** this README and the eight role/shared specifications linked below. **Do not create a separate chat spreadsheet, duplicate Kanban, or independent percentage of completion.** The official project task and DATABASE/API/UI/RELEASE phase truth remains [`docs/tracker.json`](../tracker.json), validated by `npm run progress`. Detailed UI parity evidence is kept in these page specifications and the existing [account matrix](../planning/account-surface-parity.md), [legacy route inventories](../audit/legacy-inventory-A.md) and [B](../audit/legacy-inventory-B.md). Summary reports are **derived from evidence**, never separately maintained green checkmarks.

### Product direction and source hierarchy

- **Coverage target:** all legitimate user jobs and UI surfaces in the *legacy development product*, plus useful vNext improvements. Use `42Students/lms2-fe@lms-dev-2026` and `42Students/lms@lms-dev-2026` for discovery of the requested development-version feature set. Record the **exact** FE and BE commits read on each page. Existing inventories were generated from older snapshots and are **leads, not proof that the current source was exhaustively inventoried**.
- **Cutover obligation:** the existing [clone-parity protocol](../planning/clone-parity-protocol.md) independently uses production branches as the release oracle. Compare development-only behavior to production before final release. Do not quietly replace that release gate by auditing dev alone.
- **Design authority:** the shared vNext UI kit and an internally coherent, accessible product design. Prototype screenshots are optional references, **not** a demand for pixel reproduction. Never use a visual redesign to silently remove a required workflow.
- **No-loss rule:** old page/route equality is **not** the goal. Preserve 100% of required reachable capabilities, transitions, permissions, bookmarks and outcomes. A legacy surface may become a tab, drawer or integrated workspace only after action/state/deep-link parity is proven. Every extra vNext surface must also be classified as an intentional improvement, redundant candidate, or explicitly approved retirement; don't delete a beneficial improvement just to match counts.
- **Phase boundary:** UI inventory/evidence may be prepared while DATABASE gates remain open; the global UI phase and release are **not** certified until the required upstream DB/API and integrated checks pass. A focused page pass is never a global CI or release pass.

### The hierarchy: discover → map → prove

| Level | Unit | Closure meaning |
| --- | --- | --- |
| Account | Learner, Faculty, Mentor, College Admin, Super Admin, TPO, Recruiter/HR; shared/public/operational cross-role group | Every reachable child journey mapped; shared and producer→consumer contracts proved |
| Page family | Stable user job / navigation destination, not necessarily one `page.tsx` | All child surfaces, actions, state contracts, responsive paths and page evidence complete |
| Surface | Full page, subpage/tab, modal, drawer, wizard step, dropdown/popover, command palette, inline editor, upload/viewer, confirmation or meaningful responsive-only screen | Every discoverable opening trigger and close path recorded; no orphaned legacy surface |
| Action | CTA, filter, search, sort, pagination, bulk operation, CRUD, submit, export, notification/deep link, destructive transition | Authorized behavior, persistence/side effects and negative paths verified |
| State / scenario | Default, first-run/empty, populated, large data, filtered-empty, loading, partial/stale, failed/retry, validation, success, conflict/unknown outcome, unauthorized/read-only, past/future, mobile | Applicable states executed with deterministic fixtures; nonapplicable states explicitly justified |

Do not inflate the page denominator by counting each row, component, transient toast, or screenshot as a separate route. **Count page families, child surfaces, actions and scenarios separately** and link them by stable IDs. Do not demand a meaningless Cartesian product of every state × every control; use explicit critical-path and risk-based combinations, with full negative testing for write/privacy/security paths.

### Stable page contract — required for *every* page before acceptance

Keep the following data within the appropriate `docs/parity/<account>.md` section. If a family needs its own file for safe multi-chat edits, place it at `docs/parity/pages/<account>/<stable-page-id>.md` and link it **from the account specification**; move ownership of its detailed checks rather than copy them to a second tracker. Never silently replace legacy audit findings.

| Contract field | Required contents |
| --- | --- |
| Identity | Permanent ID, role(s), parent page, entry points, legacy routes and vNext destination(s), tab/query/deep-link variants |
| Source | Exact legacy FE SHA, BE SHA and files, imports, nav/guard sources, old service/backend/API state contract; vNext SHA/files |
| Surface graph | Every tab, overlay, editor, popover, confirmation, wizard, viewer, global-shell context, mobile variant; trigger → close/back and destination |
| Actions | Every observable control, including failure/cancel/undo/redo/bulk/keyboard and hidden or conditional actions; actual business and API consequences |
| State contract | Applicable default/empty/pending/loaded/error/retry/stale/invalid/conflict/permission/time/feature-disabled states with scoped fixture IDs |
| Authorization and data | Roles, college/tenant, section/delivery scope, disabled modes, privacy, pagination limits, storage and migrations |
| Cross-role dependencies | Real upstream data creator and downstream reader; sender/receiver or authoring/consumption acceptance |
| Parity disposition | Matched, missing, enhanced, proposed consolidation or retirement; rationale and **explicit approval** for changed user-visible capability |
| Evidence | Code commit SHA, commands and test paths, exact passed/failed run/job URLs, DB/readback, desktop/mobile browser proof, UX evidence and exceptions |
| Next action | One concrete failing or unchecked requirement, not a guessed percentage or vague “polish” |

Every contract should assign stable child IDs (example: `FAC-BLUEPRINT/SURF-ADD-CONTENT`, `.../ACT-PUBLISH`, `.../STATE-CONFLICT`) and link their test witnesses. A surface or action discovered later is added to the **same family**, even if the parent page was previously considered complete. Historical “DONE”, “MAPPED”, “VERIFIED”, a passing unit suite, or a green prototype screenshot suite **must not be imported as new acceptance automatically**.

### Closure gate (five independent facts, never collapsed into a single misleading green)

| Gate | Acceptance evidence |
| --- | --- |
| Inventory closed | Current exact-SHA legacy routes, component reachability, navigation, overlays and states reconciled; every old surface has a vNext destination/disposition and every relevant vNext extra is explained |
| Functional closed | Required actions, persistence, validation, RBAC/tenant/privacy, retry/conflict/unknown outcomes, bookmarks and cross-role flows execute on a disposable test database |
| UX closed | Self-designed workflow is understandable, navigable, keyboard-accessible; focus/history/overlay behavior and empty/error copy verified |
| Visual closed | Captured actual vNext desktop/mobile renders inspected for responsiveness, density, legibility, consistency and the vNext design system; prototype pixel equality **not** required |
| Integrated/release closed | Current-commit related tests, migrations, storage/outbound preconditions, shared shell and dependent account regressions pass; final frozen-oracle, project phase and release gates are satisfied |

**A page is fully CLOSED only when every applicable gate above has evidence.** It may be called *functionally verified, visual pending* while working through the functional wave, but must never be called fully closed. If vNext/legacy dependencies change materially after a verification SHA, mark the affected proof **STALE** and re-run—not green by inheritance. Do not check a source-only item or an authored-but-unrun test.

### Discovery must be bidirectional

1. From the **legacy FE**, enumerate route files, redirects, sidebar/header menus, conditional role/module guards, imported components, tab/query modes, portal-rendered modals/drawers, shared-shell launchers, and browser/mobile variants. Follow each click path and dynamic/deep-linked destination, not route files alone.
2. From the **legacy BE**, trace invoked services, rules, status transitions, permissions, persistence, files, audits, notifications and side effects. Identify upstream creators and downstream consumers across accounts.
3. From **current vNext**, enumerate the corresponding route/component graph, already-better capabilities and extras. Build a mapping many→one/one→many where appropriate, record unresolved deltas and avoid count-only “parity”.
4. Reconcile against prior material: [A](../audit/legacy-inventory-A.md), [B](../audit/legacy-inventory-B.md), [master matrix](../planning/account-surface-parity.md), [adversarial findings](../audit/pages), existing tests and screenshots. Treat static findings and older checkmarks as leads until freshly confirmed.
5. Verify with seeded real browser/DB journeys, failed/empty/role-disabled states, destructive operation recovery and mobile/keyboard operation. Every family must name exact source/test revision and any unverified external prerequisite.

**Completeness invariants:** zero unexplained legacy reachability nodes, zero unclassified vNext additions, zero hidden or orphaned overlay triggers, zero untested critical actions, zero unresolved required cross-role links, zero missing acceptance evidence for a claimed closed page.

### Multi-chat contract (all chats read this before touching a page)

- Start from the current `main`, read `AGENTS.md`, `docs/tracker.json`, this README, the target role specification and any family file. Check current FE/BE/vNext SHAs. Current branch names alone are not stable oracle citations.
- Pick **one stable family ID** and a concrete before→after outcome. Different chats may work on different page families; avoid simultaneous edits to the same family, shared components or migration/schema/CI files without coordinating the actual write.
- Preserve the existing cross-account page inventory, but do not assume a route named differently is a missing capability or that matching route names prove parity.
- Commit page implementation, relevant tests and **that page's own evidence/checkbox changes together** to fresh `main` using optimistic blob SHA checks. No force-push. Reconcile conflicting edits before retrying.
- The next chat recovers status **from GitHub files and exact executed evidence**, not the previous chat's prose. Handoff should identify account/family ID, last verified SHAs, touched code/tests, what truly passed, remaining child IDs, blockers, external dependencies and the single next actionable defect.
- Do not mutate `docs/tracker.json` merely because a page is visually or functionally improved; project tasks follow their own acceptance contract. Rollups and percentages must be **generated from current detailed evidence**, not copied from historical matrix headers.

### Practical start order

First do a **one-time global census** of legacy dev accounts and their reachable page/overlay graph, reconciling inventories A/B and all eight detailed role specs; record incompletes rather than asserting that static scans exhaust everything. Then use **Faculty Today** as the first full contract pilot (without chasing its PNG), validate that every needed child surface/state is representable, and proceed one page family at a time through Faculty and the other roles. Complete the cross-role producer/consumer joins, integrated acceptance and independent UX/visual work; derive account/global completion only from those leaf records.

---

**Purpose:** make it impossible to finish a route while silently missing sections, actions, forms, filters, modals, drawers, states or role/tenant behavior.

**Legacy oracle:** `42Students/lms2-fe@prod-2026`  
**Frozen baseline for this audit:** `38cdd38e592a6f416c8e8e99ce36438f548ed577`

**Freshness warning:** this page-spec inventory was created against FE `38cdd38e592a6f416c8e8e99ce36438f548ed577`. Current observed FE is `008d113ddd9f515df65ae7fe90dba360938314f6`; use `docs/planning/clone-parity-protocol.md` and family evidence records before treating any checked item as final cutover proof.

The master route/surface matrix is `docs/planning/account-surface-parity.md`. These files are the **second level of truth** beneath it.

## Files

- `learner.md`
- `faculty.md`
- `mentor.md`
- `college-admin.md`
- `super-admin.md`
- `tpo.md`
- `hr.md`
- `shared-public-ops.md`

## Rule for closing a page

A master-matrix row may not be considered deeply closed until its page spec has accounted for:

1. destination / navigation / deep links;
2. all visible sections, tabs, cards and KPI/summary blocks;
3. primary and secondary actions;
4. forms and validation;
5. modals, drawers, popovers and confirmation flows;
6. filters, search, sort, pagination and URL-state behavior;
7. loading, empty, partial-data, stale-data and error states;
8. permissions, role fences, tenant/college scope and read-only states;
9. destructive-action consequences and audit/history where applicable;
10. responsive/mobile behavior that changes the user workflow;
11. regression coverage;
12. upstream producer → consumer workflow dependency;
13. browser history/session/local-storage/polling behavior where used;
14. file/private-document behavior;
15. exact legacy FE/BE SHA evidence plus desktop/mobile verification where required.

Each closure item uses a markdown checkbox. Run:

```bash
npm run parity:pages
npm run parity:pages -- --json
```

A page is not complete because its route renders. A page is only release-valid when every required checkbox is checked **and** its family evidence is VERIFIED against the current/frozen oracle. REDESIGNED/RETIRED decisions must satisfy the no-surprise protocol and cannot silently remove a daily-use feature.

## Implementation discipline

- Re-open the exact legacy route/component before implementing that page; these specs are an audited map, not a substitute for reading source.
- Update the relevant page spec in the **same commit** that closes an item.
- Do not check a box for code that exists but has not been compared against the legacy user job.
- Do not check a box for authored tests if they did not actually run.
- If legacy `prod-2026` moves materially, update the route manifest, master matrix and affected page specs before unrelated parity work.


## Initial audit baseline

At creation, these eight account/shared specs contained:

- **1,517 total detailed closure checks**
- **9 evidence-backed checked items**
- **1,508 deliberately open checks**

This is an **audit workload**, not an implementation-completion percentage. Much of vNext already exists in consolidated workspaces; an item remains unchecked until the exact legacy user job has been compared and proven.

Final page parity requires `npm run parity:pages` to report zero open checks.
