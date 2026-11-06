-- rls:variant
-- Corrects 0334 (found in independent review). 0334 put "OR college_id IS NULL" inside the single FOR ALL policy, so
-- its USING clause also governed UPDATE and DELETE: a college could delete a platform-owned row, or take one over by
-- updating its college_id to its own. The global-read rule must apply to SELECT only.
--
-- tenant_isolation returns to the strict policy of 0333 (read, update, delete and write all require the row's college
-- to match the scope, or a platform/system scope). A second, permissive policy, global_read, adds SELECT of
-- college_id IS NULL rows for lms_groups and legacy_id_map. Permissive policies combine with OR per command, so for
-- UPDATE and DELETE only tenant_isolation applies. Still inert until app.rls_mode = 'enforce'.
DO $$
DECLARE
  t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['lms_groups', 'legacy_id_map']
  LOOP
    IF to_regclass(format('public.%I', t)) IS NOT NULL THEN
      EXECUTE format('DROP POLICY IF EXISTS tenant_isolation ON public.%I', t);
      EXECUTE format(
        'CREATE POLICY tenant_isolation ON public.%I USING (app_rls_allows(college_id)) WITH CHECK (app_rls_allows(college_id))',
        t
      );
      EXECUTE format('DROP POLICY IF EXISTS global_read ON public.%I', t);
      EXECUTE format('CREATE POLICY global_read ON public.%I FOR SELECT USING (college_id IS NULL)', t);
    END IF;
  END LOOP;
END
$$;
