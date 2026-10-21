# Work packet (wave 2): edit src/modules/placements/tpo-public-join-link-service.ts

21 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-16/u022-tpo-public-link.md, docs/audit/gap2/lane-4/tpo-company-controller.md, docs/audit/gap2/lane-8/job-slug-generator.md

## G2-16-022-001  [P2] GAP  facet F01  effort S
- Legacy: TpoPublicLinkController.java:15-19 /api/v1/tpo/public-link route.
- vNext now: tpo-public-join-link-service.ts:74-90 and /api/placements/tpo/public-join-links.
- Fix: Map old API path/Settings navigation.

## G2-16-022-007  [P2] GAP  facet F04  effort S
- Legacy: CollegePublicLinkService.java:67-77 no row yields zero counters/false.
- vNext now: tpo-public-join-link-service.ts:81-90 link null/ready false.
- Fix: Differentiate no link and storage unready.

## G2-16-022-011  [P2] GAP  facet F06  effort S
- Legacy: CollegePublicLinkService.java:124-131 partial PUT preserves omitted Boolean.
- vNext now: tpo-public-join-link-service.ts:169-197 only enable/disable.
- Fix: Add postDirect partial update with auditing.

## G2-16-022-023  [P2] GAP  facet F12  effort S
- Legacy: CollegePublicLinkService.java:102-107 secret mismatch returns null.
- vNext now: tpo-public-join-link-service.ts:73-90 one-time token by design.
- Fix: Document nonrecoverability and invite impact.

## G2-16-022-032  [P2] GAP  facet F20  effort S
- Legacy: CollegePublicLinkService.java:111-120 HMAC nonce+server secret, hash stored.
- vNext now: tpo-public-join-link-service.ts:93-165 raw one-time random token, hash stored.
- Fix: Document migration/rotation security tradeoff.

## G2-16-022-034  [P2] GAP  facet F21  effort S
- Legacy: CollegePublicLinkService.java:153-167 CompanyDirectory and business email OTP.
- vNext now: tpo-public-join-link-service.ts:45-70 company-domain-specific links.
- Fix: Ensure college-wide link accepts verified business domain.

## G2-4-023-003  [P2] GAP  facet F01  effort M
- Legacy: GET /{companyId}/engagement and POST /{companyId}/join-link are direct actions from company control (`docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/tpo/TpoCompanyController.java:70-80`)
- vNext now: New company page and public join-link service separate company detail from link status/create (`src/app/(authenticated)/tpo/companies/page.tsx:130-143`; `src/modules/placements/tpo-public-join-link-service.ts:73-105`)
- Fix: Ensure detail links and company scoped link controls reachable without extra redirects.

## G2-4-023-014  [P2] GAP  facet F04  effort M
- Legacy: Legacy engagement fields include opens and joins counters with hasLink and createdAt (`docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/CompanyJoinService.java:104-115`)
- vNext now: New link status counters named opensCount/joinsCount and enabled/ready (`src/modules/placements/tpo-public-join-link-service.ts:73-90`)
- Fix: Translate names, null/zero defaults and date formatting explicitly.

## G2-4-023-023  [P2] GAP  facet F06  effort M
- Legacy: Legacy generate link has no request body, rotates immediately (`docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/tpo/TpoCompanyController.java:76-80`)
- vNext now: New change-link API requires explicit scope and action CREATE/REPLACE with expected link (`src/modules/placements/tpo-public-join-link-service.ts:93-104,128-138`)
- Fix: Show Replace link confirmation and existing link warning before rotation.

## G2-4-023-050  [P2] GAP  facet F13  effort M
- Legacy: Legacy invalid link throws LINK_INVALID / This link is no longer valid (`docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/CompanyJoinService.java:211-215`)
- vNext now: New requires DB table readiness and can return NOT_REGISTERED (`src/modules/placements/tpo-public-join-link-service.ts:22-27,95-104`)
- Fix: Separate expired/revoked invite errors from migration-disabled messages.

## G2-4-023-061  [P2] GAP  facet F18  effort M
- Legacy: Legacy domain failure exact text `Add the company's email domain first, so only its people can join` (`docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/CompanyJoinService.java:77-82`)
- vNext now: New symbolic DOMAIN_REQUIRED error from service (`src/modules/placements/tpo-public-join-link-service.ts:22-27,99-104`)
- Fix: Map error to legacy helper sentence in link panel.

## G2-4-023-066  [P2] GAP  facet F20  effort M
- Legacy: Legacy join links do not expire by time (`docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/CompanyJoinService.java:77-93,211-215`)
- vNext now: New schema requires expiresAt; service uses sentinel 9999-12-31 (`src/modules/placements/tpo-public-join-link-service.ts:143-149`)
- Fix: Document sentinel lifespan and test date overflow/expiry boundary.

