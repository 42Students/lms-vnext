# LMS vNext — Legacy Capability & UI-Surface Parity Standard

**Effective:** 2026-11-03  
**Decision:** User-approved change in acceptance strategy. **Complete what the old LMS can do; do not rebuild its pixels.**  
**Audience:** Every vNext implementation, audit, test and release contributor.  
**Priority:** This standard controls UI/UX acceptance when older screenshots, prototype notes, pixel-parity plans or historical style checklists disagree. It supplements—not weakens—the functional, API, DB, security and freshness gates in `docs/planning/clone-parity-protocol.md` and `AGENTS.md`.  
**Official progress source:** `docs/tracker.json`; existing account matrix, per-page specs and family evidence records remain the supporting registers. **Do not create a new competing tracker.**

## 1. North star

> A person using vNext must be able to complete **every required, legitimate old-LMS user job**, using the right permissions, data, steps, states and business outcomes. vNext is free to provide that experience through clearer, more accessible and more modern UI. No required old-LMS surface or action may be silently omitted.

Priorities, in order:
1. **Complete and correct capabilities:** routes, navigation reachability, controls, forms, dialogs, drawers, tables, states, exports, jobs, notifications, and their end-to-end effects.
2. **Security and correctness:** explicit role/tenant/module gates, negative authorization, input validation, transactionality, auditability, privacy, concurrency, correct producer/consumer links.
3. **Usability and accessibility:** intelligible flows, keyboard/focus behavior, responsive layout, readable text, no clipped elements, clear status/error/retry feedback.
4. **Visual quality and brand consistency:** use the existing vNext component system and LMS semantic palette; improve UI/UX deliberately later, after capability completeness.
5. **Legacy visual similarity:** an optional diagnostic/reference only, **never the acceptance score**.

A vNext control may be placed in a different tab, drawer, inline panel or consolidated workspace if it is clearly discoverable, fully usable, correctly authorized and preserves the old outcome. **Exact fonts, colors, spacing, card density, sidebar width, geometry, labels where semantic equivalents are clear, or raw pixel ratio are not mandatory parity gates.** Content wording that conveys contractual instructions, legal implications or distinct business states does remain a behavioral requirement.

## 2. Source-of-truth hierarchy

| Question | Primary evidence | Cross-check |
| --- | --- | --- |
| What jobs/surfaces exist in old LMS? | Pinned old FE `42Students/lms2-fe@prod-2026` navigation, routes, components, conditional UI, frontend API calls | `parity-baseline` screenshots and coverage JSON |
| What does each action actually do? | Pinned legacy BE `42Students/lms@prod-2026` controllers/services, persistence, notification effects | old FE calls, old tests and real workflows |
| Does vNext cover it? | Actual current vNext page/action/controller/service implementation | browser tests, API integration, tenant/role tests, upstream/downstream outcomes |
| Where is the closure recorded? | `docs/tracker.json` tasks, existing `docs/planning/account-surface-parity.md` / `docs/parity/*.md` / existing family verification files | executed exact-SHA evidence |
| How should vNext look? | Existing vNext UI kit, accessibility, responsive behavior and semantic brand tokens | old screenshots as a way to spot omissions, **not** a visual template |

Use frozen exact old FE, old BE and vNext commit SHAs in acceptance evidence. If the old oracle moves, diff it and invalidate only affected family verification as prescribed by the existing clone protocol.

## 3. How to use the 3,169 captured screenshots

The detached `parity-baseline` branch contains **3,169 images** organized into **783 packages** across captured account groups. Those numbers are an **evidence inventory**, not a promise that there are 783 independently missing pages or 3,169 acceptance cases. Some image states are blank, load-failed, duplicated or unmatched; Recruiter/HR and Super Admin do not have a complete dedicated screenshot pack. Course Coordinator captures exist on the legacy side but not paired on vNext.

