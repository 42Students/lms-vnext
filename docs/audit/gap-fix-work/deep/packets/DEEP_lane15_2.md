# Deep verification packet (rows that fast mode DEFERRED)

These rows were marked DEFERRED without being checked. Each row must now end as exactly one of:
- OK: vNext already matches the old LMS. Give EVIDENCE: the vNext file:line that implements it AND the legacy source file (docs/legacy-source/...) it matches.
- FIXED: you changed the code so it matches. Give the commit and file.

DEFERRED is NOT allowed. For each row: read its full text in the source packet named next to it, find the old behaviour in docs/legacy-source, find the vNext code, decide, and fix if needed.
Keep tests passing and TypeScript valid; never silence errors. Write one result line per row under Results, push, then tick this packet in your queue.

- [x] G2-11-010-019  (source: docs/audit/gap-fix-work/verify2/packets/lane-14/W1_lane14_4.md)
- [x] G2-11-010-022  (source: docs/audit/gap-fix-work/verify2/packets/lane-14/W1_lane14_4.md)
- [x] G2-12-003-055  (source: docs/audit/gap-fix-work/verify2/packets/lane-14/W1_lane14_4.md)
- [x] G2-12-003-084  (source: docs/audit/gap-fix-work/verify2/packets/lane-14/W1_lane14_4.md)
- [x] G2-12-020-005  (source: docs/audit/gap-fix-work/verify2/packets/lane-14/W1_lane14_4.md)
- [x] G2-12-020-009  (source: docs/audit/gap-fix-work/verify2/packets/lane-14/W1_lane14_4.md)
- [ ] G2-12-020-020  (source: docs/audit/gap-fix-work/verify2/packets/lane-14/W1_lane14_4.md)
- [x] G2-12-020-037  (source: docs/audit/gap-fix-work/verify2/packets/lane-14/W1_lane14_4.md)
- [x] G2-12-020-051  (source: docs/audit/gap-fix-work/verify2/packets/lane-14/W1_lane14_4.md)
- [x] G2-12-020-052  (source: docs/audit/gap-fix-work/verify2/packets/lane-14/W1_lane14_4.md)

## Results

- G2-12-020-005: OK — `src/db/schema/placement-company-identities.ts:7-14` persists independent domain-level `verifiedBy42`, `verifiedAt` and verifier separate from `placementCompanies`; matches `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/CompanyDomain.java:24-35`.
- G2-12-020-009: OK — `src/db/schema/placement-company-identities.ts:11-14` implements non-null `verified_by_42` with `.default(false)` plus `verified_at`; matches `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/CompanyDomain.java:34-35`.
- G2-12-020-051: OK — `src/db/schema/placement-company-identities.ts:7-27` stores tenant-linked company/domain, independent verification, legacy numeric identity and added-by actor/college provenance plus creation timestamp; matches `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/CompanyDomain.java:24-47`.
- G2-12-020-052: OK — `src/modules/placements/company-curation-domain-model.ts:7-39` canonicalizes to lowercase registrable domain and `src/db/schema/placement-company-identities.ts:28` enforces case-insensitive global uniqueness; matches `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/CompanyDomain.java:14-16` and `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/company/CompanyDomainService.java:128-138`.

- G2-11-010-019: FIXED — commit `be4614499ff003150a6ba20bf6eda0749213faf3`, `src/modules/placements/tpo-drive-next-step-model.ts`: after the deadline, the applicant count and share action now take precedence over staged rounds, as `docs/legacy-source/frontend/src/pages/tpo/drives/[jobId].js:278` does.
- G2-11-010-022: FIXED — commit `be4614499ff003150a6ba20bf6eda0749213faf3`, `src/modules/placements/tpo-drive-next-step-model.ts`: recorded-outside drives without applicants now prioritize the existing "Add students who took part" CTA before unrelated actions, matching `docs/legacy-source/frontend/src/pages/tpo/drives/[jobId].js:281`.
- G2-12-003-055: OK — `src/db/schema/courses.ts:49-75,93-112` independently persists `enabled`, `deletedAt`, `status`, and indexes visibility; disabled-but-ACTIVE is representable without archival, matching separate `active` and `enabled` fields at `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Course.java:34-40`. Scope: persistence representation, not a certification of every learner read query.
- G2-12-003-084: OK — `src/db/schema/courses.ts:26-79` carries department, short title, legacy JSON metadata and individual presentation fields, parent/organization IDs, active/enabled state, slug, version and legacy integer identity; matches `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Course.java:23-68`. Source numeric foreign IDs still require scoped import mapping; no direct migration claimed.
- G2-12-020-037: OK — `src/db/schema/placement-company-identities.ts:11-14` defines `verified_by_42` as NOT NULL DEFAULT false; newly inserted or imported unverified domains default false rather than null, matching `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/CompanyDomain.java:34-35`. Historical import backfill must still be verified separately; no migration execution claimed.
