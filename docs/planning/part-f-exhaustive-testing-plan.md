# Part F: exhaustive testing program (LOCKED by owner, 2026-10-23)

Owner decision: every test type in groups A to G below is in scope, none skipped. The LMS is the business; the move off the old stack exists so production does not break. Logical (business-rule) errors cannot be fully caught by tests; everything else must be.

## Policy (locked)

1. Coverage target: 100% statements, branches, functions and lines across `src/`, enforced by the tool in CI.
2. Exclusions only via a written exclusion list in the repo (generated parser code, type-only files, config). Every entry needs a reason; the list changes only with owner approval. No `istanbul ignore` comments, no lowered thresholds, no skipped tests.
3. Ratchet: measure the baseline per module, floor = measured value, any drop fails CI, floors rise module by module (critical modules first) until each reaches 100% and is locked there.
4. Critical modules (auth, permissions, tenant isolation, grading, fees/payments, identity, data import) need 100% coverage AND a high mutation score.
5. Source-text "contract" tests stay but do not count toward coverage.
6. Prod gate: no deploy to production unless lint, typecheck, unit, integration, coverage floor, e2e smoke, accessibility, DB migration/drift, and security scan are all green. Dev only until then; never prod without the gate.
7. Work is done by GPT lanes in file/module packets; Claude orchestrates only.

## Order of work

1. Measure coverage, write the per-module baseline.
2. Wire the ratchet and the deploy gate.
3. Critical modules to 100% plus mutation testing.
4. Remaining modules in packets until all are locked at 100%.
5. Browser, accessibility, visual, load, security and release layers.

## Catalog (status "today" = repo scan 2026-10-23: Have / Partial / None)

### A. Code-level correctness
| Test type | Proves | Today |
|---|---|---|
| Unit (pure functions) | Logic returns right values | Have (many only read source text) |
| Service tests on real Postgres | Queries, transactions, constraints | Partial |
| Component render tests (loading, empty, error, full) | Every page renders | Partial (~125) |
| Hook and state tests | Client state and effects | Partial |
| Property-based tests (fast-check) | Validators, parsers, calculations hold for random inputs | None |
| Boundary and edge-value tests | Min, max, empty, unicode, huge input | Partial |
| Mutation testing | Tests fail when code is broken | None |
| Static analysis (tsc strict, ESLint) | Type and style bugs | Have (Part A/B in progress) |

### B. System and integration
| Test type | Proves | Today |
|---|---|---|
| API contract tests | Every route returns documented shape and status | Partial |
| Request validation / fuzzing | Bad or malicious input rejected, never crashes | None |
| Authorization matrix | Each role can do exactly what it should | Partial |
| Tenant isolation | College A never reads or writes college B | Partial |
| Concurrency and race tests | Parallel actions do not corrupt data | Partial |
| Idempotency and retry tests | Repeat requests and webhooks are safe | Partial |
| Background job and queue tests | Scheduled work, email, SMS run once and recover | None |
| Third-party integration tests (sandbox) | Email, SMS, storage, payment providers behave | None |
| Transaction rollback and failure injection | Mid-operation crash leaves data consistent | Partial |

### C. Database
| Test type | Proves | Today |
|---|---|---|
| Fresh-DB migration | All migrations run from empty | Have |
| Data-preserving migration | Migration on a copy of real data loses nothing | Partial |
| Schema drift check | DB matches schema | Have |
| Rollback and restore drill | Backup restores, app works on it | None |
| Constraint and index tests | Uniqueness, FKs, indexes hold | Partial |
| Legacy data import checks | Counts and values match old LMS | Partial |

### D. Browser and user experience
| Test type | Proves | Today |
|---|---|---|
| End-to-end per role | Real flows work in a browser | Partial (63 specs) |
| Cross-browser (Chromium, Firefox, WebKit) | Works beyond Chrome | None |
| Mobile viewport tests | Phone and tablet layouts | Partial |
| Accessibility (axe, keyboard, screen-reader checks) | WCAG compliance | None automated |
| Visual regression | No unintended layout or style change | Unclear |
| Wording parity vs old LMS | Strings match exactly | Partial |
| Error-state and offline tests | Failures show proper messages | Partial |
| Form and file-upload tests | Large, wrong-type, malformed files | Partial |

