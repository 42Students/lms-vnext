# LMS vNext — Detailed Page Parity Specs

> **Closure-first for every UI/account chat:** The single live execution authority
> is `docs/tracker.json.execution.closureFirstProtocol`, not an open-ended
> re-audit of already accepted pages. Read `AGENTS.md`; run
> `npm run progress -- --closure-next --lane=LNN` when working on shared DB/API
> dependencies. For page parity, pick one OPEN page-family/user-job with
> its original detailed contract, complete its producer→consumer, permissions,
> mobile/negative/browser acceptance, then mark CLOSED in the existing page
> spec with exact evidence and move on. After two passes without a legitimate
> closure, state one reproducible blocker and owner and switch to independent
> eligible OPEN work. Previously CLOSED family/page evidence is frozen unless
> a proven regression or legacy-oracle change demands a scoped recheck.
> A page closure never increments DATABASE N/81; only tracker `done:true`
> accepted DB tasks do.

**Execution priority:** [Final Execution & Domain Closure Protocol](../tracker.json) controls global phase gates. Dependency-ready scoped API/UI user jobs may be implemented during DATABASE without certifying global API/UI. This page-family contract still governs all detailed UI verification.

## Cross-chat master closure operating contract (27 October 2026)

**Canonical entry point:** this README and the eight role/shared specifications linked below. **Do not create a separate chat spreadsheet, duplicate Kanban, or independent percentage of completion.** The official project task and DATABASE/API/UI/RELEASE phase truth remains [`docs/tracker.json`](../tracker.json), validated by `npm run progress`. Detailed UI parity evidence is kept in these page specifications and the existing [account matrix](../planning/account-surface-parity.md), [legacy route inventories](../audit/legacy-inventory-A.md) and [B](../audit/legacy-inventory-B.md). Summary reports are **derived from evidence**, never separately maintained green checkmarks.

### Product direction and source hierarchy

- **Coverage target:** all legitimate user jobs and UI surfaces in the *legacy development product*, plus useful vNext improvements. Use `42Students/lms2-fe@lms-dev-2026` and `42Students/lms@lms-dev-2026` for discovery of the requested development-version feature set. Record the **exact** FE and BE commits read on each page. Existing inventories were generated from older snapshots and are **leads, not proof that the current source was exhaustively inventoried**.
- **Cutover obligation:** the existing [clone-parity protocol](../planning/clone-parity-protocol.md) independently uses production branches as the release oracle. Compare development-only behavior to production before final release. Do not quietly replace that release gate by auditing dev alone.
- **Design authority:** the shared vNext UI kit and an internally coherent, accessible product design. Prototype screenshots are optional references, **not** a demand for pixel reproduction. Never use a visual redesign to silently remove a required workflow.
- **No-loss rule:** old page/route equality is **not** the goal. Preserve 100% of required reachable capabilities, transitions, permissions, bookmarks and outcomes. A legacy surface may become a tab, drawer or integrated workspace only after action/state/deep-link parity is proven. Every extra vNext surface must also be classified as an intentional improvement, redundant candidate, or explicitly approved retirement; don't delete a beneficial improvement just to match counts.
- **Phase boundary:** UI inventory/evidence and dependency-ready scoped domain-local implementation may proceed while DATABASE remains active; the global UI phase and RELEASE still require their independent upstream DB/API and integrated checks. A focused page pass is never a global CI or release pass.

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

### Green-and-move stop rule (binding for page execution)

The project can be exhaustive in discovery **without being endless in acceptance**. A page should be worked to a frozen, finite acceptance contract; chats must not repeatedly invent new requirements to keep one page open. This section clarifies, but does not weaken, the five independent gates above.

