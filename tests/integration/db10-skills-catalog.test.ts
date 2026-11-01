import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { Pool } from "pg";
import { closeDatabaseConnection } from "@/db/client";
import { readSkillCatalog, recordSkillSelection } from "@/modules/skills/catalog-service";
import { SEED_IDS } from "../../scripts/db-seed-data";
import { importAdminSkillCatalog } from "@/modules/skills/catalog-import-service";
import type { RequestContext } from "@/modules/identity/context";
import { assertDb018DisposableTarget } from "../support/db018-test-target.mjs";

const databaseUrl = process.env.TEST_DATABASE_URL;
if (!databaseUrl) throw new Error("DB10 skills integration tests require explicit TEST_DATABASE_URL.");
// This suite inserts and deletes catalog rows. Never fall back to a live
// DATABASE_URL; require the same disposable target as the service under test.
assertDb018DisposableTarget(process.env, { serviceBound: true });
const pool = new Pool({ connectionString: databaseUrl, max: 2 });

const suffix = crypto.randomUUID().slice(0, 8);
const ids = [crypto.randomUUID(), crypto.randomUUID(), crypto.randomUUID()];
const names = [
  "w06skilljava" + suffix,
  "w06skillreact" + suffix,
  "w06skillhidden" + suffix,
];
const synonym = "w06syn" + suffix;
const category = "W06 fixture " + suffix;
type CatalogResult = Awaited<ReturnType<typeof readSkillCatalog>>;
function requireItems(result: CatalogResult) {
  if (!result.items) throw new Error("Skill catalog unexpectedly omitted items");
  return result.items;
}
function requireCategories(result: CatalogResult) {
  if (!result.categories) throw new Error("Skill catalog unexpectedly omitted categories");
  return result.categories;
}

async function cleanup() {
  await pool.query("delete from skill_synonyms where skill_id = any($1::uuid[])", [ids]);
  await pool.query("delete from skill_usage where skill_name = any($1::text[])", [names]);
  await pool.query("delete from skills where id = any($1::uuid[])", [ids]);
}

beforeAll(async () => {
  await cleanup();
  await pool.query(`
    insert into skills (id, name, display_name, category, is_active, usage_count, search_priority)
    values ($1, $4, 'W06 Java', $7, true, 90, 2),
           ($2, $5, 'W06 React', $7, true, 20, 1),
           ($3, $6, 'W06 Hidden', $7, false, 900, 99)
  `, [...ids, ...names, category]);
  await pool.query(`
    insert into skill_synonyms (skill_id, synonym)
    values ($1, $3), ($2, $3), ($4, $3)
  `, [ids[0], ids[1], synonym, ids[2]]);
  await pool.query(
    "insert into skill_usage (skill_name, usage_count) values ($1, $2)",
    [names[1], 500],
  );
});
afterAll(async () => {
  await cleanup();
  await pool.end();
  await closeDatabaseConnection();
});

