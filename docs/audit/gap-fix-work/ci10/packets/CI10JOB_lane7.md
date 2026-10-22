# ci10 CI-job packet lane 7: db08-staged-acceptance

CI job db08-staged-acceptance: 2 files fail (P-S1-03 target cohort, P-S2-06 response hours, T-S2-08 median CTC, stale ACTIVE context) and SQL error duplicate key module_access_rules_scoped_uq. Fix the fixtures/code.

Run (CI does it): see .github/workflows/ci.yml job db08-staged-acceptance. Never weaken assertions, never .skip.

Log excerpt (CI run 39772266680):

```
   ❯ Section A: placement write/read integration boundaries (10)
     ✓ P-S1-05 counts only VERIFIED off-campus offers in held capacity and apply 388ms
     ✓ P-S1-02 enforces active debarment in the feed and application write 157ms
     × P-S1-03 enforces target cohort in both discovery and apply 44ms
     × P-S2-06 applies persisted college response hours without crediting Sunday partial hours 27ms
     × T-S2-08 hides median/highest CTC when five offers belong to just one learner 516ms
     ✓ P-S1-07 persists exactly-once expiry and rejects acceptance at the deadline 167ms
     ✓ P-S1-07 concurrent sweep skips a locked offer then expires it once on release 136ms
     ✓ P-S1-06 accept cascade declines sibling offers and withdraws sibling applications atomically 211ms
     ✓ LEARNER-placements-R03 accepting an internship never withdraws another live application or offer 163ms
     ✓ LEARNER-placements-R03 retains a Dream drive and its offer after another offer is accepted 181ms
 ❯ tests/integration/placements-db08-registration.test.ts (7 tests | 7 failed) 250ms
   ❯ DB08-B per-cohort consented learner registration (6)
     × denies stale ACTIVE context when the persisted learner account was disabled 54ms
     × denies a stale ACTIVE context when the persisted membership is suspended 33ms
     × stores a single consent and event on repeated identical self registration 33ms
     × records a changed choice and clears current consent, preserving first event 32ms
     × does not register when a batch has not been invited 33ms
     × rejects wrong-cohort direct SQL registrations and missing consent 32ms
   ❯ DB08-B manager debarment with SQL-generated immutable audit (1)
     × creates and lifts a manual debarment, idempotently 32ms
 ✓ tests/integration/placements-db08-external-offers.test.ts (4 tests) 212ms
 ✓ tests/integration/tpo-batch-workspace-db08.test.ts (3 tests) 309ms
(node:3035) DeprecationWarning: Calling client.query() when the client is already executing a query is deprecated and will be removed in pg@9.0. Use async/await or an external async flow control mechanism instead.
(Use `node --trace-deprecation ...` to show where the warning was created)
 ✓ tests/integration/placements-w04-company-drive-facts.test.ts (2 tests) 177ms

⎯⎯⎯⎯⎯⎯ Failed Tests 10 ⎯⎯⎯⎯⎯⎯⎯

 FAIL  tests/integration/placements-db08-registration.test.ts > DB08-B per-cohort consented learner registration > denies stale ACTIVE context when the persisted learner account was disabled
 FAIL  tests/integration/placements-db08-registration.test.ts > DB08-B per-cohort consented learner registration > denies a stale ACTIVE context when the persisted membership is suspended
 FAIL  tests/integration/placements-db08-registration.test.ts > DB08-B per-cohort consented learner registration > stores a single consent and event on repeated identical self registration
 FAIL  tests/integration/placements-db08-registration.test.ts > DB08-B per-cohort consented learner registration > records a changed choice and clears current consent, preserving first event
```
