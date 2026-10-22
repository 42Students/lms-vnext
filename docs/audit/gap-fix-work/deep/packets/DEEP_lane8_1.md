# Deep verification packet (rows that fast mode DEFERRED)

These rows were marked DEFERRED without being checked. Each row must now end as exactly one of:
- OK: vNext already matches the old LMS. Give EVIDENCE: the vNext file:line that implements it AND the legacy source file (docs/legacy-source/...) it matches.
- FIXED: you changed the code so it matches. Give the commit and file.

DEFERRED is NOT allowed. For each row: read its full text in the source packet named next to it, find the old behaviour in docs/legacy-source, find the vNext code, decide, and fix if needed.
Keep tests passing and TypeScript valid; never silence errors. Write one result line per row under Results, push, then tick this packet in your queue.

- [ ] G2-12-011-029  (source: docs/audit/gap-fix-work/verify2/packets/lane-11/W1_lane11_6.md)
- [ ] G2-12-027-030  (source: docs/audit/gap-fix-work/verify2/packets/lane-11/W1_lane11_6.md)
- [ ] G2-14-030-004  (source: docs/audit/gap-fix-work/verify2/packets/lane-11/W1_lane11_6.md)
- [ ] G2-15-025-009  (source: docs/audit/gap-fix-work/verify2/packets/lane-11/W1_lane11_6.md)
- [x] G2-5-024-017  (source: docs/audit/gap-fix-work/verify2/packets/lane-11/W1_lane11_6.md)
- [ ] G2-5-024-018  (source: docs/audit/gap-fix-work/verify2/packets/lane-11/W1_lane11_6.md)
- [x] G2-5-024-031  (source: docs/audit/gap-fix-work/verify2/packets/lane-11/W1_lane11_6.md)
- [x] G2-5-024-032  (source: docs/audit/gap-fix-work/verify2/packets/lane-11/W1_lane11_6.md)
- [ ] G2-5-024-036  (source: docs/audit/gap-fix-work/verify2/packets/lane-11/W1_lane11_6.md)
- [x] G2-5-024-038  (source: docs/audit/gap-fix-work/verify2/packets/lane-11/W1_lane11_6.md)

## Results

- OK G2-5-024-017 — `src/app/api/tenant-domains/[domainId]/route.ts:24-54`, `src/modules/tenant-domains/service.ts:318-342`, `src/modules/tenant-domains/repository.ts:255-297`; matches host-change verification reset, collision and audit in `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/TenantAdminController.java:462-505`.
- OK G2-5-024-031 — `src/components/admin/tenant-domain-manager.tsx:190`, `src/app/api/tenant-domains/[domainId]/route.ts:24-54`, `src/modules/tenant-domains/repository.ts:284-297`; custom host edit resets DNS proof, corresponding to `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/TenantAdminController.java:470-483`.
- OK G2-5-024-038 — `src/modules/tenant-domains/service.ts:383-395` requires unscoped Super Admin and `admin-scope.select`; matches `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/TenantAdminController.java:273-282` global-only resolver preview.
- OK G2-5-024-032 — `src/modules/tenant-domains/repository.ts:198-205,241-248,289-297,379-387,451-458,495-503` records domain create/token/edit/verify/primary/delete events with tenant context, and `src/app/api/tenant-domains/[domainId]/route.ts:24-54` handles mutation; matches audit scope of `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/TenantAdminController.java:425-565`.
