# Security policy

## Reporting a vulnerability

Please report suspected vulnerabilities **privately** through GitHub's private vulnerability reporting for this repository (Security tab, "Report a vulnerability"), or contact the repository owners directly. Do not open a public issue, and do not include real student, recruiter or college data in a report.

What helps: affected URL or file, the role used, exact steps, expected versus actual result, and any logs with personal data removed.

## What we do

We acknowledge reports within 3 working days, confirm or decline within 7 working days, and keep the reporter informed until the fix is released.

## Fix deadlines (proposed, owner to confirm)

| Severity | Fix or documented mitigation | Examples |
|---|---|---|
| Critical | 7 days | Cross-tenant data access, authentication bypass, remote code execution |
| High | 14 days | Privilege escalation within a tenant, stored XSS, sensitive data exposure |
| Moderate | 30 days | Limited-impact flaws, missing hardening with a realistic attack path |
| Low | 90 days | Defence-in-depth gaps |

Dependency advisories follow the same deadlines from the day the advisory is published. A deadline can only be extended by a recorded exception with an owner and an expiry date in `docs/tracker.json`.

## Scope

In scope: the vNext application, its API, workers, database schema and CI/CD. Out of scope: social engineering, physical attacks, denial-of-service load testing against shared environments, and any production data access.

## Safe harbour

Good-faith research that stays within this scope and does not access, change or retain other people's data will not be pursued.
