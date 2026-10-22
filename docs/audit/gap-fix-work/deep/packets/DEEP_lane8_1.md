# Deep verification packet (rows that fast mode DEFERRED)

These rows were marked DEFERRED without being checked. Each row must now end as exactly one of:
- OK: vNext already matches the old LMS. Give EVIDENCE: the vNext file:line that implements it AND the legacy source file (docs/legacy-source/...) it matches.
- FIXED: you changed the code so it matches. Give the commit and file.

DEFERRED is NOT allowed. For each row: read its full text in the source packet named next to it, find the old behaviour in docs/legacy-source, find the vNext code, decide, and fix if needed.
Keep tests passing and TypeScript valid; never silence errors. Write one result line per row under Results, push, then tick this packet in your queue.

- [ ] G2-12-011-029  (source: docs/audit/gap-fix-work/verify2/packets/lane-11/W1_lane11_6.md)
- [x] G2-12-027-030  (source: docs/audit/gap-fix-work/verify2/packets/lane-11/W1_lane11_6.md)
- [ ] G2-14-030-004  (source: docs/audit/gap-fix-work/verify2/packets/lane-11/W1_lane11_6.md)
- [x] G2-15-025-009  (source: docs/audit/gap-fix-work/verify2/packets/lane-11/W1_lane11_6.md)
- [x] G2-5-024-017  (source: docs/audit/gap-fix-work/verify2/packets/lane-11/W1_lane11_6.md)
- [ ] G2-5-024-018  (source: docs/audit/gap-fix-work/verify2/packets/lane-11/W1_lane11_6.md)
- [x] G2-5-024-031  (source: docs/audit/gap-fix-work/verify2/packets/lane-11/W1_lane11_6.md)
- [x] G2-5-024-032  (source: docs/audit/gap-fix-work/verify2/packets/lane-11/W1_lane11_6.md)
- [x] G2-5-024-036  (source: docs/audit/gap-fix-work/verify2/packets/lane-11/W1_lane11_6.md)
- [x] G2-5-024-038  (source: docs/audit/gap-fix-work/verify2/packets/lane-11/W1_lane11_6.md)

## Results

- FIXED G2-15-025-009 — commit `3013c26f97aebebe666b3eed6f0603668df94cb1`, `src/modules/placements/recruiter-college-demographics-service.ts:16-24,33-42,73-79,111-122` exposes collegeName, rounded demographic totals, branch and verified CGPA bands, provenance and asOf independently of drive counts; matches `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/RecruiterCollegeOverviewService.java:62-113`.

- FIXED G2-5-024-036 — commit `629ac9eef98b4387bbaca1507b87961ab99c32cd`, `src/modules/tenant-domains/service.ts` allows explicit DNS recheck for verified domains while the repository retains `isVerified` on failed checks; legacy `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/TenantDomainVerificationService.java:62-107`.

- OK G2-5-024-017 — `src/app/api/tenant-domains/[domainId]/route.ts:24-54`, `src/modules/tenant-domains/service.ts:318-342`, `src/modules/tenant-domains/repository.ts:255-297`; matches host-change verification reset, collision and audit in `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/TenantAdminController.java:462-505`.
- OK G2-5-024-031 — `src/components/admin/tenant-domain-manager.tsx:190`, `src/app/api/tenant-domains/[domainId]/route.ts:24-54`, `src/modules/tenant-domains/repository.ts:284-297`; custom host edit resets DNS proof, corresponding to `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/TenantAdminController.java:470-483`.
- OK G2-5-024-038 — `src/modules/tenant-domains/service.ts:383-395` requires unscoped Super Admin and `admin-scope.select`; matches `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/TenantAdminController.java:273-282` global-only resolver preview.
- OK G2-5-024-032 — `src/modules/tenant-domains/repository.ts:198-205,241-248,289-297,379-387,451-458,495-503` records domain create/token/edit/verify/primary/delete events with tenant context, and `src/app/api/tenant-domains/[domainId]/route.ts:24-54` handles mutation; matches audit scope of `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/TenantAdminController.java:425-565`.
- OK G2-12-027-030 — `src/modules/academics/faculty-assignment-service.ts:344-385` validates every membership before one database transaction and one multirow INSERT; `src/app/api/academics/faculty-assignments/route.ts:86-90` routes bulk requests into that atomic operation. Matches `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/FacultyTeachingAssignmentServiceImpl.java:87-114` and `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/FacultyTeachingAssignmentController.java:116-130` rollback-on-failure behavior.
