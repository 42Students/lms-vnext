# Work packet (wave 2): edit src/components/projects/project-workspace-readiness.tsx

4 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-7/u032-superadmin-readiness.md

## G2-7-032-013  [P2] GAP  facet F03  effort S
- Legacy: readiness/index.js:521-527 Current readiness Card Ready/Not ready Tag
- vNext now: project-workspace-readiness.tsx:43-49 PageHeader with StatusBadge Ready/Not ready
- Fix: Put readiness badge in Current readiness Card header

## G2-7-032-016  [P2] GAP  facet F04  effort S
- Legacy: readiness/index.js:537-540 separate task and sprint Progress percentages and labels
- vNext now: project-workspace-readiness.tsx:72-81 MetricBar for tasks/sprints/releases
- Fix: Match two separate legacy completion bars and label text

## G2-7-032-017  [P2] GAP  facet F04  effort M
- Legacy: readiness/index.js:545-578 readiness detail table tasks/sprints/releases/submission/state/reason/override details
- vNext now: project-workspace-readiness.tsx:59-83 shows abbreviated State/Reason/Submission then bars
- Fix: Restore every detail row including active, note, override by/at

## G2-7-032-079  [P2] GAP  facet F22  effort M
- Legacy: readiness/index.js:555-575 totalReleases, shippedReleases, submissionExists/status/readinessState
- vNext now: project-workspace-readiness.tsx:62-81 execution.releases, finalSubmission.latest, readinessOverride state
- Fix: Specify field mapping and archived/completed lifecycle overrides
