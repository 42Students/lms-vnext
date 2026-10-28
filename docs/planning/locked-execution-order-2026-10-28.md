# LMS vNext — LOCKED execution order (owner directive, 28 October 2026)

> **Binding priority policy for every new vNext chat and implementation pass.** Do not invent a new sequence, start over on already-audited pages, or treat historical progress labels as acceptance. Change this order only on an explicit new user decision, recorded in a reviewed commit. This document defines **priority and phase gates**, not a second task tracker. The sole source of task/phase status remains [`docs/tracker.json`](../tracker.json), and the existing [closure-first delivery strategy](closure-first-delivery-strategy.md) governs how each engineering batch is executed.

## The short answer — strict order

1. **DATABASE GREEN:** finish required PostgreSQL, identity/tenant, schema/domain and persistence work and certify all DATABASE gates.
2. **API / USER-JOB GREEN:** close all required backend operations and real cross-role producer-to-consumer workflows against the old LMS.
3. **UI IMPLEMENTATION GREEN:** audit/compare/fix/verify each finite page family, including every reachable tab, overlay, action and meaningful state. Stop functional work when evidenced and move to the next.
4. **DESIGN GREEN:** one deliberate application-wide UX, accessibility, responsiveness, consistency and visual-quality pass with the existing vNext UI kit.
5. **RELEASE GREEN:** current-SHA integrated regression, providers, security, recovery, rollout and frozen production-oracle parity/cutover sign-off.

**Discovery is a supporting prerequisite, not an extra release phase.** Reuse the completed legacy source and vNext inventories now to establish API and UI requirements. Perform narrow fresh-source checks only when uncovered reachable code, dynamic imports, new user behavior or source drift warrants it. Do **not** repeat the previous 313-route / 484-distinct-import-source census wholesale. A zero static import frontier is not a claim that all UI behaviors have been accepted.

## Execution sequence and stop conditions

### Step 1 — Database: close upstream, then downstream, then certify

**1A. DB-004 identity/tenant release acceptance.** Technical field evidence presently maps all 195/195 source fields; this is not `DB-004.done=true`. Finish authentic server-side verification integration as required, secure provider/negative tests, the seven explicit owner decisions, 34 retirement approvals, and any approved retention/identity-policy disposition. Never auto-approve an owner decision. Validate the exact SHA in disposable PostgreSQL. Work with the existing `docs/planning/db004-closure-decision-register.json` instead of creating another ledger.

**1B. If DB-004's next action depends on an unavailable external approval, do not stall engineering.** Record the blocked exact gate and proceed with the first independent, dependency-safe **DB-005 academic parent** integration, then **DB-007 profile/private-document parents**, while preserving DB-004 as NOT DONE. Do not mark an upstream task or phase green by inference.

**1C. Activate downstream persisted contracts** in dependency order: **DB-008 courses/content**, **DB-012 placement/TPO/recruiter persistence**, plus any needed intermediate DB-006/DB-007/DB-008/DB-009/DB-010 families, tenant FK, privacy, history, uniqueness, and concurrency guards. Follow actual code dependencies over numeric IDs; `DB-008` names the tracker task for legacy DB05, not the legacy domain number. No staged SQL is accepted as a registered migration.

**1D. Final database certification:** close **DB-019 active-field disposition**, **DB-020 drift/registered migration/phase-gate review**, and *every other required* open DATABASE task (not just the original eleven). Require fresh registered Drizzle migration journal replay, negative tenant/FK/race tests and the full database gate. Check `docs/tracker.json` for accepted closure, rather than interpreting 195/195 fields or a green isolated workflow as the whole phase.

**Greenfield rule:** `AGENTS.md` explicitly says vNext has **no legacy production data import**. Some historical DB-004 notes demand historical source-ID/timestamp import receipts. Treat this as an **unresolved policy conflict to disposition explicitly with the required owners**, not permission to connect to or migrate the old production database. Use synthetic fixtures/source-schema mappings for parity; actual historical import/backfill requires a new explicit user authorization. Record a formally approved not-applicable decision where appropriate; never fabricate receipts.

### Step 2 — API and whole-workflow functional parity

Begin **global API parity certification only after DATABASE phase sign-off**. Use `lms2-fe@lms-dev-2026` and `lms@lms-dev-2026` as the **discovery/functional reference** at exact pinned SHAs; freeze/reconcile `prod-2026` separately for final release parity.

Execute producer-to-consumer journeys, prioritizing dependencies:
1. First-party sign-in, sessions, roles, tenant selection and provisioning (Super Admin → College Admin).
2. Academic setup, people, courses and assignments (College/Admin → Faculty → Learner).
3. Projects and mentoring (administrators/faculty → Mentor → Learner).
4. Placements and recruiting (TPO → Recruiter/HR → Learner; shared company, offers and notifications).
5. Shared public/operational actions and cross-domain exceptions.

For each required action, prove correct authorization, persisted records/readback, errors, cancellation/retry, conflict/race and cross-role side effects. Use the old API/controller code for semantics, not as a mandate to port Java classes. An existing vNext feature that is safer/better remains unless it breaks required legacy outcomes.

### Step 3 — Surface-by-surface UI Implementation Green

