import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

// Source-only CHECK predicate audit; not an SQL parser or PostgreSQL execution.
const pairs=[
 ["src/db/schema/db10-general-notices.draft.ts","scripts/sql/db10-general-notices-staging.sql"],
 ["src/db/schema/db10-log-alerts.draft.ts","scripts/sql/db10-log-alerts-staging.sql"],
 ["src/db/schema/db10-skills-catalog.draft.ts","scripts/sql/db10-skills-catalog-staging.sql"],
];
const tick=String.fromCharCode(96);
function balanced(s,open){
 let depth=1,quoted=false;
 for(let i=open+1;i<s.length;i++){
  if(s[i]==="'"){
   if(quoted&&s[i+1]==="'"){i++;continue}
   quoted=!quoted;continue;
  }
  if(quoted)continue;
  if(s[i]==="(")depth++;
  if(s[i]===")"&&--depth===0)return s.slice(open+1,i);
 }
 throw Error("unterminated CHECK");
}
function fullyWrapped(s){
 if(!s.startsWith("(")||!s.endsWith(")"))return false;
 let depth=0,quoted=false;
 for(let i=0;i<s.length;i++){
  if(s[i]==="'"){if(quoted&&s[i+1]==="'"){i++;continue}quoted=!quoted;continue}
  if(quoted)continue;
  if(s[i]==="(")depth++;
  if(s[i]===")"&&--depth===0&&i!==s.length-1)return false;
 }
 return !quoted&&depth===0;
}
export function canonicalCheck(s){
 let out="",quoted=false;
 for(let i=0;i<s.length;i++){
  const c=s[i];
  if(c==="'"){
   out+=c;if(quoted&&s[i+1]==="'"){out+=s[++i];continue}
   quoted=!quoted;continue;
  }
  if(quoted){out+=c;continue}
  if(/\s/.test(c))continue;
  out+=c.toLowerCase();
 }
 assert.equal(quoted,false,"unterminated SQL quoted literal");
 out=out.replace(/\bbtrim\(/g,"trim(");
 while(fullyWrapped(out))out=out.slice(1,-1);
 return out;
}
export function compareChecks(draft,stage,label){
 const props=Object.fromEntries([...draft.matchAll(
  /^\s*(\w+):\s*(?:uuid|bigint|integer|boolean|varchar|timestamp|date|jsonb|text)\(\s*["'](\w+)["']/gm
 )].map(m=>[m[1],m[2]]));
 const left=new Map(),right=new Map();
 const pattern=new RegExp("\\bcheck\\(\\s*[\"'](\\w+)[\"']\\s*,\\s*sql"+tick+"([^"+tick+"]+)"+tick+"\\s*\\)","g");
 for(const m of draft.matchAll(pattern)){
  assert.ok(!left.has(m[1]),label+": duplicate Drizzle CHECK");
  const expr=m[2].replace(/\$\{t\.(\w+)\}/g,(_,name)=>{
   assert.ok(props[name],label+": unknown column property "+name);
   return props[name];
  });
  assert.doesNotMatch(expr,/\$\{/,label+": unsupported expression");
  left.set(m[1],canonicalCheck(expr));
 }
 for(const m of stage.matchAll(/\bCONSTRAINT\s+(\w+)\s+CHECK\s*\(/gi)){
  assert.ok(!right.has(m[1]),label+": duplicate SQL CHECK");
  right.set(m[1],canonicalCheck(balanced(stage,m.index+m[0].length-1)));
 }
 assert.ok(left.size>0,label+": no predicates extracted");
 assert.deepEqual([...left.keys()].sort(),[...right.keys()].sort(),label+": CHECK coverage differs");
 for(const [name,predicate]of left){
  assert.equal(predicate,right.get(name),label+": CHECK expression drift "+name);
 }
 return left.size;
}
for(const [draft,stage]of pairs){
 test("DB10 exact CHECK predicate parity: "+draft,()=>{
  assert.ok(compareChecks(readFileSync(draft,"utf8"),
   readFileSync(stage,"utf8"),draft)>0);
 });
}
const fixtureTs=[
 "pgTable('example',{",
 " status:varchar('status',{length:12}),",
 " count:integer('count'),",
 "},(t)=>[",
 " check('state_ck',sql"+tick+"\${t.status} in ('OPEN','FIXED')"+tick+"),",
 " check('count_ck',sql"+tick+"\${t.count} >= 0"+tick+"),",
 "]);",
].join("\n");
const fixtureSql=[
 "CREATE TABLE example (",
 " status varchar(12),",
 " count integer,",
 " CONSTRAINT state_ck CHECK (status IN ('OPEN','FIXED')),",
 " CONSTRAINT count_ck CHECK (count >= 0)",
 ");",
].join("\n");
test("fixture: formatting and trim/btrim normalize safely",()=>{
 assert.equal(compareChecks(fixtureTs,fixtureSql,"fixture"),2);
 assert.equal(canonicalCheck(" length(trim(name)) > 0 "),
  canonicalCheck(" LENGTH(BTRIM(name))>0 "));
});
test("fixture: case-sensitive literal, status and threshold change fail",()=>{
 for(const changed of [
  fixtureSql.replace("'OPEN'","'open'"),
  fixtureSql.replace("'FIXED'","'CLOSED'"),
  fixtureSql.replace("count >= 0","count > 0"),
 ])assert.throws(()=>compareChecks(fixtureTs,changed,"negative"),/CHECK expression drift/);
});
test("fixture: missing CHECK and duplicate CHECK fail",()=>{
 assert.throws(()=>compareChecks(fixtureTs,
  fixtureSql.replace("CONSTRAINT count_ck CHECK (count >= 0)",""),"missing"),
  /CHECK coverage differs/);
 assert.throws(()=>compareChecks(fixtureTs,
  fixtureSql.replace("CONSTRAINT count_ck CHECK (count >= 0)",
   "CONSTRAINT count_ck CHECK (count >= 0), CONSTRAINT count_ck CHECK (count >= 0)"),"duplicate"),
  /duplicate SQL CHECK/);
});
