/**
 * Exact CURRENT registered PG17 catalog evidence for DB020 snapshot parity.
 * Read-only; must never apply/drift Drizzle's generated migration.
 * Captures index/check/default/trigger semantics omitted by the compact FK
 * diagnostic, so a no-op schema baseline cannot hide destructive differences.
 */
import { mkdirSync,writeFileSync,readFileSync } from "node:fs";
import pg from "pg";
import { assertDb018DisposableTarget } from "../tests/support/db018-test-target.mjs";

if (process.env.DB020_DISPOSABLE_PG !== "1") throw new Error("DB020 export requires disposable PG17");
assertDb018DisposableTarget(process.env,{serviceBound:true});
const db=new pg.Client({connectionString:process.env.TEST_DATABASE_URL,
 connectionTimeoutMillis:10000,query_timeout:25000});
await db.connect();
try{
 await db.query("BEGIN READ ONLY");
 const version=Number((await db.query("SHOW server_version_num")).rows[0].server_version_num);
 if(version<170000||version>=180000)throw new Error("DB020 catalog requires PG17");
 const journal=JSON.parse(readFileSync("drizzle/meta/_journal.json","utf8"));
 const applied=Number((await db.query("select count(*)::integer n from drizzle.__drizzle_migrations")).rows[0].n);
 if(applied!==journal.entries.length)throw new Error("DB020 export refuses partially registered catalog");
 const tables=(await db.query(`
   SELECT n.nspname AS schema,t.relname AS name,
          t.relkind,
          t.reltuples::bigint AS estimated_rows
   FROM pg_class t JOIN pg_namespace n ON n.oid=t.relnamespace
   WHERE n.nspname='public' AND t.relkind IN ('r','p')
   ORDER BY t.relname
 `)).rows;
 const columns=(await db.query(`
   SELECT c.relname AS table_name,a.attname AS column_name,
          format_type(a.atttypid,a.atttypmod) AS data_type,
          a.attnotnull AS not_null,
          pg_get_expr(d.adbin,d.adrelid) AS default_expression,
          a.attidentity AS identity_mode,a.attgenerated AS generated_mode
   FROM pg_attribute a
   JOIN pg_class c ON c.oid=a.attrelid
   JOIN pg_namespace n ON n.oid=c.relnamespace
   LEFT JOIN pg_attrdef d ON d.adrelid=a.attrelid AND d.adnum=a.attnum
   WHERE n.nspname='public' AND c.relkind IN ('r','p')
     AND a.attnum>0 AND NOT a.attisdropped
   ORDER BY c.relname,a.attnum
 `)).rows;
 const constraints=(await db.query(`
   SELECT t.relname AS table_name,cn.conname AS name,
          cn.contype AS type,cn.convalidated AS validated,
          cn.condeferrable AS deferrable,cn.condeferred AS initially_deferred,
          pg_get_constraintdef(cn.oid,true) AS definition
   FROM pg_constraint cn
   JOIN pg_class t ON t.oid=cn.conrelid
   JOIN pg_namespace n ON n.oid=t.relnamespace
   WHERE n.nspname='public'
   ORDER BY t.relname,cn.contype,cn.conname
 `)).rows;
 const indexes=(await db.query(`
   SELECT t.relname AS table_name,i.relname AS name,ix.indisunique AS unique,
          ix.indisprimary AS primary,ix.indisvalid AS valid,
          pg_get_indexdef(ix.indexrelid) AS definition
   FROM pg_index ix
   JOIN pg_class t ON t.oid=ix.indrelid
   JOIN pg_namespace n ON n.oid=t.relnamespace
   JOIN pg_class i ON i.oid=ix.indexrelid
   WHERE n.nspname='public'
   ORDER BY t.relname,i.relname
 `)).rows;
 const triggers=(await db.query(`
   SELECT t.relname AS table_name,g.tgname AS name,g.tgenabled AS enabled,
          pg_get_triggerdef(g.oid,true) AS definition
   FROM pg_trigger g
   JOIN pg_class t ON t.oid=g.tgrelid
   JOIN pg_namespace n ON n.oid=t.relnamespace
   WHERE n.nspname='public' AND NOT g.tgisinternal
   ORDER BY t.relname,g.tgname
 `)).rows;
 const data={kind:"DB020_EXACT_REGISTERED_PG17_CATALOG",
   registeredHead:journal.entries.at(-1).tag,registeredMigrations:applied,
   tables,columns,constraints,indexes,triggers};
 mkdirSync(".verification",{recursive:true});
 writeFileSync(".verification/db020-registered-catalog-full.json",JSON.stringify(data,null,2)+"\n");
 console.log(JSON.stringify({kind:data.kind,head:data.registeredHead,
  tables:tables.length,columns:columns.length,constraints:constraints.length,
  indexes:indexes.length,triggers:triggers.length}));
 await db.query("COMMIT");
}finally{
 await db.query("ROLLBACK").catch(()=>{});
 await db.end();
}
