import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { Pool } from "pg";
import { closeDatabaseConnection } from "@/db/client";
import { readSkillCatalog } from "@/modules/skills/catalog-service";
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
});
