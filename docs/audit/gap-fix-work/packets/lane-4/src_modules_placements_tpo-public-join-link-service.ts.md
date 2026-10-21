# Work packet: edit src/modules/placements/tpo-public-join-link-service.ts

13 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-16/u022-tpo-public-link.md, docs/audit/gap2/lane-8/job-slug-generator.md, docs/audit/gap2/lane-4/tpo-company-controller.md

## G2-16-022-003  [P1] GAP  facet F02  effort M
- Legacy: CollegePublicLinkService.java:67-80 settings enabled/postDirect/hasLink/createdAt/opens/joins/token.
- vNext now: tpo-public-join-link-service.ts:73-90 returns only link counts/enabled.
- Fix: Restore Post directly field and repeatable link sharing if approved.

## G2-16-022-006  [P1] GAP  facet F04  effort M
- Legacy: CollegePublicLinkService.java:78-79 token rebuilt from nonce/hash.
- vNext now: tpo-public-join-link-service.ts:73-90 never redisplays token.
- Fix: Offer safe repeatable share or make token loss recovery explicit.

## G2-16-022-008  [P1] GAP  facet F05  effort M
- Legacy: CollegePublicLinkService.java:84-89 active invitation token from college settings.
- vNext now: tpo-public-join-link-service.ts:73-90 no returned existing token.
- Fix: Wire active link into recruiter invite workflow.

## G2-16-022-016  [P1] MISSING  facet F08  effort M
- Legacy: CollegePublicLinkService.java:129-130 audit postDirect changes.
- vNext now: tpo-public-join-link-service.ts:189-196 audits enabled only.
- Fix: Audit posting policy changes.

## G2-16-022-019  [P1] MISSING  facet F10  effort M
- Legacy: CollegePublicLinkService.java:124-131 writes post_direct.
- vNext now: tpo-public-join-link-service.ts:169-197 no postWithoutApproval update.
- Fix: Persist postWithoutApproval.

## G2-16-022-021  [P1] GAP  facet F11  effort M
- Legacy: CollegePublicLinkService.java:135-141 postDirect requires public grant+active+not expired.
- vNext now: tpo-public-join-link-service.ts:1-200 no posting gate.
- Fix: Verify recruiter auto-post uses all provenance checks.

## G2-16-022-036  [P1] GAP  facet F23  effort M
- Legacy: CollegePublicLinkService.java:78-79 repeatable old link recovery.
- vNext now: tpo-public-join-link-service.ts:73-90 one-time link only.
- Fix: Owner acceptance needed for changed recurring invite workflow.

## G2-8-010-021  [P1] MISSING  facet F10  effort M
- Legacy: Legacy update generates if visibility changed to external and slug blank (`docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/AdminJobServiceImpl.java:877-895`)
- vNext now: VNext has no job visibility-triggered `smr-` issuance (`src/modules/placements/tpo-public-join-link-service.ts:93-105`)
- Fix: Hook external job link creation to eligible visibility lifecycle and owner-controlled rotation

## G2-16-022-013  [P2] GAP  facet F07  effort S
- Legacy: TpoPublicLinkController.java:29-33 no college `Not found`.
- vNext now: tpo-public-join-link-service.ts:30-42 scoped auth failure.
- Fix: Offer actionable no-college guidance.

## G2-4-023-027  [P2] GAP  facet F07  effort M
- Legacy: Legacy missing company domain for join link: `Add the company's email domain first, so only its people can join` (`docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/CompanyJoinService.java:77-82`)
- vNext now: New link returns TPO_PUBLIC_JOIN_LINK_DOMAIN_REQUIRED code (`src/modules/placements/tpo-public-join-link-service.ts:22-27,99-104`)
- Fix: Render exact legacy resolution guidance and link to domain form.

## G2-4-023-032  [P2] GAP  facet F08  effort M
- Legacy: Legacy generation returns engagement plus one-time `token` (`docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/CompanyJoinService.java:77-93`)
- vNext now: New returns `path` and status link metadata (`src/modules/placements/tpo-public-join-link-service.ts:139-165`)
- Fix: Show one-time full shareable URL and copy warning, not opaque relative path only.

## G2-8-010-014  [P2] GAP  facet F07  effort S
- Legacy: Null or length <4 validator returns false; other invalid values return false rather than throw (`docs/legacy-source/backend/src/main/java/com/_42students/lms/util/JobSlugGenerator.java:42-49`)
- vNext now: Zod public-join change schema throws parse issues for invalid action/scope/confirmation (`src/modules/placements/tpo-public-join-link-model.ts:3-24; src/modules/placements/tpo-public-join-link-service.ts:93-95`)
- Fix: Map invalid legacy job slug to stable not-found/invalid-link response without disclosing internals

## G2-8-010-015  [P2] GAP  facet F07  effort M
- Legacy: After 50 attempts legacy throws explicit user-facing `Unable to generate a unique external link for this job. Please try again or contact support.` (`docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/AdminJobServiceImpl.java:495-505`)
- vNext now: New join issuance returns distinct NOT_REGISTERED, NOT_FOUND, DOMAIN_REQUIRED, ALREADY_EXISTS, STALE errors (`src/modules/placements/tpo-public-join-link-service.ts:21-27,93-104`)
- Fix: Preserve external-job issuance error meaning; new recruiter-link errors should remain domain-specific