describe("DB10 skills catalog source-backed PostgreSQL consumer", () => {
  it("matches both active skills for one shared synonym, never leaked inactive records", async () => {
    const result = await readSkillCatalog({
      mode: "search", query: synonym, limit: 10,
    });
    expect(requireItems(result).map(item => item.name).sort())
      .toEqual(names.slice(0, 2).sort());
  });
  it("ranks an exact name above prefix/synonym while preserving catalog boosts", async () => {
    const result = await readSkillCatalog({
      mode: "search", query: names[0], limit: 10,
    });
    expect(requireItems(result)[0]?.name).toBe(names[0]);
  });
  it("uses separate v2 usage counter for popular sort, not catalog overwrite", async () => {
    const result = await readSkillCatalog({ mode: "popular", query: "", limit: 50 });
    const fixtureNames = requireItems(result)
      .filter(item => names.includes(item.name)).map(item => item.name);
    expect(fixtureNames[0]).toBe(names[1]);
    const counts = await pool.query(
      "select usage_count from skills where id = $1", [ids[1]],
    );
    expect(counts.rows[0]?.usage_count).toBe(20);
  });
  it("exposes category list and scoped category results only for active catalog entries", async () => {
    const categories = await readSkillCatalog({ mode: "categories", query: "", limit: 15 });
    expect(requireCategories(categories).includes(category)).toBe(true);
    const result = await readSkillCatalog({
      mode: "category", query: "", category, limit: 10,
    });
    expect(requireItems(result)).toHaveLength(2);
  });

  it("enforces folded catalog uniqueness and rejects invalid source-backed skill values", async () => {
    await expect(pool.query(
      "insert into skills (name,display_name) values ($1,'Duplicate')",
      [names[0].toUpperCase()],
    )).rejects.toMatchObject({code:"23505"});
    await expect(pool.query(
      "insert into skills (name,display_name) values ('   ','Blank name')",
    )).rejects.toMatchObject({code:"23514"});
    await expect(pool.query(
      "update skills set usage_count=-1 where id=$1",[ids[0]],
    )).rejects.toMatchObject({code:"23514"});
    await expect(pool.query(
      "update skills set search_priority=101 where id=$1",[ids[0]],
    )).rejects.toMatchObject({code:"23514"});
    await expect(pool.query(
      "insert into skill_synonyms (skill_id,synonym) values ($1,'unknown parent')",
      [crypto.randomUUID()],
    )).rejects.toMatchObject({code:"23503"});
  });

  it("allows repeated aliases without accidentally merging distinct skill IDs", async () => {
    const inserted=await pool.query<{id:string}>(
      "insert into skill_synonyms (skill_id,synonym) values ($1,$2) returning id",
      [ids[0],synonym],
    );
    const extraId=inserted.rows[0]!.id;
    try {
      const result=await readSkillCatalog({mode:"search",query:synonym,limit:10});
      expect(requireItems(result).map(row=>row.name).sort()).toEqual(names.slice(0,2).sort());
    } finally {
      await pool.query("delete from skill_synonyms where id=$1",[extraId]);
    }
  });

  it("keeps the catalog count independent of the free-text usage counter", async () => {
    const previous=(await pool.query<{usage_count:number}>(
      "select usage_count from skills where id=$1",[ids[1]],
    )).rows[0]!.usage_count;
    try {
      await pool.query("update skills set usage_count=usage_count+3 where id=$1",[ids[1]]);
      const rows=await pool.query<{usage_count:number}>(
        "select usage_count from skill_usage where skill_name=$1",[names[1]],
      );
      expect(rows.rows[0]?.usage_count).toBe(500);
    } finally {
      await pool.query("update skills set usage_count=$1 where id=$2",[previous,ids[1]]);
    }
  });

  it("atomically counts 20 concurrent free-text uses without needing a catalog parent", async () => {
    const key="w06unknown"+suffix;
    try {
      await Promise.all(Array.from({length:20},()=>pool.query(
        `insert into skill_usage(skill_name,usage_count,last_used)
           values ($1,1,clock_timestamp())
           on conflict (skill_name) do update
             set usage_count=skill_usage.usage_count+1,
                 last_used=clock_timestamp()`,
        [key],
      )));
      const usage=await pool.query<{usage_count:number}>(
        "select usage_count from skill_usage where skill_name=$1",[key],
      );
      expect(usage.rows[0]?.usage_count).toBe(20);
      const catalog=await pool.query("select id from skills where name=$1",[key]);
      expect(catalog.rows).toHaveLength(0);
      const existing=await pool.query<{usage_count:number}>(
        "select usage_count from skills where id=$1",[ids[0]],
      );
      expect(existing.rows[0]?.usage_count).toBe(90);
    } finally {
      await pool.query("delete from skill_usage where skill_name=$1",[key]);
    }
  });
  it("binds the selected v1 canonical name to its UUID and preserves independent v2 usage", async () => {
    const authorized: RequestContext = {
      user: {
        id: SEED_IDS.collegeAdminUser,
        identityUid: "seed-college-admin",
        platformStatus: "ACTIVE",
        systemRoles: [],
      },
      membership: {
        id: SEED_IDS.collegeAdminMembership,
        collegeId: SEED_IDS.collegeA,
        organizationId: SEED_IDS.organization,
        status: "ACTIVE",
        roles: ["COLLEGE_ADMIN"],
      },
    };
    const count=async(table: "skills"|"skill_usage",id:string)=> {
      const key=table==="skills"?"id":"skill_name";
      const row=await pool.query<{usage_count:number}>(
        `select usage_count from ${table} where ${key}=$1`,[id]);
      return row.rows[0]?.usage_count ?? 0;
    };
    const before=await count("skills",ids[0]);
    const beforeUsage=await count("skill_usage",names[1]);
    const freeText="p30uncataloged"+suffix;
    try {
      // A forged name/UUID pair cannot inflate unrelated catalog popularity.
      await expect(recordSkillSelection(authorized,{
        source:"v1",skillId:ids[0]!,name:names[1]!,
      })).rejects.toThrow("SKILL_NOT_FOUND");
      expect(await count("skills",ids[0]!)).toBe(before);
      await recordSkillSelection(authorized,{
        source:"v1",skillId:ids[0]!,name:names[0]!.toUpperCase(),
      });
      expect(await count("skills",ids[0]!)).toBe(before+1);
      await Promise.all(Array.from({length:8},()=>recordSkillSelection(authorized,{
        source:"v2",name:freeText,
      })));
      expect(await count("skill_usage",freeText)).toBe(8);
      expect(await count("skill_usage",names[1]!)).toBe(beforeUsage);
      expect(await count("skills",ids[0]!)).toBe(before+1);

      const denied:RequestContext={
        ...authorized,
        user:{...authorized.user,platformStatus:"DISABLED"},
      };
      await expect(recordSkillSelection(denied,{
        source:"v1",skillId:ids[0]!,name:names[0]!,
      })).rejects.toThrow("FORBIDDEN_SKILL_CATALOG");
      expect(await count("skills",ids[0]!)).toBe(before+1);
    } finally {
      await pool.query("update skills set usage_count=$1 where id=$2",[before,ids[0]]);
      await pool.query("delete from skill_usage where skill_name=$1",[freeText]);
    }
  });

  it("imports curated skills through the persisted Super Admin producer, idempotently and without privilege spoofing", async () => {
    const admin: RequestContext = {
      user: {
        id: SEED_IDS.superAdminUser,
        identityUid: "seed-super-admin",
        platformStatus: "ACTIVE",
        systemRoles: ["SUPER_ADMIN"],
      },
      membership: null,
      adminScope: null,
    };
    const skillName="w06imported"+suffix;
    const alias="w06alias"+suffix;
    const csv=`name,category,synonyms\n${skillName},${category},${alias}`;
    const previous=process.env.DB10_SKILLS_SCHEMA_READY;
    process.env.DB10_SKILLS_SCHEMA_READY="DB10_REPLAY_VERIFIED";
    try {
      const preview=await importAdminSkillCatalog(admin,{
        format:"CSV",content:csv,dryRun:true,
      });
      expect(preview).toMatchObject({ready:true,dryRun:true,sourceCount:1});

      // An in-memory role forged for a different persisted account cannot
      // insert even though the parsed request and schema are valid.
      const forged:RequestContext={
        ...admin,
        user:{...admin.user,id:SEED_IDS.collegeAdminUser,systemRoles:["SUPER_ADMIN"]},
      };
      await expect(importAdminSkillCatalog(forged,{
        format:"CSV",content:csv,dryRun:false,
      })).rejects.toBeTruthy();
      expect((await pool.query("select id from skills where name=$1",[skillName])).rows)
        .toHaveLength(0);

      const result=await importAdminSkillCatalog(admin,{
        format:"CSV",content:csv,dryRun:false,
      });
      expect(result).toMatchObject({ready:true,committed:true,inserted:1,synonymsInserted:1});
      const repeat=await importAdminSkillCatalog(admin,{
        format:"CSV",content:csv,dryRun:false,
      });
      expect(repeat).toMatchObject({ready:true,committed:true,inserted:0,synonymsInserted:0});
      const rows=await pool.query<{id:string;usage_count:number}>(
        "select id,usage_count from skills where name=$1",[skillName]);
      expect(rows.rows).toHaveLength(1);
      expect(rows.rows[0]?.usage_count).toBe(0);
      const aliases=await pool.query(
        "select synonym from skill_synonyms where skill_id=$1",[rows.rows[0]!.id]);
      expect(aliases.rows).toEqual([{synonym:alias}]);
    } finally {
      await pool.query("delete from skill_synonyms where skill_id in (select id from skills where name=$1)",[skillName]);
      await pool.query("delete from skills where name=$1",[skillName]);
      if(previous===undefined) delete process.env.DB10_SKILLS_SCHEMA_READY;
      else process.env.DB10_SKILLS_SCHEMA_READY=previous;
    }
  });

});
