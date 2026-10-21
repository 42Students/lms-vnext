# Work packet: NEW / MISSING items from docs/audit/gap2/lane-8/public-college-join-controller.md

6 findings. These findings have no vNext file yet: create the files, modules or routes needed, inside the feature area of this lane.
Audit documents with full context: docs/audit/gap2/lane-8/public-college-join-controller.md

## G2-8-026-014  [P1] GAP  facet F04  effort M
- Legacy: Legacy recruiter identifies by contactMail and firstName/lastName, phone, designation (docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/CollegePublicLinkService.java:55-63,202-213).
- vNext now: New canonical users.email/displayName, placementRecruiterProfiles.title and optional separate phone storage (src/modules/placements/public-join/join-service.ts:116-170).
- Fix: Define exact name split and historic recruiter email ID crosswalk.

## G2-8-026-021  [P1] GAP  facet F06  effort M
- Legacy: Legacy Company name asked only after code, maxLength200, required whitespace rule (docs/legacy-source/frontend/src/pages/college-join/[token].js:137-141).
- vNext now: New companyName after code when unknown, maxLength200 but visible Input lacks required attr (src/components/placements/public-recruiter-join-form.tsx:191-199).
- Fix: Require unknown company name at form and server; focus input on empty submit.

## G2-8-026-062  [P1] GAP  facet F22  effort M
- Legacy: Legacy college_public_link unique college ID + token hash, nonce, enabled/postDirect, opens/joins (docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/CollegePublicLinkService.java:67-80,109-131).
- vNext now: New UUID link, scope COLLEGE / COMPANY, tokenHash, explicit expiresAt/revokedAt, counters, no nonce (src/db/schema/placement-public-joins.ts:6-36).
- Fix: Map old HMAC-derived token links to new hashed UUID links; plan token continuity or forced rotation.

## G2-8-026-064  [P1] GAP  facet F22  effort M
- Legacy: Legacy recruiter and recruiter_college_access integer entities, company resolved domain (docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/CollegePublicLinkService.java:182-221).
- vNext now: New users/profile/company relationship/grants UUID plus verification status and scoped expiry (src/modules/placements/public-join/join-service.ts:116-202).
- Fix: Migrate recruiter identity and college grants with exact eligibility and verification data.

## G2-8-026-023  [P2] GAP  facet F07  effort M
- Legacy: Legacy field errors under relevant field via FIELD_OF mapping (docs/legacy-source/frontend/src/pages/college-join/[token].js:6-10,54-60).
- vNext now: New errors go to single focused InlineNotice at bottom of form (src/components/placements/public-recruiter-join-form.tsx:44-46,217-218).
- Fix: Restore field-level errors and focus target on invalid email/mobile/name/code.

## G2-8-026-029  [P3] GAP  facet F08  effort M
- Legacy: Legacy success You now have access to college; sign in code each time (docs/legacy-source/frontend/src/pages/college-join/[token].js:100-106).
- vNext now: New same title and similar copy but ALREADY_JOINED description differs (src/components/placements/public-recruiter-join-form.tsx:134-142).
- Fix: Preserve full old already-joined subtitle with placement address.
