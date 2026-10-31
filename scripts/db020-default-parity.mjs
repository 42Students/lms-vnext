#!/usr/bin/env node
// DB020 exact typed-vs-registered PostgreSQL DEFAULT proof. This is a
// readonly catalog audit, NOT automatic schema promotion or phase acceptance.
import {readFileSync,writeFileSync,mkdirSync} from "node:fs";
import assert from "node:assert/strict";

function literalValue(value){
 if(value===null||value===undefined)return null;
 if(typeof value==="boolean"||typeof value==="number")return String(value);
 return String(value).trim();
}
function typedColumnName(k){return k.startsWith("public.")?k.slice(7):k; }
const jsonLiteral=x=>{
 const match=/^'((?:[^']|'')*)'::jsonb$/.exec(String(x??""));
 if(!match)return null;
 try{return JSON.parse(match[1].replaceAll("''","'"));}catch{return null;}
};
const deepJson=x=>JSON.stringify(x,(_,v)=>v&&typeof v==="object"&&!Array.isArray(v)?
 Object.fromEntries(Object.entries(v).sort(([a],[b])=>a.localeCompare(b))):v);
export function proveDefault({field,typedDefault,pgDefault,typedType,pgType,bigserialProof}){
 const a=literalValue(typedDefault),b=literalValue(pgDefault);
 if(a===b)return "exact";
 if(a===null || b===null){
  if(a===null && b!==null && typedType==="bigserial" &&
    bigserialProof?.field===field && bigserialProof?.pgDefault===b &&
    /^nextval\('[^']+'::regclass\)$/.test(b))
   return "pg17-owned-bigserial-sequence";
  return null;
 }
 if(typeof typedDefault==="string" && /^'([^']|'')*'$/.test(a)){
  const cast=/^('(?:[^']|'')*')::(character varying|text|[a-z_][a-z0-9_]*)$/.exec(b);
  if(cast && cast[1]===a &&
     (cast[2]==="character varying"&&typedType.startsWith("varchar(") ||
      cast[2]==="text"&&typedType==="text" ||
      cast[2]===typedType&&typedType===pgType))
    return "same-literal-with-resolved-pg-type-cast";
 }
 if(typedType==="jsonb"){
  const left=jsonLiteral(a),right=jsonLiteral(b);
  if(left!==null&&right!==null&&deepJson(left)===deepJson(right))
   return "same-jsonb-value";
 }
 if(field==="placement_recruiter_college_grants.capabilities" &&
    typedType==="text[]" && a==="ARRAY['DRIVES']::text[]" &&
    b==="ARRAY['DRIVES'::text]")
  return "same-array-one-element-resolved-cast";
 if(field==="placement_applications.public_ref" &&
    typedType==="varchar(33)" &&
    a==="'A' || upper(replace(gen_random_uuid()::text, '-', ''))" &&
    b==="('A'::text || upper(replace((gen_random_uuid())::text, '-'::text, ''::text)))")
  return "same-uuid-public-reference-expression";
 return null;
}
export function auditDb020Defaults(snapshot,catalog,diagnosis){
 if(snapshot?.dialect!=="postgresql" ||
    catalog?.kind!=="DB020_EXACT_REGISTERED_PG17_CATALOG" ||
    diagnosis?.kind!=="DB020_DISPOSABLE_PG17_REGISTERED_VS_GENERATED_DIAGNOSIS" ||
    catalog.registeredHead!==diagnosis.registeredHead ||
    catalog.registeredMigrations!==diagnosis.registeredMigrations ||
    catalog.registeredMigrations<327)
  throw new Error("DB020 default audit requires exact registered 0326+ PG17 artifacts");
 const pgColumns=new Map(catalog.columns.map(c=>[c.table_name+"."+c.column_name,c]));
 const proofs=new Map((diagnosis.verifiedBigserialSemantics||[]).map(x=>[x.field,x]));
 const counts={},unexplained=[],missing=[];
 let checked=0;
 for(const [tableKey,t] of Object.entries(snapshot.tables||{})){
  const table=typedColumnName(tableKey);
  for(const col of Object.values(t.columns||{})){
   const field=table+"."+col.name,actual=pgColumns.get(field);
   if(!actual){missing.push(field);continue}
   checked++;
   const proof=proveDefault({field,typedDefault:col.default??null,
    pgDefault:actual.default_expression??null,typedType:col.type,pgType:actual.data_type,
    bigserialProof:proofs.get(field)});
   if(proof)counts[proof]=(counts[proof]||0)+1;
   else unexplained.push({field,typedType:col.type,pgType:actual.data_type,
    typedDefault:col.default??null,pgDefault:actual.default_expression??null});
  }
 }
 return {kind:"DB020_REGISTERED_PG17_DEFAULT_PROOF",registeredHead:diagnosis.registeredHead,
  registeredMigrations:diagnosis.registeredMigrations,
  checkedColumns:checked,proofCategories:counts,missing,unexplained,
  defaultsStructurallyReconciled:missing.length===0&&unexplained.length===0,
  passCertification:false,
  limitations:["DEFAULTs verified only, not CHECK expressions/index predicates/tenant privacy",
   "Current PG17 registered catalog and independent DB020 phase gate are distinct",
   "No generated Drizzle SQL may be applied from this audit"]};
}
if(process.argv[1]?.endsWith("db020-default-parity.mjs")){
 const read=p=>JSON.parse(readFileSync(p,"utf8"));
 const r=auditDb020Defaults(read(".verification/db020-unapplied-generated-snapshot.json"),
  read(".verification/db020-registered-catalog-full.json"),
  read(".verification/db020-catalog-disposition.json"));
 mkdirSync(".verification",{recursive:true});
 writeFileSync(".verification/db020-default-parity.json",JSON.stringify(r,null,2)+"\n");
 console.log(JSON.stringify({kind:r.kind,checkedColumns:r.checkedColumns,
  proofCategories:r.proofCategories,unexplained:r.unexplained,missing:r.missing},null,2));
 if(!r.defaultsStructurallyReconciled)process.exitCode=1;
}
