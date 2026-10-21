# Work packet (wave 2): edit src/modules/placements/college-drive-overview-service.ts

2 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-9/college-admin-jobs-overview.md

## G2-9-011-018  [P2] GAP  facet F04  effort S
- Legacy: `docs/legacy-source/frontend/src/pages/college-admin/jobs/[jobId]/index.js:219-224` — Description rendered jobDescription, ellipsis three rows
- vNext now: `src/modules/placements/college-drive-overview-service.ts:19-25` — Description from placementJobs.description; empty string may show empty section
- Fix: Show divider/description only when meaningful, truncate to three rows

## G2-9-011-063  [P2] GAP  facet F22  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/college-admin/jobs/[jobId]/index.js:193-206` — Legacy Job fields companyLogo/jobType/isDraft/isActive/deadline used for card
- vNext now: `src/modules/placements/college-drive-overview-service.ts:19-24` — New placementJobs joined companyName, seasonName, status/employmentType/workMode
- Fix: Map enum/status, logo and jobType fields to joined vNext schema
