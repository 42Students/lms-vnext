# Next phases after the UX passes (owner-requested, 2026-10-18)

Order matters. Do each phase fully (code, tests, cloud CI green, deployed to dev) before the next.

## Phase 0 (in progress)
Unit failures to zero, UX cross-audit, UX coverage closure (`docs/audit/ux/COVERAGE-MATRIX.md` gaps to zero or waivers), scroll and motion pass, master surface registry kept current (`docs/audit/ui-surfaces/`), redeploy dev, then the visual check on dev after audits and fixes (owner signs in once in the Browser pane; the assistant drives from that session).

## Phase 1: super exhaustive test coverage for the Projects and Placements modules
- Scope: `src/modules/projects`, `src/modules/placements`, their routes (`/admin/projects`, `/college/projects`, `/mentor/projects`, `/learn` project views, `/admin/placements`, `/tpo`, `/hr`, `/recruiter`, `/learn/placements`) and components.
- For every service function: happy path, validation failures, permission matrix (every role, own versus other tenant, super admin scope), idempotency, concurrency/version conflicts, state-machine transitions (allowed and forbidden), audit/activity events, notifications, error mapping to friendly copy.
- Integration tests on real PostgreSQL for every migration-backed table (constraints, cascades, indexes, rollback on failure), and API route tests (same-origin guard, auth, input limits, GET never writes).
- E2E (Playwright) for the main journeys per role at 360 and 1280 widths.
- Coverage report per module, target branch coverage above 90 percent for these two modules, and a ledger file per module listing each function and its tests.

## Phase 2: TPO and HR, super important
- Same exhaustive coverage as Phase 1, applied to every TPO and HR page, service and workflow (drives, rounds, interviews, offers, joining, requests, campaigns, notices, settings, people, companies, recruiters, HR jobs and applicants).
- Parity check against the CURRENT dev deployment of the old LMS: walk every TPO and HR screen, action and message there and list what vNext still lacks (missing page, action, filter, column, validation, notification, export, wording). Needs the owner to sign in on the old LMS dev in the Browser pane (credentials are never typed by the assistant). Output: `docs/audit/legacy-vs-vnext-tpo-hr-gaps.md` with ids, then close every gap (build, test, deploy). Repeat the same walk for the other roles afterwards (college admin, mentor, faculty, learner, recruiter) to find anything still missing.

## Phase 3: Super Admin
- Brutal audit of every Super Admin surface (pages, modals, actions, exports, tenant and college scoping, safety rails, audit trails, alerts), fix everything found, then exhaustive test coverage as in Phase 1 (permission matrix, scope safety, destructive-action confirmations, audit events, live data states).
- Parity walk against the old LMS dev Super Admin as in Phase 2.

## Standing rules for all phases
Legacy wording exact. Dev only, never production. Never weaken tests. Keep the UI surface registry and coverage matrix regenerated after merges. Cloud CI (typecheck, lint, unit, then integration and e2e) green before each deploy.
