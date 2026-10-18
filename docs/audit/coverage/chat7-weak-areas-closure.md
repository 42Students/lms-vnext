# Chat-7 WEAK-AREAS remediation ledger — 18 Oct 2026

Baseline: `docs/audit/coverage/WEAK-AREAS.md` on `main` listed Courses at **336 files, 313 referenced, 93% file reference, 871 exports / 710 named = 82% export reference**. These are **heuristic source-name reference metrics**, not proof of behavioural branch coverage. The generated report has **not been regenerated** after chat-7 pushes and must not be manually edited to inflate the percentage.

Test statuses in this ledger: **A = direct behavioural unit exercising export, but unexecuted**; **B = imported with mocked persistence and meaningful results/denials, unexecuted**; **C = source-contract or structural assertions, unexecuted**. "Missing" means no added chat-7 coverage, not that no prior lane has any.

| WEAK-AREAS courses source | Chat-7 test | Depth |
|---|---|---|
| admin-course-workspace.ts | `chat7-admin-course-workspaces-weak.test.ts` | B: same actor/college in 4 dependencies, returned summaries |
| admin-offering-learning-workspace.ts | `chat7-admin-course-workspaces-weak.test.ts` | B: scope permission, offering resolution, missing ancestry, per-lesson counts |
| assignment-scope.ts | `chat7-courses-assignment-quiz-scope-weak.test.ts` | B: parent offering, section-specific submission mismatch, missing assessment |
| college-assessment-export-model.ts | `chat7-courses-weak-export-boundaries.test.ts` | A: export URL, filters, CSV injection, results release |
| college-assessment-export-service.ts | `chat7-college-assessment-export-service-weak.test.ts` | B: context retention, 40-page / 1000 cap, bad requests |
| college-assignment-authoring-options.ts | `chat7-college-authoring-options-weak.test.ts` | B: scoped options and next sequence |
| college-content-authoring-service.ts | `chat7-college-content-authoring-weak.test.ts` | B: role, acting college, drafts vs hidden published URLs, cap and lessons |
| college-course-catalogue-export-model.ts | `chat7-courses-weak-export-boundaries.test.ts` | A: scoped URL, CSV escaping |
| college-course-setup-relations-service.ts | `chat7-college-course-setup-weak.test.ts` | C: remove duplicate academic-period JOIN and assert scoped relations |
| college-course-teachers-service.ts | `chat7-college-course-scoped-readers-weak.test.ts` | B/C: offering/college permission, exact read cap, active teachers |
| college-faculty-picker-service.ts | `chat7-college-course-scoped-readers-weak.test.ts` | B/C: active faculty role, cap, authorization |
| college-ist-datetime-model.ts | `chat7-courses-weak-export-boundaries.test.ts` | A: leap days, IST midnight, invalid dates |
| college-offering-section-preview-service.ts | `chat7-college-course-scoped-readers-weak.test.ts` | B/C: stale/foreign delivery and valid beyond first 200 |
| college-quiz-authoring-options.ts | `chat7-college-authoring-options-weak.test.ts` | B: scoped quiz sequence |
| delivery-roster.ts | `chat7-course-delivery-roster-weak.test.ts` | B/C: elective vs ordinary active learner roster, query tenant constraints |
| faculty-content-preview-model.ts | `chat7-faculty-content-preview-weak.test.ts` | A: HTTPS/no-credential, YouTube host and embed ID |
| faculty-lesson-visibility-staged.ts | `chat7-faculty-lesson-staged-weak.test.ts` | B: schema unavailable, visible-only projection and empty |
| learner-access-guard.ts | `chat7-learner-access-guard-weak.test.ts` | B: active caller/persisted membership, user status, tenant denied |
| learner-assignment-methods-service.ts | `chat7-learner-assignment-methods-weak.test.ts` | B: published/visible/exact delivery, role denied and safe fallback |
| lesson-resource-materials-model.ts | `chat7-course-resource-materials-weak.test.ts` | A: strict HTTPS/no credentials, CRUD ID, deployment flag |
| quiz-scope.ts | `chat7-courses-assignment-quiz-scope-weak.test.ts` | B: parent offering and result visibility scoping |
| resource-material-readiness.ts | `chat7-courses-weak-export-boundaries.test.ts` | A: fail closed unless exact DB05 readiness |

## Additional tests for core area not specifically weak-file-listed

`PROJ-BREAK-LEARNER-01.test.ts`, `PROJ-BREAK-LEARNER-02.test.ts`, `PROJ-BREAK-FACULTY-01.test.ts`, `PROJ-BREAK-LEARNER-ROUTES-01.test.ts`, `COURSES-BREAK-FACULTY-01.test.ts`, `COURSES-BREAK-FACULTY-02.test.ts`, `COURSES-BREAK-ROUTES-01.test.ts`, `chat7-superadmin-course-tenant-bulk.test.ts`, `chat7-superadmin-course-authoring-break.test.ts` target actual learner/faculty adversarial routes, published-grading and project state-machine behaviour.

## Non-claims and release gates

- No real PostgreSQL test server/fixtures accessible in this connector-only session. B/C results are unit mock/source contracts, **not proof of SQL, constraints, tenancy or authorization in a deployed server**.
- `scripts/audit/weak-test-areas.mjs`, strict TypeScript, Vitest, route integration and UX browser flows have **not run**. Both the generated report and overall `projects-ledger.md` are maintained by other lanes.
- For high-stakes Projects rollout to IIT Dharwad, get independent lane review and real transaction/parallel-session/expired-auth test evidence for every identified defect in `docs/audit/defects-chat-7.md` before release.
- Other `src/modules/courses` exports beyond the listed weak sources and learner subset remain to audit; this file intentionally does not claim universal 871-export coverage.
