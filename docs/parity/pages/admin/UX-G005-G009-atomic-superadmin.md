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
- **Final exact-SHA acceptance PASSED**: [run 42639407123](https://github.com/42Students/lms-vnext/actions/runs/42639407123), commit `5c1c49e051d4db632b92a2c81725671da642269e`. GitHub steps succeeded for scoped ESLint, full TypeScript, canonical UX registry checks, six focused unit suites, isolated PostgreSQL seed, G006 persisted batch preview with cross-college denial, and seeded Chromium responsive/role-denial/recovery checks. Playwright JSON stats: **5 expected, 0 unexpected, 0 flaky, 0 skipped**. Official artifact: [ux-g005-g009-real-5c1c49e...](https://github.com/42Students/lms-vnext/actions/runs/42639407123/artifacts/13684054864), containing desktop and mobile screenshots for every G005–G009 major page, actual section details, actual student report and the production error-component recovery fixture. The final run also proves G009 student search is a named accessible search landmark.
- Existing targeted services retain independent validation, including `tests/unit/chat3-sa-section-workspace-permission-matrix.test.ts`, `tests/unit/sa-batch-promotion-execute.test.ts`, `tests/unit/chat4-superadmin-college-admin-sessions-page.test.tsx`, `tests/unit/chat4-superadmin-college-signin-page-states.test.tsx`, and `tests/unit/chat11-super-admin-course-progress-tenant-guard.test.ts`.

### Important evidence cautions

**Resolved by final run 42639407123:** page screenshot waits for the configured sign-in policy and managed-domain controls, while G009 requires the actual `/admin/course-progress/students` URL and the named class-filter search form before the per-student screenshot. The final artifact contains the rendered destination pages on desktop and mobile; earlier skeleton/parent screenshots are superseded. The G009 form's missing `role="search"` was corrected in commit `f355658b350813aa3f69ee874340b7712d6fa766`, and the final exact-SHA acceptance covers this correction.

The UX task is scoped to its registered pages and route states. It does not certify separate interactive-component groups, actual production DNS changes, sign-in policy mutation, administrator session revocation, batch advancement mutation, or overall security/release. Cross-route smoke, authorized report and invalid/denied states are checked, but independent mutation tests remain important wherever their owners are separate.

### Closure gate

**Closure evidence is now available for the five registered slices at tested SHA `5c1c49e051d4db632b92a2c81725671da642269e`.** The administrative DONE transition must record this exact commit, the final green run/artifact, scoped unit and browser evidence, responsive screenshots and regression/role reviews. The original `ux-admin-10-nov08-chat` owner is preserved. This acceptance does not certify separately registered sibling groups, production sign-in policy mutations, DNS provisioning, session revocation, batch execution, or full CI/security/release readiness.
