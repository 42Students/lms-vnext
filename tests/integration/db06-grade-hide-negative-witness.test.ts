import {expect,it} from "vitest";
import {Pool} from "pg";

/**
 * DB035 incremental enforcement witness, intentionally opt-in.
 * NEVER run against a shared or production database. The caller must supply
 * a disposable seeded TEST_DATABASE_URL and an actual GRADED+published
 * DB06_GRADE_HIDE_SUBMISSION_ID with at least one prior audit event.
 *
 * It is deliberately RED before L01 registers the incremental deferred
 * grade-audit completeness trigger. Skip is not acceptance evidence.
 */
const enabled=Boolean(
  process.env.TEST_DATABASE_URL &&
  process.env.DB06_GRADE_HIDE_SUBMISSION_ID &&
  process.env.DB06_RUN_GRADE_HIDE_WITNESSES==="1" &&
  process.env.DB06_DISPOSABLE_DB_CONFIRM==="YES",
);
const negative=enabled?it:it.skip;

negative("DB035 direct HIDE_GRADE state mutation without event fails 23514",async()=>{
  const pool=new Pool({connectionString:process.env.TEST_DATABASE_URL,max:1});
  const client=await pool.connect();
  try{
    await client.query("BEGIN");
    const {rows}=await client.query(
      "select id from assignment_submissions where id=$1 and grading_status='GRADED' and grade_published=true for update",
      [process.env.DB06_GRADE_HIDE_SUBMISSION_ID],
    );
    expect(rows).toHaveLength(1);
    let rejected:unknown=null;
    try{
      await client.query(
        "update assignment_submissions set grade_published=false,version=version+1 where id=$1",
        [rows[0]!.id],
      );
      await client.query("SET CONSTRAINTS ALL IMMEDIATE");
    }catch(error){rejected=error;}
    expect((rejected as {code?:string}|null)?.code).toBe("23514");
  }finally{
    await client.query("ROLLBACK").catch(()=>undefined);
    client.release();
    await pool.end();
  }
});

negative("DB035 HIDE_GRADE event cannot mutate prior points or feedback",async()=>{
  const pool=new Pool({connectionString:process.env.TEST_DATABASE_URL,max:1});
  const client=await pool.connect();
  try{
    await client.query("BEGIN");
    const {rows}=await client.query(
      `select s.id,s.points_awarded
       from assignment_submissions s
       where s.id=$1 and s.grade_published=true and s.grading_status='GRADED'
         and s.points_awarded is not null
         and exists(select 1 from assignment_grade_events g
                    where g.assignment_submission_id=s.id)
       for update`,
      [process.env.DB06_GRADE_HIDE_SUBMISSION_ID],
    );
    expect(rows).toHaveLength(1);
    let rejected:unknown=null;
    try{
      await client.query(`
        insert into assignment_grade_events(
          assignment_submission_id,assignment_id,delivery_id,
          learner_membership_id,college_id,actor_user_id,
          actor_membership_id,actor_role,action,previous_points,new_points,
          previous_feedback,new_feedback,previous_grading_status,
          new_grading_status,previous_grade_published,new_grade_published,
          previous_graded_by_user_id,new_graded_by_user_id,
          previous_graded_at,new_graded_at,
          submission_version_before,submission_version_after
        )
        select s.id,s.assignment_id,s.delivery_id,s.membership_id,
               g.college_id,g.actor_user_id,g.actor_membership_id,
               g.actor_role,'HIDE_GRADE',s.points_awarded,
               s.points_awarded+1,s.feedback,s.feedback,
               s.grading_status,s.grading_status,true,false,
               s.graded_by_user_id,s.graded_by_user_id,
               s.graded_at,s.graded_at,s.version,s.version+1
        from assignment_submissions s
        join lateral (
          select college_id,actor_user_id,actor_membership_id,actor_role
          from assignment_grade_events
          where assignment_submission_id=s.id
          order by occurred_at desc,id desc limit 1
        ) g on true
        where s.id=$1
      `,[rows[0]!.id]);
      await client.query("SET CONSTRAINTS ALL IMMEDIATE");
    }catch(error){rejected=error;}
    expect((rejected as {code?:string}|null)?.code).toBe("23514");
  }finally{
    await client.query("ROLLBACK").catch(()=>undefined);
    client.release();
    await pool.end();
  }
});
