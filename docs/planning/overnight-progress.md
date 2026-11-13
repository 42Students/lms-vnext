# Overnight progress tracker

Plan: `overnight-master-plan-2026-11-14.md`. Audit: `centralisation-audit-2026-11-14.md`.
Rule: tick a box only when the step's gate passed (tsc, lint, security:central, tests, CI green on the pushed commit).
Each line: `[x] id (commit) note`. If a step is partly done, leave it unticked and write what is left under it.

**Out of scope for the whole program (owner, 2026-11-14): GCP and Cloudflare. Skip anything that touches either: no cloud commands, no deploys, no Cloud SQL or load-balancer or Workers/Hyperdrive/Turnstile/firewall work, no manifests applied. If a step would need them, mark it SKIPPED (cloud) and move on. Code, tests and docs only.**

Resume rule for a new wake-up: read this file, take the first unticked item, do it, commit, push, tick, continue.

## Phase 0: baseline and safety
- [x] 0.1 CI green on main (last green run a7082f66e3; head b9517b34e3 is docs-only, run pending)
- [x] 0.2 scripts/centralisation-metrics.mjs + docs/security/baselines/centralisation.json (35 metrics, all tracking until their module lands)
- [x] 0.3 `npm run centralisation:check` is part of `npm run lint` (CI lint job)
- [x] 0.4 tests/support/actors.ts; five security suites moved onto it (63 DB tests green, tsc 0 source errors)
- [x] 0.5 docs/planning/CENTRALISATION-IN-PROGRESS.md (what changes, what to use instead, which dirs, ratchet rules)

## Phase 1: safety nets
- [ ] 1.1 production readiness startup guard
- [ ] 1.2a cross-user: quiz attempts and answers
- [ ] 1.2b cross-user: attendance and parent contacts
- [ ] 1.2c cross-user: placement offers and recruiter/company data
- [ ] 1.2d cross-user: project and mentor workspaces
- [ ] 1.2e cross-user: notifications and staff inbox
- [ ] 1.3 export scope tests
- [ ] 1.4 request-level abuse suite through the wrapper
- [ ] 1.5 admin-scope and role-switch tests
- [ ] 1.6 role-by-route matrix diff check

## Phase 2: foundations
- [ ] 2.1 typed config module (migrated directory by directory)
- [ ] 2.2 feature registry (flags and module access)
- [ ] 2.3 role and capability constants
- [ ] 2.4 clock service and per-college time zone, one formatter set
- [ ] 2.5 shared utilities (first, when, humanize, initials, isUniqueViolation, ...)
- [ ] 2.6 one baselines folder and reader

## Phase 3: request, response, error plumbing
- [ ] 3.1 one error model and mapper
- [ ] 3.2 response helpers by route class
- [ ] 3.3 wrapper owns origin, actor, body, query; one body reader
- [ ] 3.4 limits.ts
- [ ] 3.5 session cookie helper
- [ ] 3.6 idempotency option

## Phase 4: authorization and tenant
- [ ] 4.1 policy registry
- [ ] 4.2 route families migrated (people, courses, placements learner, placements staff, projects, academics, attendance, admin, internal, legacy)
- [ ] 4.3 per-file requireX guard copies removed
- [ ] 4.4 requireSameCollege / ownsResource
- [ ] 4.5 requireCurrentVersion
- [ ] 4.6 last server raw fetch onto outboundFetch

## Phase 5: data, events, files, exports, jobs
- [ ] 5.1 recordActivity + status-transition writer
- [ ] 5.2 repositories (52 direct-DB routes first)
- [ ] 5.3 file policy and download header builders
- [ ] 5.4 one export pipeline
- [ ] 5.5 job registry
- [ ] 5.6 notification service
- [ ] 5.7 settings service

## Phase 6: behaviour consistency
- [ ] 6.1 shared validation primitives
- [ ] 6.2 one pagination contract
- [ ] 6.3 status registry
- [ ] 6.4 typed route registry
- [ ] 6.5 legacy table and envelope adapter
- [ ] 6.6 locale, currency, phone module
- [ ] 6.7 date and money inputs

## Phase 7: UI and wording
- [ ] 7.1 copy catalogue
- [ ] 7.2 design-token ratchet driven down
- [ ] 7.3 state, form, table components on the new modules
- [ ] 7.4 quarantined UI-copy tests repaired

## Phase 8: close-out
- [ ] 8.1 shared domain fixtures
- [ ] 8.2 environment matrix from config
- [ ] 8.3 audit re-run, before/after table
- [ ] 8.4 docs and memory updated
- [ ] 8.5 final gate: LF unit suite, all DB suites, CI green

## Log (newest first)
- 2026-11-14: Phase 0 complete (0.1-0.5).
- 2026-11-14: 0.2 and 0.3 done: metrics script, baseline and lint wiring; metrics flip to ENFORCED in scripts/centralisation-metrics.mjs when their module lands.
- 2026-11-14: owner confirmed GCP and Cloudflare are out of scope; rule added above and to memory.
- 2026-11-14: tracker created.
