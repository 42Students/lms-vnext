# Production observability baseline

This document defines the production observability target for LMS vNext.

It separates code-side behavior that is already implemented from Google Cloud configuration that cannot be completed until the real project exists.

## Application logs

Server-side application logs use structured JSON written to stdout/stderr.

Required common fields:

- severity
- event
- timestamp

Unexpected errors additionally expose an Error Reporting-friendly message/stack trace at the top level of the JSON record.

Do not log passwords, session cookies, Identity Platform tokens, verification codes, database credentials, or raw request bodies.

Current structured events include:

- unexpected API errors
- database readiness failures
- database migration started/completed/failed
- public deployment smoke success

## Error Reporting

Target platform: Google Cloud Error Reporting over Cloud Run logs.

The code-side logger is formatted so Cloud Logging can ingest severity and stack-trace data without adding a second error-reporting SDK solely for transport.

Still account-bound:

- deploy to the real Cloud Run project
- confirm errors are grouped in Error Reporting
- configure alerting/notification channels
- exercise one controlled non-production error and confirm end-to-end visibility

Until those are verified, the production-readiness "error tracking" item remains partial.

## Database performance

Target platform: Cloud SQL Query Insights.

Production Cloud SQL should enable Query Insights so slow/high-cost SQL can be diagnosed by latency and total database load.

Do not enable raw client/user attribution simply for convenience if it would expose unnecessary personal data.

Before launch:

1. enable Query Insights on the production instance
2. confirm the operations team can access the dashboard with least-privilege roles
3. establish the first latency/load baseline from real traffic
4. review top queries by total time and latency
5. add an alert or review threshold only after baseline data makes the threshold meaningful

Until Query Insights is enabled on a real instance, the "slow query monitoring" item remains partial.

## Core signals

At minimum, production monitoring should cover:

- Cloud Run request error rate
- Cloud Run latency
- Cloud Run instance/container failures
- readiness failures
- migration-job failures
- Cloud SQL CPU
- Cloud SQL memory/connection pressure where available
- Cloud SQL storage growth
- backup failures
- Query Insights top query load
- Identity Platform/SMS abuse signals when phone login is enabled

## Alert quality

Prefer actionable alerts over noisy threshold spam.

Every production alert should answer:

- what user-facing risk is occurring?
- which service/database is affected?
- what runbook should the operator follow?
- is immediate action required or is this a trend to review?

## Privacy

Operational telemetry must preserve tenant isolation and data minimization.

Do not emit full learner/faculty records, phone numbers, email addresses, access tokens, session cookies, OTP codes or arbitrary request payloads into logs.

If a future domain needs user-level correlation, use an intentionally selected internal identifier and document why it is necessary.
