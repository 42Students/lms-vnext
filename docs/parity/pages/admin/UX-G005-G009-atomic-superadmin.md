# Atomic Super Admin UX — UX-G005–UX-G009 (9 November 2026)

Canonical status and surface ownership: `docs/tracker.json#uxReview.groups`. **Scope is the five reduced atomic slices only**, not their separately tracked siblings, shared mutation components, global security/release work, or the full pre-repartition 15–18-file parents.

## Exact source scope and change summary

| ID | Registered UX slice | Changes on `main` | Scenarios |
| --- | --- | --- | --- |
| UX-G005 | `/admin/academics`, `/admin/academics/sections/[sectionId]` (two pages, error/loading boundaries) | Named academic loading states; retained role/scope restrictions, section detail and safe back navigation | Authorized selected-college academic dashboard, actual persisted E2E section operations, correct back link, mobile width and recovery retry |
| UX-G006 | `/admin/audit`, `/admin/batch-promotion` (two pages and boundaries) | Failed promotion now offers explicit retry and safe return to Academic Setup, keeping no-write-on-preview semantics | Authorized audit and promotion forms, malformed category/year safe recovery, producer fallback, mobile layout, source-preview service security |
| UX-G007 | `/admin/colleges/[collegeId]/admins/[userId]` and `.../history` (two pages and boundaries) | History now links back to **this same college and admin's** active sessions; links use `encodeURIComponent` | Actual scoped session/history pages, session refresh controls, malformed history filter, cross-role denial, empty/loaded states |
| UX-G008 | `/admin/colleges/[collegeId]/signin` and `.../subdomain` (two pages and boundaries) | Safe cross-links between same-college sign-in policy and web address settings; no writes or host permissions changed | Actual persisted configured policy and managed-domain settings, recovery retry, wrong-role denial, mobile layout; wait for hydrated policy/domain controls before screenshots |
| UX-G009 | `/admin/course-progress`, `/admin/course-progress/students`, `/admin/courses` error/loading (six source files) | Progress error now offers safe return to Courses and explicit retry | Actual saved cohort/course selections, measured learner progress route, invalid progress filters, course directory, scoped report and mobile width |

### Scope correction

An unrelated route-only `/admin/content-order` had been assigned to UX-G008 by an earlier mechanical repartition. It was transferred without dropping its coverage to the separate course-content group **UX-G197** in commit `5936891e320da22264cf4cdf8537a5acf58ed9d9`. The canonical registry still contains 2,080 source surfaces and 83 extra routes.

### Executed evidence available

- **First green seeded acceptance:** [run 42634774649](https://github.com/42Students/lms-vnext/actions/runs/42634774649) at SHA `7881d256d8b51e9e0f3b37787c0a8050f4feadc2`: 5/5 desktop/mobile Chromium cases, no skips; scoped lint, full TypeScript, tracker tests, scoped unit tests and disposable PostgreSQL all green. Screenshot artifact `13683280375`.
- **Expanded green seeded acceptance:** [run 42636044339](https://github.com/42Students/lms-vnext/actions/runs/42636044339) at SHA `c2cf5a56e8a16b2aff149484e2eb255eb4ff5656`: added real persisted academic section, actual course progress selection/drilldown, invalid filter recovery, session refresh and actual policy/domain controls; 5/5 browser cases and no skips. Screenshot artifact `13682951837`.
- **Current stronger acceptance work**: `.github/workflows/ux-g005-g009-admin-real-acceptance.yml`; runs 5 unit suites specific to these features plus shared route-source regression, real seeded desktop/mobile pages with 5 browser cases, and a Learner-denial case. Final run result and exact SHA are authoritative; partial older runs do not automatically certify the latest code.
- Existing targeted services retain independent validation, including `tests/unit/chat3-sa-section-workspace-permission-matrix.test.ts`, `tests/unit/sa-batch-promotion-execute.test.ts`, `tests/unit/chat4-superadmin-college-admin-sessions-page.test.tsx`, `tests/unit/chat4-superadmin-college-signin-page-states.test.tsx`, and `tests/unit/chat11-super-admin-course-progress-tenant-guard.test.ts`.

### Important evidence cautions

The first green screenshot suite sometimes captured the G008 loading skeleton before the policy/domain controls hydrated; screenshot-readiness awaits were added later. The expanded G009 screenshot sometimes captured the pre-navigation course-progress page before the browser reached the per-student path; a URL and target-form assertion were added later. **Do not accept either earlier screenshot as final visual proof for those destinations.** Only final exact-SHA screenshots after these fixes count.

The UX task is scoped to its registered pages and route states. It does not certify separate interactive-component groups, actual production DNS changes, sign-in policy mutation, administrator session revocation, batch advancement mutation, or overall security/release. Cross-route smoke, authorized report and invalid/denied states are checked, but independent mutation tests remain important wherever their owners are separate.

### Closure gate

Move each group from DOING to DONE **only** after the exact-source workflow and screenshot artifacts are green, the named partial-vs-full proof caveats above are resolved, and `docs/tracker.json#uxReview` records valid `commitSha`, parityDoc path, executed unit/browser checks, desktop/mobile evidence links, regression and role/tenant security review. Do not copy successful results between SHAs. Existing owners must be preserved or explicitly coordinated across concurrent chats.
