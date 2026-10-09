-- LMS vNext Pass 3: read-only PostgreSQL schema integrity inventory.
-- Run only with an explicitly authorized SELECT/catalog-readable account.
-- No application rows, credentials or personal data are collected.
-- Example:
--   psql -X -A -t -v ON_ERROR_STOP=1 "$TEST_DATABASE_URL" \
--     -f scripts/sql/vnext-readonly-integrity.sql > /tmp/vnext-integrity.jsonl
-- DO NOT commit exports from real environments; schema names may be sensitive.

-- Tables: include partitioned relations
SELECT jsonb_build_object('kind','table','table_name',c.relname,'relkind',c.relkind,
       'rls_enabled',c.relrowsecurity,'rls_forced',c.relforcerowsecurity)::text
FROM pg_catalog.pg_class c
JOIN pg_catalog.pg_namespace n ON n.oid=c.relnamespace
WHERE n.nspname='public' AND c.relkind IN ('r','p')
ORDER BY c.relname;

-- FK constraints, including column sets and referential actions.
SELECT jsonb_build_object(
  'kind','foreign_key',
  'constraint_name',co.conname,
  'table_name',co.conrelid::regclass::text,
  'target_table',co.confrelid::regclass::text,
  'columns',ARRAY(SELECT a.attname FROM unnest(co.conkey) WITH ORDINALITY k(attnum,ord)
    JOIN pg_catalog.pg_attribute a ON a.attrelid=co.conrelid AND a.attnum=k.attnum ORDER BY k.ord),
  'target_columns',ARRAY(SELECT a.attname FROM unnest(co.confkey) WITH ORDINALITY k(attnum,ord)
    JOIN pg_catalog.pg_attribute a ON a.attrelid=co.confrelid AND a.attnum=k.attnum ORDER BY k.ord),
  'delete_action',co.confdeltype::text,
  'validated',co.convalidated,
  'deferrable',co.condeferrable,
  'initially_deferred',co.condeferred)::text
FROM pg_catalog.pg_constraint co
JOIN pg_catalog.pg_namespace ns ON ns.oid=co.connamespace
WHERE ns.nspname='public' AND co.contype='f'
ORDER BY co.conrelid::regclass::text,co.conname;

-- CHECK/UNIQUE/PK/EXCLUDE definitions and validation.
SELECT jsonb_build_object('kind','constraint','table_name',co.conrelid::regclass::text,
  'constraint_name',co.conname,'constraint_type',co.contype::text,
  'definition',pg_get_constraintdef(co.oid,true),'validated',co.convalidated)::text
FROM pg_catalog.pg_constraint co
JOIN pg_catalog.pg_namespace ns ON ns.oid=co.connamespace
WHERE ns.nspname='public' AND co.contype IN ('c','p','u','x')
ORDER BY co.conrelid::regclass::text,co.conname;

-- Index definitions, partial predicates, invalid/not-ready states.
SELECT jsonb_build_object('kind','index','table_name',t.relname,'index_name',ix.relname,
  'unique',i.indisunique,'primary',i.indisprimary,'valid',i.indisvalid,
  'ready',i.indisready,'predicate',pg_get_expr(i.indpred,i.indrelid),
  'definition',pg_get_indexdef(i.indexrelid))::text
FROM pg_catalog.pg_index i
JOIN pg_catalog.pg_class t ON t.oid=i.indrelid
JOIN pg_catalog.pg_namespace ns ON ns.oid=t.relnamespace
JOIN pg_catalog.pg_class ix ON ix.oid=i.indexrelid
WHERE ns.nspname='public' ORDER BY t.relname,ix.relname;

-- Enum labels and order: semantic changes are migration-sensitive.
SELECT jsonb_build_object('kind','enum','type_name',typ.typname,'label',en.enumlabel,
  'sort_order',en.enumsortorder)::text
FROM pg_catalog.pg_type typ
JOIN pg_catalog.pg_namespace ns ON ns.oid=typ.typnamespace
JOIN pg_catalog.pg_enum en ON en.enumtypid=typ.oid
WHERE ns.nspname='public' ORDER BY typ.typname,en.enumsortorder;

-- User-defined triggers excluding internal constraint triggers.
SELECT jsonb_build_object('kind','trigger','table_name',tbl.relname,
  'trigger_name',tg.tgname,'enabled',tg.tgenabled,
  'definition',pg_get_triggerdef(tg.oid,true))::text
FROM pg_catalog.pg_trigger tg
JOIN pg_catalog.pg_class tbl ON tbl.oid=tg.tgrelid
JOIN pg_catalog.pg_namespace ns ON ns.oid=tbl.relnamespace
WHERE ns.nspname='public' AND NOT tg.tgisinternal
ORDER BY tbl.relname,tg.tgname;

-- RLS policies and views: grants/visibility can matter even where FKs exist.
SELECT jsonb_build_object('kind','rls_policy','table_name',tablename,'policy_name',policyname,
  'cmd',cmd,'roles',roles,'using_expr',qual,'with_check_expr',with_check)::text
FROM pg_catalog.pg_policies WHERE schemaname='public'
ORDER BY tablename,policyname;
SELECT jsonb_build_object('kind','view','view_name',viewname,
  'definition',definition)::text
FROM pg_catalog.pg_views WHERE schemaname='public' ORDER BY viewname;

-- Public routines: the body is not exported (can contain sensitive app logic).
SELECT jsonb_build_object('kind','routine','routine_name',p.proname,
  'identity_args',pg_get_function_identity_arguments(p.oid),
  'security_definer',p.prosecdef)::text
FROM pg_catalog.pg_proc p
JOIN pg_catalog.pg_namespace n ON n.oid=p.pronamespace
WHERE n.nspname='public'
ORDER BY p.proname,p.oid;
