-- Row-level security applies to the table OWNER only when FORCE is set. On dev (and anywhere the runtime role also
-- owns the tables, as `lms_vnext_app` does for all 278 tables) enabling `app.rls_mode = 'enforce'` would otherwise
-- change nothing for the app. Still INERT until that setting is 'enforce': app_rls_allows() returns true otherwise,
-- so migrations and backfills that connect without the setting are unaffected. The app pods set the mode through
-- PGOPTIONS (-c app.rls_mode=enforce), the migrator Job does not.
DO $$
DECLARE
  t record;
BEGIN
  FOR t IN
    SELECT c.relname AS name
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace AND n.nspname = 'public'
    JOIN pg_policy p ON p.polrelid = c.oid AND p.polname = 'tenant_isolation'
    WHERE c.relkind IN ('r', 'p')
    ORDER BY c.relname
  LOOP
    EXECUTE format('ALTER TABLE public.%I FORCE ROW LEVEL SECURITY', t.name);
  END LOOP;
END
$$;
