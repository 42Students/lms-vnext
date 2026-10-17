# Graceful alerting verification — builder chat-16

Branch: `chatgpt/chat-16-b`. All tests below are **authored but NOT RUN**. DONE means code authored, not test-passed or deployed. Source implementation does not certify production readiness; DB10 migration registration, real webhook registration and Kubernetes tests are orchestrator-owned.

| ID | Status | Evidence (implementation; test with ID in name) |
| --- | --- | --- |
| GR-111 | DONE | `src/modules/log-alerts/telegram-notifier.ts`; `tests/unit/graceful-telegram-foundations.test.ts` GR-111 |
| GR-112 | DONE | `src/modules/log-alerts/signature.ts`; `tests/unit/graceful-telegram-foundations.test.ts` GR-112 |
| GR-113 | DONE | `src/modules/log-alerts/redaction.ts`; `tests/unit/graceful-telegram-foundations.test.ts` GR-113 |
| GR-114 | DONE | `src/observability/logger.ts`, `src/lib/api-error.ts`; reporter `src/modules/log-alerts/reporter.ts`; additional callback verification pending |
| GR-115 | BLOCKED (migration) | `src/db/schema/db10-log-alerts.draft.ts`; `docs/proposed-migrations/graceful-telegram-alerting.sql`; `tests/unit/graceful-alert-policy.test.ts` GR-115 and `tests/integration/graceful-telegram-persistence.test.ts` GR-115 |
| GR-116 | DONE | `src/modules/log-alerts/policy.ts` and `reporter.ts`; `tests/unit/graceful-alert-policy.test.ts` GR-116; `tests/integration/graceful-telegram-persistence.test.ts` GR-116 |
| GR-117 | BLOCKED (root boundary call) | `src/app/api/client-errors/route.ts`, `src/lib/report-client-error.ts`; `tests/unit/graceful-client-error.test.ts` and `tests/unit/graceful-client-errors-route.test.ts` GR-117; chat-14 must wire root boundary |
| GR-118 | BLOCKED (migration / secret) | `src/modules/log-alerts/scheduler.ts`, `src/app/api/internal/alerts/tick/route.ts`, `deploy/k8s/dev/alerting/vnext-alert-tick.yaml`; `tests/unit/graceful-alert-scheduler.test.ts` GR-118 |
| GR-119 | BLOCKED (migration / runtime evidence) | `src/modules/log-alerts/scheduler.ts`, daily counts; `tests/unit/graceful-alert-scheduler.test.ts` GR-119 |
| GR-120 | BLOCKED (cluster prerequisites) | `deploy/k8s/dev/alerting/vnext-health-watch.yaml`; `tests/unit/graceful-alert-ops-contract.test.ts` GR-120 |
| GR-121 | DONE | `scripts/ops/deploy-health-check.sh`; `tests/unit/graceful-alert-ops-contract.test.ts` GR-121 |
| GR-122 | BLOCKED (production webhook secret) | `src/app/api/webhooks/telegram/route.ts`, `src/modules/log-alerts/telegram-webhook.ts`; `tests/unit/graceful-telegram-webhook.test.ts` GR-122 |
| GR-123 | DONE | `src/modules/log-alerts/admin-service.ts`, `src/components/tracker/known-errors-workspace.tsx`; `tests/unit/graceful-telegram-webhook.test.ts` GR-123, preexisting `tests/integration/db10-log-alert-admin.test.ts` |
| GR-124 | DONE | `src/modules/log-alerts/readiness.ts`, notifier, `src/app/(authenticated)/tracker/logs/page.tsx` |
| GR-125 | BLOCKED (test execution / migration) | `tests/unit/graceful-telegram-foundations.test.ts`, `graceful-telegram-fake-server.test.ts`, `graceful-alert-policy.test.ts`, `graceful-alert-scheduler.test.ts`, `graceful-client-error.test.ts`, `graceful-telegram-webhook.test.ts`, `graceful-alert-ops-contract.test.ts`, `tests/integration/graceful-telegram-persistence.test.ts` |

Operator notes: health-watch CronJob is independent of web pods but **requires a network-reachable PostgreSQL endpoint**. If PostgreSQL is unavailable too, it exits failed rather than inventing a persisted two-failure state; install an independent external uptime alert to cover a combined cluster/DB outage. The deploy script requires `READY_URL` and is not self-triggering; the orchestrator must call it after rollouts. Telegram credentials are environment-only.
