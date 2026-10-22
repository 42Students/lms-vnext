# ci10 CI-job packet lane 3: db02-staged-acceptance

CI job db02-staged-acceptance fails while APPLYING scripts/sql/db02-academic-progression-and-rooms-staging.sql: column cohorts.start_date already exists (a migration now creates it). Make the staging script idempotent on a fully migrated DB (ADD COLUMN IF NOT EXISTS, CREATE ... IF NOT EXISTS, guarded constraints via DO blocks catching duplicate_object). Then make sure its tests pass.

Run (CI does it): see .github/workflows/ci.yml job db02-staged-acceptance. Never weaken assertions, never .skip.

Log excerpt (CI run 39772266680):

```
CREATE FUNCTION
DROP TRIGGER
CREATE TRIGGER
psql:scripts/sql/db02-academic-progression-and-rooms-staging.sql:684: ERROR:  column "start_date" of relation "cohorts" already exists
##[error]Process completed with exit code 3.
Post job cleanup.
```
