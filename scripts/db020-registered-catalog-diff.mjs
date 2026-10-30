#!/usr/bin/env node
// DB020 read-only catalog-vs-generated-schema diagnosis. This is NOT a migration
// promotion and can never certify runtime parity by itself.
import {readFileSync,readdirSync,mkdirSync,writeFileSync} from "node:fs";
import {execFileSync} from "node:child_process";
import pg from "pg";
import {assertDb018DisposableTarget} from "../tests/support/db018-test-target.mjs";
import {compareForeignKeyShapes,partitionCatalogOnlyForeignKeys} from "./db020-fk-shape.mjs";
import {canonicalPgTypeLabel} from "./db020-sql-type.mjs";

if(process.env.DB020_DISPOSABLE_PG!=="1")
  throw new Error("DB020 catalog inspection requires explicit disposable PostgreSQL");
assertDb018DisposableTarget(process.env,{serviceBound:true});

// Generation changes the working journal. The immutable commit's journal
// remains the only honest registered baseline for migration/catalog checks.
const journal=JSON.parse(execFileSync("git",
 ["show","HEAD:drizzle/meta/_journal.json"],{encoding:"utf8"}));
const head=journal.entries.at(-1);
const generatedFiles=readdirSync("drizzle/meta")
  .filter(x=>/^\d{4}_snapshot\.json$/.test(x))
  .filter(x=>Number(x.slice(0,4))>head.idx)
  .sort();
if(generatedFiles.length!==1)
 throw new Error("Require exactly one disposable generated snapshot after current registered head");
const latest=JSON.parse(readFileSync("drizzle/meta/"+generatedFiles[0],"utf8"));
const base=JSON.parse(readFileSync(
  "drizzle/meta/"+String(head.idx).padStart(4,"0")+"_snapshot.json","utf8"));
if(latest.prevId!==base.id)
 throw new Error("Generated snapshot does not reference actual registered head");

