import assert from "node:assert/strict";
import test from "node:test";
import { randomUUID } from "node:crypto";
import { Pool } from "pg";
import { assertDb018DisposableTarget } from "./support/db018-test-target.mjs";

if (!process.env.TEST_DATABASE_URL || process.env.DB03_ISOLATED_TEST_DATABASE !== "1" ||
    process.env.DATABASE_URL !== process.env.TEST_DATABASE_URL) {
  throw new Error("DB008 PG acceptance requires the same explicit disposable test database");
}
assertDb018DisposableTarget(process.env, { serviceBound: true });
const pool = new Pool({ connectionString: process.env.TEST_DATABASE_URL, max: 4 });
const collegeA = "20000000-0000-4000-8000-000000000001";
const collegeB = "20000000-0000-4000-8000-000000000002";
const departmentA = "21000000-0000-4000-8000-000000000001";
const departmentB = "21000000-0000-4000-8000-000000000002";

test("DB008 registered parent graph: same-college paths, direct SQL negatives and races", async (t) => {
  const tag = "D8SQL-" + randomUUID().slice(0, 8);
  const courses = [], departments = [];
  async function course(departmentId = departmentA, parentId = null) {
    const id = randomUUID();
    await pool.query(
      "INSERT INTO courses(id,department_id,parent_course_id,name,code) VALUES($1,$2,$3,$4,$5)",
      [id, departmentId, parentId, tag + "-" + id, tag + "-" + id.slice(0, 8)],
    );
    courses.push(id);
    return id;
  }
  async function department(collegeId = collegeA) {
    const id = randomUUID();
    await pool.query("INSERT INTO departments(id,college_id,name) VALUES($1,$2,$3)",
      [id,collegeId,tag+"-"+id]);
    departments.push(id);
    return id;
  }
  try {
    await t.test("registered triggers and catalog are present", async () => {
      const r = await pool.query(
        "SELECT tgname FROM pg_trigger WHERE NOT tgisinternal AND tgname IN ($1,$2)",
        ["db05_course_parent_graph_before_write","db05_department_course_college_before_move"]);
      assert.deepEqual(new Set(r.rows.map(row=>row.tgname)),new Set([
        "db05_course_parent_graph_before_write","db05_department_course_college_before_move",
      ]));
    });
    const root = await course();
    const middle = await course(departmentA,root);
    const leaf = await course(departmentA,middle);
    await t.test("reject self, two/three-node cycles and unknown parent", async () => {
      await assert.rejects(pool.query("UPDATE courses SET parent_course_id=id WHERE id=$1",[root]),
        { code:"23514" });
      await assert.rejects(pool.query("UPDATE courses SET parent_course_id=$1 WHERE id=$2",[leaf,root]),
        { code:"23514" });
      await assert.rejects(pool.query("UPDATE courses SET parent_course_id=$1 WHERE id=$2",
        [randomUUID(),root]),{code:"23514"});
      const r=await pool.query("SELECT parent_course_id FROM courses WHERE id=$1",[root]);
      assert.equal(r.rows[0].parent_course_id,null);
    });
    await t.test("reject cross-college parent and department ownership move", async () => {
      const foreign=await course(departmentB);
      await assert.rejects(pool.query("UPDATE courses SET parent_course_id=$1 WHERE id=$2",
        [foreign,root]),{code:"23514"});
      await assert.rejects(pool.query("UPDATE courses SET department_id=$1 WHERE id=$2",
        [departmentB,middle]),{code:"23514"});
      const ownedDepartment=await department();
      await course(ownedDepartment);
      await assert.rejects(pool.query("UPDATE departments SET college_id=$1 WHERE id=$2",
        [collegeB,ownedDepartment]),{code:"23514"});
      const empty=await department();
      await pool.query("UPDATE departments SET college_id=$1 WHERE id=$2",[collegeB,empty]);
      const moved=await pool.query("SELECT college_id FROM departments WHERE id=$1",[empty]);
      assert.equal(moved.rows[0].college_id,collegeB);
    });
    await t.test("non-read-committed course graph writes explicitly reject", async () => {
      const client=await pool.connect();
      try {
        await client.query("BEGIN ISOLATION LEVEL REPEATABLE READ");
        await assert.rejects(client.query(
          "UPDATE courses SET parent_course_id = NULL WHERE id=$1",[leaf]),{code:"25001"});
      } finally {
        await client.query("ROLLBACK").catch(()=>undefined);
        client.release();
      }
    });
    await t.test("reciprocal direct SQL race cannot commit a cycle", async () => {
      const a=await course(), b=await course();
      const clients=await Promise.all([pool.connect(),pool.connect()]);
      try {
        await Promise.all(clients.map(c=>c.query("BEGIN")));
        await clients[0].query("UPDATE courses SET parent_course_id=$1 WHERE id=$2",[b,a]);
        // The second writer is forced to wait on the same transaction lock;
        // commit the first before awaiting the second to avoid a test deadlock.
        const pending=clients[1].query(
          "UPDATE courses SET parent_course_id=$1 WHERE id=$2",[a,b],
        ).then(()=>({accepted:true,error:null}),error=>({accepted:false,error}));
        await new Promise(resolve=>setTimeout(resolve,75));
        await clients[0].query("COMMIT");
        const second=await pending;
        assert.equal(second.accepted,false);
        assert.equal(second.error?.code,"23514");
        await clients[1].query("ROLLBACK");
        const rows=await pool.query(
          "SELECT id,parent_course_id FROM courses WHERE id=ANY($1::uuid[])",[[a,b]],
        );
        const parents=new Map(rows.rows.map(r=>[r.id,r.parent_course_id]));
        assert.equal(parents.get(a)===b&&parents.get(b)===a,false);
      } finally {
        await Promise.all(clients.map(async c=>{
          await c.query("ROLLBACK").catch(()=>undefined);c.release();
        }));
      }
    });
  } finally {
    if(courses.length){
      await pool.query("UPDATE courses SET parent_course_id=NULL WHERE id=ANY($1::uuid[])",[courses]);
      await pool.query("DELETE FROM courses WHERE id=ANY($1::uuid[])",[courses]);
    }
    if(departments.length){
      await pool.query("DELETE FROM departments WHERE id=ANY($1::uuid[])",[departments]);
    }
    await pool.end();
  }
});
