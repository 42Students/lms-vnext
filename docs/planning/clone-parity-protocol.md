# Clone Parity Protocol — No-Surprise LMS vNext Cutover

**Purpose:** make an as-is rebuild of the current production LMS provable, repeatable, and resistant to hidden/stale gaps.

This protocol is a release gate. It sits above the account matrix, route manifest, detailed page specs, and account ledgers.

## 1. Product oracle

During clone parity, the current production branches are the oracle:

- frontend: `42Students/lms2-fe@prod-2026`
- backend: `42Students/lms@prod-2026`

vNext may use a different architecture, but it must preserve the current user-visible jobs, permissions, business outcomes, navigation contracts, and cross-role workflows unless an exception is explicitly documented.

### Final cutover freeze

Before final parity sign-off, choose exact frontend/backend commit SHAs as the **cutover oracle**. After that point:
- every final verification is against those exact SHAs;
- if production moves again, diff the new commits against the cutover oracle;
- any material product change re-opens only the affected families;
- cutover cannot claim parity against a moving branch name.

## 2. Clone means behavior, not implementation

Clone:
- route/naming/navigation behavior;
- visible sections/cards/tabs/content;
- filters/search/sort/pagination/URL state;
- forms/validation/modals/drawers/popovers/confirmations;
- loading/empty/error/partial/stale states;
- mobile/responsive workflow differences;
- role/tenant/module-access behavior;
- status/state machines and transition rules;
- file/private-document behavior;
- timing/deadline/timezone rules;
- notifications/deep links;
- side effects, audit/history, idempotency and destructive consequences;
- upstream authoring and downstream consumption workflows.

Do **not** clone:
- accidental legacy code structure;
- Redux/Ant Design/Pages Router/Java class layout;
- unsafe security/privacy defects.

A user-visible legacy quirk must not be silently “fixed” during parity. Record it first. Security/privacy/data-corruption defects may be corrected immediately, but the deviation must be documented and remains an exception until explicitly accounted for.

## 3. Discovery gate — before coding a family

A family audit must inspect all of these, not only the route file:

1. sidebar/navigation source and feature/module guards;
2. route file and redirects/deep links;
3. rendered component tree;
4. CSS/responsive/mobile-specific components;
5. frontend API/service calls;
6. backend controller/service/domain rules;
7. persistence/status/enums that change behavior;
8. legacy tests for the family;
9. modals/drawers/popovers/confirmations;
10. polling/timers/session/local-storage/browser-history behavior;
11. upload/download/private-document flows;
12. notifications and cross-page action links;
13. role/tenant/read-only/feature-flag/module-access gates;
14. upstream producer surfaces that create the data being consumed;
15. downstream consumers affected by learner actions.

Any newly discovered behavior is added to the ledger/spec **before implementation**.

## 4. Three-layer closure model

### Layer A — Surface row

The operational row records one visible/behavioral requirement.

A row can be:
`UNCHECKED → AUDITING → GAP → FIXED → CLOSED`.

`FIXED` means code exists but proof is incomplete.

### Layer B — Family verification record

Every page/family has a separate evidence row in `docs/planning/learner-family-verification.md`.

A family is not release-valid until it records:
- exact legacy FE SHA;
- exact legacy BE SHA;
- vNext SHA;
- legacy source files/components inspected;
- relevant legacy tests inspected;
- vNext tests that actually executed;
- browser/visual verification status;
- upstream producer dependency status;
- open approved exceptions.

A historical `CLOSED` surface does not make a stale family release-ready.

### Layer C — Final frozen-oracle sweep

After every account ledger is resolved:
1. freeze exact cutover-oracle FE/BE SHAs;
2. regenerate/re-audit the full route manifest;
3. diff from each family's verification SHA to the cutover oracle;
4. re-open affected families;
5. run account/page parity counters;
6. execute browser scenarios;
7. execute negative permission/tenant scenarios;
8. verify cross-role producer→consumer flows;
9. close only when there are zero unexplained deltas.

## 5. Legacy drift protocol

Every parity chat begins by reading current FE/BE/vNext heads.

If either legacy SHA changed:
1. compare old verified SHA → new SHA;
2. classify changed files by family/account;
3. mark affected family verification rows `STALE`;
4. update route manifest if routes/navigation changed;
5. update page specs/ledger if visible behavior changed;
6. do not preserve old `VERIFIED` family state merely because individual rows still say `CLOSED`.

