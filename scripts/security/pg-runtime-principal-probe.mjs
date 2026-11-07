#!/usr/bin/env node
// Read-only evidence for SEC-06-001/010/011/012/013/014 with the ACTUAL runtime DATABASE_URL (dev or disposable only).
// Prints role attributes, memberships, ownership, RLS/FORCE coverage and SECURITY DEFINER count. Exits 1 on any finding.
import pg from "pg";
const c = new pg.Client({ connectionString: process.env.DATABASE_URL });
await c.connect();
const one = async (sql) => (await c.query(sql)).rows[0];
const role = await one(`select rolname, rolsuper, rolbypassrls, rolcreaterole, rolcreatedb, rolreplication from pg_roles where rolname = current_user`);
const memberships = (await c.query(`select r.rolname from pg_auth_members m join pg_roles r on r.oid = m.roleid where m.member = (select oid from pg_roles where rolname = current_user)`)).rows.map((r) => r.rolname);
const owned = (await one(`select count(*)::int n from pg_tables where schemaname = 'public' and tableowner = current_user`)).n;
const total = (await one(`select count(*)::int n from pg_tables where schemaname = 'public'`)).n;
const rls = await one(`select count(*) filter (where relrowsecurity)::int enabled, count(*) filter (where relforcerowsecurity)::int forced, count(*)::int tables from pg_class c join pg_namespace n on n.oid = c.relnamespace and n.nspname = 'public' where c.relkind = 'r'`);
const policied = (await one(`select count(distinct tablename)::int n from pg_policies where schemaname = 'public'`)).n;
const secdef = (await one(`select count(*)::int n from pg_proc p join pg_namespace n on n.oid = p.pronamespace and n.nspname = 'public' where p.prosecdef`)).n;
const truncate = (await one(`select count(*)::int n from pg_tables t where schemaname = 'public' and has_table_privilege(current_user, format('%I.%I', schemaname, tablename), 'TRUNCATE')`)).n;
const canCreate = (await one(`select has_database_privilege(current_user, current_database(), 'CREATE') x`)).x;
const out = { role, memberships, tablesOwnedByRuntime: owned, tables: total, rls, tablesWithAnyPolicy: policied, securityDefinerFunctions: secdef, tablesRuntimeCanTruncate: truncate, canCreateInDatabase: canCreate };
console.log(JSON.stringify(out, null, 1));
const findings = [];
if (role.rolsuper) findings.push("runtime role is superuser");
if (role.rolbypassrls) findings.push("runtime role has BYPASSRLS");
if (role.rolcreaterole || role.rolcreatedb || role.rolreplication) findings.push("runtime role has CREATEROLE/CREATEDB/REPLICATION");
if (memberships.length) findings.push("runtime role is a member of " + memberships.join(","));
if (owned) findings.push("runtime role owns tables");
if (secdef) findings.push("SECURITY DEFINER functions exist");
if (truncate) findings.push("runtime role can TRUNCATE tables");
if (canCreate) findings.push("runtime role can CREATE in the database");
await c.end();
if (findings.length) { console.error("FINDINGS:\n" + findings.join("\n")); process.exit(1); }
console.log("runtime principal: clean");
