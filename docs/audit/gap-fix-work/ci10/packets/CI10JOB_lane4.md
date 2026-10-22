# ci10 CI-job packet lane 4: db10-skills-acceptance

CI job db10-skills-acceptance fails while applying scripts/sql/db10-log-alerts-staging.sql: relation log_alert_signatures already exists (a migration creates it now). Make that staging script (and db10-skills-catalog-staging.sql) idempotent on a fully migrated DB (IF NOT EXISTS / guarded DO blocks). Then make sure its tests pass.

Run (CI does it): see .github/workflows/ci.yml job db10-skills-acceptance. Never weaken assertions, never .skip.

Log excerpt (CI run 39772266680):

```
  DB03_ISOLATED_TEST_DATABASE: 1
  DB018_ISOLATED_TEST_DATABASE: 1
##[endgroup]
psql:scripts/sql/db10-log-alerts-staging.sql:35: ERROR:  relation "log_alert_signatures" already exists
##[error]Process completed with exit code 3.
Post job cleanup.
```