Global final sign-off is forbidden while any family is `STALE`, `UNVERIFIED`, `IN_PROGRESS`, or `BLOCKED`.

## 6. Browser and visual gate

Source comparison is necessary but not sufficient for user-visible parity.

Every daily-use family must be checked at minimum at:
- desktop: 1366×768 or equivalent common laptop viewport;
- mobile: ~390×844;
- any breakpoint where legacy changes workflow materially.

Browser verification covers:
- navigation and Back/Forward;
- focus/keyboard/escape for overlays;
- scroll restoration/deep-link focus;
- responsive reflow/overflow;
- loading→ready transitions;
- empty/error/retry;
- modal/drawer positioning and dismissal;
- browser-local timezone/date behavior;
- file/open/download flows where configured.

For high-value pages, capture side-by-side screenshots or equivalent visual evidence before final family verification.

## 7. Cross-role workflow gate

A consumer page is not fully parity-closed merely because seeded data renders.

Examples:
- learner announcement/update requires Faculty/Admin authoring;
- learner attendance requires Faculty/Admin attendance production;
- placement interview/assessment requires TPO/HR scheduling;
- project workspace requires Admin/Mentor project/team/sprint/task creation;
- profile verification requires learner submission + authorized verifier review.

If the producer workflow does not exist yet, mark the dependency in the family record. The consumer UI may be `FIXED`, but the end-to-end family is not `VERIFIED`.

## 8. State matrix gate

For each data-driven family, explicitly exercise representative states:
- first-run/no-data;
- normal populated;
- large/paginated;
- filtered-empty;
- historical/read-only;
- partial-source failure;
- hard failure + retry;
- permission denied;
- feature/module disabled;
- stale/concurrent action where relevant;
- deadline/past/future state where relevant.

Do not infer these from a happy-path screenshot.

## 9. REDESIGNED / RETIRED discipline

`REDESIGNED` is not permission to skip parity.

A REDESIGNED row must state:
- exact legacy behavior;
- exact new behavior;
- why the same user job/outcome is preserved;
- whether the change is user-visible;
- approval/decision reference when user-visible behavior changes.

`RETIRED` is allowed only for proven redirect/framework/test/artifact surfaces or an explicitly approved product removal.

No daily-use legacy feature may disappear through either label without explicit evidence.

## 10. Route-manifest discipline

The route manifest is a mechanical backstop, not a one-time artifact.

It must:
- include only real route-capable source files, not arbitrary files under `src/pages`;
- be regenerated/re-audited whenever current `prod-2026` adds/removes/renames routes;
- record the exact source SHA;
- have zero unclassified real product routes at final cutover.

A stale manifest blocks release.

## 11. Required final gates

LMS vNext cannot be called an as-is replacement until all are true:

- current route manifest matches frozen cutover oracle;
- master matrix has zero PARTIAL/MISSING/VERIFY/BLOCKED rows;
- detailed page specs have zero open required checks;
- account operational ledgers have zero UNCHECKED/AUDITING/GAP/FIXED/BLOCKED rows;
- every family verification record is VERIFIED against the frozen oracle;
- browser/mobile verification is complete for daily-use surfaces;
- upstream producer→consumer workflows are proven;
- feature/module access and negative authorization are proven;
- configured file/private-document flows execute;
- CI/tests actually executed or every unavailable gate is explicitly blocking release;
- no undocumented REDESIGNED/RETIRED surface exists.

## 12. Current audit finding — 2026-10-05

The no-surprise protocol was introduced because the earlier process was good at inventory but weak at freshness/evidence.

At introduction:
- old ledger/frontend baseline: `38cdd38e592a6f416c8e8e99ce36438f548ed577`;
- current frontend head: `008d113ddd9f515df65ae7fe90dba360938314f6`;
- current backend head: `ed1377b744088f2ec759895658105c494337ba30`;
- current vNext head before this protocol: `db6f3c0db7ae4d2402211b1a65650de499b97c69`.

The frontend moved 115 commits after the original audit baseline. Material Learner-facing changes include Profile Verification/private marksheets, profile-section removals, placement/module-access behavior and project semantics. New real account routes also appeared outside the frozen route manifest.

Therefore prior surface `CLOSED` rows remain useful historical evidence, but **no Learner family is final-release VERIFIED until revalidated through the family evidence record against the current/frozen oracle**.
