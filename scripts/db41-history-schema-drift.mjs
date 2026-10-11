#!/usr/bin/env node
/* DB41: source-only audit for the DB06 grade/attendance history proposals.
 * A missing field blocks migration promotion. Never claims PostgreSQL proof.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

export const SOURCES = {
  drizzle: "src/db/schema/db06-history-staged.ts",
  sql: "docs/planning/sql/db06-assessment-attendance-history-candidate.sql"
};
export const TABLES = ["assignment_grade_events","attendance_record_events"];
const fieldType = "(?:uuid|varchar\\s*\\(\\s*\\d+\\s*\\)|integer|bigint|text|boolean|timestamptz)";
const uniqueSort = arr => [...new Set(arr)].sort();

function stagedTable(source,name) {
  const matcher=new RegExp("\\bpgTable\\(\\s*[\"']"+name+"[\"']\\s*,","g");
  const match=matcher.exec(source);
  if(!match)return null;
  const remaining=source.slice(match.index);
  const next=remaining.indexOf("\nexport const ",match[0].length);
  return next<0?remaining:remaining.slice(0,next);
}
function sqlTable(source,name) {
  const pattern=new RegExp("\\bCREATE\\s+TABLE\\s+(?:IF\\s+NOT\\s+EXISTS\\s+)?"+name+"\\s*\\(","ig");
  const m=pattern.exec(source);
  if(!m)return null;
  const block=source.slice(m.index);
  const end=block.indexOf("\n);");
  return end<0?null:block.slice(0,end+3);
}
function columnsFromDrizzle(s){
  return [...s.matchAll(/\b(?:uuid|varchar|integer|timestamp|text|boolean|bigint)\(\s*["']([a-z][a-z0-9_]*)["']/gi)].map(m=>m[1].toLowerCase());
}
function columnsFromSql(s){
  const matcher=new RegExp("^\\s{2}([a-z][a-z0-9_]*)\\s+"+fieldType+"(?=\\s|,|\\()","gmi");
  return [...s.matchAll(matcher)].map(m=>m[1].toLowerCase());
}
function definedConstraints(s,kind){
  const re=kind==="staged"?/\b(?:check|uniqueIndex|index)\(\s*["']([a-z][a-z0-9_]*)["']/gi:/\bCONSTRAINT\s+([a-z][a-z0-9_]*)/gi;
  return uniqueSort([...s.matchAll(re)].map(m=>m[1].toLowerCase()));
}
function missing(original,target) {
  const set=new Set(target);
  return uniqueSort(original.filter(x=>!set.has(x)));
}
function malformedLiterals(text){
  return text.split("\n").flatMap((line,i)=>{
    if(/sql\.raw\("["(]/.test(line))return [{line:i+1}];
    return [];
  });
}
export function auditDb41(stagedSql,historySql){
  const errors=[],warnings=[],tables={};
  const malformed=malformedLiterals(stagedSql);
  if(malformed.length)errors.push("Malformed TypeScript sql.raw strings: "+malformed.length);
  for(const name of TABLES){
    const staged=stagedTable(stagedSql,name),sql=sqlTable(historySql,name);
    if(!staged)errors.push(name+": missing staged pgTable");
    if(!sql)errors.push(name+": missing SQL CREATE TABLE");
    if(!staged||!sql)continue;
    const a=columnsFromDrizzle(staged),b=columnsFromSql(sql);
    const stagedChecks=definedConstraints(staged,"staged").filter(n=>n.endsWith("_ck"));
    const sqlChecks=definedConstraints(sql,"sql").filter(n=>n.endsWith("_ck"));
    const missingSqlColumns=missing(a,b);
    const missingStagedColumns=missing(b,a);
    const missingSqlChecks=missing(stagedChecks,sqlChecks);
    const missingStagedChecks=missing(sqlChecks,stagedChecks);
    tables[name]={
      stagedColumnCount:uniqueSort(a).length,sqlColumnCount:uniqueSort(b).length,
      missingSqlColumns,missingStagedColumns,missingSqlChecks,missingStagedChecks
    };
    if(missingSqlColumns.length||missingStagedColumns.length)
      errors.push(name+": columns disagree ("+missingSqlColumns.length+" SQL missing, "+
                  missingStagedColumns.length+" Drizzle missing)");
    if(missingSqlChecks.length||missingStagedChecks.length)
      warnings.push(name+": CHECK constraint definitions differ");
  }
  const gradeTriggerStart=historySql.indexOf("CREATE FUNCTION db06_require_assignment_grade_event()");
  const gradeTrigger=gradeTriggerStart>=0?historySql.slice(gradeTriggerStart):"";
  if(!/NEW\.feedback\s+IS\s+NOT\s+DISTINCT\s+FROM\s+OLD\.feedback/i.test(gradeTrigger))
    errors.push("Grade completeness trigger ignores feedback-only edits");
  for(const name of TABLES){
    if(!/\bactor_role\b/i.test(sqlTable(historySql,name)||""))
      errors.push(name+": SQL does not persist actor_role");
  }
  const fieldDifferences=Object.values(tables).reduce((n,t)=>
     n+t.missingSqlColumns.length+t.missingStagedColumns.length,0);
  return {
    status:errors.length?"BLOCKED_SOURCE_DRIFT":"STRUCTURALLY_ALIGNED_UNVERIFIED",
    readyForPromotion:false,verifiedPostgreSQL:false,fieldDifferences,
    malformedRawSqlLiterals:malformed,tables,errors,warnings,
    requiredEvidence:[
      "Select one attendance history identity/version model",
      "Drizzle+SQL field and CHECK parity",
      "Atomic grade/publish/attendance producers with request actor",
      "Real disposable PostgreSQL replay and negative/race tests"
    ]
  };
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
  const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),"..");
  const read=p=>fs.readFileSync(path.join(root,p),"utf8");
  const result=auditDb41(read(SOURCES.drizzle),read(SOURCES.sql));
  if(process.argv.includes("--json"))console.log(JSON.stringify(result,null,2));
  else console.log("DB41 history parity: "+result.status+"; "+result.fieldDifferences+
                   " column differences; "+result.errors.length+" blockers (NO PG EXECUTION)");
  if(result.errors.length)process.exitCode=2;
}
