# Work packet (wave 3): edit src/modules/placements/tpo-public-join-link-model.ts

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-8/job-slug-generator.md

## G2-8-010-001  [P1] MISSING  facet F01  effort L
- Legacy: Old external-job URL target uses `smr-`+16-char slug for HYBRID/EXTERNAL_ONLY jobs (`docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Job.java:220-236`)
- vNext now: No equivalent public job slug column; public recruiter join links instead target `/college-join/` or `/company-join/` (`src/modules/placements/tpo-public-join-link-model.ts:32-34; src/db/schema/placements.ts:157-1982`)
- Fix: Decide if public HYBRID/EXTERNAL_ONLY job pages still supported; create specific job external route if required, not a recruiter-join route
