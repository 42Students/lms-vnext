# U022 — TpoPublicLinkController

## Source closure

Legacy `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/tpo/TpoPublicLinkController.java:1-54`, `service/tpo/CollegePublicLinkService.java:1-259`, InviteCode/CompanyJoin/CompanyDirectory/TpoAudit services, college_public_link SQL and recruiter access grants. vNext `src/modules/placements/tpo-public-join-link-service.ts:1-200`, `tpo-public-join-link-model.ts:1-54`, `src/components/tpo/tpo-public-join-link-card.tsx:1-209`, `src/db/schema/placement-public-joins.ts:1-101`, public join APIs. Short names point to these paths, 1-based lines. No code/CI.

| ID | Facet | Legacy (file:line) | vNext (file:line) | Verdict | Severity | Fix | Effort |
|---|---|---|---|---|---|---|---|
| G2-16-022-001 | F01 | TpoPublicLinkController.java:15-19 /api/v1/tpo/public-link route. | tpo-public-join-link-service.ts:74-90 and /api/placements/tpo/public-join-links. | GAP | P2 | Map old API path/Settings navigation. | S |
| G2-16-022-002 | F01 | CollegePublicLinkService.java:28-35 one public college link. | tpo-public-join-link-service.ts:21-22 adds COMPANY scope. | EXTRA | P3 | Keep company-specific links separately. | S |
| G2-16-022-003 | F02 | CollegePublicLinkService.java:67-80 settings enabled/postDirect/hasLink/createdAt/opens/joins/token. | tpo-public-join-link-service.ts:73-90 returns only link counts/enabled. | GAP | P1 | Restore Post directly field and repeatable link sharing if approved. | M |
| G2-16-022-004 | F03 | TpoPublicLinkController.java:39-51 GET,new/save toggles. | tpo-public-join-link-card.tsx:165-180 create/replace/on checkbox, no postDirect. | MISSING | P1 | Add Post directly toggle. | M |
| G2-16-022-005 | F03 | CollegePublicLinkService.java:67-77 opens/joins counters. | tpo-public-join-link-card.tsx:165-168 displays counts. | MATCH | P3 | Keep counts. | S |
| G2-16-022-006 | F04 | CollegePublicLinkService.java:78-79 token rebuilt from nonce/hash. | tpo-public-join-link-service.ts:73-90 never redisplays token. | GAP | P1 | Offer safe repeatable share or make token loss recovery explicit. | M |
| G2-16-022-007 | F04 | CollegePublicLinkService.java:67-77 no row yields zero counters/false. | tpo-public-join-link-service.ts:81-90 link null/ready false. | GAP | P2 | Differentiate no link and storage unready. | S |
| G2-16-022-008 | F05 | CollegePublicLinkService.java:84-89 active invitation token from college settings. | tpo-public-join-link-service.ts:73-90 no returned existing token. | GAP | P1 | Wire active link into recruiter invite workflow. | M |
| G2-16-022-009 | F05 | CollegePublicLinkService.java:86-88 unique college link. | placement-public-joins.ts:25-36 unique hash, but multiple unrevoked college rows allowed. | GAP | P2 | Enforce one active per scope with partial index. | S |
| G2-16-022-010 | F06 | TpoPublicLinkController.java:24-27 enabled and postDirect nullable fields. | tpo-public-join-link-model.ts:50-53 only enabled boolean. | GAP | P1 | Add independent validated posting policy field. | M |
| G2-16-022-011 | F06 | CollegePublicLinkService.java:124-131 partial PUT preserves omitted Boolean. | tpo-public-join-link-service.ts:169-197 only enable/disable. | GAP | P2 | Add postDirect partial update with auditing. | S |
| G2-16-022-012 | F06 | CollegePublicLinkService.java:109-121 new link switches enabled true. | tpo-public-join-link-service.ts:94-165 new link enabled true. | MATCH | P3 | Keep default. | S |
| G2-16-022-013 | F07 | TpoPublicLinkController.java:29-33 no college `Not found`. | tpo-public-join-link-service.ts:30-42 scoped auth failure. | GAP | P2 | Offer actionable no-college guidance. | S |
| G2-16-022-014 | F07 | CollegePublicLinkService.java:97-99 `Couldn't make the link`. | tpo-public-join-link-card.tsx:55-63 longer friendly fallback. | GAP | P3 | Match exact legacy error copy if required. | S |
| G2-16-022-015 | F08 | CollegePublicLinkService.java:119-120 audit new link/old revoked. | tpo-public-join-link-card.tsx:59-61 `New link made`. | GAP | P3 | Show old link stopped working message. | S |
| G2-16-022-016 | F08 | CollegePublicLinkService.java:129-130 audit postDirect changes. | tpo-public-join-link-service.ts:189-196 audits enabled only. | MISSING | P1 | Audit posting policy changes. | M |
| G2-16-022-017 | F09 | TpoPublicLinkController.java:44-46 NEW no confirm in backend. | tpo-public-join-link-card.tsx:26,175-180 confirms replacement. | EXTRA | P3 | Keep safety confirmation if approved. | S |
| G2-16-022-018 | F10 | TpoPublicLinkController.java:39-51 GET,POST new,PUT save. | tpo-public-join-link-card.tsx:38-46 POST create,109-112 POST enable, GET status. | GAP | P2 | Adapt old API contract if clients retained. | S |
| G2-16-022-019 | F10 | CollegePublicLinkService.java:124-131 writes post_direct. | tpo-public-join-link-service.ts:169-197 no postWithoutApproval update. | MISSING | P1 | Persist postWithoutApproval. | M |
| G2-16-022-020 | F11 | TpoPublicLinkController.java:29-37 gets caller college. | tpo-public-join-link-service.ts:30-42 TPO/College Admin active checks. | EXTRA | P3 | Keep strict authorization. | S |
| G2-16-022-021 | F11 | CollegePublicLinkService.java:135-141 postDirect requires public grant+active+not expired. | tpo-public-join-link-service.ts:1-200 no posting gate. | GAP | P1 | Verify recruiter auto-post uses all provenance checks. | M |
| G2-16-022-022 | F12 | CollegePublicLinkService.java:109-121 rotate old invalidated. | tpo-public-join-link-service.ts:128-165 revoke/replace transaction. | MATCH | P3 | Keep single valid token. | S |
| G2-16-022-023 | F12 | CollegePublicLinkService.java:102-107 secret mismatch returns null. | tpo-public-join-link-service.ts:73-90 one-time token by design. | GAP | P2 | Document nonrecoverability and invite impact. | S |
| G2-16-022-024 | F13 | CollegePublicLinkService.java:67-80 absent settings empty. | tpo-public-join-link-card.tsx:157-163 no-ready Retry state. | EXTRA | P3 | Keep distinct unavailable vs no link. | S |
| G2-16-022-025 | F14 | CollegePublicLinkService.java:67-80 existing token re-shown. | tpo-public-join-link-card.tsx:121-127 clipboard freshUrl only. | GAP | P1 | Restore safe reuse or explicit new-link recovery. | M |
| G2-16-022-026 | F15 | CollegePublicLinkService.java:153-167 OTP email for business address. | placement-public-joins.ts:39-57 code challenge persistence. | MATCH | P3 | Keep rate-limited OTP email. | S |
| G2-16-022-027 | F15 | CollegePublicLinkService.java:119-130 TPO audit changes. | tpo-public-join-link-service.ts:152-160,189-196 events. | MATCH | P3 | Retain event log. | S |
| G2-16-022-028 | F16 | TpoPublicLinkController.java:15-53 backend no breakpoints. | tpo-public-join-link-card.tsx:130-209 responsive controls. | EXTRA | P3 | Compare live settings layout in separate UI scope. | S |
| G2-16-022-029 | F17 | TpoPublicLinkController.java:15-53 backend no ARIA. | tpo-public-join-link-card.tsx:131,170-174 label/checkbox. | EXTRA | P3 | Keep screen-reader-friendly toggle. | S |
| G2-16-022-030 | F18 | CollegePublicLinkService.java:119 `A new public link; the old one stopped working`. | tpo-public-join-link-model.ts:42-47 shorter `The old link stops working`. | GAP | P3 | Match warning wording. | S |
| G2-16-022-031 | F19 | CollegePublicLinkService.java:67-80 one settings SELECT. | tpo-public-join-link-service.ts:81-90 indexed active link read. | EXTRA | P3 | Keep bounded indexed lookup. | S |
| G2-16-022-032 | F20 | CollegePublicLinkService.java:111-120 HMAC nonce+server secret, hash stored. | tpo-public-join-link-service.ts:93-165 raw one-time random token, hash stored. | GAP | P2 | Document migration/rotation security tradeoff. | S |
| G2-16-022-033 | F20 | CollegePublicLinkService.java:124-131 settings update no expected version. | tpo-public-join-link-service.ts:169-197 expectedLinkId+lock. | EXTRA | P3 | Keep CAS. | S |
| G2-16-022-034 | F21 | CollegePublicLinkService.java:153-167 CompanyDirectory and business email OTP. | tpo-public-join-link-service.ts:45-70 company-domain-specific links. | GAP | P2 | Ensure college-wide link accepts verified business domain. | S |
| G2-16-022-035 | F22 | CollegePublicLinkService.java:67-69 college_public_link hash,nonce,post_direct,counts. | placement-public-joins.ts:6-36 hash,scope,expiry,postWithoutApproval,counts, no nonce. | GAP | P1 | Migrate settings and counters; decide token recovery. | M |
| G2-16-022-036 | F23 | CollegePublicLinkService.java:78-79 repeatable old link recovery. | tpo-public-join-link-service.ts:73-90 one-time link only. | GAP | P1 | Owner acceptance needed for changed recurring invite workflow. | M |
| G2-16-022-037 | F23 | placement-public-joins.ts:16-17 expiration and company scope are new. | CollegePublicLinkService.java:67-80 no expiry, college-only. | EXTRA | P3 | Keep expiry and scopes as intentional. | S |

## Unit summary

37 rows cover F01–F23. Verdict {"GAP":20,"EXTRA":9,"MISSING":3,"MATCH":5}; severity {"P2":9,"P3":17,"P1":11}. Top: Post directly setting and gate are not wired here; existing token not redisplayable unlike legacy; activation uniqueness, invite token reuse and exact response shape require proof. UNKNOWN live: actual recruiter autoapproval policy and migration readiness; check before implementing.