For each package:
1. Open every old screenshot and list **distinct UI surfaces**: screen, section, tab, card, primary/secondary action, filter, search, export, upload, modal, drawer, confirmation, status indicator and error/loading/empty state.
2. Identify what **action** each visible affordance enables. Trace the old frontend handler, called API and old backend rules. Screenshots alone **cannot** prove the effect or authorization.
3. Check the corresponding vNext route/workspace, including redirects, aliased routes, menus, responsive states and role/module gates.
4. Mark each required surface/operation **PRESENT_AND_VERIFIED, MISSING, PARTIAL, RELOCATED_EQUIVALENT, BLOCKED, RETIRED_APPROVED, or NOT_A_PRODUCT_SURFACE**, with exact source and evidence. Existing register status vocabularies remain authoritative; translate classifications into their current statuses rather than changing schemas arbitrarily.
5. If missing or partial, implement the **minimum complete working capability**. If relocated, add a discoverability path (navigation/menu/link or documented intentional flow) when needed; a hidden unreachable feature does not count.
6. Verify the real click → request → authorization → persistence/side effect → visible outcome, and negative/error conditions. Then close the existing ledger item and update family evidence.
7. Use overlay/pixel diff only to **notice overlooked controls or clipping**, never to decide pass/fail from raw pixel count.

A valid screenshot is one clue, not a substitute for route/source census. Audit source for conditional menus, multi-step actions, hidden detail routes, role branches, permissions, read-only states and post-save transitions the capture missed.

### Screenshots: keep, but demote
- Preserve `parity-baseline/old`, `parity-baseline/vnext`, `packages/*`, `summary.json`, and original capture metadata exactly as recorded.
- Keep merged comparison scripts and old screenshot evidence; they are useful for spotting missing sections, regressions and broken layouts.
- **Stop:** optimizing 0.5% thresholds, individual CSS coordinates, exact icon glyphs and screenshots that differ only because vNext offers a better interface.
- **Continue:** accessibility, correctness, component consistency, missing visible controls, responsiveness, layout clipping and legibility.
- Do not erase past pixel parity work; mark its documentation as **superseded visual policy** so evidence remains explainable.

## 4. Canonical coverage model

A **route** is not a capability; a **screenshot** is not a route; a **button** is not proven functional merely because it renders. Use the most granular meaningful **user-visible surface/action + behavior** in the existing account spec.

For each requirement, capture:
- account/role and module permission; old route/page/state and vNext equivalent route/page/state;
- old FE source path and exact SHA, relevant old BE handler and SHA;
- screenshot/package refs where available;
- display affordance and keyboard/mobile reachability;
- **business operation:** read, create, edit, delete, approve, submit, upload, download, send, export, schedule, etc.;
- input/validation, permission/tenant restrictions, resulting status/persistence/side effect;
- empty/loading/error/forbidden/stale/large-data states as relevant;
- upstream producer and downstream consumer when applicable;
- verification artifact: test command/run, affected exact SHA, browser/API evidence, negative case;
- classification, rationale for redesigned equivalent or explicit approval for retirement.

A consolidated page can satisfy multiple old routes. For each legacy user job, show a discoverable vNext entry point, equivalent inputs, outcome and state. **Do not add extra pages simply to imitate old paths.**

### Illustrative classification (not actual audited findings)

| Old surface | vNext candidate | Decision | Evidence required |
| --- | --- | --- | --- |
| Compact Meetings list | Modern Meetings workspace | RELOCATED_EQUIVALENT if all records/actions/reachability exist | role-gated populated/empty browser cases |
| Reschedule confirmation | No available vNext action | MISSING | implement and test authorized write + audit + conflict behavior |
| Export applicants | Different export button | PRESENT_AND_VERIFIED if same scope/privacy/csv data | download assertion + negative permission |
| Old animation or 1px divider | Different vNext styling | NOT_A_PRODUCT_SURFACE | no feature closure; optional UX check |
| Security-unsafe legacy shortcut | Safe verified vNext workflow | REDESIGNED_EQUIVALENT with documented safety rationale | authorization and successful lawful job completion |

