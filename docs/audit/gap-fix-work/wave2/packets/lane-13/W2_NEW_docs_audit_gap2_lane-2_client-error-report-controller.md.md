# Work packet (wave 2): NEW / MISSING items from docs/audit/gap2/lane-2/client-error-report-controller.md

1 findings. No vNext file yet: create the needed files, modules or routes inside the feature area of this lane.
Audit documents with full context: docs/audit/gap2/lane-2/client-error-report-controller.md

## G2-2-034-057  [P2] GAP  facet F20  effort M
- Legacy: src/app/api/client-errors/route.ts:55-59 hashes proxy IP/session cookie
- vNext now: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/ClientErrorReportController.java:98-107 rate by authenticated numeric account
- Fix: Verify x-forwarded-for trust at ingress, anonymous floods, and NAT fairness.
