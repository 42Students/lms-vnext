import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

// Source-only: explicit staged table families, not registered migrations.
const pairs=[
 ["src/db/schema/db10-general-notices.draft.ts","scripts/sql/db10-general-notices-staging.sql"],
 ["src/db/schema/db10-log-alerts.draft.ts","scripts/sql/db10-log-alerts-staging.sql"],
 ["src/db/schema/db10-skills-catalog.draft.ts","scripts/sql/db10-skills-catalog-staging.sql"],
];
function normalizeDefault(raw){
 if(raw===null)return null;
 let v=raw.trim();
 if(/^-?\d+n$/.test(v))return v.slice(0,-1);
 if(/^(?:true|false|-?\d+|gen_random_uuid\(\)|now\(\))$/i.test(v))
  return v.toLowerCase();
 if(/^\{\}$/.test(v)||/^'\{\}'::jsonb$/i.test(v))return "jsonb:{}";
 if(/^"[^"]+"$/.test(v))return "str:"+v.slice(1,-1);
 if(/^'[^']+'$/.test(v))return "str:"+v.slice(1,-1);
 throw Error("unsupported default expression: "+v);
}
export function compareDefaults(draft,stage,label){
 const left=[];
 for(const [,table,body]of draft.matchAll(
  /\bpgTable\(\s*["'](\w+)["'],\s*{([\s\S]*?)^\s*},\s*\(t\)\s*=>/gm,
 )){
  const fields=[...body.matchAll(
   /^\s*\w+:\s*(?:uuid|bigint|integer|boolean|varchar|timestamp|date|jsonb|text)\(\s*["'](\w+)["']/gm,
  )];
  for(let i=0;i<fields.length;i++){
   const part=body.slice(fields[i].index,fields[i+1]?.index??body.length);
   const forms=[
    part.includes(".defaultRandom()")?"gen_random_uuid()":null,
    part.includes(".defaultNow()")?"now()":null,
    /\.default\((true|false|-?\d+n?|["'][^"']+["']|\{\})\)/.exec(part)?.[1]??null,
   ].filter(x=>x!==null);
   assert.ok(forms.length<=1,label+": multiple defaults "+table+"."+fields[i][1]);
   left.push([table,fields[i][1],normalizeDefault(forms[0]??null)]);
  }
 }
 const right=[];
 for(const [,table,body]of stage.matchAll(
  /^\s*CREATE\s+TABLE\s+(\w+)\s*\(([\s\S]*?)^\);/gim,
  )){
  const columns=[...body.matchAll(
   /^\s*(\w+)\s+(?:uuid|bigint|integer|boolean|varchar\(\d+\)|timestamp with time zone|timestamptz|date|jsonb|text)(?=\s|,|$)([^\n]*)/gim,
  )];
  for(const m of columns){
   const defaultExpr=/\bDEFAULT\s+(\S+)/i.exec(m[2])?.[1]?.replace(/,$/, "")??null;
   right.push([table,m[1],normalizeDefault(defaultExpr)]);
  }
 }
 assert.ok(left.length,label+": no draft columns");
 assert.deepEqual(left.map(JSON.stringify).toSorted(),right.map(JSON.stringify).toSorted(),
  label+": default presence/value drift (includes column inventory)");
 return {columns:left.length,withDefaults:left.filter(x=>x[2]!==null).length};
}
for(const [draft,stage]of pairs){
 test("DB10 staged default parity: "+draft,()=>{
  compareDefaults(readFileSync(draft,"utf8"),readFileSync(stage,"utf8"),draft);
 });
}
const fixtureTs=[
 "pgTable('example',{",
 " id:uuid('id').defaultRandom().primaryKey(),",
 " count:bigint('count',{mode:'bigint'}).default(1n),",
 " enabled:boolean('enabled').default(true),",
 " state:varchar('state',{length:16}).default('OPEN'),",
 " attrs:jsonb('attrs').default({}),",
 " at:timestamp('at',{withTimezone:true}).defaultNow(),",
 "},(t)=>[]);",
].join("\n");
const fixtureSql=[
 "CREATE TABLE example (",
 " id uuid PRIMARY KEY DEFAULT gen_random_uuid(),",
 " count bigint DEFAULT 1,",
 " enabled boolean DEFAULT true,",
 " state varchar(16) DEFAULT 'OPEN',",
 " attrs jsonb DEFAULT '{}'::jsonb,",
 " at timestamptz DEFAULT now()",
 ");",
].join("\n");
test("fixture: bigint, booleans, strings, JSONB, UUID and now() defaults match",()=>{
 assert.deepEqual(compareDefaults(fixtureTs,fixtureSql,"good"),{columns:6,withDefaults:6});
});
test("fixture: missing default or changed value/case fails",()=>{
 for(const bad of [
  fixtureSql.replace("DEFAULT 1","DEFAULT 2"),
  fixtureSql.replace("DEFAULT 'OPEN'","DEFAULT 'open'"),
  fixtureSql.replace("DEFAULT now()",""),
  fixtureSql.replace("DEFAULT true","DEFAULT false"),
  fixtureSql.replace("DEFAULT '{}'::jsonb",""),
 ])assert.throws(()=>compareDefaults(fixtureTs,bad,"bad"),/default presence\/value drift/);
});
test("fixture: SQL trailing column commas do not alter default values",()=>{
 const withComma=fixtureSql.replace("count bigint DEFAULT 1,", "count bigint DEFAULT 1,");
 assert.deepEqual(compareDefaults(fixtureTs,withComma,"trailing commas"),
  {columns:6,withDefaults:6});
});
test("fixture: unsupported default functions fail closed",()=>{
 assert.throws(()=>compareDefaults(fixtureTs,
  fixtureSql.replace("DEFAULT now()","DEFAULT clock_timestamp()"),"unknown"),
  /unsupported default expression/);
});
