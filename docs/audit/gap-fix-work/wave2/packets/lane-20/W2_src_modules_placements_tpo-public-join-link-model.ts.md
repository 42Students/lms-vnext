# Work packet (wave 2): edit src/modules/placements/tpo-public-join-link-model.ts

4 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-8/job-slug-generator.md, docs/audit/gap2/lane-16/u022-tpo-public-link.md

## G2-8-010-006  [P2] GAP  facet F04  effort M
- Legacy: Slug always starts `smr-` (`docs/legacy-source/backend/src/main/java/com/_42students/lms/util/JobSlugGenerator.java:25-27`)
- vNext now: Public join tokens have no human readable `smr-` prefix (`src/modules/placements/tpo-public-join-link-service.ts:142-147; src/modules/placements/tpo-public-join-link-model.ts:32-34`)
- Fix: If external job share parity required, preserve old prefix in compatibility resolver; new token may use secure distinct scheme

## G2-8-010-033  [P2] GAP  facet F18  effort S
- Legacy: Visible error on collision `Unable to generate a unique external link...`; validator no custom label (`docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/AdminJobServiceImpl.java:501-505; docs/legacy-source/backend/src/main/java/com/_42students/lms/util/JobSlugGenerator.java:42-49`)
- vNext now: Public join model uses different exact strings `Make a link`, `New link`, `Copy it now...` (`src/modules/placements/tpo-public-join-link-model.ts:36-48`)
- Fix: Audit job-link copy independent of recruiter join link and preserve error precision

## G2-8-010-039  [P2] GAP  facet F22  effort M
- Legacy: Legacy jobs with INTERNAL_ONLY default have null slug; generating depends on visibility (`docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Job.java:220-236; docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/AdminJobServiceImpl.java:491-509`)
- vNext now: VNext public join issuance depends on TPO scope and explicit CREATE/REPLACE, not placement visibility (`src/modules/placements/tpo-public-join-link-model.ts:3-24; src/modules/placements/tpo-public-join-link-service.ts:93-105`)
- Fix: Model visibility-linked public access in job lifecycle separately from invitation link lifecycle

## G2-16-022-030  [P3] GAP  facet F18  effort S
- Legacy: CollegePublicLinkService.java:119 `A new public link; the old one stopped working`.
- vNext now: tpo-public-join-link-model.ts:42-47 shorter `The old link stops working`.
- Fix: Match warning wording.
