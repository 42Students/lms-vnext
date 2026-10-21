# Work packet (wave 2): edit src/db/schema/tpo-crm.ts

5 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-10/public-campaign-unsubscribe-controller.md, docs/audit/gap2/lane-14/u022-tpo-recruiter-lead-controller.md, docs/audit/gap2/lane-5/u012-tpo-calendar.md

## G2-10-026-069  [P2] GAP  facet F22  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/TpoEmailCampaignService.java:130-133 — Lead uses LocalDateTime unsubscribedAt.
- vNext now: src/db/schema/tpo-crm.ts:61-61 — New timestamptz.
- Fix: Map timezone semantics.

## G2-14-022-065  [P2] GAP  facet F22  effort M
- Legacy: Legacy invite token lifecycle/revisit fields in recruiter lead `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/TpoRecruiterLeadService.java:272-325`
- vNext now: New invite hash/time/reminder/unsusbcribed fields with SQL checks `src/db/schema/tpo-crm.ts:51-63` `src/db/schema/tpo-crm.ts:117-129`
- Fix: Map historical invite hashes and do not reuse expired tokens

## G2-5-012-100  [P2] GAP  facet F22  effort L
- Legacy: Legacy FollowUp primary key Long, recruiter lead Long, dueAt LocalDateTime (`docs/legacy-source/backend/src/main/java/com/_42students/lms/model/tpo/FollowUp.java:20-33`)
- vNext now: vNext UUID id/leadId, timestamptz dueAt (`src/db/schema/tpo-crm.ts:180-202`)
- Fix: Document ID and time conversion rules; preserve old URL compatibility if migrated

## G2-5-012-101  [P2] GAP  facet F22  effort L
- Legacy: Legacy FollowUp stores owner_faculty_id; vNext stores owner_membership_id with college composite FK (`docs/legacy-source/backend/src/main/java/com/_42students/lms/model/tpo/FollowUp.java:26-35`)
- vNext now: vNext ownerMembershipId and tenant FK (`src/db/schema/tpo-crm.ts:184-220`)
- Fix: Map ownership on any migration and maintain per-college foreign-key enforcement

## G2-5-012-102  [P2] GAP  facet F22  effort M
- Legacy: Legacy follow_up query excludes completed and uses due_at date-indexed range (`docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/TpoInsightsService.java:474-481`)
- vNext now: vNext has index college, doneAt, dueAt plus conditional read filters (`src/db/schema/tpo-crm.ts:203-221`)
- Fix: Ensure composite index is used for bounded calendar queries and terminal exclusion
