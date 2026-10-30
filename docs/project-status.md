# Project status command

> **2026-10-31 closure-first authority:** This document describes a historical
> checklist's directional `npm run status` report; it is **not** the live task
> completion tracker. For all vNext implementation chats and the 81 DB items,
> read `AGENTS.md` and `docs/tracker.json.execution.closureFirstProtocol`,
> run `npm run progress -- --closure-next [--lane=LNN]` before work and
> `npm run progress -- --check` before reporting. Only tracker `done:true`
> with executed scoped acceptance changes N/81. Freeze accepted tasks, close
> runnable open tasks first and switch after two unaccepted passes with a
> named blocker handoff. Keep this historical status script only for its
> separately labeled implementation-checklist metrics, never as evidence
> that database/API/UI/release gates passed.

Use the repository checklist itself as the source of truth for LMS vNext completion statistics.

Run:

```bash
npm run status
```

For machine-readable output:

```bash
npm run status -- --json
```

The command reads `docs/planning/vnext-execution-checklist.md` and counts only product execution phases **A through AD**.

It deliberately excludes:

- the legend/example checkboxes at the top of the checklist;
- section AE, which contains instructions for future ChatGPT sessions rather than LMS implementation work.

Two completion measures are reported:

- **strict completion** = fully complete items / all execution items;
- **practical completion** = complete items + 50% credit for explicitly partial/dependency-blocked items.

The practical percentage is directional, not a release gate. Production launch remains governed by the explicit production/launch checklist and runbooks.

When a batch changes checklist state, update the checklist in the same commit. Future progress reports should prefer this command over manually recounting checkboxes or reusing percentages from older chats.


## Detailed account-surface parity

The execution checklist intentionally tracks parity at the account/release-gate level. For the detailed page/section/action inventory run:

```bash
npm run parity:status
```

Machine-readable:

```bash
npm run parity:status -- --json
```

This parses `docs/planning/account-surface-parity.md`. DONE, REDESIGNED and RETIRED are resolved. PARTIAL, MISSING, VERIFY and BLOCKED are release blockers. The frozen mechanical route inventory lives in `docs/planning/legacy-ui-route-manifest.md`.


## Detailed per-page parity

The master surface matrix is intentionally not granular enough to prove every page's internal behavior. The second-level contracts live in `docs/parity/*.md`.

Run:

```bash
npm run parity:pages
```

Machine-readable:

```bash
npm run parity:pages -- --json
```

At initial creation, the eight detailed specs contained **1,517 closure checks**: 9 checked and 1,508 open. This is **not a percentage of implemented LMS code**. It is a deliberately strict audit workload: existing vNext work may satisfy an item only after it is compared against the legacy page and the checkbox is closed with evidence.

Release parity requires both:
- `npm run parity:status` — zero PARTIAL / MISSING / VERIFY / BLOCKED rows;
- `npm run parity:pages` — zero open detailed checks.

A master DONE/REDESIGNED row must not hide open required checks in its detailed page contract.
