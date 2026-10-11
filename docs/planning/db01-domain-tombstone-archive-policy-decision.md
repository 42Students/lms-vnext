# DB-004 — College archival when tenant domains preserve tombstones

**Status: SOURCE-CONFIRMED DESIGN CONFLICT; decision pending; NOT migrated or runtime verified**  
**Chat:** 2 · **Phase:** global DATABASE · **Date:** 2026-10-11  
**Current vNext sources:** `src/modules/colleges/service.ts` (`resolveCollegeUsage`, `archiveCollege`), `src/modules/colleges/archive-policy.ts`, `src/modules/tenant-domains/repository.ts`.  
**Unregistered DB01 proposals:** `docs/planning/sql/db01-tenant-domain-tombstone-staging.sql`, `docs/planning/sql/db01-domain-tombstone-state-guard-staging.sql`, `docs/planning/sql/db01-college-membership-domain-archive-guard-staging.sql`.

## Evidence of a durable lifecycle deadlock

1. Current `resolveCollegeUsage` counts `count(*)` from `tenantDomains` with `collegeId` and **does not filter deletion**, because the current table has no `deleted_at` column. `archiveCollege` calls this usage check.
2. The staged `db01_college_archive_db01_children_guard` similarly denies archive when *any* `tenant_domains` row exists, irrespective of verification or future deleted/tombstone state.
3. Current `deleteDomain` hard-deletes, allowing the count to return to zero after removing a hostname. The DB01 tombstone proposal deliberately keeps a row for audit instead.
4. Consequently, if tombstone persistence and the current all-row archive rule both ship unchanged, **any college that ever registered a domain can become permanently nonarchivable**, even after every domain was removed from live routing. This is a product-visible divergence, not a minor index optimization.

## Required explicit policy choice

| Alternative | Archive eligibility | Pros | Costs / risks |
| --- | --- | --- | --- |
| A. All retained rows count as usage | Any domain tombstone blocks archive forever until authorized physical purge | Extremely conservative; matches *literal unadjusted current SQL* | Makes historical audit retention conflict with normal archive lifecycle; manual purge would undermine retention and host ownership |
| **B. Active associations only (proposed)** | Any nondeleted domain blocks; only tombstones remain ⇒ may archive if **all other usage** is cleared | Preserves historical rows and current user-facing delete→archive behavior; no forced purge | Requires coordinated vNext service count, archive DB guard, host resolver and domain deletion mutation |

**Recommendation for approval:** B, with strict positive proof that no *active* host exists. Tombstones remain forever unique by `lower(host)` until separate host-reuse approval; no retained hostname can resolve a tenant. This is **not automatically approved** by preparing the alternative SQL.

## Staged coordinated alternative

`docs/planning/sql/db01-college-archive-tombstone-consistency-staging.sql` is an **unregistered alternative** that replaces the body of the original archive guard function to count domain rows only where `deleted_at IS NULL`. It keeps the membership non-ENDED check unchanged. It does not create a competing trigger or weaken the other college usage families.

Activation must be one cohesive migration/service batch:

- Chat 1 registers `deleted_at`, actor/audit fields, the terminal tombstone/host-proof guard, parent row-lock children/archive guards and (only after policy approval) the active-only archive guard function.
- The later API phase changes `deleteDomain` from hard DELETE to atomic `UPDATE` clearing primary/secret, and adds deleted-at filters to **all** domain host-routing, admin, recheck, primary and bootstrapping read paths.
- `resolveCollegeUsage` and any other college archive count must filter `tenantDomains.deletedAt IS NULL` at the same cutover; defaulting to count-all remains a regression.
- Existing all-time case-insensitive host uniqueness must remain, and tombstone rows cannot be rearmed or moved across colleges.
- Creation/move of active tenant hosts into an ARCHIVED college must still fail under real concurrent INSERT/archive orders. The parent college row-lock contract in the DB01 archive guard remains mandatory.
- No change to non-ENDED membership rules or separate academic, projects, placement, department and schedule usage checks without each domain owner's review.

## Acceptance matrix — authored witness scope, no executed PG proof

| Case | Expected |
| --- | --- |
| Active verified domain exists | College archive **rejected** |
| Active unverified domain exists | College archive **rejected** |
| Only deleted domains remain | College archive **allowed**, provided every other usage family is empty |
| Active/SUSPENDED membership remains | College archive **rejected** |
| Only ENDED memberships remain | DB01 membership usage alone does not block archival |
| Deleted domain's host matches another college's new hostname | Global lower(host) unique constraint still **rejects** reuse |
| Concurrent domain insert vs college archive | One writer loses; never ACTIVE domain under ARCHIVED college |
| Concurrent domain deletion vs college archive | Serializable parent locks and persisted state yield safe outcome |
| Direct SQL UPDATE attempts to restore `deleted_at=NULL` | Tombstone terminal guard **rejects** |
| Deleted host DNS recheck or primary promotion | Terminal guard/active filters **reject** |

**Executed Node tests:** 0 for this decision. **Executed PostgreSQL tests:** 0. **Database phase promotion:** forbidden until the policy is approved and all real-schema migration/race witnesses pass.

Decision tracking field: `docs/planning/db01-chat02-migration-integration-manifest.json:readiness.domainTombstoneArchiveUsagePolicyApproved` must remain `false` until the owner records acceptance with exact coordinated source/test evidence. No branch/PR or production schema was changed by this draft.
