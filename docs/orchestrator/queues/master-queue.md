# MASTER QUEUE (owner: use every lane at full throttle, never idle)

## OWNER GOAL (2026-10-19, overrides everything): vNext must look like a NEW MODULE INSIDE THE OLD LMS, not a separate product
Five checkpoints, in this order, each must be a pixel-level clone of the old LMS (docs/design/old-lms-shell.css, old-lms-pages.md, legacy-styles/):
1. TOP BAR  2. SIDEBAR  3. INTERNAL PAGES (page head, canvas, tabs, tables, filters, chips, banners)  4. MODALS and drawers  5. BUTTONS (primary solid #0a7c88 white text, radius 9, 36px high, 14px/650; secondary outlined; sizes; hover/focus/disabled).
When in doubt, copy the legacy SCSS value. Stakeholders must not be able to tell vNext from the old LMS.

WORK STYLE: lift heavy. Each turn do a LARGE batch (100+ commits or your whole category), plan from greps, keep going, push every ~10 commits; reply only at the end with commits/ticked/open/next file. See docs/design/ui-clone-checklist.md.
EXHAUSTIVE CHECKLIST (owner asked to be exhaustive): docs/design/ui-clone-checklist.md lists every UI element category (foundations, shell, forms, buttons, data display, overlays and feedback, whole-page types, portals, behaviour) with ONE owner lane per category. Read your category, compare value by value with docs/design/legacy-styles, fix, write docs/audit/ux/clone-<category>.md, then migrate every page onto the shared components.

## NORTH STAR (owner, 2026-10-19, TOP PRIORITY, COMPLETE BY MORNING): the vNext SHELL and LOOK must be exactly the old LMS
SCOPE (owner clarified, binding): change the page SHELL and the global LOOK, NOT the page contents. The owner respects vNext page contents and the way they are arranged inside the page: keep every page's own sections, tables, forms, wording and behaviour. What must become exactly the old LMS, for EVERY page and portal, down to tiny details: sidebar (96px icon rail that expands to 256px on hover, icons, groups, active bar), top bar (68px, command search, + New, notification icons, avatar menu), page canvas (one white rounded canvas on the #f1f4f9 shell), fonts (Inter weights/sizes/line-heights as the old LMS), colours, buttons (solid #0a7c88, white text, radius 9, 36px high), inputs/selects/textareas, dropdown menus, tables (header row, row height, hairlines, hover), badges/pills, tabs, tooltips, modals/dialogs/drawers, toasts, alerts, pagination, scrollbars, focus rings, spacing scale, radii, borders, shadows, transitions. Breakage is acceptable tonight; completeness is not optional. Do not run or wait for CI; the owner fixes and runs CI/CD after waking.
REFERENCES: docs/design/old-lms-shell-spec.md, old-lms-shell.css (exact TPO shell rules from the running app), old-lms-pages.md, vnext-vs-old-lms-gap.md, and legacy-styles/ (the old LMS SCSS sources: variables, buttons, forms, dropdowns, header, common, antd overrides, layout, notification drawer, login). If a detail is not covered, read the SCSS and match its values; never guess a look.
OWNERSHIP (single owner per file set so lanes do not collide; everyone pushes every ~10 commits):
- chat-17: GLOBAL TOKENS AND SKINS: src/app/globals.css, src/app/layout.tsx and every shared element in src/components/ui (Button, Input, Select, Textarea, Checkbox/Radio, Badge/StatusBadge, Tabs, Dialog/Modal/Drawer, Toast, Tooltip, Dropdown, Table/DataTable, Pagination, Alert/Banner, Card, Skeleton, EmptyState, ErrorState): restyle them so their values equal the old LMS (from legacy-styles/ and the spec); plus src/components/ui/page-canvas.tsx and its use in the authenticated layout. Every portal inherits this, so it is the highest-leverage job: do it first and push after each component.
- chat-19: SIDEBAR (src/components/shell/sidebar-nav.tsx plus icon/group data in shell-model.ts) exactly per old-lms-shell.css: 96px rail, 256px on hover, push layout, a real icon per item, group headings only when expanded, 3px teal active bar, badges onto the icon when collapsed, logo mark at top, mobile drawer behaviour kept, portals not mixed in one list.
- chat-13: TOP BAR (new files src/components/shell/topbar/** plus the header-slot swap in app-shell.tsx): 68px, command search with Ctrl K, + New, Messages and Notifications icon buttons with badges, organisation name, avatar menu with the existing account actions; remove the text-link cluster and the in-page duplicate strip.
- chat-16: login, sign-in, OTP and every public/auth/error/not-found/maintenance page: match the old LMS login (docs/design/legacy-styles/pages___login.scss) and public pages exactly.
- All other lanes (2, 3, 4, 5, 6, 7, 9, 11, 12, 14, 15): once chat-17 pushes the skins and chat-19/13 the shell, sweep YOUR portal's pages and components: replace every hard-coded colour, font, radius, shadow, spacing, button or input style that bypasses the shared tokens with the shared components/tokens; remove outer card wrappers or paddings that fight the page canvas; fix page titles/headings to the old LMS typography (h1 30px/600 #172033, etc.); fix anything that looks different from the old LMS shell. Do NOT restructure page contents. Until the shared work lands, prepare docs/audit/ux/north-star-sweep-<lane>.md listing the files/components of your portal with hard-coded styles to fix, then execute the sweep.
- The orchestrator only coordinates, merges and keeps the lanes busy.

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

## AFTER NORTH STAR (orchestrator, 2026-10-19): ONE SOURCE OF TRUTH FOR CONTROLS
Tokens exist in globals.css and shared components in src/components/ui, but many pages hand-roll raw <button>/<select>/<input>/<textarea> with long class strings. Do after the sweeps: (1) make src/components/ui the single source for every control; (2) add a lint rule or unit test failing on raw controls with long class strings and on hard-coded hex colours outside globals.css/ui; (3) one codemod pass moving remaining raw controls to the shared components.