## G2-4-023-071  [P2] GAP  facet F22  effort M
- Legacy: Legacy join token hash/counters live on CollegeCompany row (`docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/CompanyJoinService.java:77-115`)
- vNext now: New `placementPublicJoinLinks` table versioned history and status (`src/modules/placements/tpo-public-join-link-service.ts:73-90,139-150`)
- Fix: Migrate existing active hashes, counters and creation time or explicitly expire with notice.

## G2-8-010-002  [P2] GAP  facet F01  effort M
- Legacy: Generator is a Spring component, not directly a router (`docs/legacy-source/backend/src/main/java/com/_42students/lms/util/JobSlugGenerator.java:11-12`)
- vNext now: Token generator belongs to TPO public join service, no common reusable job-slug utility (`src/modules/placements/tpo-public-join-link-service.ts:1-21,139-163`)
- Fix: Define dedicated public-job token service if parity required; do not conflate join identity links with job application

## G2-8-010-005  [P2] GAP  facet F03  effort M
- Legacy: Legacy external slug is materialized and logged raw at create/update (`docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/AdminJobServiceImpl.java:491-509,877-893`)
- vNext now: New join link displayed once; raw token never persisted or re-displayed (`src/modules/placements/tpo-public-join-link-service.ts:73-90,93-95,142-163`)
- Fix: Use one-time secret presentation with explicit link-copy UX; avoid replicating legacy raw-secret logging

## G2-8-010-006  [P2] GAP  facet F04  effort M
- Legacy: Slug always starts `smr-` (`docs/legacy-source/backend/src/main/java/com/_42students/lms/util/JobSlugGenerator.java:25-27`)
- vNext now: Public join tokens have no human readable `smr-` prefix (`src/modules/placements/tpo-public-join-link-service.ts:142-147; src/modules/placements/tpo-public-join-link-model.ts:32-34`)
- Fix: If external job share parity required, preserve old prefix in compatibility resolver; new token may use secure distinct scheme

## G2-8-010-007  [P2] GAP  facet F04  effort M
- Legacy: Exactly 16 random alphabet characters appended; generated slug length exactly 20 (`docs/legacy-source/backend/src/main/java/com/_42students/lms/util/JobSlugGenerator.java:15-16,25-33`)
- vNext now: Public join token `randomBytes(32).toString('base64url')`: 43 URL-safe characters; no job slug (`src/modules/placements/tpo-public-join-link-service.ts:142-147`)
- Fix: Document and test legacy slug length mapping; use URL-safe alphabet for new generation

## G2-8-010-012  [P2] GAP  facet F06  effort M
- Legacy: Validator separately called `isValidSlug(String)` and checks prefix, lengths and regex (`docs/legacy-source/backend/src/main/java/com/_42students/lms/util/JobSlugGenerator.java:36-50`)
- vNext now: New incoming public join token handled through route token input and stored hash (no isValidSlug bridge) (`src/modules/placements/tpo-public-join-link-service.ts:142-147; src/db/schema/placement-public-joins.ts:9-10,28-31`)
- Fix: Add explicit legacy validation only on old public-job compatibility route; never accept insecure slug as new join token

## G2-8-010-019  [P2] GAP  facet F10  effort L
- Legacy: Legacy generator returns plaintext slug directly; uniqueness checked by repo in service (`docs/legacy-source/backend/src/main/java/com/_42students/lms/util/JobSlugGenerator.java:25-34; docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/AdminJobServiceImpl.java:491-509`)
- vNext now: vNext public recruiter link returns one-time path and stores SHA-256 digest (`src/modules/placements/tpo-public-join-link-service.ts:139-163`)
- Fix: Document distinct security contract, and build separate public job lookup if old feature still required

## G2-8-010-026  [P2] GAP  facet F12  effort M
- Legacy: Legacy slug stays on job once generated; never auto-expires in generator (`docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Job.java:220-236; docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/AdminJobServiceImpl.java:491-509`)
- vNext now: New recruiter join can be revoked/replaced; stores expiresAt max date and enabled toggle (`src/modules/placements/tpo-public-join-link-service.ts:139-149,168-188`)
- Fix: Specify lifecycle for external job links and preserve old bookmarks until explicit revocation if business requires

## G2-8-010-039  [P2] GAP  facet F22  effort M
- Legacy: Legacy jobs with INTERNAL_ONLY default have null slug; generating depends on visibility (`docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Job.java:220-236; docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/AdminJobServiceImpl.java:491-509`)
- vNext now: VNext public join issuance depends on TPO scope and explicit CREATE/REPLACE, not placement visibility (`src/modules/placements/tpo-public-join-link-model.ts:3-24; src/modules/placements/tpo-public-join-link-service.ts:93-105`)
- Fix: Model visibility-linked public access in job lifecycle separately from invitation link lifecycle