**Discovery first; code comparison second; focused repair/testing third.** The original page-count and the old 99.8% gap register are historical *leads*, not an exhaustive or current UI-Green denominator. The October 27 finite Green-and-Move protocol in [`docs/parity/README.md`](../parity/README.md) is binding.

For each family:
1. Read its existing `docs/parity/<account>.md` contract and import census; inspect only relevant, previously uncovered current `lms-dev-2026` FE/BE routes, sidebar/header, hidden overlays/portals and conditional states; pin exact FE/BE/vNext SHAs.
2. Enumerate actual reachable **pages, tabs, sidebars, modals, drawers, dropdowns, wizards, forms, bulk actions, empty/loading/error/stale/permission/mobile states**, and the external API/storage consequences. Map each legacy surface to a vNext equivalent, accepted consolidation or explicit retirement; categorize beneficial vNext extras.
3. Compare the actual vNext code and runtime. Fix P0/P1 gaps in a coherent batch and prove critical actions with real disposable PostgreSQL, auth/tenant negatives and desktop/mobile browser checks; retain executed test URLs and commit SHAs.
4. Mark **Implementation Green** only with the requisite evidence receipt; stop re-auditing that family and advance. Two focused repair rounds are the default; for an external block leave **NOT GREEN / BLOCKED** and advance to the next independent eligible family. Do not turn a static file census into fictitious UI acceptance.

**Family order:** honor the existing one-time **Faculty Today contract pilot** if still not evidenced, then complete remaining Faculty families. Thereafter follow **College Admin → Super Admin → Learner → Mentor → TPO → Recruiter/HR → Shared/Public/Operations**, selecting prerequisite-ready families first. Within an account use existing spec order, never independent chat-specific trackers. A critical cross-role dependency is fixed at its producer before retesting the consumer. A user-named account/family scopes the next action only among prerequisite-eligible tasks; it does not override the phase gate.

### Step 4 — Final UI/UX and visual Design Green

**Only after required functional page implementations are accepted**, perform the dedicated UX pass: information architecture, sidebar/grouped navigation, consistent layouts, forms/overlays and keyboard/focus, accessibility, density and typography, mobile/desktop responsiveness, empty/error content, motion and branded colors. Use the shared vNext design kit. **Prototype pixel matching is not the goal**; preserve all required old-development capabilities and any beneficial improvements. Design changes must not silently reopen functionality; retest only materially touched flows. Mark separate Design Green receipts.

### Step 5 — Release Green and cutover

Freeze exact `prod-2026` FE/BE oracle SHAs and reconcile material differences from development references. Require complete source-specific CI, migration and catalog checks, integration/negative/browser/security suites, storage and outbound providers with authorized accounts, performance, restore/rollback, environment/secret/tenant isolation and approved production smoke/cutover. Run `npm run parity:clone-gate`; do not say release-ready unless it reports READY YES and every applicable signed gate passes.

## Rules for parallel chats and day-to-day execution

- **Only one current global phase:** DATABASE → API → UI → RELEASE, as declared in `docs/tracker.json`. Discovering/inventorying UI while DATABASE is open is permitted as **read-only preparation**; it is not permission to claim or certify API/UI phase completion. Do not start unrelated new UI/API parity implementation ahead of their prerequisite phase; urgent P0 security/data-loss fixes and fixes necessary to test the current database gate are exceptions with explicit evidence, not hidden phase advancement.
- **Parallelize inside the active phase, not across uncertified phase gates.** Example: DB-005 independent schema integrations can progress while DB-004 waits for authorized decisions. Different chats may inspect independent legacy source families, but one writer owns a shared Drizzle journal/schema/CI edit at a time.
- **Always re-read fresh `main` and exact acceptance evidence.** No forced branch writes; prefer one substantial atomic batch, one test witness, one Git commit. Reuse prior verified/green family evidence unless source or behavior materially changed.
- **CI is continuous, not a terminal phase.** Run focused tests with every material code change; full applicable acceptance at the phase gates. A passing full CI never overrides an open task or missing owner decision.
- **No speculative percentages.** Official task state = `docs/tracker.json`; page receipt = `docs/parity/`; source/audit findings = `docs/audit/`; this document = **ordered policy only**. Never set `done=true` from prose or an authored test.
- **No order drift without authorization.** If another chat suggests prototyping, polishing, migrating production data, creating a parallel tracker or repeating the census instead of the first eligible locked priority, follow this document. An explicit user direction to change priority must be incorporated here and linked from `AGENTS.md` before replacing the order.

## Default continuation rule (read this in every chat)

1. Read `AGENTS.md`, `docs/tracker.json`, **this locked order**, `docs/planning/closure-first-delivery-strategy.md` and the target acceptance spec.
2. Choose the earliest **unsatisfied and independently executable** obligation in the active phase, respecting DB dependencies and any explicit user's narrower scope. Check newest `main` to avoid duplicating parallel work.
3. Deliver a real implementation or fix, executed focused proof and a concurrency-safe commit. Record exact blockers only if external approvals or a reproducible dependency prevent that unit.
4. Update the existing official tracker/receipts **only where acceptance was actually proved**. Continue with the next eligible obligation rather than redoing the same audit; do not advance global phases without their signed gates.

**One-sentence carry-forward:** *Finish database foundations and gate → finish API/user jobs → finish audited UI functionality per surface → final self-designed UX polish → certify release; use prior source-census work rather than repeating it.*