## 5. Closure evidence: **functionality over appearance**

**A single surface/action is CLOSED only if:**
1. Its old purpose and cases were reconstructed from old FE + where applicable BE source.
2. The vNext entry point is discoverable by the right account/module.
3. Real vNext UI and/or API performs the required operation with equivalent scope and business outcome.
4. Correct and incorrect inputs, permissions and tenant boundaries were exercised when relevant.
5. Empty/loading/error/retry/disabled/permission-denied and responsive/keyboard states were checked where applicable.
6. Producer→consumer flows were actually exercised or explicitly remain blocking to family-level acceptance.
7. The existing account spec/ledger and evidence record cite the exact tested commits and executed tests.

**FIXED is not CLOSED:** a present button, code commit, passing source grep or authored unit test is insufficient by itself for an interactive workflow.

**A family is VERIFIED only if:** all required constituent surface actions are closed; old FE/BE and vNext SHAs are fresh; representative desktop and mobile browser work was executed; producer and consumer are coherent; no unapproved retirement or blocked gate remains. `npm run parity:clone-gate` READY: YES is still required for final as-is replacement, but must be interpreted as **capability parity**, not visual fidelity.

### Status accounting without invented percentages

Report separately:
- legacy source routes **classified / discovered**;
- unique functional surfaces **discovered / required / VERIFIED / PARTIAL / MISSING / BLOCKED / RETIRED_APPROVED**;
- user jobs/operations **verified / required**, including role/tenant negative cases;
- family verification **fresh VERIFIED / total** and stale families;
- current tester SHA and passing/failing command/run links;
- known uncaptured or unresolved routes/states.

**Never report** 783 packages as 783 missing features. Do not report a feature-parity percentage before the complete source-backed denominator exists. No global “all green” claim while the old route oracle or any required family evidence is stale.

## 6. Fast, closure-first execution

The aim is to close **complete user jobs** quickly, not maximize CSS commits or volume of screenshots.

1. Run `npm run progress -- --closure-next` and inspect `docs/tracker.json`, current route manifest, account matrix, page spec and family record. Preserve existing global DB/API/UI/release gates.
2. Pick the smallest P0/P1 **missing or broken action with a runnable test environment**, not the page with the most obvious color differences.
3. Read only the relevant legacy FE component + API handler + BE rule, and the candidate vNext code. Limit audit to that family; add any newly discovered actions before implementing.
4. Implement one coherent vertical slice: discoverable UI affordance → API/service → persistence/side effect → response/UX states → authorization/negative tests → producer/consumer test if applicable.
5. Run focused, real tests. If tests pass and source freshness is satisfied, update existing closure records and integrate. A passing browser visual capture can help prove **surface existence**, without any pixel threshold.
6. After two substantive passes blocked by unrelated infrastructure, record exactly what is missing and move to another independent open surface. Do not silently waive a required gate or spin on the same screenshot.
7. Prefer shared functionality fixes that eliminate gaps across several accounts, but do not let broad refactors block ready small closures. Coordinate overlapping files against latest `main`.
8. Reserve broad visual redesign and cosmetic cleanup for a distinct later UX stage; fix severe clipping/overlap/inaccessible controls immediately as real usability defects.

### Priorities
**P0** missing required daily job, action falsely claims success, authorization/tenant/privacy defect, broken primary navigation, missing critical write/consumer flow.  
**P1** missing old filter/export/modal/confirmation/state, important partial workflow, permission/module behavior mismatch.  
**P2** usability/accessibility/error handling that blocks specific users or cases, weak discoverability or content hierarchy.  
**P3** aesthetic differences (radius, exact spacing, density, icon style, pixel ratio). **P3 is not a parity release blocker** unless it creates clipping, unreadable information or inability to act.