**Three achievements, never conflated:**
- **IMPLEMENTATION GREEN = stop functional work on this family and move to the next.** All *required* legacy child surfaces and vNext retained improvements are mapped; their critical/high-impact actions and applicable data, error, permission, cancellation, conflict and cross-role paths have post-change executable evidence; no known P0/P1 issue remains; focused relevant tests pass at the recorded commit. The page may still be VISUAL PENDING and may depend on global phase/release gates. This is the normal "page green" for functional work.
- **DESIGN GREEN = final page-level UI/UX accepted.** Actual desktop/mobile behavior, accessibility and visual composition reviewed using our vNext design system. No prototype pixel-identity requirement; no full functional re-audit unless visual changes touch behavior.
- **RELEASE GREEN = integrated system sign-off.** Global current-commit DB, shared CI, upstream/downstream and deployment gates passed; not inferred from implementation or design green. `docs/tracker.json` is still the authoritative phase/release task tracker.

**Finite contract rule:** A family's first audit must document the **enumerable reachable graph** of sections/tabs/overlays/steps, legacy actions and applicable states, plus named critical scenarios, verification commands and known external prerequisites. Discovery ends when the independently checked legacy route/component/navigation/API closure adds no unexplained reachable nodes; it is *not* an endless effort to invent every imaginable edge case. New P0/P1 legacy/security findings discovered later reopen only the affected requirement. Ideas, optional enhancements and minor P2/P3 polish are recorded as non-blocking design/improvement work; they cannot silently expand a signed-off implementation denominator.

**Priority classification:**
- P0: privacy/security/data corruption; broken required core job; missing indispensable legacy surface; broken producer→consumer contract.
- P1: materially broken legacy interaction, required state, accessibility-critical path, navigation/deep link or persistence/validation.
- P2: noncritical visual consistency, low-impact interaction or copy improvement with safe usable path.
- P3: new ideas, niceties and nonessential enhancements.
- Do not waive P0/P1. If a purported P2 makes a daily task unusable or inaccessible, promote it to P1. Do not substitute a "green" badge for evidence.

**Bounded execution rule:**
1. Audit the chosen family **once** against exact current source SHAs, reconcile existing inventories rather than rebuilding them, and freeze its enumerated required acceptance list. Record no-op findings where already implemented and tested.
2. Do one cohesive implementation/test batch targeting its remaining P0/P1 failures. Run focused acceptance and fix observed failures. Do a **second focused repair round** if needed; do not start another full source audit.
3. If all P0/P1 pass, record IMPLEMENTATION GREEN (with witnesses), **stop working on this page**, and advance in canonical account order. If a P0/P1 is blocked after two focused repair rounds by an external approval, migration, test environment or a deeper dependency, record its reproducible blocker, owner/dependency, attempted fixes and next required event; leave **NOT GREEN / BLOCKED**, and advance to the next **independent eligible** family. More rounds are allowed only for a newly isolated executable fix, not repeated broad re-investigation.
4. Minor P2/P3 issues may remain as explicitly named nonblocking follow-up in the same family section; they do not block IMPLEMENTATION GREEN. They **do** remain visible to the eventual design/release gate if applicable.
5. After a family is green, **never redo its full audit automatically**. On relevant code, schema, role/permission or source-oracle drift, compute the actual file/contract dependency delta and rerun only impacted evidence. If the contract is materially invalidated, mark only affected gate stale; preserve unaffected acceptance witnesses. Full re-audit is reserved for demonstrated systemic inventory failure or explicit instruction.
6. A shared global CI failure **outside this family's affected scope** must be recorded but does not revoke a properly evidenced focused IMPLEMENTATION GREEN. However, no RELEASE GREEN while required global checks are red.

**Evidence receipt to leave behind per family:** permanent ID; old FE/BE and vNext SHAs; required surface/action/state IDs; before→after changes; exact passing/failing commands and URLs; any P0/P1 and external blockers; nonblocking P2/P3; `implementationGreen`/ `designGreen` gates with evidence; last material change; **next independently executable action**. These facts belong within the **existing family specification**, not a new chat-owned tracker. Checkbox completion must represent executed evidence, not authored expectations.

### Deterministic continuation, even with a context-free new chat

A new conversation may contain only "continue LMS vNext works." The assistant should not depend on earlier assistant prose or pretend to know another chat's live in-flight work:

