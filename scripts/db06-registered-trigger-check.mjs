#!/usr/bin/env node
/** DB06 migration 0041→0042 trigger-catalog structural audit.
 * A source check only; never call it PostgreSQL execution/verification.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

export const migrations = [
  "drizzle/0041_db06_assessment_parent_scope.sql",
  "drizzle/0042_db06_assessment_scope_hardening.sql",
];
const required = [
  "db06_course_quiz_parent_guard", "db06_course_assignment_parent_guard",
  "db06_quiz_attempt_parent_guard", "db06_assignment_submission_parent_guard",
  "db06_quiz_answer_parent_guard", "db06_lesson_assessment_reparent_guard",
  "db06_learning_path_assessment_reparent_guard", "db06_quiz_question_reparent_guard",
  "db06_delivery_assessment_history_guard", "db06_section_assessment_history_guard",
  "db06_offering_assessment_history_guard",
];
const noComments = s => s.replace(/\/\*[\s\S]*?\*\//g," ").replace(/--[^\n]*/g," ");
const noStrings = s => noComments(s).replace(/'(?:''|[^'])*'/g,"''");
export function auditDb06Triggers(inputs, snapshot, journal) {
  const errors=[], warnings=[], functions=new Map(), active=new Map(), created=new Map();
  const cols=new Map(Object.values(snapshot.tables||{}).map(t=>[
    t.name?.toLowerCase(),new Set(Object.keys(t.columns||{}).map(x=>x.toLowerCase()))
  ]));
  for (const file of migrations) {
    const sql=inputs[file];
    if(typeof sql!=="string") {errors.push("Missing SQL: "+file);continue;}
    const tag=file.split("/").pop().replace(/\.sql$/,"");
    if(!journal.entries?.some(e=>e.tag===tag))errors.push("Journal missing: "+tag);
    const definition=/CREATE\s+(?:OR\s+REPLACE\s+)?FUNCTION\s+([a-z]\w*)\s*\([^)]*\)\s*RETURNS\s+trigger\s+LANGUAGE\s+plpgsql\s+AS\s+(\$[a-z0-9_]*\$)([\s\S]*?)\2\s*;/ig;
    for(const m of sql.matchAll(definition)) {
      const body=m[3],fields=[...new Set([...noStrings(body).matchAll(/\b(?:NEW|OLD)\.([a-z]\w*)\b/ig)].map(x=>x[1].toLowerCase()))];
      functions.set(m[1].toLowerCase(),{body,fields});
    }
    for(const statement of sql.split(/-->\s*statement-breakpoint/g)) {
      const clean=noComments(statement);
      const drop=clean.match(/\bDROP\s+TRIGGER\s+(?:IF\s+EXISTS\s+)?([a-z]\w*)\s+ON\s+([a-z]\w*)/i);
      if(drop) {
        const name=drop[1].toLowerCase(),table=drop[2].toLowerCase();
        if(active.has(name)&&active.get(name).table!==table) errors.push("DROP "+name+" targets wrong table");
        else if(!active.has(name))errors.push("DROP "+name+" has no prior audited CREATE");
        active.delete(name);
      }
      const create=clean.match(/\bCREATE\s+(?:CONSTRAINT\s+)?TRIGGER\s+([a-z]\w*)\s+([\s\S]*?)\bON\s+([a-z]\w*)\s+([\s\S]*?)\bEXECUTE\s+FUNCTION\s+([a-z]\w*)\s*\(/i);
      if(!create)continue;
      const [,raw,event,rawTable,,rawFn]=create;
      const name=raw.toLowerCase(),table=rawTable.toLowerCase(),fnName=rawFn.toLowerCase();
      const tableCols=cols.get(table),fn=functions.get(fnName);
      if(!tableCols)errors.push(name+": unknown trigger target "+table);
      if(!fn)errors.push(name+": function missing "+fnName);
      if(active.has(name))errors.push(name+": duplicated without DROP");
      const update=event.match(/\bUPDATE\s+OF\s+([\s\S]*?)(?=\bOR\b|\bON\b|$)/i);
      if(update)for(const rawField of update[1].split(",")){
        const field=rawField.trim().toLowerCase();
        if(field&&!tableCols?.has(field))errors.push(name+": nonexistent UPDATE OF "+field);
      }
      for(const field of fn?.fields||[]){
        if(tableCols?.has(field))continue;
        const otherTableBranch=field==="max_points"&&table==="course_quizzes"&&
          fnName==="db06_guard_assessment_definition"&&
          /TG_TABLE_NAME\s*=\s*'course_assignments'/i.test(fn.body)&&
          cols.get("course_assignments")?.has(field);
        if(otherTableBranch)warnings.push(name+": max_points correctly guarded for assignment branch");
        else errors.push(name+": "+fnName+" references absent "+table+"."+field);
      }
      active.set(name,{table,fnName});
      created.set(name,(created.get(name)||0)+1);
    }
  }
  for(const name of required)if(!active.has(name))errors.push("Required trigger absent: "+name);
  for(const name of ["db06_course_assignment_parent_guard","db06_assignment_submission_parent_guard"])
    if(created.get(name)!==2)errors.push("Expected hardening replacement: "+name);
  return {status:errors.length?"FAILED":"SOURCE_PASS_NOT_PG",errors,warnings,
    functionCount:functions.size,triggerCount:active.size,
    registrationChecked:migrations.length};
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
  const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),"..");
  const read=p=>fs.readFileSync(path.join(root,p),"utf8");
  const inputs=Object.fromEntries(migrations.map(p=>[p,read(p)]));
  const result=auditDb06Triggers(inputs,JSON.parse(read("drizzle/meta/0042_snapshot.json")),
    JSON.parse(read("drizzle/meta/_journal.json")));
  if(process.argv.includes("--json"))console.log(JSON.stringify(result,null,2));
  else console.log("DB06 registered trigger audit: "+result.status+" ("+result.triggerCount+" active triggers)");
  if(result.errors.length)process.exitCode=2;
}
