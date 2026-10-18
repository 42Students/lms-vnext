# MASTER QUEUE (owner: use every lane at full throttle, never idle)

## NORTH STAR (owner, 2026-10-19, VERY IMPORTANT, GO NOW): vNext must look the SAME as the old LMS
Stakeholders must not feel this is a new app. The old LMS was measured live; references are in docs/design/: old-lms-shell-spec.md, old-lms-shell.css (exact rules), old-lms-pages.md (page anatomy), vnext-vs-old-lms-gap.md (gap table and build order). Read them before touching UI. Primary buttons are now solid #0a7c88 with WHITE text and the font is Inter (already landed in src/app/globals.css and src/app/layout.tsx).
Ownership, to avoid conflicts:
- ORCHESTRATOR (do NOT edit): src/components/shell/**, src/app/globals.css, src/app/layout.tsx, the authenticated layout wrappers. The shell (icon rail that expands on hover, top bar with command search and avatar, one white page canvas) is being rebuilt there; do not touch those files.
- chat-17 (shared UI kit) builds these primitives FIRST in src/components/ui, each with tests, exactly per docs/design/old-lms-pages.md: PageHead (title with grey one-line subtitle inline, primary actions top-right), NeedsDoingChips (pill chips with counts that filter), ListTabs (tabs with counts, teal underline), ListToolbar (search + Filters, Views, Columns, Export small outlined buttons, "N items in this view / Act on all N"), HairlineTable (compact rows, hairline separators, pill statuses), BannerStrip (slim pale-yellow info strip with outlined action), SummaryStrip (funnel numbers with captions and arrows), ReportTile (card tile for genuinely separate objects). A page is ONE canvas; sections are separated by headings, whitespace and hairlines, NOT a bordered card per section; cards only for genuinely separate objects. Push as soon as each primitive is done and say so in your commit messages.
- Every other lane: as soon as chat-17 pushes a primitive, migrate the pages of YOUR portal to it, replacing per-section card wrappers, raw filter-form stacks, eyebrow-plus-paragraph headers and big stat cards with the old-LMS patterns. Order inside a portal follows the sidebar order. Portals: TPO (chat-2, chat-5, chat-12, chat-11), HR/recruiter (chat-15, chat-16, chat-19), College Admin (chat-4, chat-11), Faculty (chat-3), Learner (chat-7), Mentor and Projects (chat-14, chat-9), Super Admin (chat-6, chat-9, chat-13). Keep legacy wording exact, keep behaviour and permissions, keep tests green, update tests that assert old structure to the new one.
- Do NOT start the page migrations before chat-17 has pushed the matching primitive; until then continue your normal queue.

## PRIORITY CHANGE (owner, 2026-10-18 23:40): NO CI GATING UNTIL THE END
Stop fixing failing unit tests and compile errors from docs/orchestrator/unit-failures-latest.md and typecheck-errors-latest.md for now: the orchestrator is NOT running CI rounds until all tasks are finished. Spend ALL your time on your task queue below (Projects hardening, exhaustive coverage, TPO/HR depth, Super Admin audit, UX coverage), item by item, pushing every ~10 commits. Still keep syntax valid (balanced parentheses and braces, no line break before an as-cast) because the push gate is a syntax check. One full CI, test-fix and deploy pass happens at the very end.

Rule for every lane: finish your current item, `git pull origin main`, then work YOUR section below from top to bottom without reporting between items. Push to your own `chatgpt/chat-N-b` branch every ~10 commits, tag commits `[chat-N]`, TypeScript strict-clean, legacy wording exact, never weaken or delete tests, dev only. Reply only when your WHOLE section is done or you are blocked. When done, take items from "Unowned and spillover" at the bottom, then tell the orchestrator.

Definition of "exhaustive coverage" for a module or page group (used in every test task):
1. Ledger file `docs/audit/coverage/<name>-ledger.md`: one row per exported service/model function and per route handler, with the test file and the cases covered. No row without a test.
2. Per function: happy path, each validation failure, each role in the permission matrix (own tenant, other tenant, wrong role, super admin scope), idempotency, version/concurrency conflict, each allowed and each forbidden state transition, audit/activity event written, notification sent or not, friendly error mapping (no raw codes).
3. Per route handler: same-origin guard, unauthenticated, forbidden, input size/shape limits, GET never writes.
4. Per page: loading, empty, error, partial, denied states render; phone layout assertions; legacy wording assertions.
5. Database-backed behaviour gets integration tests that run on PostgreSQL (see `docs/orchestrator/` local DB recipe): constraints, cascades, indexes, rollback.
6. Tests must assert behaviour, never only existence. Name tests with the module and case.

ALSO, always: read docs/orchestrator/typecheck-errors-latest.md and fix compile errors in YOUR files first, then docs/orchestrator/unit-failures-latest.md (section for your lane). Both files are refreshed by the orchestrator after every CI run. Write only to your own defect and ledger files to avoid merge conflicts.

## TOP PRIORITY (owner, 13:40): PROJECTS FOR IIT DHARWAD AND UNBREAKABLE ACCOUNTS
The Projects module is the product we sell first. Before anything else in your Pass B section, do your part of `docs/orchestrator/briefs/projects-iit-dharwad-hardening.md` (squad and roles are listed at its end). Then use `docs/audit/coverage/WEAK-AREAS.md` (regenerate with `node scripts/audit/weak-test-areas.mjs`) to add behavioural tests in the weakest areas for your modules, starting with auth, system-roles, tenant-domains, identity, academics, admin-ui, bug-tracker, colleges, messaging. Every account (Super Admin, College Admin, TPO, HR/Recruiter, Faculty, Mentor, Learner) must be unbreakable: write role journey tests that try to break each account with bad input, double submits, stale tabs, wrong tenant, expired session. The visual check on dev is the very last step of everything; do not wait for it.

## Pass A, in progress for everyone (do first, from the earlier messages)
UX cross-audit, UX coverage closure (docs/orchestrator/briefs/ux-coverage-closure.md), scroll and motion pass (docs/orchestrator/briefs/ux-scroll-motion-pass.md). Master surface list: docs/audit/ui-surfaces/UI-SURFACES.md.

## Pass B: exhaustive coverage, by lane

### chat-2
1. Placements interviews, rounds and slots services (src/modules/placements/*interview*, *round*, *slot*): full ledger + tests.
2. TPO last-third pages: every route in your slice gets the page-level tests from the definition above.
3. TPO campaigns, public links, settings people services: ledger + tests.

### chat-3
1. Faculty/teacher module (src/modules/courses faculty paths, assessments, attendance, grades, quizzes): ledger + tests; permission matrix faculty versus mentor versus learner.
2. Super Admin audit: academics and people pages (/admin/academics*, /admin/people*, /admin/recruiters): find and fix defects, then tests.

### chat-4
1. College module (src/modules/college*, academics, groups, people, contacts): ledger + tests.
2. Super Admin audit: colleges and tenants (/admin/colleges*, /admin/organizations*): defects, fixes, tests.

### chat-5
1. Placements module core: drives, jobs, selection, offers, waitlist, joining, retention (src/modules/placements/*): ledger + tests, state machines first.
2. TPO second-third pages: page-level tests.

### chat-6
1. Super Admin audit: /admin second third (docs/orchestrator/ui-ux/pages-admin.md): read every page, every action; defects, fixes, tests.
2. Auth and sessions (login, OTP, handoff, revoke sessions, rate limits): ledger + tests.

### chat-7
1. Courses and learner module (src/modules/courses learner paths, quizzes, assignments, discussions, certificates): ledger + tests.
2. Super Admin audit: courses and content pages (/admin/courses*, content builders): defects, fixes, tests.

### chat-9
1. Projects module admin and college side (src/modules/projects: templates, versions, assignment, readiness, lifecycle, submissions): ledger + tests.
2. Super Admin audit: /admin last third: defects, fixes, tests.

### chat-11
1. TPO settings and college setup (course progress, setup steps, notice settings, preferences): ledger + tests.
2. Super Admin audit: tenants modules, branding, sign-in methods, readiness: defects, fixes, tests.

### chat-12
1. TPO students and companies (roster, facets, bulk actions, participation, history, company directory/share, team): ledger + tests, concurrency on bulk actions.
2. TPO first-third pages: page-level tests.

### chat-13
1. Super Admin audit: /admin first third, placements and projects admin pages (SA placements-projects): defects, fixes, tests.
2. Placements admin services (src/modules/placements admin paths, analytics, exports): ledger + tests.

### chat-14
1. Projects module mentor side (meetings, sprints, tasks, releases, tracker, attention, approvals, resources): ledger + tests.
2. Mentor pages page-level tests and permission matrix.

### chat-15
1. HR module (src/modules/placements hr/recruiter paths: HR jobs, applicants, drives, offers, rounds, messaging, calendar): ledger + tests; HR is super important.
2. Recruiter and tracker pages page-level tests.

### chat-16
1. HR and recruiter messaging, campaigns, notifications, email bridge, inbound mail: ledger + tests.
2. Public and auth pages page-level tests.

### chat-17
1. Shared UI kit (src/components/ui): every component, every state, a11y, motion, scroll cue tests.
2. Integration test harness on PostgreSQL for Projects and Placements (shared fixtures for tenants, roles, drives, projects) so the other lanes can use it; document in docs/orchestrator/.

### chat-19
1. HR pages UX slice (already assigned) then HR page-level tests.
2. Cross-audit of the HR slice written by chat-15 and chat-16 (second pair of eyes).

## Pass C: Old LMS parity (needs the owner to sign in on the old LMS dev site)
Source-level now: compare `docs/audit/legacy-inventory-A.md`, `legacy-inventory-B.md`, `legacy-copy-A.md`, `legacy-copy-B.md` to vNext for TPO and HR first; list anything absent in `docs/audit/legacy-vs-vnext-tpo-hr-gaps.md` (id, legacy page/action, vNext status, severity). Chat-15 and chat-12 own TPO/HR lists; chat-3 and chat-7 the other roles. Live walk of the old LMS dev (all roles) follows when the owner signs in.

## Unowned and spillover
Anything in docs/audit/ux/COVERAGE-MATRIX.md still red; unit failures in docs/orchestrator/unit-failures-*.md newest file; any lane's overflow.
