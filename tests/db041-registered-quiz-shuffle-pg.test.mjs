import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { test } from "node:test";
import pg from "pg";
import { assertDb018DisposableTarget } from "./support/db018-test-target.mjs";

if (process.env.DB041_REGISTERED_PG !== "YES") {
  throw Error("DB041 only runs against explicitly isolated registered PostgreSQL");
}
assertDb018DisposableTarget(process.env, { serviceBound: true });

test("DB041 registered PostgreSQL 17 persists safe quiz shuffle flags, defaults and author order", async () => {
  const db = new pg.Client({connectionString:process.env.TEST_DATABASE_URL,
    connectionTimeoutMillis:10000,query_timeout:15000});
  await db.connect();
  let begun=false;
  try {
    const ver=Number((await db.query("SHOW server_version_num")).rows[0].server_version_num);
    assert.ok(ver>=170000 && ver<180000, "PostgreSQL 17 acceptance required");
    const columns=(await db.query(
      "SELECT column_name, is_nullable, column_default, data_type "+
      "FROM information_schema.columns WHERE table_schema='public' AND table_name='course_quizzes' "+
      "AND column_name IN ('shuffle_questions','shuffle_options') ORDER BY column_name"
    )).rows;
    assert.equal(columns.length,2,"both flags must exist on the registered table");
    for (const col of columns) {
      assert.equal(col.is_nullable,"NO",col.column_name);
      assert.equal(col.data_type,"boolean",col.column_name);
      assert.match(col.column_default,/false/i,col.column_name);
    }
    await db.query("BEGIN"); begun=true;
    const marker=randomUUID().slice(0,8);
    const department="21000000-0000-4000-8000-000000000001";
    const college="20000000-0000-4000-8000-000000000001";
    const actor="30000000-0000-4000-8000-000000000002";
    const row=async(sql,params)=>(await db.query(sql,params)).rows[0];
    const program=await row("INSERT INTO programs(department_id,name,code,duration_terms) VALUES($1,$2,$3,8) RETURNING id",
      [department,"DB041 program "+marker,"DB041-"+marker]);
    const period=await row("INSERT INTO academic_periods(college_id,name,code,start_date,end_date,status) "+
      "VALUES($1,$2,$3,'2026-07-01','2027-06-30','ACTIVE') RETURNING id",
      [college,"DB041 period "+marker,"DB041-"+marker]);
    const cohort=await row("INSERT INTO cohorts(program_id,name,code,start_period_id,status) "+
      "VALUES($1,$2,$3,$4,'ACTIVE') RETURNING id",
      [program.id,"DB041 cohort "+marker,"DB041-"+marker,period.id]);
    const course=await row("INSERT INTO courses(department_id,name,code) VALUES($1,$2,$3) RETURNING id",
      [department,"DB041 course "+marker,"DB041-"+marker]);
    const offering=await row("INSERT INTO course_offerings(course_id,cohort_id,academic_period_id) "+
      "VALUES($1,$2,$3) RETURNING id",[course.id,cohort.id,period.id]);
    const path=await row("INSERT INTO course_learning_paths(offering_id,title) VALUES($1,$2) RETURNING id",
      [offering.id,"DB041 path "+marker]);
    const lesson=await row("INSERT INTO course_lessons(learning_path_id,name,sequence) VALUES($1,$2,0) RETURNING id",
      [path.id,"DB041 lesson "+marker]);

    const insertQuiz=async(flags,seq)=>{
      const title="DB041 quiz "+seq+" "+marker;
      if(flags===null) return row(
        "INSERT INTO course_quizzes(lesson_id,title,total_points,sequence,created_by_user_id) "+
        "VALUES($1,$2,10,$3,$4) RETURNING id,shuffle_questions,shuffle_options",
        [lesson.id,title,seq,actor]);
      return row(
        "INSERT INTO course_quizzes(lesson_id,title,total_points,sequence,created_by_user_id,shuffle_questions,shuffle_options) "+
        "VALUES($1,$2,10,$3,$4,$5,$6) RETURNING id,shuffle_questions,shuffle_options",
        [lesson.id,title,seq,actor,...flags]);
    };
    const defaults=await insertQuiz(null,0);
    assert.equal(defaults.shuffle_questions,false);
    assert.equal(defaults.shuffle_options,false);
    const questionOnly=await insertQuiz([true,false],1);
    const optionsOnly=await insertQuiz([false,true],2);
    assert.deepEqual([questionOnly.shuffle_questions,questionOnly.shuffle_options],[true,false]);
    assert.deepEqual([optionsOnly.shuffle_questions,optionsOnly.shuffle_options],[false,true]);
    const question=await row(
      "INSERT INTO quiz_questions(quiz_id,question_type,prompt,points,sequence) "+
      "VALUES($1,'SINGLE_CHOICE','DB041 retained question',10,7) RETURNING id,sequence",
      [questionOnly.id]);
    const option=await row(
      "INSERT INTO quiz_options(question_id,option_text,is_correct,sequence) "+
      "VALUES($1,'DB041 original order',true,4) RETURNING id,sequence",[question.id]);
    await db.query("UPDATE course_quizzes SET shuffle_questions=false,shuffle_options=true WHERE id=$1",
      [questionOnly.id]);
    const unchanged=await row(
      "SELECT q.shuffle_questions,q.shuffle_options,qq.sequence AS question_sequence, "+
      "qo.sequence AS option_sequence FROM course_quizzes q "+
      "JOIN quiz_questions qq ON qq.quiz_id=q.id JOIN quiz_options qo ON qo.question_id=qq.id "+
      "WHERE q.id=$1",[questionOnly.id]);
    assert.deepEqual([unchanged.shuffle_questions,unchanged.shuffle_options,
      unchanged.question_sequence,unchanged.option_sequence],[false,true,7,4],
      "metadata toggles must not rewrite authored question/option order");

    await db.query("SAVEPOINT db041_null_test");
    await assert.rejects(
      db.query("UPDATE course_quizzes SET shuffle_questions=NULL WHERE id=$1",[defaults.id]),
      error=>{assert.equal(error?.code,"23502");return true;}
    );
    await db.query("ROLLBACK TO SAVEPOINT db041_null_test");
    await db.query("RELEASE SAVEPOINT db041_null_test");

    await db.query("ROLLBACK");begun=false;
    assert.equal((await db.query("SELECT count(*)::integer AS n FROM course_quizzes WHERE id=$1",
      [questionOnly.id])).rows[0].n,0,"all witness data must be rolled back");
  } finally {
    if(begun)await db.query("ROLLBACK").catch(()=>{});
    await db.end();
  }
});
