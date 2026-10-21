# Lane chat-7 — gap-fix ownership and product-decision handoffs

Source: wave-1 packets in `docs/audit/gap-fix-work/packets/lane-7/`. These items were inspected against existing vNext implementations. No product policy or shared export was silently changed.

## Packet: L19-U026 Module Access Controller (17 findings)

- G2-19-026-016 | `src/modules/module-access/service.ts`, `admin-descendant-rule-write.ts`: Owner decision required: legacy Placements is college-only; vNext permits descendant scopes. Align validation and effective rules before changing behavior.
- G2-19-026-019 | `src/modules/module-access/super-admin-student-bulk-rule-service.ts`: Module Access owner to decide atomic transactional bulk or explicitly accepted partial success, with retry-only failed learners.
- G2-19-026-027 | `src/modules/module-access/service.ts`: Module Access owner to resolve whether Placements is college-only or follows the vNext academic hierarchy.
- G2-19-026-038 | `src/app/(authenticated)/admin/features/[collegeId]/page.tsx`: Product decision on Placements hierarchy needed before correcting contradictory copy.
- G2-19-026-041 | `src/modules/module-access/super-admin-student-bulk-rule-service.ts`: Mixed-college and locked-ancestor bulk must not claim legacy atomic semantics while saving partially.
- G2-19-026-003 | `src/modules/module-access/admin-read-service.ts`: Expose all inherited-only nodes in the full academic hierarchy grid, bounded for large colleges.
- G2-19-026-005 | `src/modules/module-access/service.ts`: Product/catalog owners to sign off legacy Courses→vNext Electives mapping; do not add `courses` as a silent fourth module.
- G2-19-026-007 | `src/modules/module-access/admin-read-service.ts`: Return the complete node inventory including nodes with no persisted override.
- G2-19-026-011 | `src/modules/module-access/admin-descendant-rule-write.ts`: Check omitted lock field preserves existing lock when enabled changes, while INHERIT deletes value and lock.
- G2-19-026-013 | `src/modules/module-access/super-admin-student-bulk-rule-service.ts`: Current cap 25 differs from legacy 1000; needs bounded transactional batch design before changing the limit.
- G2-19-026-022 | `src/app/(authenticated)/admin/features/[collegeId]/page.tsx` and module-access API: Build 7-endpoint parity crosswalk without replacing new membership-scope contracts.
- G2-19-026-034 | `src/modules/module-access/super-admin-student-bulk-rule-service.ts`: Required bulk audit/journal must be reconciled with optional post-write summary event.
- G2-19-026-040 | `src/modules/module-access/super-admin-student-bulk-rule-service.ts`: Preflight and transact the selection rather than 25 independent writes if atomic contract is selected.
- G2-19-026-047 | `src/modules/module-access/service.ts`: Product owner to document explicit legacy courses vs new electives scope and permission mapping.
- G2-19-026-014 | `src/app/(authenticated)/admin/features/[collegeId]/page.tsx`: Friendly selected-college validation instead of opaque UUID parsing; numeric legacy IDs are intentionally not revived.
- G2-19-026-017 | `src/modules/module-access/super-admin-student-bulk-rule-service.ts` and caller: Reflect actual selection cap and empty selection errors after batch policy decision.
- G2-19-026-018 | `src/app/api/admin/students/module-access/bulk/route.ts` and caller: Give success counts, final effective state and partial-failure/audit warnings; don't impose obsolete Response envelope.

## Packet: AdminCollegeDashboardController (remaining outside-lane decisions)

- G2-2-012-029 | `src/auth/request-context.ts`, `src/modules/permissions/acting-college.ts`, `src/app/(authenticated)/college/page.tsx`: Authorize Super Admin selected-college dashboard without requiring college membership; adjust all dashboard read services consistently, not only page routing.
- G2-2-012-054 | `src/modules/admin-ui/college-dashboard-grading-service.ts`: Risk roster mapping corrected, but published-only assignment backlog needs product-owner signoff before including unpublished submissions; never expose drafts by simply dropping the PUBLISHED filter.
