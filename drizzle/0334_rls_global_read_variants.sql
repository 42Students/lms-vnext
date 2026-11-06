-- rls:variant
-- Per-table RLS variants (docs/security/central-security-architecture.md, layer L5). Still inert until
-- app.rls_mode = 'enforce'.
--
-- Two tables hold platform-owned rows (college_id IS NULL) that every college must be able to READ:
--   lms_groups      owner_scope = 'PLATFORM' groups shown to learners of any college
--   legacy_id_map   global legacy mappings (project templates and creation mapping)
-- Reads therefore also allow NULL-college rows; writes stay strict, so only a platform or system scope can
-- create or change a global row. Every other nullable-college table keeps the strict policy from 0333
-- (a NULL row is visible only to platform and system scopes): no code path reads their NULL rows as defaults.
DO $$
DECLARE
  t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['lms_groups', 'legacy_id_map']
  LOOP
    IF to_regclass(format('public.%I', t)) IS NOT NULL THEN
      EXECUTE format('DROP POLICY IF EXISTS tenant_isolation ON public.%I', t);
      EXECUTE format(
        'CREATE POLICY tenant_isolation ON public.%I USING (app_rls_allows(college_id) OR college_id IS NULL) WITH CHECK (app_rls_allows(college_id))',
        t
      );
    END IF;
  END LOOP;
END
$$;
