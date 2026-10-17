# Graceful E2E acceptance — chat-15, round 2

**NOT EXECUTED by this builder (explicit owner instruction).** This file records authored test evidence, not an acceptance result. The orchestrator must merge chat-14 and chat-15, run tests against a pinned SHA, and fill in execution fields before declaring DONE for the product. `BLOCKED` below means browser certification is pending, not that the test source is missing.

| ID | Status | Authored evidence (path; test names carry ID) |
| --- | --- | --- |
| GR-80 | BLOCKED | `tests/e2e/graceful-public.spec.ts` — `GR-80 public sign-in ...` and phone sign-in; `graceful-role-saves.spec.ts` — Learner preferences, College department, Super Admin organization saves and each role's `GR-80 ... unknown record link`; `graceful-learner.spec.ts` — Learner profile save/offline/reload; `graceful-faculty.spec.ts` — Faculty assignment and membership switch; `graceful-mentor.spec.ts` — notifications, calendar recovery/offline; `graceful-tpo.spec.ts` — recruiter roster and companies; `graceful-recruiter.spec.ts` — conversation reply/offline; `graceful-recruiter-profile.spec.ts` — designation/name; `graceful-college-onboard.spec.ts` — person onboarding/offline; `graceful-college.spec.ts` — contacts recovery; `graceful-superadmin.spec.ts` — college create/offline; `graceful-double-submit.spec.ts` — pending guard/duplicate prevention; `graceful-production.spec.ts` — stale chunks. Pending per-page helper adoption, fixture prerequisites and execution. |
| GR-81 | DONE | Source authored: `tests/e2e/support/no-raw-error.ts` (`expectNoRawErrors`, `failApi`, `requests`, exact `GR02_TEXT`); `tests/e2e/graceful-helper.spec.ts` (`GR-81 rejects ...`, `GR-81 accepts actionable ...`). **Not executed**, so no verified pass. |
| GR-82 | BLOCKED | `tests/e2e/graceful-production.spec.ts` (`GR-82 sign-in is branded`, `GR-82 unknown public URL`, `GR-82 production does not serve JavaScript source maps`, `GR-82 HTML 502`, `GR-82 production JSON 500`, `GR-80 GR-82 stale chunk recovers`); `tests/e2e/playwright.graceful-production.config.ts` disables dev webserver. Needs production-build run. |
| GR-83 | BLOCKED | `tests/e2e/README-graceful.md` cross-references chat-14's eight `tests/unit/graceful-*.test.ts` files and `tests/integration/db10-outbound-queue.test.ts`. Chat-14 helper source and unit suites are now merged into main; Chat-14/orchestrator still owns independently executed unit + disposable PostgreSQL integration evidence. |

## Execution evidence — orchestrator only

- Tested commit SHA: **NOT RUN**
- Browser environment/database: **NOT RUN**
- Production build URL and build SHA: **NOT RUN**
- Unit/integration source and database SHA: **NOT RUN**
- Passed / failed / skipped counts: **NOT RUN**
- Traces, defects, remediation: **NOT RUN**

The GR-02 exact strings are imported from `main:src/lib/friendly-error.ts` after the round-2 main merge. Areas that still display older domain-only messages may fail the strict GR-80 expectations; this is a product adoption task, not a pass or a justification to relax the test.
