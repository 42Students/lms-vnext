import {randomUUID} from "node:crypto";
import {afterAll,describe,expect,it} from "vitest";
import {Pool} from "pg";

/** Independent real-PG witness for DEFAULT now() precision and stale tokens. */
if(!process.env.TEST_DATABASE_URL)throw new Error("Requires disposable TEST_DATABASE_URL");
const pool=new Pool({connectionString:process.env.TEST_DATABASE_URL,max:1});
afterAll(async()=>{await pool.end();});

describe("PostgreSQL microsecond optimistic timestamp safety",()=>{
  it("accepts an untouched SQL-default timestamp and rejects stale tokens",async()=>{
    const client=await pool.connect();
    try{
      await client.query("BEGIN");
      await client.query(`CREATE TEMP TABLE chat4_millisecond_cas(
        id uuid PRIMARY KEY,updated_at timestamptz NOT NULL DEFAULT now(),title text NOT NULL
      ) ON COMMIT DROP`);
      const id=randomUUID();
      const created=await client.query<{updated_at:Date}>(
        "INSERT INTO chat4_millisecond_cas(id,title) VALUES($1,'Draft') RETURNING updated_at",[id]);
      const expected=created.rows[0]!.updated_at.toISOString();
      // Ensure the DB really stored a fractional microsecond Date cannot carry.
      const fraction=await client.query<{fraction:string}>(`
        SELECT to_char(updated_at,'US') AS fraction FROM chat4_millisecond_cas WHERE id=$1`,[id]);
      expect(fraction.rows[0]?.fraction).toMatch(/^\d{6}$/);
      // The CAS must compare the database column truncated, not the JS Date token.
      const update=await client.query(`
        UPDATE chat4_millisecond_cas SET title='Saved',
          updated_at=greatest(now(),updated_at+interval '1 millisecond')
        WHERE id=$1 AND date_trunc('milliseconds',updated_at)=$2::timestamptz
        RETURNING updated_at`,[id,expected]);
      expect(update.rowCount).toBe(1);
      const stale=await client.query(`
        UPDATE chat4_millisecond_cas SET title='Stale'
        WHERE id=$1 AND date_trunc('milliseconds',updated_at)=$2::timestamptz`,
        [id,expected]);
      expect(stale.rowCount).toBe(0);
      const title=await client.query<{title:string}>(
        "SELECT title FROM chat4_millisecond_cas WHERE id=$1",[id]);
      expect(title.rows[0]?.title).toBe("Saved");
      await client.query("ROLLBACK");
    }finally{client.release();}
  });
});
