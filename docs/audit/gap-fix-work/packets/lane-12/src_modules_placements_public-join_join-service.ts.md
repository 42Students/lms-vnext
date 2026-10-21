# Work packet: edit src/modules/placements/public-join/join-service.ts

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-8/public-college-join-controller.md

## G2-8-026-065  [P1] GAP  facet F23  effort M
- Legacy: Legacy postDirect and long-lived college public link, old tokens rebuilt with HMAC nonce (docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/CollegePublicLinkService.java:91-141).
- vNext now: New expiry/revocation and audited no-review bypass false, multiple scope kinds (src/db/schema/placement-public-joins.ts:14-23; src/modules/placements/public-join/join-service.ts:189-202).
- Fix: Document approved retirement of unlimited token and direct-post option or restore equivalent.
