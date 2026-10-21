# Work packet (wave 3): edit src/components/placements/learner-placement-job-detail.tsx

2 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-15/u005-learner-placement-job-detail.md

## G2-15-005-013  [P1] MISSING  facet F04  effort L
- Legacy: Legacy POOL drive shows hostCollege/reportingAt/travelNote, OFF_CAMPUS external site prompt (JobDetailContent.jsx:1135-1153)
- vNext now: VNext Where shows only job.locations and no host/travel/report in projected toItem (jobs/[jobId]/page.tsx:13-28; learner-placement-job-detail.tsx:72-88)
- Fix: Project driveMode, host college, report time, travel note; display legacy specific messaging

## G2-15-005-024  [P1] MISSING  facet F06  effort L
- Legacy: Legacy profile Resume preview and `Add/Update resume on your profile` link (JobDetailContent.jsx:1017-1042)
- vNext now: VNext confirms `Resume Not attached` without fetching profile resume and only other profile links (learner-placement-jobs.tsx:441-460; learner-placement-job-detail.tsx:156-165)
- Fix: Show current scoped resume, preview, and accurate application submission disclosure or require owner-approved no-resume policy
