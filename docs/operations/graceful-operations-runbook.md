# Graceful operations runbook (GR-102, GR-103, GR-105, GR-106, GR-108, GR-109)

Goal: customers never see a crash, and when something does go wrong we find it first and recover fast. Commands assume the isolated gcloud config and kubeconfig described in `docs/operations/` and the deployment notes; dev namespace `lms-dev-2026`. Never run any of this against production from a development session; production changes follow the owner-approved cutover plan.

## 1. Deploying safely (GR-101, GR-102)
1. Build the images from a clean checkout of the commit (`git archive HEAD`), tag by short sha. The web build needs `NODE_OPTIONS=--max-old-space-size=6144` (already in the Dockerfile).
2. Run the migrate Job from the migrator image first. Migrations must be backward compatible with the currently running web image (GR-103): additive only (new tables, new nullable columns, new indexes); a column or table is removed one release after the code stopped using it.
3. `kubectl set image deploy/lms-vnext web=<registry>/web:<sha> -n <ns>`. The deployment is `maxUnavailable: 0` with a startup and a readiness probe on `/ready`, so a new copy that crashes or cannot reach the database never receives traffic and the old copy keeps serving (this saved the 2026-10-17 dev deploy when a bad route table crashed the new pod at start).
4. Watch `kubectl rollout status deploy/lms-vnext -n <ns> --timeout=240s`. If it does not finish, roll back (section 2).
5. Smoke: `curl -s -o /dev/null -w "%{http_code}" https://<host>/login` is 200 for the platform and each college host, and `/ready` reports the database ok.

## 2. Rolling back
- Code: `kubectl rollout undo deploy/lms-vnext -n <ns>` (returns to the previous image within seconds, no data change).
- Data: only if a migration was destructive (should not happen, GR-103): restore from the named Cloud SQL backup (section 6) into a new instance and cut over; this is a planned, owner-approved action.

## 3. Maintenance mode (GR-17)
Set `MAINTENANCE_MODE=1` in the deployment env (`kubectl set env deploy/lms-vnext MAINTENANCE_MODE=1 -n <ns>`); every page returns a calm 503 with `Retry-After`, `/ready` stays honest. Unset with `kubectl set env deploy/lms-vnext MAINTENANCE_MODE- -n <ns>`. Announce on the status line (section 5) first.

## 4. Finding what went wrong from a reference id (GR-05, GR-105)
A user quotes "Reference: ab12cd34". Search the structured log:

    gcloud logging read 'resource.type="k8s_container" AND resource.labels.namespace_name="<ns>" AND resource.labels.container_name="web" AND jsonPayload.requestId="ab12cd34"' --project students-384817 --freshness=7d --format=json

The entry carries the component, the event (`api.unhandled_error` for unexpected faults), the redacted error and the route. Never paste database values or personal data into tickets.

## 5. Alerts and status (GR-104, GR-106)
- Log-based metric `vnext_dev_unhandled_api_errors` counts `api.unhandled_error` events from the dev web pods. Alerts go to Telegram only (owner decision: no email): the app reports new error signatures, spikes, a daily digest and a one-minute health watch to the same bot and chat as the old LMS, tagged `[vnext dev]` outside production (checklist GR-111 to GR-125). The metric is a backup counter. Production gets the same pipeline with the production tag and the acknowledge webhook.
- Status line: a one-sentence note in the support channel and on the maintenance page ("We are making a quick update, back in about N minutes").

## 6. Backups and restore drill (GR-109)
- Daily automated backups with 7-day point-in-time recovery exist on the Cloud SQL instance. An on-demand backup before any risky change: `gcloud sql backups create --instance=<instance> --description="<why> <date>"`.
- Quarterly drill: restore the latest backup into a scratch instance (`gcloud sql backups restore <id> --restore-instance=<scratch>`), run `scripts/migrate/nsrit/verify.ts` style counts, delete the scratch instance, record the date and the time it took here.

## 7. Weekly error review (GR-108)
Every week: list the top 10 `requestId`s by count of `api.unhandled_error` and `component`, turn each into a ticket with the reproduction, and confirm last week's are gone.

## 8. Capacity (GR-110)
Dev runs one copy (100m CPU / 256Mi requested). Production design: two copies minimum spread across nodes, autoscaling 2 to 6 on 70% CPU, see `deploy/k8s/production-design/`. Revisit after the first college's real load (requests per minute, p95 latency, database connections: `DB_POOL_MAX` times replicas must stay below the database connection limit).
