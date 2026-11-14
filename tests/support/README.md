# Shared test fixtures

One place to look before writing a new fixture. Prefer these over a new inline setup.

| Need | Use |
|---|---|
| A person with a membership and role in a college (real PostgreSQL) | `actors.ts`: `person`, `insertPerson`, `deletePerson`, `contextFor`, `seedContext`, `seededCollegeAdmin` |
| A placement job tree owned by a college | `placement-college.ts`, `publishable-job-fixture.ts`, `placement-job-tree-cleanup.ts` |
| A persisted job with a recruiter grant | `persisted-job-recruiter-fixture.ts` |
| Learner placement, course and learning surfaces | `learner-*-fixture.ts` |
| Attendance and immutable grades | `db045-attendance-fixture.mjs`, `db045-immutable-grade-fixture-cleanup.mjs` |
| A route handler run through the real wrapper | `route-chain.ts` |
| An object store that records calls | `fake-object-store.ts` |
| "No-store" source-text contract | `cache-pin.ts` |
| Disposable-database guard | `db018-test-target.mjs` |

Rules: a fixture creates only what it deletes; append-only history needs `SET LOCAL session_replication_role = replica` in cleanup on the
disposable database; never point a fixture at a non-disposable database (the guard refuses).
