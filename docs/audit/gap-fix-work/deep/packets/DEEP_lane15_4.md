# Deep verification packet (rows that fast mode DEFERRED)

These rows were marked DEFERRED without being checked. Each row must now end as exactly one of:
- OK: vNext already matches the old LMS. Give EVIDENCE: the vNext file:line that implements it AND the legacy source file (docs/legacy-source/...) it matches.
- FIXED: you changed the code so it matches. Give the commit and file.

DEFERRED is NOT allowed. For each row: read its full text in the source packet named next to it, find the old behaviour in docs/legacy-source, find the vNext code, decide, and fix if needed.
Keep tests passing and TypeScript valid; never silence errors. Write one result line per row under Results, push, then tick this packet in your queue.

- [ ] G2-14-020-004  (source: docs/audit/gap-fix-work/verify2/packets/lane-6/W1_lane6_8.md)
- [ ] G2-14-020-016  (source: docs/audit/gap-fix-work/verify2/packets/lane-6/W1_lane6_8.md)
- [ ] G2-14-020-019  (source: docs/audit/gap-fix-work/verify2/packets/lane-6/W1_lane6_8.md)
- [ ] G2-14-020-021  (source: docs/audit/gap-fix-work/verify2/packets/lane-6/W1_lane6_8.md)
- [ ] G2-14-020-030  (source: docs/audit/gap-fix-work/verify2/packets/lane-6/W1_lane6_8.md)
- [ ] G2-14-020-035  (source: docs/audit/gap-fix-work/verify2/packets/lane-6/W1_lane6_8.md)
- [ ] G2-14-020-042  (source: docs/audit/gap-fix-work/verify2/packets/lane-6/W1_lane6_8.md)
- [ ] G2-14-020-045  (source: docs/audit/gap-fix-work/verify2/packets/lane-6/W1_lane6_8.md)
- [ ] G2-14-020-057  (source: docs/audit/gap-fix-work/verify2/packets/lane-6/W1_lane6_8.md)
- [ ] G2-15-015-017  (source: docs/audit/gap-fix-work/verify2/packets/lane-6/W1_lane6_8.md)

## Results

- G2-14-020-004: OK — vNext implements the full company join flow outside company-service.ts: preview src/modules/placements/public-join/preview-service.ts:26 (getPublicJoinPreview, COMPANY scope), OTP request src/modules/placements/public-join/send-code-service.ts:39, join src/modules/placements/public-join/join-service.ts:49-290 bound to the stored link's company relationship, and link metrics (opensCount/joinsCount, link state) in src/modules/placements/tpo-public-join-link-service.ts:116-221; matches docs/legacy-source/backend/.../tpo/CompanyJoinService.java:117-198.
- G2-14-020-016: OK — vNext src/modules/placements/tpo-public-join-link-service.ts:44-46,150-197 refuses to create a company link without a verified company domain ("Add the company's email domain first, so only its people can join") and revokes the previous link (revokedAt) when a new token hash is stored; matches CompanyJoinService.java:77-89.
- G2-14-020-019: OK — vNext src/modules/placements/public-join/join-service.ts:95-130 requires the work email domain to match the stored company domain/verified domains (companyJoinEmailCandidate) and a live, unexpired, unlocked one-time code (matchesPublicJoinCode) before any grant; matches CompanyJoinService.java:137-165,218-229.
- G2-14-020-021: OK — vNext shows the legacy generic invalid-link page "This link is no longer valid" (src/components/placements/public-recruiter-join-form.tsx:195, src/components/tpo/recruiter-invite-landing.tsx:270; join-service.ts maps a DENIED/expired/revoked link to LINK_INVALID without disclosing which); matches CompanyJoinService.java:212-216.
- G2-14-020-030: OK — vNext src/modules/placements/public-join/join-service.ts:195-222 maps a verified public join into a recruiter grant with required expiry (recruiterGrantValidUntil using the college's access months), verificationStatus VERIFIED and DRIVES capability; an expired verified grant is renewed after a fresh code while revoked/removed grants cannot self-reactivate. Matches CompanyJoinService.java:246-276.
- G2-14-020-035: OK — same enforcement in join-service.ts:95-130 (email domain ownership + one-time code consumed in the transaction before the grant insert at :217-223); matches CompanyJoinService.java:137-165.
- G2-14-020-042: OK — same generic LINK_INVALID handling (join-service.ts decision DENIED -> PublicJoinAcceptError("LINK_INVALID"), UI public-recruiter-join-form.tsx:195); matches CompanyJoinService.java:212-216.
- G2-14-020-045: FIXED — src/modules/placements/public-join/join-service.ts now records a once-only PLACEMENTS_RECRUITER_WELCOME_INTENT (template recruiter-welcome, AWAITING_TEMPLATE_OUTBOX) in the same transaction only when the join created a new identity, alongside the existing TPO bell inAppNotifications insert (:254, copy from join-notification-model.ts); same pattern as public-recruiter-invite-accept-service.ts:205-220. Matches CompanyJoinService.java:186-197,235-243.
- G2-14-020-057: OK — vNext performs OTP (hashed code with HMAC secret, attempt lock, expiry) and all identity/profile/grant/activity/bell/welcome-intent writes in one database transaction (src/modules/placements/public-join/join-service.ts:76-290, code policy in public-join/code-policy.ts), never sending provider mail inside it; matches CompanyJoinService.java:137-165,186-197.
- G2-15-015-017: OK — vNext src/modules/placements/validation.ts:809-818 (placementEligibilityOverrideInputSchema) accepts only INCLUDE/EXCLUDE ("Choose include or exclude."), requires a trimmed reason of at least 3 characters ("A reason is required.") and keeps the 1000-character guard, used by src/app/api/placements/jobs/[jobId]/eligibility/[membershipId]/route.ts; matches docs/legacy-source/backend/.../tpo/TpoDriveExtrasService.java:384-389.
