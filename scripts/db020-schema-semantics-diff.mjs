#!/usr/bin/env node
// DB020 READ-ONLY semantic diagnosis for exact registered PG17 vs the
// UNAPPLIED Drizzle-generated snapshot. Never apply generated DDL or assert
// global certification from matching names alone.
import {readFileSync,writeFileSync,mkdirSync} from "node:fs";

const nameFromKey=k=>k.startsWith("public.")?k.slice(7):k;
const identity=(table,name)=>
 typeof table==="string"&&table.trim()&&typeof name==="string"&&name.trim()
  ?table+"."+name:"";
const capped=a=>a.slice(0,100);
// Catalog export is read-only, but the diagnostic artifact may be stale,
// truncated or accidentally joined with a different registered revision.
// Never let Map() silently overwrite duplicated physical identities.
function uniqueBy(rows, key, label){
 if(!Array.isArray(rows))throw new Error("DB020 missing "+label+" catalog entries");
 const result=new Map();
 for(const row of rows){
  const id=key(row);
  if(!id||result.has(id))throw new Error("DB020 duplicate or invalid "+label+" identity: "+id);
  result.set(id,row);
 }
 return result;
}
export function inspectDb020StructuralSemantics(snapshot,catalog,diagnosis){
 if(snapshot?.dialect!=="postgresql" || !snapshot.tables)
  throw new Error("requires generated PostgreSQL typed snapshot");
 if(catalog?.kind!=="DB020_EXACT_REGISTERED_PG17_CATALOG" ||
    diagnosis?.kind!=="DB020_DISPOSABLE_PG17_REGISTERED_VS_GENERATED_DIAGNOSIS" ||
    catalog.registeredHead!==diagnosis.registeredHead ||
    catalog.registeredMigrations!==diagnosis.registeredMigrations)
  throw new Error("refuse unrelated or unverified registered PG17 catalog");
 if(catalog.registeredMigrations<326)
  throw new Error("require 0326 CHECK validation in registered replay");
 if(snapshot.tables && Object.keys(snapshot.tables).length!==diagnosis.counts.generatedTypedTables)
  throw new Error("generated snapshot/table census does not match PG17 diagnosis");

 const physicalTables=uniqueBy(catalog.tables,t=>t.name,"table");
 const columns=uniqueBy(catalog.columns,c=>identity(c.table_name,c.column_name),"column");
 const indexes=uniqueBy(catalog.indexes,i=>identity(i.table_name,i.name),"index");
 const constraints=uniqueBy(catalog.constraints,c=>identity(c.table_name,c.name),"constraint");
 uniqueBy(catalog.triggers,t=>identity(t.table_name,t.name),"trigger");
 for(const [label,entries] of [["column",catalog.columns],["index",catalog.indexes],
  ["constraint",catalog.constraints],["trigger",catalog.triggers]]){
  for(const row of entries){
   if(!physicalTables.has(row.table_name))
    throw new Error("DB020 orphan "+label+" references absent physical table: "+row.table_name);
  }
 }
 if(catalog.constraints.filter(c=>c.type==="f").length!==diagnosis.counts.registeredFks)
  throw new Error("DB020 foreign-key census differs from pinned PG17 diagnosis");
 const typedTables=new Set(Object.keys(snapshot.tables).map(nameFromKey));
 if(physicalTables.size!==diagnosis.counts.registeredTables ||
    physicalTables.size-typedTables.size!==diagnosis.counts.registeredSqlOnlyTables)
  throw new Error("DB020 physical table census differs from pinned PG17 diagnosis");
 const missingTypedTables=[...typedTables].filter(t=>!physicalTables.has(t)).sort();
 const missingColumns=[],nullabilityDifferences=[],defaultTextDifferences=[];
 const missingTypedChecks=[],unvalidatedTypedChecks=[],namedChecksPresent=[];
 const missingTypedIndexes=[],invalidTypedIndexes=[],indexUniqueDifferences=[],namedIndexesPresent=[];
 const physicallyUnmodeledChecks=[],physicallyUnmodeledIndexes=[];
 const modelChecks=new Set(),modelIndexes=new Set();
 for(const [tableKey,t] of Object.entries(snapshot.tables)){
  const table=nameFromKey(tableKey);
  for(const col of Object.values(t.columns||{})){
   const key=identity(table,col.name),actual=columns.get(key);
   if(!actual){missingColumns.push(key);continue;}
   if(Boolean(actual.not_null)!==Boolean(col.notNull))
    nullabilityDifferences.push({field:key,typedNotNull:Boolean(col.notNull),registeredNotNull:Boolean(actual.not_null)});
   // Raw expression strings are NOT semantics. Report for human review; SQL
   // expression casts/functions/intervals need AST or PG-execution proof.
   const typedDefault=col.default??null, registeredDefault=actual.default_expression??null;
   if(String(typedDefault??"")!==String(registeredDefault??""))
    defaultTextDifferences.push({field:key,typedDefault,registeredDefault});
  }
  for(const [name,c] of Object.entries(t.checkConstraints||{})){
   const key=identity(table,name);modelChecks.add(key);
   const actual=constraints.get(key);
   if(!actual||actual.type!=="c")missingTypedChecks.push({table,name,typedExpression:c.value??null});
   else if(actual.validated!==true)unvalidatedTypedChecks.push(key);
   else namedChecksPresent.push(key);
  }
  for(const [name,i] of Object.entries(t.indexes||{})){
   const key=identity(table,name);modelIndexes.add(key);
   const actual=indexes.get(key);
   if(!actual)missingTypedIndexes.push({table,name,typedUnique:Boolean(i.isUnique)});
   else if(actual.valid!==true)invalidTypedIndexes.push(key);
   else {
    namedIndexesPresent.push(key);
    if(Boolean(actual.unique)!==Boolean(i.isUnique))
     indexUniqueDifferences.push({index:key,typedUnique:Boolean(i.isUnique),registeredUnique:Boolean(actual.unique)});
   }
  }
 }
 for(const c of catalog.constraints)
  if(c.type==="c"&&typedTables.has(c.table_name)&&!modelChecks.has(identity(c.table_name,c.name)))
   physicallyUnmodeledChecks.push({table:c.table_name,name:c.name,validated:c.validated,definition:c.definition});
 for(const i of catalog.indexes)
  if(typedTables.has(i.table_name)&&!modelIndexes.has(identity(i.table_name,i.name))&&i.primary!==true)
   physicallyUnmodeledIndexes.push({table:i.table_name,name:i.name,valid:i.valid,unique:i.unique,definition:i.definition});
 const invalidPhysicalConstraints=catalog.constraints.filter(c=>c.validated!==true)
  .map(c=>identity(c.table_name,c.name));
 const invalidPhysicalIndexes=catalog.indexes.filter(i=>i.valid!==true)
  .map(i=>identity(i.table_name,i.name));
 const disabledTriggers=catalog.triggers.filter(t=>t.enabled!=="O"&&t.enabled!=="A")
  .map(t=>identity(t.table_name,t.name)+":"+t.enabled);
 // Missing typed CHECKs/indexes are blocking drift even if no same-name
 // physical constraint exists. SQL-owned unnamed contracts are audited
 // separately; they do not excuse absent typed schema contracts.
 const hardDifferences=missingTypedTables.length+missingColumns.length+nullabilityDifferences.length+
  missingTypedChecks.length+unvalidatedTypedChecks.length+
  missingTypedIndexes.length+invalidTypedIndexes.length+indexUniqueDifferences.length+
  invalidPhysicalConstraints.length+invalidPhysicalIndexes.length+disabledTriggers.length;
 const structuralFailures=[
  ["typed table absent from independent PG17 catalog",missingTypedTables.length],
  ["missing typed table in PG17",diagnosis.counts.generatedAbsentInRegisteredPg],
  ["missing typed columns in PG17",diagnosis.counts.generatedTypedMissingColumns],
  ["unmodeled columns on typed tables",diagnosis.counts.registeredExtraColumnsOnTypedTables],
  ["unexplained PostgreSQL type mismatches",diagnosis.counts.unexplainedTypeDifferences],
  ["missing typed FK shapes",diagnosis.counts.typedFkShapesMissingFromCatalog],
  ["unvalidated PG17 FKs",diagnosis.counts.unvalidatedFks],
  ["CHECK/index/nullability/trigger structural drift",hardDifferences],
 ].filter(([,count])=>count!==0).map(([reason,count])=>({reason,count}));
 const structurallyConsistent=structuralFailures.length===0;
 return {
  kind:"DB020_REGISTERED_PG17_SEMANTIC_DRIFT_DIAGNOSIS",
  source:"unapplied-generated-typed-snapshot-vs-readonly-pg17-catalog",
  registeredHead:catalog.registeredHead,
  registeredMigrations:catalog.registeredMigrations,
  generatedSnapshotId:snapshot.id,
  passCertification:false,
  // A green structural gate is deliberately NOT DB020 global certification.
  structurallyConsistent,
  structuralFailures,
  requiresHumanSqlReview:true,
  counts:{
   typedTables:typedTables.size,
   catalogTables:catalog.tables.length,
   typedTablesMissingFromPhysicalCatalog:missingTypedTables.length,
   missingColumns:missingColumns.length,
   nullabilityDifferences:nullabilityDifferences.length,
   rawDefaultExpressionDifferences:defaultTextDifferences.length,
   typedCheckNamesAbsentFromCatalog:missingTypedChecks.length,
   typedCheckNamesValidatedInCatalog:namedChecksPresent.length,
   typedChecksUnvalidatedInCatalog:unvalidatedTypedChecks.length,
   typedIndexNamesAbsentFromCatalog:missingTypedIndexes.length,
   typedIndexNamesValidInCatalog:namedIndexesPresent.length,
   typedIndexUniquenessDifferences:indexUniqueDifferences.length,
   typedIndexesInvalidInCatalog:invalidTypedIndexes.length,
   registeredChecksNotNamedByTypedSchema:physicallyUnmodeledChecks.length,
   registeredIndexesNotNamedByTypedSchema:physicallyUnmodeledIndexes.length,
   unvalidatedRegisteredConstraintsAllTypes:invalidPhysicalConstraints.length,
   invalidPhysicalIndexes:invalidPhysicalIndexes.length,
   disabledRegisteredTriggers:disabledTriggers.length,
   hardDifferences,
  },
  missingTypedTables:capped(missingTypedTables),
  missingColumns:capped(missingColumns),
  nullabilityDifferences:capped(nullabilityDifferences),
  defaultTextDifferences:capped(defaultTextDifferences),
  missingTypedChecks:capped(missingTypedChecks),
  unvalidatedTypedChecks:capped(unvalidatedTypedChecks),
  missingTypedIndexes:capped(missingTypedIndexes),
  invalidTypedIndexes:capped(invalidTypedIndexes),
  indexUniqueDifferences:capped(indexUniqueDifferences),
  physicallyUnmodeledChecks:capped(physicallyUnmodeledChecks),
  physicallyUnmodeledIndexes:capped(physicallyUnmodeledIndexes),
  invalidPhysicalConstraints:capped(invalidPhysicalConstraints),
  invalidPhysicalIndexes:capped(invalidPhysicalIndexes),
  disabledTriggers:capped(disabledTriggers),
  coverageLimitations:[
   "Matching CHECK/index names do not prove identical expressions, predicates, key order or operators",
   "Default textual differences are not automatically equivalent or defects",
   "SQL-only tables and SQL-owned FKs/triggers require their own executed witnesses",
   "Do not baseline Drizzle snapshots or promote generated SQL on this report alone",
  ],
 };
}
if(process.argv[1]&&process.argv[1].endsWith("db020-schema-semantics-diff.mjs")){
 const read=p=>JSON.parse(readFileSync(p,"utf8"));
 const report=inspectDb020StructuralSemantics(
  read(".verification/db020-current-typed-snapshot.json"),
  read(".verification/db020-registered-catalog-full.json"),
  read(".verification/db020-catalog-disposition.json"));
 mkdirSync(".verification",{recursive:true});
 writeFileSync(".verification/db020-semantic-disposition.json",JSON.stringify(report,null,2)+"\n");
 console.log(JSON.stringify({kind:report.kind,registeredHead:report.registeredHead,
  counts:report.counts,structurallyConsistent:report.structurallyConsistent,
  structuralFailures:report.structuralFailures,passCertification:report.passCertification},null,2));
 if(!report.structurallyConsistent)process.exitCode=1;
}
