# Deep verification packet (rows that fast mode DEFERRED)

These rows were marked DEFERRED without being checked. Each row must now end as exactly one of:
- OK: vNext already matches the old LMS. Give EVIDENCE: the vNext file:line that implements it AND the legacy source file (docs/legacy-source/...) it matches.
- FIXED: you changed the code so it matches. Give the commit and file.

DEFERRED is NOT allowed. For each row: read its full text in the source packet named next to it, find the old behaviour in docs/legacy-source, find the vNext code, decide, and fix if needed.
Keep tests passing and TypeScript valid; never silence errors. Write one result line per row under Results, push, then tick this packet in your queue.

- [ ] G2-12-006-028  (source: docs/audit/gap-fix-work/verify2/packets/lane-4/W1_lane4_4.md)
- [ ] G2-12-006-038  (source: docs/audit/gap-fix-work/verify2/packets/lane-4/W1_lane4_4.md)
- [ ] G2-12-006-040  (source: docs/audit/gap-fix-work/verify2/packets/lane-4/W1_lane4_4.md)
- [ ] G2-12-020-002  (source: docs/audit/gap-fix-work/verify2/packets/lane-4/W1_lane4_4.md)
- [ ] G2-12-020-018  (source: docs/audit/gap-fix-work/verify2/packets/lane-4/W1_lane4_4.md)
- [ ] G2-12-020-034  (source: docs/audit/gap-fix-work/verify2/packets/lane-4/W1_lane4_4.md)
- [ ] G2-12-020-035  (source: docs/audit/gap-fix-work/verify2/packets/lane-4/W1_lane4_4.md)
- [ ] G2-12-020-055  (source: docs/audit/gap-fix-work/verify2/packets/lane-4/W1_lane4_4.md)
- [ ] G2-13-012-001  (source: docs/audit/gap-fix-work/verify2/packets/lane-4/W1_lane4_4.md)
- [ ] G2-13-012-002  (source: docs/audit/gap-fix-work/verify2/packets/lane-4/W1_lane4_4.md)

## Results

- G2-12-006-028: OK — vNext src/components/placements/learner-applications-browse.tsx:395-410 (application details section opened per application with a collapse Button aria-expanded/aria-controls) plus the journey cards in learner-placement-journey.tsx match docs/legacy-source/frontend/src/pages/learn/my-placements/applications.js:123-143.
- G2-12-006-038: OK — vNext learner-applications-browse.tsx:63-64 (SELF only while staffOptOutUntil is in the future) and :465-468 (visible "opt out until <date>" notice) and learner-placement-journey.tsx:243-249 match applications.js:121,145-147.
- G2-12-006-040: FIXED — the withdrawal grant was never passed to the browse component so only the heuristic opt-out path existed; src/app/(authenticated)/learn/my-placements/applications/page.tsx now passes the server-derived withdrawalMode as `withdraw` (SELF/REQUEST/null) and src/components/placements/learner-placement-journey.tsx item type gained `withdraw`, which authorizedWithdrawalMode (learner-applications-browse.tsx:59-66) already honours first (applications.js:165-170).
- G2-12-020-002: OK — vNext src/modules/placements/tpo-company-domain-service.ts:60-84 writes the same child aggregate placementCompanyDomains (addedByUserType TPO, verifiedBy42 false) as super-admin-company-identities-service.ts:76-84, matching CompanyDomainService.java:16-25.
- G2-12-020-018: FIXED — src/modules/placements/company-curation-domain-model.ts (shared by TPO and super-admin paths) now rejects personal/disposable/academic/IP/invalid inputs with the exact per-outcome legacy wording from publicWorkEmailIssueCopy (was one generic message); matches CompanyDomainService.java:41-52,90-102.
- G2-12-020-034: FIXED — one domain policy: companyDomainSchema (company-curation-domain-model.ts) now emits legacy Check.message() copy for every caller, and super-admin-company-identities-model.ts normalizeCompanyDomain passes those exact messages through instead of re-wording; TPO (tpo-company-domain-service.ts:17-35) and super admin use the same schema plus companyDomainAcceptsMail.
- G2-12-020-035: OK — vNext src/modules/placements/super-admin-company-identities-service.ts:80-84 and tpo-company-domain-service.ts:81-84 insert domains with verifiedBy42:false and the comment at tpo-company-domain-service.ts:78-79 states TPO cannot attest; matches docs/legacy-source/backend/src/main/java/com/_42students/lms/model/CompanyDomain.java:34-35.
- G2-12-020-055: FIXED — website/email/@domain/raw host normalisation (company-curation-domain-model.ts domainFromInput, tpo-trusted-domain-validation.ts normalizeTpoTrustedDomainInput) already existed; exact error mapping now added via company-curation-domain-model.ts and super-admin-company-identities-model.ts, matching CompanyDomainService.java:16-25,77-103 Check.message().
- G2-13-012-001: OK — vNext src/modules/placements/company-mail-domain-resolver.ts is the extracted shared resolver (MX then A/AAAA, 24h cache, UNKNOWN never blocks) called from public-join/send-code-service.ts:99 and tpo-company-domain-service.ts:33; matches DnsMailDomainResolver.java:22-34.
- G2-13-012-002: OK — vNext applies the same requireMail policy at both call sites: public-join/send-code-service.ts:99 (checkEmail path) and tpo-company-domain-service.ts:33 (checkDomain path), both via companyDomainAcceptsMail(domain,true); matches CompanyDomainService.java:16-24,77-102.