### E. Security
| Test type | Proves | Today |
|---|---|---|
| Dependency audit | No known vulnerable packages | None in CI |
| Secret scanning | No keys committed | None in CI |
| SAST (static security rules) | Injection and unsafe patterns | None |
| Auth and session tests | Login, logout, expiry, lockout, token reuse | Partial |
| Rate-limit and abuse tests | Brute force and flooding throttled | None |
| Security headers and CSP checks | Browser protections on | None |
| Penetration-style tests (dev only) | Common attack paths fail | None |

### F. Performance and reliability
| Test type | Proves | Today |
|---|---|---|
| Load test | Handles expected concurrent users | Partial (4 scripts, not in CI) |
| Stress and spike | Fails gracefully past capacity | None |
| Soak (long run) | No memory or connection leaks | None |
| Query performance budgets | No slow queries at real data size | None |
| Bundle size and build checks | Pages do not bloat or break the build | Partial |

### G. Release and production safety
| Test type | Proves | Today |
|---|---|---|
| Boot-time config validation | App refuses to start on bad config | Partial |
| Post-deploy smoke | Key flows work right after deploy | None |
| Health and readiness checks | Dependencies reachable | Partial |
| Rollback test | A bad release can be reverted safely | None |
| Canary / staged rollout checks | Errors visible before everyone sees them | None |
| Monitoring and alert tests | Alerts really fire on failure | None |

## Done definition

Every row above is Have with a CI job (or a scheduled job for F/G), the coverage gate is at 100% with only the approved exclusion list, critical modules pass the mutation threshold, and the prod deploy workflow refuses to run unless all gates are green.

## Decisions made by the orchestrator under owner delegation (2026-10-23)

Owner said "you decide all those"; these are locked unless the owner overrides.

1. Sequence: (a) finish Part A (5 packets left) and the deep-verification queue (34 packets); (b) coverage baseline per module; (c) ratchet + deploy gate; (d) critical modules to 100% plus mutation testing; (e) rest of the modules in packets, interleaved with strictness B to H on the same files so each file is touched once; (f) browser, accessibility, security, performance and release layers (groups D to G); (g) visual polish last; (h) dev redeploy; production only after the gate is green and the owner approves.
2. Lanes: 10 lanes, one persistent chat each with its real chat id recorded. Nudge a lane only when its branch has not moved for 30 minutes. At least 3 minutes between sends, never create chats from the home page in a loop, no blanket "continue all" on a timer.
3. Lanes only: no Claude agents, no Claude code fixes. Claude plans, writes packets, merges and reports.
4. Critical modules (100% coverage + mutation score >= 80%): auth, identity, permissions, system-roles, admin-scope, organizations, colleges, tenant-domains, module-access, storage, messaging, notifications, inbound-mail, verification, profile-verification, and the grading/assessment, fee/payment and import paths inside courses, placements and projects. Everything else (academics, activity, announcements, attendance, bug-tracker, departments, electives, groups, log-alerts, operations, people, platform-settings, skills, system, admin-ui, rest of courses/placements/projects) gets 100% line/branch coverage, no mutation gate at first.
   Largest modules by file count (packet planning): placements 1149, courses 384, projects 339, people 136, academics 102.
5. End-to-end smoke per role, one login-to-main-flow-to-logout path each: student, faculty, mentor, college admin, TPO, HR, super admin.
6. Prod approval: the owner approves every production deploy manually even when all gates are green. Lanes and Claude never deploy to production.
7. Staging: the dev environment doubles as staging for load, soak, restore and rollback tests until the owner asks for a separate one. Zero-cost tooling only (GitHub Actions on the public repo, Playwright, axe, k6, free secret/dependency scanners).
8. Exclusion list: one file, `docs/planning/coverage-exclusions.md` plus the coverage config; every entry needs a reason and the owner's approval; no inline ignore comments.
9. Owner-only go-live checklist: private R2 bucket, ZeptoMail token rotation, go-live decision, prod approval of each deploy, DNS and TLS for custom hosts.
10. Target date: set after the coverage baseline gives a measured estimate; until then no date is promised.
