# Work packet (wave 3): NEW / MISSING items from docs/audit/gap2/lane-15/u005-learner-placement-job-detail.md

1 findings. No vNext file yet: create the needed files, modules or routes inside the feature area of this lane.
Audit documents with full context: docs/audit/gap2/lane-15/u005-learner-placement-job-detail.md

## G2-15-005-017  [P1] MISSING  facet F04  effort L
- Legacy: Legacy applied receipt shows APP-id, appliedAt, resume URL/name (JobDetailContent.jsx:911-959)
- vNext now: VNext JobActions shows `Applied · channel` badge only; no visible receipt (learner-placement-jobs.tsx:286-301,533-679)
- Fix: Add durable application receipt with timestamp/reference/resume details and safe preview