const client=new pg.Client({
 connectionString:process.env.TEST_DATABASE_URL,connectionTimeoutMillis:10000,
 query_timeout:30000,
});
const tableName=key=>key.startsWith("public.")?key.slice(7):key;
const lines=xs=>xs.sort().slice(0,120);
try{
 await client.connect();
 await client.query("BEGIN READ ONLY");
 const version=Number((await client.query("SHOW server_version_num")).rows[0].server_version_num);
 if(version<170000||version>=180000)throw new Error("Requires PostgreSQL 17");
 const applied=Number((await client.query(
  "SELECT count(*)::int n FROM drizzle.__drizzle_migrations")).rows[0].n);
 if(applied!==journal.entries.length)
  throw new Error("Exact registered migration count mismatch");
 const catalog=(await client.query(`
  SELECT c.relname AS table_name
  FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
  WHERE n.nspname='public' AND c.relkind IN ('r','p')
 `)).rows.map(x=>x.table_name);
 const catalogSet=new Set(catalog);
 const snapTables=Object.keys(latest.tables).map(tableName);
 const snapSet=new Set(snapTables);
 const priorTables=new Set(Object.keys(base.tables).map(tableName));
 const absentFromCatalog=snapTables.filter(x=>!catalogSet.has(x));
 const sqlOnlyTables=catalog.filter(x=>!snapSet.has(x));
 const newlyTypedTables=snapTables.filter(x=>!priorTables.has(x));

 const columns=(await client.query(`
  SELECT c.relname AS table_name,a.attname AS column_name,
         format_type(a.atttypid,a.atttypmod) AS pg_type,
         a.attnotnull,pg_get_expr(d.adbin,d.adrelid) AS pg_default
  FROM pg_attribute a
  JOIN pg_class c ON c.oid=a.attrelid
  JOIN pg_namespace n ON n.oid=c.relnamespace
  LEFT JOIN pg_attrdef d ON d.adrelid=a.attrelid AND d.adnum=a.attnum
  WHERE n.nspname='public' AND c.relkind IN ('r','p')
    AND a.attnum>0 AND NOT a.attisdropped
 `)).rows;
 const existing=new Map(columns.map(x=>[x.table_name+"."+x.column_name,x]));
 const missingColumns=[],extraCatalogColumns=[],typeDifferences=[],unexplainedTypeDifferences=[];
 const generatedColumnIds=new Set();
 for(const [key,t] of Object.entries(latest.tables)){
  const name=tableName(key);
  for(const col of Object.values(t.columns??{})){
   const id=name+"."+col.name;
   generatedColumnIds.add(id);
   const actual=existing.get(id);
   if(!actual){missingColumns.push(id);continue;}
   // Exact textual differences are diagnostic, not assertions. Drizzle and
   // PostgreSQL format equivalent types/defaults in different notations.
   const pgType=String(actual.pg_type).toLowerCase();
   const modelType=String(col.type).toLowerCase();
   if(pgType!==modelType) {
    const difference={field:id,pg:actual.pg_type,typed:col.type};
    typeDifferences.push(difference);
    if(canonicalPgTypeLabel(pgType)!==canonicalPgTypeLabel(modelType))
      unexplainedTypeDifferences.push(difference);
   }
  }
 }
 for(const id of existing.keys())if(snapSet.has(id.split(".")[0])&&!generatedColumnIds.has(id))
   extraCatalogColumns.push(id);

 // Bigserial is a BIGINT column plus an owned BIGINT sequence and matching
 // nextval default, NOT an alias of bigint. Verify all three facts against
 // the registered PG catalog before discounting a type spelling difference.
 const provenBigserialColumns=[];
 const remainingUnexplainedTypes=[];
 for(const difference of unexplainedTypeDifferences){
  if(difference.pg!=="bigint"||difference.typed!=="bigserial"){
   remainingUnexplainedTypes.push(difference);continue;
  }
  const split=difference.field.lastIndexOf(".");
  const table=difference.field.slice(0,split);
  const column=difference.field.slice(split+1);
  const actual=existing.get(difference.field);
  const nextval=/^nextval\('([^']+)'::regclass\)$/.exec(actual?.pg_default??"");
  if(!table||!column||!actual?.attnotnull||!nextval){
   remainingUnexplainedTypes.push(difference);continue;
  }
  const ownership=(await client.query(
   "SELECT pg_get_serial_sequence($1,$2) AS owned_sequence",
   ["public."+table,column])).rows[0]?.owned_sequence;
  if(!ownership){
   remainingUnexplainedTypes.push(difference);continue;
  }
  const witness=(await client.query(`
   SELECT ($1::regclass::oid=$2::regclass::oid) AS is_owned_default,
          s.seqtypid = 'pg_catalog.int8'::regtype AS is_bigint_sequence
   FROM pg_sequence s WHERE s.seqrelid=$1::regclass
  `,[ownership,nextval[1]])).rows[0];
  if(witness?.is_owned_default!==true||witness?.is_bigint_sequence!==true){
   remainingUnexplainedTypes.push(difference);continue;
  }
  provenBigserialColumns.push({field:difference.field,ownedSequence:ownership,
   pgDefault:actual.pg_default});
 }
 const allFks=(await client.query(`
  SELECT c.conname,c.convalidated,cl.relname AS child, parent.relname AS parent,
         cardinality(c.conkey)::int AS child_columns,
         c.confdeltype,c.confupdtype,
         ARRAY(
          SELECT a.attname::text FROM unnest(c.conkey) WITH ORDINALITY k(attnum,ord)
           JOIN pg_attribute a ON a.attrelid=c.conrelid AND a.attnum=k.attnum
           ORDER BY k.ord
         ) AS columns_from,
         ARRAY(
          SELECT a.attname::text FROM unnest(c.confkey) WITH ORDINALITY k(attnum,ord)
           JOIN pg_attribute a ON a.attrelid=c.confrelid AND a.attnum=k.attnum
           ORDER BY k.ord
         ) AS columns_to
  FROM pg_constraint c JOIN pg_class cl ON cl.oid=c.conrelid
  JOIN pg_class parent ON parent.oid=c.confrelid
  JOIN pg_namespace n ON n.oid=cl.relnamespace
  WHERE n.nspname='public' AND c.contype='f'
 `)).rows;
 const invalidFks=allFks.filter(x=>x.convalidated!==true).map(x=>x.child+"."+x.conname);
 const typedFkIds=new Set(Object.entries(latest.tables).flatMap(([k,t])=>
   Object.keys(t.foreignKeys??{}).map(name=>tableName(k)+"."+name)));
 const catalogFkIds=new Set(allFks.map(x=>x.child+"."+x.conname));
 const metadataOnlyFks=lines([...catalogFkIds].filter(x=>!typedFkIds.has(x)));
 const typedFkMissing=lines([...typedFkIds].filter(x=>!catalogFkIds.has(x)));
 const actionLabel={a:"no action",r:"restrict",c:"cascade",n:"set null",d:"set default"};
 const canonicalTypedFks=Object.entries(latest.tables).flatMap(([key,t])=>
  Object.entries(t.foreignKeys??{}).map(([name,fk])=>({
   name,child:tableName(key),parent:fk.tableTo,
   columnsFrom:fk.columnsFrom,columnsTo:fk.columnsTo,
   onDelete:fk.onDelete??"no action",onUpdate:fk.onUpdate??"no action",
  })));
 const canonicalCatalogFks=allFks.map(x=>({
  name:x.conname,child:x.child,parent:x.parent,
  columnsFrom:x.columns_from,columnsTo:x.columns_to,
  onDelete:actionLabel[x.confdeltype]??x.confdeltype,
  onUpdate:actionLabel[x.confupdtype]??x.confupdtype,
 }));
 const fkShapes=compareForeignKeyShapes(canonicalTypedFks,canonicalCatalogFks);
 const fkOnlyOwners=partitionCatalogOnlyForeignKeys(
   fkShapes.catalogShapeWithoutTyped,snapTables);
 await client.query("COMMIT");
 const report={
  kind:"DB020_DISPOSABLE_PG17_REGISTERED_VS_GENERATED_DIAGNOSIS",
  registeredHead:head.tag,registeredMigrations:applied,
  generatedSnapshot:generatedFiles[0],passCertification:false,
  counts:{
   registeredTables:catalogSet.size,priorSnapshotTables:priorTables.size,
   generatedTypedTables:snapSet.size,newlyTypedTables:newlyTypedTables.length,
   generatedAbsentInRegisteredPg:absentFromCatalog.length,
   registeredSqlOnlyTables:sqlOnlyTables.length,
   generatedTypedMissingColumns:missingColumns.length,
   registeredExtraColumnsOnTypedTables:extraCatalogColumns.length,
   textuallyDifferentTypes:typeDifferences.length,
   unexplainedTypeDifferences:remainingUnexplainedTypes.length,
   verifiedBigserialSemantics:provenBigserialColumns.length,
   registeredFks:allFks.length,
   unvalidatedFks:invalidFks.length,
   registeredFksMissingFromTypedSnapshot:metadataOnlyFks.length,
   typedFksMissingFromRegisteredCatalog:typedFkMissing.length,
   equalShapeDifferentNameFks:fkShapes.differentNameSameShape.length,
   matchingNameAndShapeFks:fkShapes.sameNameSameShape.length,
   matchingNameDifferentShapeFks:fkShapes.sameNameDrift.length,
   typedFkShapesMissingFromCatalog:fkShapes.missingTypedShape.length,
   catalogFkShapesMissingFromTypedSnapshot:fkShapes.catalogShapeWithoutTyped.length,
   catalogOnlyFkShapesOnSqlOnlyTables:fkOnlyOwners.sqlOnlyTableEdges.length,
   catalogOnlyFkShapesOnTypedTables:fkOnlyOwners.typedTableEdges.length,
  },
  newlyTypedTables:lines(newlyTypedTables),
  absentFromRegisteredCatalog:lines(absentFromCatalog),
  sqlOnlyTables:lines(sqlOnlyTables),
  missingColumns:lines(missingColumns),
  extraCatalogColumns:lines(extraCatalogColumns),
  // Diagnostic only: reveal exact registered column metadata so a reviewer
  // can reconcile each SQL-added field without inventing a typed definition.
  extraCatalogColumnDefinitions:extraCatalogColumns.sort().map(field=>{
    const c=existing.get(field);
    if(!c)throw new Error("Catalog metadata disappeared: "+field);
    return {field,pgType:c.pg_type,nullable:!c.attnotnull,
      pgDefault:c.pg_default};
  }),
  typeDifferences:typeDifferences.slice(0,120),
  unexplainedTypeDifferences:remainingUnexplainedTypes.slice(0,120),
  verifiedBigserialSemantics:provenBigserialColumns,
  unvalidatedFks:lines(invalidFks),
  registeredFksWithoutDrizzleRepresentation:metadataOnlyFks,
  drizzleFksWithoutRegisteredCatalog:typedFkMissing,
  fkNameAliases:fkShapes.differentNameSameShape.slice(0,120),
  fkSameNameShapeConflicts:fkShapes.sameNameDrift.slice(0,80),
  fkTypedShapeMissing:fkShapes.missingTypedShape.slice(0,80),
  fkCatalogShapeMissing:fkShapes.catalogShapeWithoutTyped.slice(0,80),
  fkCatalogSqlOnlyTableEdges:fkOnlyOwners.sqlOnlyTableEdges.slice(0,80),
  fkCatalogTypedTableEdges:fkOnlyOwners.typedTableEdges.slice(0,80),
  requirements:["Review every structural difference against registered DDL and live catalog",
    "Do not apply the generated SQL as a migration or rewrite already applied SQL",
    "Do not accept DB020 or DB001 from a diagnostic report"],
 };
 mkdirSync(".verification",{recursive:true});
 writeFileSync(".verification/db020-catalog-disposition.json",JSON.stringify(report,null,2)+"\n");
 console.log(JSON.stringify(report,null,2));
}finally{
 await client.query("ROLLBACK").catch(()=>{});
 await client.end();
}