1. Read fresh GitHub `AGENTS.md`, `docs/tracker.json` and this page, then current FE/BE/vNext heads, targeted family specifications and actual accepted test evidence.
2. **If the conversation or user names an account/page**, resume its not-yet-implementation-green family; if green, advance to the next eligible family in that account's existing spec order. Do not restart green pages.
3. **Without a named scope**, prioritize the earliest unsatisfied prerequisite in the **current phase** of `docs/tracker.json`; consult dependencies and the existing closure-first strategy. Do not invent which unrelated Faculty/TPO page another chat meant. When UI execution is eligible, select the earliest not-green, not-blocked ready family in canonical role/spec order; prefer finishing an existing executable P0/P1 before opening a new family.
4. Before writing, verify whether another recently landed commit already fixed the exact gap; fetch the latest blob SHA, avoid overwriting competing account work, and keep a single writer for shared files/migrations. If two independent chats receive the same generic instruction concurrently, they may select the same task: **generic wording cannot provide safe multi-chat locking**. For parallel lanes, scope chats explicitly (e.g., "Continue LMS vNext — Faculty" and "Continue LMS vNext — TPO"), one active implementation writer per overlapping family.
5. Make a real code/test change and record its evidence in GitHub, or report the concrete blocker and the next independent family. Never spend a new chat reproducing already committed research. If the tools/repositories are unavailable, say so rather than inventing a continuation or a green count.

**Existing tooling caveat:** `npm run parity:pages` currently counts Markdown checkboxes in the eight **top-level** `docs/parity/*.md` role files. If page-family specifications are split into `docs/parity/pages/**`, update and test the generator to include them **exactly once** before relying on its totals. It is a checklist count, **not** independent runtime acceptance, account-wide green certification or release readiness.

### Machine-validated page closure and cross-chat continuation

**Finite units:** Course Detail, Project Detail and multi-tab workspaces are split into child acceptance units when their specifications contain explicit section/tab/view headings. A shared page header with required checklist actions becomes its own `shared-shell` unit. This prevents a large workspace from trapping one chat for the entire account.

**Historical deduplication:** repeated documentation headings for the same account/page are reconciled as one family, with all their checklist requirements retained. Workspace sections, reports, tabs and standalone pages have distinct IDs. This is a derived documentation index, not a verified full legacy source reachability census.

The read-only `scripts/page-closure.mjs` discovers page families from the **existing eight account specifications**. It never updates `docs/tracker.json` (which remains the sole official project task/phase tracker), nor does it infer green from old `[x]` checkboxes or historic DONE prose.

```bash
npm run parity:closure                    # all-account page-family overview
npm run parity:closure:check              # invalid receipts fail
npm run parity:closure -- --next          # select official phase task
npm run parity:closure -- --next --account faculty
npm run parity:closure -- --json          # inspect individual families
npm run test:parity:closure               # false-green and resume regressions
```

To mark a page **Implementation Green**, insert a `<!-- page-closure` JSON block ending with `-->` *inside the existing page-family section*. Its ID equals `<account>:<heading-slug>` (inspect `--json`); `implementation.status` is `open`, `blocked` (with named `blockers`) or `green`. Green demands no unchecked family checkboxes, full FE/BE/vNext commit SHAs, `inventoryComplete: true`, `unmappedRequired: 0`, `openP0P1: 0`, unique named `surfaces`, `actions`, and `states`, and passing current-vNext-SHA `functional`, `authorization`, `browser-desktop`, and `browser-mobile` GitHub Actions evidence. An intentional user-visible redesign or retirement also requires `approvalUrl`. Other relevant DB/storage/cross-role acceptance gates remain mandatory.

Example of a **blocked** family (not a green claim):

```html
<!-- page-closure
{"id":"faculty:attendance","implementation":{"status":"blocked","blockers":["Exact unavailable dependency and failed test reference"]}}
-->
```

The CLI validates **receipt structure**, not live GitHub Actions truth. Independent reviewers still verify run conclusions/commit SHAs and domain-specific persistence tests. Design and Release Green are separately evidenced and never inferred from Implementation Green. `--next` skips explicitly blocked pages rather than redoing their audit. Bare checked Markdown is *unverified* until a verified receipt is added.

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
