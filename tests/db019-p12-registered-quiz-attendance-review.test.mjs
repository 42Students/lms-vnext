import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import test from "node:test";

const read=path=>readFileSync(path,"utf8");
const source=JSON.parse(read("docs/planning/db-pass4-columns-db06_assessments_and_attendance.json"));
const review=JSON.parse(read("docs/planning/database-parity-db06-field-reconciliation.json"));
const quizzes=read("src/db/schema/quizzes.ts");
const attendance=read("src/db/schema/attendance.ts");
const history=read("src/db/schema/db06-quiz-lifecycle-staged.ts");
const original={
  attend:9,quiz_answers:9,quiz_attempts:11,
  quiz_options:8,quiz_questions:9,quizzes:19,
};
const frozen="21bad59d4dfaf2fa11fdeaf9353327ce105697d5";
const verify=(r=review)=>{
  const errors=[],seen=new Set();
  if(r.sourceSha!==frozen||source.sourceSha!==frozen)errors.push("FROZEN_ORACLE_DRIFT");
  for(const [name,count] of Object.entries(original)){
    const s=source.tables.filter(t=>t.table===name);
    const t=r.tables.filter(x=>x.legacyTable===name);
    if(s.length!==1||t.length!==1||s[0].rows.length!==count||t[0].fields.length!==count){
      errors.push("TABLE_SCOPE_DRIFT:"+name);continue;
    }
    const sourceByCol=new Map(s[0].rows.map(x=>[x.legacyColumn,x]));
    for(const f of t[0].fields){
      const id=name+"."+f.legacyField;
      if(seen.has(id))errors.push("DUPLICATE:"+id);
      seen.add(id);
      if(!sourceByCol.has(f.legacyField)||
         f.sourceType!==sourceByCol.get(f.legacyField).sourceType ||
         !f.reason||!f.decision||!f.targetRef||
         f.runtimeVerified!==false)errors.push("SOURCE_OR_FALSE_RUNTIME_PROOF:"+id);
      if(/^STAGED_TARGET_FIELD_RUNTIME_UNVERIFIED$/.test(f.decision))
        errors.push("REGISTERED_FIELD_FALSE_STAGE_STATUS:"+id);
    }
  }
  if(seen.size!==65)errors.push("65_FIELD_COUNT_DRIFT");
  const qq=r.tables.find(t=>t.legacyTable==="quizzes");
  for(const field of ["shuffle_questions","shuffle_options"]){
    const f=qq?.fields.find(x=>x.legacyField===field);
    if(!f||f.targetRef!=="course_quizzes."+field ||
       f.decision!=="REGISTERED_DB041_FIELD_GLOBAL_VERIFY_PENDING")
      errors.push("DB041_REGISTERED_SHUFFLE_MISSING:"+field);
  }
  if(!quizzes.includes('pgTable(\n  "course_quizzes"') ||
     !quizzes.includes('shuffleQuestions: boolean("shuffle_questions")') ||
     !quizzes.includes('shuffleOptions: boolean("shuffle_options")') ||
     !quizzes.includes('pgTable(\n  "quiz_attempts"') ||
     !quizzes.includes('pgTable(\n  "quiz_attempt_answers"') ||
     !attendance.includes('pgTable(\n  "attendance_records"') ||
     !history.includes('pgTable(\n  "course_quiz_lifecycle_events"'))
    errors.push("REGISTERED_TYPED_TARGET_MISSING");
  return {valid:errors.length===0,sourceFields:seen.size,sourceOnly:true,
    postgresVerified:false,acceptanceReady:false,errors};
};

test("P12 reconciles exactly 65 quiz/attendance source fields without global acceptance inflation",()=>{
  assert.deepEqual(verify(),{
    valid:true,sourceFields:65,sourceOnly:true,
    postgresVerified:false,acceptanceReady:false,errors:[],
  });
});
test("P12 rejects losing registered DB041 shuffle target or pretending it is staged",()=>{
  const r=structuredClone(review),table=r.tables.find(t=>t.legacyTable==="quizzes");
  table.fields.find(f=>f.legacyField==="shuffle_questions").decision="STAGED_TARGET_FIELD_RUNTIME_UNVERIFIED";
  assert.ok(verify(r).errors.some(e=>e.startsWith("REGISTERED_FIELD_FALSE_STAGE_STATUS")));
  table.fields.find(f=>f.legacyField==="shuffle_questions").decision="REGISTERED_DB041_FIELD_GLOBAL_VERIFY_PENDING";
  table.fields.find(f=>f.legacyField==="shuffle_options").targetRef="course_upload_receipts.shuffle_options";
  assert.ok(verify(r).errors.some(e=>e.startsWith("DB041_REGISTERED_SHUFFLE_MISSING")));
});
test("P12 source-loss, forged proof and duplicated field identity fail closed",()=>{
  const r=structuredClone(review),table=r.tables.find(t=>t.legacyTable==="attend");
  table.fields[0].legacyField=table.fields[1].legacyField;
  assert.ok(verify(r).errors.some(e=>e.startsWith("DUPLICATE")));
  const q=structuredClone(review),at=q.tables.find(t=>t.legacyTable==="quiz_answers");
  at.fields[0].runtimeVerified=true;
  assert.ok(verify(q).errors.some(e=>e.startsWith("SOURCE_OR_FALSE_RUNTIME_PROOF")));
  const missing=structuredClone(review);
  missing.tables.find(t=>t.legacyTable==="quizzes").fields.pop();
  assert.ok(verify(missing).errors.some(e=>e.startsWith("TABLE_SCOPE_DRIFT")));
});
