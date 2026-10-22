# ci10 CI-job packet lane 5: db10-outbound-acceptance

CI job db10-outbound-acceptance fails while applying scripts/sql/db10-outbound-queue-staging.sql: relation outbound_messages already exists. Make scripts/sql/db10-outbound-queue-staging.sql and the docs/planning/sql/db10-*.sql files it applies idempotent on a fully migrated DB. Then make sure its tests pass.

Run (CI does it): see .github/workflows/ci.yml job db10-outbound-acceptance. Never weaken assertions, never .skip.

Log excerpt (CI run 39772266680):

```
  DB10_ISOLATED_TEST_DATABASE: 1
  DB10_OUTBOUND_SCOPE_FK_ENFORCED: 1
##[endgroup]
psql:scripts/sql/db10-outbound-queue-staging.sql:66: ERROR:  relation "outbound_messages" already exists
##[error]Process completed with exit code 3.
Post job cleanup.
```
