# Work packet: edit src/app/api/placements/jobs/[jobId]/eligibility/[membershipId]/route.ts

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-17/job-eligibility-override-repository.md

## G2-17-014-026  [P1] GAP  facet F11  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/tpo/TpoWorkspaceController.java:211-217 — TPO needs active college scope; principal source.
- vNext now: src/app/api/placements/jobs/[jobId]/eligibility/[membershipId]/route.ts:28-33 — GET requires actor (TPO/admin), superadmin exception.
- Fix: Verify superadmin acting-college scope on direct GET.
