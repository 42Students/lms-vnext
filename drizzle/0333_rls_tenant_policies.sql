-- rls:catalog-wide
-- Tenant row-level security (docs/security/central-security-architecture.md, layer L5).
-- INERT by default: app_rls_allows() returns true unless the database setting app.rls_mode = 'enforce'.
-- Enforcement is switched on per environment by a human (docs/security/rls-rollout.md), after the
-- per-table review there. Superusers and BYPASSRLS roles are never subject to policies; the runtime
-- role must not be either (src/db/runtime-principal-policy.ts already enforces that in production).
--
-- Tables are discovered from the live catalog (every base table in public with a college_id column), so
-- renamed tables and dropped columns can never make this migration fail or miss a table. Tables created by
-- later migrations get their own policy statements (scripts/generate-rls-migration.mjs, guarded in CI).
CREATE OR REPLACE FUNCTION app_rls_allows(row_college uuid) RETURNS boolean
LANGUAGE sql STABLE AS $$
  SELECT coalesce(current_setting('app.rls_mode', true), '') <> 'enforce'
      OR current_setting('app.platform', true) = 'on'
      OR coalesce(current_setting('app.system', true), '') <> ''
      OR row_college = nullif(current_setting('app.college_id', true), '')::uuid
$$;
--> statement-breakpoint
-- Explicit, because hardened databases revoke default function execution from PUBLIC.
GRANT EXECUTE ON FUNCTION app_rls_allows(uuid) TO PUBLIC;
--> statement-breakpoint
DO $$
DECLARE
  t record;
BEGIN
  FOR t IN
    SELECT c.relname AS name
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace AND n.nspname = 'public'
    JOIN pg_attribute a ON a.attrelid = c.oid AND a.attname = 'college_id' AND NOT a.attisdropped
    WHERE c.relkind IN ('r', 'p')
    ORDER BY c.relname
  LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t.name);
    EXECUTE format('DROP POLICY IF EXISTS tenant_isolation ON public.%I', t.name);
    EXECUTE format(
      'CREATE POLICY tenant_isolation ON public.%I USING (app_rls_allows(college_id)) WITH CHECK (app_rls_allows(college_id))',
      t.name
    );
  END LOOP;
END
$$;