## 7. Account and workflow scope

Cover all currently deployed or supported account and module combinations. The existing production protocol names **Learner, Faculty, Mentor, College Admin, Super Admin, TPO, HR/Recruiter**. Other approved roles, including Course Coordinator/Global TPO if implemented for the target deployment, must be handled in the account/role source census rather than inferred from screenshot folder names.

Cross-role flows to verify explicitly:
- Faculty/Admin content publish → Learner visibility/attempt/submission → grade/result/history.
- College/Admin course/semester/team/attendance authoring → Learner and Faculty consumption.
- TPO/HR company, drive, application, shortlist, interview, offer, feedback, messaging → authorized recipients.
- Admin/Mentor project/team/sprint/task/meeting/final-delivery creation and review → Learner workflows.
- Learner profile/verification request → authorized reviewer → visible decision.
- File uploads/private downloads, notification delivery/deep links, exports and audit history.

Do not declare a consumer page complete solely from static seeded cards if its real authoring workflow is absent.

## 8. Existing work reconciliation (effective immediately)

1. **Keep merged PR #216:** baseline inventory, image diff, capture tests and runbook remain optional diagnostics. Its CI reference-integrity gate is not a feature-completeness gate.
2. **Do not revert merged PR #217 blindly.** Audit its Mentor Meetings default list, collapsed navigation, layout disclosure and state reachability for any lost/hidden functionality. A layout regression with no feature benefit should be repaired or redesigned independently, not blindly cloned.
3. **Review open PR #218 before merge.** It primarily imitates old Assignments visuals and nests vNext filters/metrics in a disclosure; under this decision, a purely cosmetic clone is **not a required parity fix**. Retain only demonstrated missing user capabilities, broken workflows or genuine accessibility/overflow fixes. Preserve equivalent or better vNext default UX. Close/supersede the cosmetic PR if no functional gap is proven.
4. **Stop requesting pixel thresholds as blockers.** Mentor's measured 26.06% difference is historical diagnostic data, not “26.06% unfinished” or a reason to keep a working page open.
5. Continue the existing DB/API/role parity work without changing accepted items. Do not reset or erase evidence.

## 9. Mandatory independent audit before account release

Three passes on each family:
1. **Completeness pass:** every legacy route, surface, action, modal, state and conditional role branch accounted for; blind screenshots cross-checked against source.
2. **Behavior and security pass:** real positive/negative actions, validation, tenant/module permission, side effects, persisted state, audit/logging, producer/consumer verified.
3. **Usability and regression pass:** desktop/mobile/keyboard reachability, failure handling, no hidden or clipped actions, no regression across roles, tested exact-SHA evidence.

A family is not complete merely because one screenshot looks close or because its new interface is nicer.

## 10. References and supersession

- **Active:** `docs/planning/clone-parity-protocol.md`, `docs/tracker.json`, `docs/planning/account-surface-parity.md`, `docs/planning/legacy-ui-route-manifest.md`, account `docs/parity/*.md` specs, family verification records and this standard.
- **Historical visual references, not governing acceptance:** `docs/design/ui-clone-checklist.md`, `docs/design/vnext-vs-old-lms-gap.md`, legacy design measurements, detached `parity-baseline/PIXEL_PARITY_MASTER_PLAN.md`.
- **Screenshot pack:** `parity-baseline` remains a read-only reference set. The original images and packages must never be discarded or silently overwritten.
- **Automated checks:** `npm run parity:status`, `npm run parity:pages`, `npm run parity:clone-gate`, `npm run progress -- --closure-next`; focused source, API, PostgreSQL and Playwright tests as demanded by a selected action.

**Rule of thumb:** If the old LMS has an action vNext cannot perform, fix it. If vNext performs the action correctly but looks different, keep it. If vNext hides or breaks the action despite looking nicer, fix its discoverability or behavior. Close with evidence, not screenshots.
