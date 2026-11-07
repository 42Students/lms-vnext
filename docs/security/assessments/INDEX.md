# Assessments and evidence index (2026-11-08)

Code-read and dev-evidence assessments written before the single CI pass. None of this is tracker evidence (the tracker validator needs a passing CI run and a commit SHA); each row becomes a tracker entry after that run and an independent review.

| Group | Document | Evidence |
|---|---|---|
| SEC-01 authentication | assessments/SEC-01-authentication.md | enumeration measured on dev |
| SEC-02 sessions and devices | assessments/SEC-02-session-and-device.md | evidence/http-surface-checks |
| SEC-03, 04, 08 access control | assessments/SEC-03-04-08-access-control.md | evidence/role-route-matrix, cross-college-api-probe, horizontal-learner-probe, unauthenticated-api-sweep; `role-matrix-baseline.json` |
| SEC-05, 06 tenant isolation and RLS | assessments/SEC-05-06-tenant-isolation-and-rls.md, tables-without-college-id.md, derived-policy-plan.json, table-classification.json, rls-rollout.md | isolation sweep (619 checks), performance probe, runtime principal probe |
| SEC-07 database privilege | assessments/SEC-07-database-privilege-and-integrity.md | role-split.sql, principal probe |
| SEC-09, 12, 21 secrets, browser, backup | assessments/SEC-09-12-21-secrets-browser-backup.md | evidence/http-surface-checks |
| SEC-10 encryption and data | assessments/SEC-10-encryption-and-sensitive-data.md | data-inventory.md |
| SEC-11 uploads | assessments/SEC-11-file-uploads-and-storage.md | |
| SEC-15 integrations | assessments/SEC-15-integrations-webhooks.md | |
| SEC-16 background jobs | assessments/SEC-16-background-jobs.md | internal route reachability |
| SEC-17 cloud and network | assessments/SEC-17-cloud-network-infrastructure.md | read-only kubectl |
| SEC-18 supply chain | assessments/SEC-18-supply-chain-and-ci.md | accepted-risks.md |
| SEC-19 logging and detection | assessments/SEC-19-logging-audit-detection.md | audit trail rows on dev |
| SEC-20 incident response | runbooks/incident-response.md (draft) | |
| SEC-22 privacy | data-inventory.md | |
| Gate 0 | GATE0-CI-RED.md | CI run 42414194708, local unit reproduction |

Also: assessments/SEC-13-business-logic.md and assessments/SEC-14-23-24-25-26-remaining.md. Not assessed: SEC-22 beyond the data inventory. Owner-facing list: OWNER-ACTIONS.md. Ranked work: NEXT-UP.md.
