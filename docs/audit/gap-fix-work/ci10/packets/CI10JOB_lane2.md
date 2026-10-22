# ci10 CI-job packet lane 2: db00-scope

CI job db00-scope fails: "registered PG replay excludes exactly the independently exercised staged suites". The registry of staged PG suites vs the CI jobs that run them is out of sync. Fix the registry/workflow mapping (not the assertion).

Run (CI does it): see .github/workflows/ci.yml job db00-scope. Never weaken assertions, never .skip.

Log excerpt (CI run 39772266680):

```
##[endgroup]
TAP version 13
# Subtest: registered PG replay excludes exactly the independently exercised staged suites
not ok 1 - registered PG replay excludes exactly the independently exercised staged suites
  ---
  duration_ms: 2.450411
  type: 'test'
  location: '/home/runner/work/lms-vnext/lms-vnext/tests/db020-ci-matrix-coverage.test.mjs:25:1'
  failureType: 'testCodeFailure'
  error: |-
    Expected values to be strictly deep-equal:
    + actual - expected
    ... Skipped lines
    
      [
        'db10-log-alert-admin.test.ts',
        'db10-outbound-queue.test.ts',
        'db10-outbound-scope-fk.test.ts',
        'db10-skills-catalog.test.ts',
    ...
        'placements-db08-registration.test.ts',
    +   'placements-phase2-learner-gates.test.ts',
        'placements-w04-company-drive-facts.test.ts',
    +   'tpo-batch-workspace-db08.test.ts'
      ]
    
  code: 'ERR_ASSERTION'
  name: 'AssertionError'
  expected:
    0: 'db10-log-alert-admin.test.ts'
    1: 'db10-outbound-queue.test.ts'
    2: 'db10-outbound-scope-fk.test.ts'
    3: 'db10-skills-catalog.test.ts'
    4: 'placements-db08-batches.test.ts'
    5: 'placements-db08-external-offers.test.ts'
    6: 'placements-db08-registration.test.ts'
    7: 'placements-w04-company-drive-facts.test.ts'
  actual:
    0: 'db10-log-alert-admin.test.ts'
    1: 'db10-outbound-queue.test.ts'
    2: 'db10-outbound-scope-fk.test.ts'
    3: 'db10-skills-catalog.test.ts'
    4: 'placements-db08-batches.test.ts'
```
