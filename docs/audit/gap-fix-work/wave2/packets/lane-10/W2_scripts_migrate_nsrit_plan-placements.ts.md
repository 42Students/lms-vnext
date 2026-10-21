# Work packet (wave 2): edit scripts/migrate/nsrit/plan-placements.ts

2 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-4/job-preferences-repository.md

## G2-4-015-015  [P2] GAP  facet F04  effort M
- Legacy: Legacy papInterest Yes/No/Need more info persists separately from DTO. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/model/JobPreferences.java:38-39`)
- vNext now: Migration stores it in unmapped metadata instead of typed profile. (`scripts/migrate/nsrit/plan-placements.ts:1960-1960`)
- Fix: Retain durable recoverable metadata if field intentionally unsupported.

## G2-4-015-063  [P2] MISSING  facet F22  effort M
- Legacy: Legacy exam slot and PAP values persisted in table. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/model/JobPreferences.java:34-39`)
- vNext now: New typed schema excludes them and migration marks unmapped. (`src/modules/people/profile-validation.ts:509-518`; `scripts/migrate/nsrit/plan-placements.ts:1960-1960`)
- Fix: Preserve both in durable metadata and expose exam field in UI.
