-- Chat 2 / DB-004 / 2026-10-11. ALTERNATIVE PROPOSAL ONLY.
-- NOT REGISTERED, NOT APPROVED, NOT APPLIED. Do not independently run.
-- Requires BOTH:
--   db01-tenant-domain-tombstone-staging.sql (adds deleted_at)
--   db01-college-membership-domain-archive-guard-staging.sql
-- and the complete coordinated archive consumer/write-path update.
--
-- Current vNext college usage counts ALL tenant_domains rows. If tombstones
-- retain old rows forever, even after every active domain is removed,
-- college archive can NEVER pass. This is a functional lifecycle deadlock.
-- Legacy/vNext hard-delete semantics allow archive once domain removal has
-- eliminated live tenant routing; audit tombstones must not silently change
-- the product into permanent no-archive.
--
-- POLICY DECISION PENDING: proposed ACTIVE-ONLY counting of tenant host
-- associations for archive eligibility, while retaining tombstones for
-- forensics and all-time global lower(host) uniqueness. Until approved,
-- do not register this replacement or claim college archive is ready.

CREATE OR REPLACE FUNCTION db01_college_archive_db01_children_guard()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.status = 'ARCHIVED'
     AND OLD.status IS DISTINCT FROM NEW.status
     AND (
       EXISTS (
         SELECT 1 FROM college_memberships AS m
         WHERE m.college_id = OLD.id
           AND m.status <> 'ENDED'
       )
       OR EXISTS (
         SELECT 1 FROM tenant_domains AS d
         WHERE d.college_id = OLD.id
           AND d.deleted_at IS NULL
       )
     ) THEN
    RAISE EXCEPTION 'College still has active DB01 membership or tenant domain'
      USING ERRCODE = '23514',
            CONSTRAINT = 'db01_college_archive_db01_children_ck';
  END IF;
  RETURN NEW;
END;
$$;

-- Do NOT duplicate the trigger created by the original DB01 archive guard.
-- CREATE OR REPLACE updates its function body; the original
-- db01_college_archive_db01_children_trg continues to reference this
-- function. Must ship within ONE selected migration design/review.

-- REQUIRED COORDINATED ACTIVATION:
-- 1. College service resolveCollegeUsage must count only active
--    tenantDomains.deletedAt IS NULL for tenant-domain usage.
-- 2. Domain repository deleteDomain becomes tombstone UPDATE atomically
--    setting deleted_at, is_primary=false, verification_token=NULL.
-- 3. All host resolver/admin domain list/verify/set-primary reads use
--    deleted_at IS NULL. Existing global hostname uniqueness remains.
-- 4. Active-domain insert/college ownership changes still lock ACTIVE
--    college FOR UPDATE; archived college rejects new active domains.
-- 5. Test active verified, active unverified, and all-only-tombstones
--    archive transitions, including parent/child two-connection races.
-- 6. No weakening of other usage families (departments, projects,
--    placements, periods, memberships, template assignments etc.).
-- 7. Approved retention/purge rules may not silently revive a hostname.
-- 8. Do not count retired domain rows as active usage, but never stop
--    preserving audit evidence for the former host.
