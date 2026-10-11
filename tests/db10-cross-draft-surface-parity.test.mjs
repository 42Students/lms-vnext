import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

// These explicit pairs have SQL and Drizzle draft copies that Chat 1 may
// integrate later. This checks named objects and index UNIQUENESS only.
// It does NOT compare CHECK expressions, index column order, FKs, triggers,
// PL/pgSQL execution, migration registration, or runtime safety.
const pairs = [
  ["src/db/schema/db10-general-notices.draft.ts", "scripts/sql/db10-general-notices-staging.sql"],
  ["src/db/schema/db10-log-alerts.draft.ts", "scripts/sql/db10-log-alerts-staging.sql"],
  ["src/db/schema/db10-skills-catalog.draft.ts", "scripts/sql/db10-skills-catalog-staging.sql"],
];
const capture = (s, re, pick = (m) => m[1]) => [...s.matchAll(re)].map(pick);
const dupes = (names) => [...new Set(names.filter((n, i) => names.indexOf(n) !== i))];

export function compareNamedSurfaces(schema, sql, label) {
  const draftTables = capture(schema, /\bpgTable\(\s*["']([^"']+)["']/g);
  const sqlTables = capture(sql, /^\s*CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?(?:public\.)?([a-z_][a-z0-9_]*)\s*\(/gim, (m) => m[1].toLowerCase());
  const draftChecks = capture(schema, /\bcheck\(\s*["']([^"']+)["']/g);
  const sqlChecks = capture(sql, /^\s*CONSTRAINT\s+([a-z_][a-z0-9_]*)\s+CHECK\s*\(/gim, (m) => m[1].toLowerCase());
  const draftIndexes = capture(schema, /\b(uniqueIndex|index)\(\s*["']([^"']+)["']/g,
    (m) => [m[2], m[1] === "uniqueIndex" ? "UNIQUE" : "NORMAL"]);
  const sqlIndexes = capture(sql, /^\s*CREATE\s+(UNIQUE\s+)?INDEX\s+(?:IF\s+NOT\s+EXISTS\s+)?([a-z_][a-z0-9_]*)\b/gim,
    (m) => [m[2].toLowerCase(), m[1] ? "UNIQUE" : "NORMAL"]);
  const equalNames = (group, a, b) => {
    assert.deepEqual(dupes(a), [], label + ": duplicate " + group + " in Drizzle draft");
    assert.deepEqual(dupes(b), [], label + ": duplicate " + group + " in staged SQL");
    assert.deepEqual(a.toSorted(), b.toSorted(), label + ": " + group + " Drizzle/SQL drift");
  };
  assert.ok(draftTables.length, label + ": no draft tables");
  assert.ok(draftChecks.length, label + ": no draft checks");
  assert.ok(draftIndexes.length, label + ": no draft indexes");
  equalNames("tables", draftTables, sqlTables);
  equalNames("checks", draftChecks, sqlChecks);
  equalNames("indexes and uniqueness", draftIndexes.map(JSON.stringify), sqlIndexes.map(JSON.stringify));
  return {tables: draftTables.length, checks: draftChecks.length, indexes: draftIndexes.length};
}

for (const [draft, stage] of pairs) {
  test("DB10 draft/SQL named surface parity: " + draft, () => {
    const schema = readFileSync(draft, "utf8");
    const sql = readFileSync(stage, "utf8");
    assert.match(schema, /DRAFT ONLY/);
    assert.match(sql, /STAGING ONLY|STAGED SQL/i);
    compareNamedSurfaces(schema, sql, draft);
  });
}

const ts = "const t = pgTable('fixture_table', {}, () => [check('fixture_valid_ck', null), uniqueIndex('fixture_unique_uq'), index('fixture_read_idx')]);";
const sql = ["CREATE TABLE fixture_table (", "id uuid,", "CONSTRAINT fixture_valid_ck CHECK (true)", ");",
  "CREATE UNIQUE INDEX fixture_unique_uq ON fixture_table (id);",
  "CREATE INDEX fixture_read_idx ON fixture_table (id);"].join("\n");

test("fixture: matched named surfaces pass", () => {
  assert.deepEqual(compareNamedSurfaces(ts, sql, "fixture"), {tables:1, checks:1, indexes:2});
});
test("fixture: changed or removed named constraint fails", () => {
  assert.throws(() => compareNamedSurfaces(ts, sql.replace("CONSTRAINT fixture_valid_ck CHECK (true)", ""), "missing"), /checks Drizzle\/SQL drift/);
  assert.throws(() => compareNamedSurfaces(ts.replace("fixture_valid_ck", "other_ck"), sql, "renamed"), /checks Drizzle\/SQL drift/);
});
test("fixture: changed index uniqueness in either direction fails", () => {
  assert.throws(() => compareNamedSurfaces(ts, sql.replace("CREATE UNIQUE INDEX fixture_unique_uq", "CREATE INDEX fixture_unique_uq"), "weakened"), /indexes and uniqueness Drizzle\/SQL drift/);
  assert.throws(() => compareNamedSurfaces(ts.replace("index('fixture_read_idx')", "uniqueIndex('fixture_read_idx')"), sql, "tightened"), /indexes and uniqueness Drizzle\/SQL drift/);
});
test("fixture: duplicate CREATE declarations and mismatched tables fail", () => {
  assert.throws(() => compareNamedSurfaces(ts + ts, sql, "dupe draft"), /duplicate tables in Drizzle draft/);
  assert.throws(() => compareNamedSurfaces(ts, sql + "\n" + sql, "dupe SQL"), /duplicate tables in staged SQL/);
  assert.throws(() => compareNamedSurfaces(ts.replace("fixture_table", "different_table"), sql, "name"), /tables Drizzle\/SQL drift/);
});


/**
 * Compare physical column names and primitive SQL types for every table in
 * the three paired drafts. Name-only checks miss e.g. integer→bigint,
 * timestamp timezone loss and varchar length drift. This remains a lexical
 * source check, NOT SQL parsing or PostgreSQL acceptance.
 */
export function compareColumnTypes(schema, sql, label) {
  const tsTables = [...schema.matchAll(/\bpgTable\(\s*["'](\w+)["'],\s*{([\s\S]*?)^\s*},\s*\(t\)\s*=>/gm)];
  const sqlTables = [...sql.matchAll(/^\s*CREATE\s+TABLE\s+(\w+)\s*\(([\s\S]*?)^\);/gim)];
  assert.ok(tsTables.length, label + ": no Drizzle column bodies");
  assert.equal(tsTables.length, sqlTables.length, label + ": table count differs");
  const draftTypes = (body) => [...body.matchAll(
    /^\s*\w+:\s*(uuid|bigint|integer|boolean|varchar|timestamp|date|jsonb|text)\(\s*["'](\w+)["']([^\n]*)/gm,
  )].map((m) => {
    let type = m[1];
    if (type === "varchar") {
      const len = /\blength:\s*(\d+)/.exec(m[3]);
      assert.ok(len, label + ": missing explicit varchar length for " + m[2]);
      type = "varchar(" + len[1] + ")";
    }
    if (type === "timestamp") {
      assert.match(m[3], /withTimezone:\s*true/, label + ": timestamp timezone not explicit for " + m[2]);
      type = "timestamptz";
    }
    return [m[2], type];
  });
  const stagedTypes = (body) => [...body.matchAll(
    /^\s*(\w+)\s+(uuid|bigint|integer|boolean|varchar\(\d+\)|timestamp with time zone|timestamptz|date|jsonb|text)(?=\s|,|$)/gim,
  )].map((m) => [m[1], m[2].toLowerCase().replace("timestamp with time zone", "timestamptz")]);
  const reported = {};
  for (const [, table, body] of tsTables) {
    const sqlBody = sqlTables.find((m) => m[1] === table)?.[2];
    assert.ok(sqlBody, label + ": missing SQL body for " + table);
    const draft = draftTypes(body), stage = stagedTypes(sqlBody);
    assert.ok(draft.length, label + ": no recognized Drizzle columns for " + table);
    const names = (cols) => cols.map((pair) => pair[0]);
    assert.deepEqual(dupes(names(draft)), [], label + ": duplicate draft columns in " + table);
    assert.deepEqual(dupes(names(stage)), [], label + ": duplicate SQL columns in " + table);
    assert.deepEqual(
      draft.map(JSON.stringify).toSorted(), stage.map(JSON.stringify).toSorted(),
      label + ": SQL/Drizzle column name or type drift in " + table,
    );
    reported[table] = draft.length;
  }
  return reported;
}

for (const [draft, stage] of pairs) {
  test("DB10 draft/SQL column type parity: " + draft, () =>
    compareColumnTypes(readFileSync(draft, "utf8"), readFileSync(stage, "utf8"), draft));
}

const typedTS = [
  "const fixture = pgTable('typed_table', {",
  "  id: uuid('id').primaryKey(),",
  "  count: bigint('count', { mode: 'bigint' }).notNull(),",
  "  label: varchar('label', { length: 64 }).notNull(),",
  "  occurredAt: timestamp('occurred_at', { withTimezone: true }).notNull(),",
  "}, (t) => []);",
].join("\n");
const typedSQL = [
  "CREATE TABLE typed_table (",
  "  id uuid NOT NULL,",
  "  count bigint NOT NULL,",
  "  label varchar(64) NOT NULL,",
  "  occurred_at timestamptz NOT NULL",
  ");",
].join("\n");

test("fixture: typed columns match across SQL and Drizzle", () => {
  assert.deepEqual(compareColumnTypes(typedTS, typedSQL, "fixture"), {typed_table: 4});
});
test("fixture: narrowing varchar or converting bigint to integer is detected", () => {
  assert.throws(() => compareColumnTypes(typedTS, typedSQL.replace("varchar(64)", "varchar(32)"), "varchar"), /column name or type drift/);
  assert.throws(() => compareColumnTypes(typedTS, typedSQL.replace("count bigint", "count integer"), "bigint"), /column name or type drift/);
});
test("fixture: timezone loss or missing columns are detected", () => {
  assert.throws(() => compareColumnTypes(typedTS, typedSQL.replace("occurred_at timestamptz", "occurred_at timestamp"), "time"), /column name or type drift/);
  assert.throws(() => compareColumnTypes(typedTS, typedSQL.replace("label varchar(64) NOT NULL,", ""), "column"), /column name or type drift/);
});


/**
 * Nullability is a separate safety contract: matching names and primitive
 * types would miss a SQL nullable FK that Drizzle advertises as required.
 * A primary key counts as NOT NULL even without an explicit .notNull().
 */
export function compareColumnNullability(schema, sql, label) {
  const tsTables = [...schema.matchAll(/\bpgTable\(\s*["'](\w+)["'],\s*{([\s\S]*?)^\s*},\s*\(t\)\s*=>/gm)];
  const sqlTables = [...sql.matchAll(/^\s*CREATE\s+TABLE\s+(\w+)\s*\(([\s\S]*?)^\);/gim)];
  let seen = 0;
  for (const [, table, draftBody] of tsTables) {
    const stageBody = sqlTables.find((m) => m[1] === table)?.[2];
    assert.ok(stageBody, label + ": missing SQL table " + table);
    const draftFields = [...draftBody.matchAll(
      /^\s*\w+:\s*(?:uuid|bigint|integer|boolean|varchar|timestamp|date|jsonb|text)\(\s*["'](\w+)["']/gm,
    )];
    const sqlFields = [...stageBody.matchAll(
      /^\s*(\w+)\s+(?:uuid|bigint|integer|boolean|varchar\(\d+\)|timestamp with time zone|timestamptz|date|jsonb|text)(?=\s|,|$)([^\n]*)/gim,
    )];
    for (let i = 0; i < draftFields.length; i++) {
      const field = draftFields[i];
      const chain = draftBody.slice(field.index, draftFields[i + 1]?.index ?? draftBody.length);
      const required = /\.notNull\s*\(|\.primaryKey\s*\(/.test(chain);
      const match = sqlFields.find((m) => m[1] === field[1]);
      assert.ok(match, label + ": missing SQL field " + table + "." + field[1]);
      const sqlRequired = /\bNOT NULL\b|\bPRIMARY KEY\b/i.test(match[2]);
      assert.equal(required, sqlRequired,
        label + ": nullability drift in " + table + "." + field[1]);
      seen++;
    }
  }
  assert.ok(seen > 0, label + ": no columns checked");
  return seen;
}
for (const [draft, stage] of pairs) {
  test("DB10 draft/SQL nullability parity: " + draft, () => {
    compareColumnNullability(readFileSync(draft, "utf8"), readFileSync(stage, "utf8"), draft);
  });
}
test("fixture: required columns agree and nullable/required changes are detected", () => {
  assert.equal(compareColumnNullability(typedTS, typedSQL, "typed fixture"), 4);
  assert.throws(() =>
    compareColumnNullability(typedTS, typedSQL.replace("count bigint NOT NULL", "count bigint"), "missing required"),
    /nullability drift in typed_table.count/);
  assert.throws(() =>
    compareColumnNullability(typedTS.replace(".primaryKey()", ""), typedSQL, "missing PK"),
    /nullability drift in typed_table.id/);
});


/**
 * Foreign-key column/target/delete behavior comparison. Resolves local draft
 * pgTable variables explicitly; external imports in these source-reviewed
 * drafts use the corresponding camelCase database table name. This does not
 * establish tenant-scoped/composite FK correctness or trigger execution.
 */
export function compareForeignKeys(schema, sql, label) {
  const localTables = Object.fromEntries([...schema.matchAll(
    /\bexport const (\w+) = pgTable\(\s*["'](\w+)["']/gm,
  )].map((m) => [m[1], m[2]]));
  const toSqlTable = (name) => localTables[name] ??
    name.replace(/([a-z\d])([A-Z])/g, "$1_$2").toLowerCase();
  const draft = [];
  for (const [, table, body] of schema.matchAll(
    /\bpgTable\(\s*["'](\w+)["'],\s*{([\s\S]*?)^\s*},\s*\(t\)\s*=>/gm,
  )) {
    const columns = [...body.matchAll(/^\s*\w+:\s*uuid\(\s*["'](\w+)["']/gm)];
    for (let i = 0; i < columns.length; i++) {
      const part = body.slice(columns[i].index, columns[i + 1]?.index ?? body.length);
      const target = /\.references\(\s*\(\)\s*=>\s*(\w+)\.(\w+)\s*,\s*\{\s*onDelete:\s*["'](\w+)["']/.exec(part);
      if (target) draft.push([table, columns[i][1], toSqlTable(target[1]),
        target[2], target[3].toUpperCase()]);
    }
  }
  const staged = [];
  for (const [, table, body] of sql.matchAll(
    /^\s*CREATE\s+TABLE\s+(\w+)\s*\(([\s\S]*?)^\);/gim,
  )) {
    for (const m of body.matchAll(
      /^\s*(\w+)\s+uuid\s+(?:NOT NULL\s+)?REFERENCES\s+(\w+)\((\w+)\)\s+ON DELETE\s+(\w+)/gim,
    )) staged.push([table, m[1], m[2], m[3], m[4].toUpperCase()]);
  }
  assert.ok(draft.length > 0, label + ": missing draft FK relationships");
  assert.deepEqual(draft.map(JSON.stringify).toSorted(), staged.map(JSON.stringify).toSorted(),
    label + ": FK table, target, column or delete action drift");
  return draft.length;
}
for (const [draft, stage] of pairs) {
  test("DB10 draft/SQL foreign-key parity: " + draft, () => {
    compareForeignKeys(readFileSync(draft, "utf8"), readFileSync(stage, "utf8"), draft);
  });
}

const fkTS = [
  "export const parent = pgTable('parent_table', { id: uuid('id').primaryKey() }, (t) => []);",
  "export const child = pgTable('child_table', {",
  "  id: uuid('id').primaryKey(),",
  "  parentId: uuid('parent_id').notNull()",
  "    .references(() => parent.id, { onDelete: 'restrict' }),",
  "}, (t) => []);",
].join("\n");
const fkSQL = [
  "CREATE TABLE parent_table (",
  "  id uuid PRIMARY KEY",
  ");",
  "CREATE TABLE child_table (",
  "  id uuid PRIMARY KEY,",
  "  parent_id uuid NOT NULL REFERENCES parent_table(id) ON DELETE RESTRICT",
  ");",
].join("\n");
test("fixture: FK target and delete action match", () => {
  assert.equal(compareForeignKeys(fkTS, fkSQL, "foreign keys fixture"), 1);
});
test("fixture: dropping FK and weakening delete semantics both fail", () => {
  assert.throws(() =>
    compareForeignKeys(fkTS, fkSQL.replace("REFERENCES parent_table(id) ON DELETE RESTRICT", ""), "lost FK"),
    /FK table, target, column or delete action drift/);
  assert.throws(() =>
    compareForeignKeys(fkTS, fkSQL.replace("ON DELETE RESTRICT", "ON DELETE CASCADE"), "cascade"),
    /FK table, target, column or delete action drift/);
  assert.throws(() =>
    compareForeignKeys(fkTS.replace("parent.id", "otherParent.id"), fkSQL, "wrong parent"),
    /FK table, target, column or delete action drift/);
});
