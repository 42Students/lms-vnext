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
  // The closing TABLE parenthesis can share a line with a nested CHECK,
  // e.g. "));". A literal "\n);" lookup incorrectly reports missing DDL.
  // Balance parentheses, ignoring SQL string/identifier literals and comments.
  let depth=1, single=false, double=false, lineComment=false, blockComment=false;
  for(let i=m.index+m[0].length;i<source.length;i++){
    const ch=source[i], next=source[i+1];
    if(lineComment){if(ch==="\n")lineComment=false;continue;}
    if(blockComment){if(ch==="*"&&next==="/"){blockComment=false;i++;}continue;}
    if(single){
      if(ch==="'"&&next==="'"){i++;continue;}
      if(ch==="'")single=false;
      continue;
    }
    if(double){
      if(ch==='"'&&next==='"'){i++;continue;}
      if(ch==='"')double=false;
      continue;
    }
    if(ch==="-"&&next==="-"){lineComment=true;i++;continue;}
    if(ch==="/"&&next==="*"){blockComment=true;i++;continue;}
    if(ch==="'"){single=true;continue;}
    if(ch==='"'){double=true;continue;}
    if(ch==="(")depth++;
    if(ch===")"&&--depth===0){
      const tail=source.slice(i+1).match(/^\s*;/);
      return tail?source.slice(m.index,i+1+tail[0].length):null;
    }
  }
  return null;
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
  const attendanceTriggerStart=historySql.indexOf("CREATE FUNCTION db06_require_attendance_event()");
  const attendanceTrigger=attendanceTriggerStart>=0?historySql.slice(attendanceTriggerStart):"";
  if(!/NEW\.feedback\s+IS\s+NOT\s+DISTINCT\s+FROM\s+OLD\.feedback/i.test(gradeTrigger))
    errors.push("Grade completeness trigger ignores feedback-only edits");
  for(const name of TABLES){
    if(!/\bactor_role\b/i.test(sqlTable(historySql,name)||""))
      errors.push(name+": SQL does not persist actor_role");
  }
  const attendanceTable=sqlTable(historySql,"attendance_record_events")||"";
  for(const field of [
    "attendance_record_id","delivery_id","actor_role",
    "previous_marked_by_user_id","new_marked_by_user_id",
    "previous_marked_at","new_marked_at",
    "record_version_before","record_version_after"
  ]){
    if(!new RegExp("\\b"+field+"\\b","i").test(attendanceTable))
      errors.push("attendance_record_events: missing canonical field "+field);
  }
  if(/\brevision\b|previous_attendance_record_id|new_attendance_record_id/i.test(attendanceTable))
    errors.push("attendance_record_events: legacy delete/recreate identity leaked into canonical SQL");
  for(const fragment of [
    "previous_marked_by_user_id","new_marked_by_user_id",
    "previous_marked_at","new_marked_at"
  ]){
    if(!new RegExp(fragment,"i").test(attendanceTrigger))
      errors.push("Attendance completeness trigger ignores "+fragment);
  }
  if(!/attendance record identity is immutable/i.test(historySql))
    errors.push("Attendance current-row identity immutability guard is missing");
  if(!/actor must equal current marker/i.test(historySql))
    errors.push("Attendance event actor/current-marker equality guard is missing");
  const attendanceStaged=stagedTable(stagedSql,"attendance_record_events")||"";
  const attendanceSql=sqlTable(historySql,"attendance_record_events")||"";
  const attendanceWhole=historySql;

  const forbiddenAttendanceFields=[
    "revision",
    "previous_attendance_record_id",
    "new_attendance_record_id"
  ];
  for(const field of forbiddenAttendanceFields){
    if(new RegExp("\\b"+field+"\\b","i").test(attendanceStaged) ||
       new RegExp("\\b"+field+"\\b","i").test(attendanceSql)){
      errors.push("attendance_record_events: obsolete session-revision field reintroduced: "+field);
    }
  }

  if(!/delivery_id\s+uuid\s+NOT\s+NULL/i.test(attendanceSql))
    errors.push("attendance_record_events: delivery_id must be NOT NULL");
  if(!/linked_delivery\s+IS\s+NULL[\s\S]*attendance event requires a course-linked schedule/i.test(attendanceWhole))
    errors.push("attendance history must reject a schedule event without a delivery link");
  if(!/NEW\.delivery_id\s+IS\s+DISTINCT\s+FROM\s+linked_delivery/i.test(attendanceWhole))
    errors.push("attendance history must mirror the required canonical schedule delivery link");
  if(!/section_schedule_event_courses[\s\S]*schedule_event_id\s*=\s*NEW\.schedule_event_id/i.test(attendanceWhole))
    errors.push("attendance history does not resolve the canonical schedule delivery link");
  for(const token of [
    "attendance_record_events_record_identity_fk",
    "attendance_record_events_delivery_identity_fk",
    "attendance_records_event_identity_uq",
    "section_schedule_event_courses_event_delivery_uq",
    "ADD COLUMN version integer NOT NULL DEFAULT 0"
  ]){
    if(!attendanceWhole.includes(token))
      errors.push("attendance history prerequisite missing: "+token);
  }
  for(const token of [
    "previous_marked_by_user_id",
    "new_marked_by_user_id",
    "previous_marked_at",
    "new_marked_at"
  ]){
    const requireStart=attendanceWhole.indexOf("CREATE FUNCTION db06_require_attendance_event()");
    const requireBody=requireStart>=0?attendanceWhole.slice(requireStart):"";
    if(!requireBody.includes(token))
      errors.push("Attendance completeness trigger ignores marker snapshot: "+token);
  }
  const versionStart=attendanceWhole.indexOf("CREATE FUNCTION db06_attendance_record_version_guard()");
  const versionBody=versionStart>=0?attendanceWhole.slice(versionStart):"";
  if(!/NEW\.marked_at\s+IS\s+DISTINCT\s+FROM\s+OLD\.marked_at/i.test(versionBody))
    errors.push("Attendance version guard ignores marked_at changes");

  const fieldDifferences=Object.values(tables).reduce((n,t)=>
     n+t.missingSqlColumns.length+t.missingStagedColumns.length,0);
  return {
    status:errors.length?"BLOCKED_SOURCE_DRIFT":"STRUCTURALLY_ALIGNED_UNVERIFIED",
    readyForPromotion:false,verifiedPostgreSQL:false,fieldDifferences,
    malformedRawSqlLiterals:malformed,tables,errors,warnings,
    requiredEvidence:[
      "Retained explicit-PRESENT attendance row + monotonic version model preserved through migration integration",
      "Drizzle+SQL field/CHECK parity plus current-row and schedule-delivery composite identities",
      "Atomic grade/publish/attendance producers with request actor, exact snapshots and CAS",
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
