import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { analyze, analyzeCheckout, inspect, classify, stripSqlLiterals } from "../scripts/db27-stage-sql-preflight.mjs";

const candidate = (pathName, sql) => ({path:pathName,sql});
const baseline = [
  candidate("drizzle/0001_base.sql",
    'CREATE TABLE "users" (id uuid primary key); CREATE TABLE "colleges" (id uuid primary key);'),
];

test("lexer excludes comments, SQL literals and dollar-quoted function bodies", () => {
  const sql = [
    "-- CREATE TABLE fake_line (id int);",
    "/* ALTER TABLE fake_block ADD bad int; */",
    "SELECT 'REFERENCES fake_string CREATE TABLE fake_text';",
    "CREATE FUNCTION f() RETURNS void AS $body$",
    "BEGIN RAISE NOTICE 'CREATE TABLE fake_plpgsql'; END;",
    "$body$ LANGUAGE plpgsql;",
    'CREATE TABLE "real_table" (id uuid REFERENCES "users"(id));',
  ].join("\n");
  const row = inspect(candidate("draft.sql",sql));
  assert.deepEqual(row.create, ["real_table"]);
  assert.deepEqual(row.alter, []);
  assert.deepEqual(row.references,["users"]);
  assert.doesNotMatch(stripSqlLiterals(sql), /fake_line|fake_block|fake_string|fake_plpgsql/);
});

test("DB27 lexes nested PostgreSQL block comments without phantom tables", () => {
  const sql = "/* outer /* inner */ CREATE TABLE phantom(id int); */ CREATE TABLE actual(id int);";
  assert.deepEqual(inspect(candidate("nested.sql", sql)).create, ["actual"]);
});

test("DB27 lexes E-prefixed backslash strings without phantom DDL", () => {
  const sql = String.raw`SELECT E'ignore \' CREATE TABLE phantom(id int)'; CREATE TABLE actual(id int);`;
  assert.deepEqual(inspect(candidate("escaped.sql", sql)).create, ["actual"]);
});

test("DB27 hides quoted pseudo-DDL without losing normal quoted table names", () => {
  const sql = 'SELECT "CREATE TABLE phantom" FROM users; CREATE TABLE "actual"(id int);';
  assert.deepEqual(inspect(candidate("quoted.sql", sql)).create, ["actual"]);
});


test("unclosed staged SQL delimiters are promotion hazards, never clean preflight", () => {
  const drafts=[
    candidate("open-block.sql","CREATE TABLE first_table (id int); /* unclosed comment"),
    candidate("open-string.sql","SELECT 'unterminated CREATE TABLE phantom(id int)"),
    candidate("open-dollar.sql","CREATE FUNCTION x() RETURNS void AS $body$ BEGIN CREATE TABLE phantom(id int);"),
    candidate("open-identifier.sql",'CREATE TABLE "unfinished identifier (id int)'),
  ];
  const report=analyze({candidates:drafts});
  assert.deepEqual(report.lexicalHazards,[
    {file:"open-block.sql",errors:["UNCLOSED_BLOCK_COMMENT"]},
    {file:"open-dollar.sql",errors:["UNCLOSED_DOLLAR_QUOTE:$body$"]},
    {file:"open-identifier.sql",errors:["UNCLOSED_QUOTED_IDENTIFIER"]},
    {file:"open-string.sql",errors:["UNCLOSED_STRING_LITERAL"]},
  ]);
  assert.equal(report.hazards,true);
  assert.equal(report.safeForAutomaticPromotion,false);
});

test("EOF after ordinary line comment is valid but unterminated dollar tag is not", () => {
  const ok=inspect(candidate("comment.sql","CREATE TABLE safe(id int); -- trailing comment"));
  assert.deepEqual(ok.lexicalErrors,[]);
  const bad=inspect(candidate("body.sql","DO $audit$ BEGIN RAISE NOTICE 'hi'; END;"));
  assert.deepEqual(bad.lexicalErrors,["UNCLOSED_DOLLAR_QUOTE:$audit$"]);
  const ignored=analyze({candidates:[
    candidate("superseded.sql","-- SUPERSEDED\n/* invalid legacy draft"),
  ]});
  assert.equal(ignored.hazards,true,"ignored drafts with malformed SQL still need disposition");
  assert.deepEqual(ignored.lexicalHazards,
    [{file:"superseded.sql",errors:["UNCLOSED_BLOCK_COMMENT"]}]);
});

test("stripSqlLiterals preserves its text API and optionally reports syntax gaps", () => {
  const errs=[];
  const cleaned=stripSqlLiterals("SELECT E'unclosed",errs);
  assert.equal(typeof cleaned,"string");
  assert.deepEqual(errs,["UNCLOSED_STRING_LITERAL"]);
  const valid=[];
  stripSqlLiterals("SELECT $$text with CREATE TABLE fake$$; CREATE TABLE real(id int);",valid);
  assert.deepEqual(valid,[]);
});


test("complex quoted DDL identifiers are not silently ignored", () => {
  const cases=[
    candidate("strange-create.sql",'CREATE TABLE "a table" (id int);'),
    candidate("strange-fk.sql",'CREATE TABLE child (parent_id uuid REFERENCES "odd parent"(id));'),
    candidate("strange-alter.sql",'ALTER TABLE "odd""identifier" ADD name text;'),
  ];
  const report=analyze({candidates:cases});
  assert.deepEqual(report.lexicalHazards,[
    {file:"strange-alter.sql",errors:["UNSUPPORTED_QUOTED_DDL_IDENTIFIER"]},
    {file:"strange-create.sql",errors:["UNSUPPORTED_QUOTED_DDL_IDENTIFIER"]},
    {file:"strange-fk.sql",errors:["UNSUPPORTED_QUOTED_DDL_IDENTIFIER"]},
  ]);
  assert.equal(report.hazards,true);
  assert.equal(report.safeForAutomaticPromotion,false);
  const harmless=inspect(candidate("normal-quoted-sql.sql",
    'SELECT "not a DDL identifier" FROM "real_table"; CREATE TABLE normal (id uuid);'));
  assert.deepEqual(harmless.lexicalErrors,[]);
  assert.deepEqual(harmless.create,["normal"]);
});

test("source-only and superseded SQL cannot silently become active drafts", () => {
  assert.equal(classify("-- SUPERSEDED DB09\nCREATE TABLE old (id int);"),"SUPERSEDED");
  assert.equal(classify("-- DB09 SOURCE REFERENCE ONLY\n-- NO DDL\n"),"REFERENCE_ONLY");
  assert.equal(classify("-- STAGED ONLY\nCREATE TABLE new_table (id int);"),"STAGED");
  const result = analyze({candidates:[
    candidate("discard.sql","-- SUPERSEDED\nCREATE TABLE shadow (id int);"),
    candidate("reference.sql","-- SOURCE REFERENCE ONLY\n-- no DDL\n"),
  ]});
  assert.deepEqual(result.ignoredExecutable,["discard.sql"]);
  assert.equal(result.safeForAutomaticPromotion,false);
  assert.equal(result.hazards,true);
});

test("duplicate staged CREATE TABLEs are detected rather than overwritten", () => {
  const report=analyze({candidates:[
    candidate("a.sql","CREATE TABLE collision(id int);"),
    candidate("b.sql","CREATE TABLE collision(id int);"),
  ]});
  assert.deepEqual(report.duplicates,[{table:"collision",files:["a.sql","b.sql"]}]);
  assert.equal(report.hazards,true);
});

test("a staged CREATE duplicating a registered table is a blocker", () => {
  const report=analyze({candidates:[candidate("a.sql",
    'CREATE TABLE "users" (id uuid);')],registered:baseline});
  assert.deepEqual(report.registeredOverlap,["users"]);
});

test("cross-draft foreign keys determine dependency order", () => {
  const report=analyze({candidates:[
    candidate("c_child.sql","CREATE TABLE child(id int REFERENCES parent(id));"),
    candidate("a_parent.sql","CREATE TABLE parent(id int primary key);"),
  ]});
  assert.deepEqual(report.required,[{file:"c_child.sql",parentTable:"parent",stagedProviders:["a_parent.sql"]}]);
  assert.deepEqual(report.proposedSourceOrder,["a_parent.sql","c_child.sql"]);
  assert.deepEqual(report.cycles,[]);
  assert.deepEqual(report.unresolved,[]);
});

test("an ALTER TABLE draft cannot run before a creating draft", () => {
  const report=analyze({candidates:[
    candidate("create.sql","CREATE TABLE abc(id int);"),
    candidate("alter.sql","ALTER TABLE abc ADD COLUMN label text;"),
  ]});
  assert.deepEqual(report.proposedSourceOrder,["create.sql","alter.sql"]);
});

test("missing parent references differentiate schema-declared vs truly absent", () => {
  const report=analyze({candidates:[candidate("child.sql",
    "CREATE TABLE child(id int REFERENCES declared_parent(id), orphan_id int REFERENCES absent_parent(id));")],
    declared:["declared_parent"]});
  assert.deepEqual(report.unresolved,[
    {file:"child.sql",parentTable:"declared_parent",category:"DECLARED_NOT_PROVEN_REGISTERED"},
    {file:"child.sql",parentTable:"absent_parent",category:"NO_KNOWN_SQL_CREATOR"},
  ]);
  assert.equal(report.hazards,true);
});

test("cyclic cross-draft FKs cannot be ordered with simple migration stages", () => {
  const report=analyze({candidates:[
    candidate("a.sql","CREATE TABLE a(id int REFERENCES b(id));"),
    candidate("b.sql","CREATE TABLE b(id int REFERENCES a(id));"),
  ]});
  assert.equal(report.cycles.length,2);
  assert.equal(report.proposedSourceOrder.length,0);
  assert.equal(report.hazards,true);
});

test("detects destructive draft SQL in code without being fooled by comments", () => {
  const report=analyze({candidates:[
    candidate("safe.sql","-- DROP TABLE all;\nSELECT 1;"),
    candidate("bad.sql","TRUNCATE TABLE private_docs;"),
  ]});
  assert.deepEqual(report.destructive,["bad.sql"]);
});

test("all report variants remain source-only and never signal SQL acceptance", () => {
  const report=analyze({candidates:[]});
  assert.equal(report.safeForAutomaticPromotion,false);
  assert.equal(report.verification,"SOURCE_ONLY_NO_MIGRATION_OR_POSTGRES_EXECUTED");
  assert.equal(report.hazards,false);
});

test("real checkout inventory is read-only and counts staged plus tombstones", () => {
  const repo=path.resolve(import.meta.dirname,"..");
  if (!fs.existsSync(path.join(repo,"docs/planning/sql"))) return;
  const report=analyzeCheckout(repo);
  assert.ok(report.counts.scanned>=20);
  assert.ok(report.counts.active>=10);
  assert.equal(report.safeForAutomaticPromotion,false);
});

test("missing journal migration causes explicit failure rather than green output", () => {
  const root=fs.mkdtempSync(path.join(os.tmpdir(),"db27-fixture-"));
  try{
    fs.mkdirSync(path.join(root,"drizzle/meta"),{recursive:true});
    fs.writeFileSync(path.join(root,"drizzle/meta/_journal.json"),
      JSON.stringify({entries:[{tag:"0001_missing"}]}));
    assert.throws(()=>analyzeCheckout(root),/Registered migration missing/);
  }finally{fs.rmSync(root,{recursive:true,force:true});}
});

test("canonical DB04 draft owns education, images and receipt checks once", () => {
  const root=path.resolve(import.meta.dirname,"..");
  const canonical=fs.readFileSync(path.join(root,
    "docs/planning/db04-proposed-migration.sql"),"utf8");
  const legacy=[
    "docs/planning/sql/db04-education-media-candidate.sql",
    "docs/planning/sql/db04-private-receipt-hardening-candidate.sql",
  ];
  const authoritative=inspect({path:"canonical",sql:canonical});
  for(const table of [
    "profile_private_document_receipts",
    "learner_profile_education_entries",
    "learner_profile_education_documents",
    "learner_profile_images",
  ]) assert.ok(authoritative.create.includes(table),
    "Canonical DB04 is missing "+table);
  for(const filename of legacy) {
    const sql=fs.readFileSync(path.join(root,filename),"utf8");
    const row=inspect({path:filename,sql});
    assert.equal(row.state,"SUPERSEDED",filename);
    assert.deepEqual(row.create,[],filename+" must not create competing tables");
    assert.deepEqual(row.alter,[],filename+" must not add duplicate constraints");
  }
  for(const phrase of [
    "profile_private_doc_id_owner_uq",
    "profile_private_doc_key_ck",
    "profile_private_doc_generation_ck",
    "profile_private_doc_sha256_ck",
    "profile_private_doc_mimetype_ck",
    "learner_profile_education_documents_receipt_fk",
    "learner_profile_images_receipt_fk",
  ]) assert.ok(canonical.includes(phrase),"Canonical DB04 missing "+phrase);
});

test("duplicate CREATE TABLE in a single draft is rejected", () => {
  const report=analyze({candidates:[candidate("twice.sql",
    "CREATE TABLE repeated (id int); CREATE TABLE repeated(id int);")]});
  assert.deepEqual(report.repeatedWithinFile,
    [{file:"twice.sql",tables:["repeated"]}]);
  assert.equal(report.hazards,true);
});


test("DB27 orders partition creation and attachment after parent and child", () => {
  const report=analyze({candidates:[
    candidate("10-parent.sql","CREATE TABLE parent(id int) PARTITION BY LIST(id);"),
    candidate("20-child.sql","CREATE TABLE child PARTITION OF parent FOR VALUES IN (1);"),
    candidate("30-attach.sql","ALTER TABLE ONLY parent ATTACH PARTITION child FOR VALUES IN (2);"),
  ]});
  assert.deepEqual(report.required.filter(x=>x.file==="20-child.sql").map(x=>x.parentTable),["parent"]);
  assert.deepEqual(report.required.filter(x=>x.file==="30-attach.sql").map(x=>x.parentTable).sort(),["child","parent"]);
  assert.ok(report.proposedSourceOrder.indexOf("10-parent.sql")<report.proposedSourceOrder.indexOf("20-child.sql"));
  assert.ok(report.proposedSourceOrder.indexOf("20-child.sql")<report.proposedSourceOrder.indexOf("30-attach.sql"));
});
test("DB27 inventories INHERITS, ALTER INHERIT and CREATE TABLE LIKE parent dependencies", () => {
  const report=analyze({candidates:[
    candidate("01-bases.sql","CREATE TABLE base_a(id int); CREATE TABLE base_b(id int);"),
    candidate("02-child.sql","CREATE TABLE child (note text) INHERITS (base_a, base_b);"),
    candidate("03-like.sql","CREATE TABLE copy (LIKE base_a INCLUDING ALL, LIKE base_b INCLUDING DEFAULTS);"),
    candidate("04-change.sql","ALTER TABLE ONLY child INHERIT base_a;"),
  ]});
  for(const [file,expected] of [
    ["02-child.sql",["base_a","base_b"]],
    ["03-like.sql",["base_a","base_b"]],
    ["04-change.sql",["base_a","child"]],
  ]) assert.deepEqual(report.required.filter(x=>x.file===file).map(x=>x.parentTable).sort(),expected,file);
});
test("DB27 does not confuse CHECK and SELECT LIKE with table ancestry", () => {
  const row=inspect(candidate("not-ancestry.sql",
    "SELECT label LIKE 'match'; CREATE TABLE child(tag text, flag text, CHECK (tag LIKE flag));"));
  assert.deepEqual(row.references,[]);
  assert.deepEqual(row.lexicalErrors,[]);
});
test("DB27 fails closed for malformed INHERITS lists and unsupported quoted parents", () => {
  const report=analyze({candidates:[
    candidate("missing-close.sql","CREATE TABLE child(id int) INHERITS (parent;"),
    candidate("trailing-comma.sql","CREATE TABLE child2(id int) INHERITS (parent,);"),
    candidate("quoted.sql",'CREATE TABLE child3(id int) INHERITS ("two word parent");'),
  ]});
  assert.equal(report.lexicalHazards.length,3);
  assert.ok(report.lexicalHazards.some(x=>x.errors.includes("MALFORMED_INHERITS_CLAUSE")));
  assert.equal(report.lexicalHazards.filter(x=>x.errors.includes("UNSUPPORTED_INHERITS_PARENT")).length,2);
  assert.equal(report.safeForAutomaticPromotion,false);
});
test("DB27 reports partition detach, NO INHERIT, SET UNLOGGED and DISABLE RULE for review", () => {
  for(const sql of [
    "ALTER TABLE parent DETACH PARTITION child;",
    "ALTER TABLE child NO INHERIT parent;",
    "ALTER TABLE records SET UNLOGGED;",
    "ALTER TABLE logs DISABLE RULE security_rule;",
  ]) assert.equal(inspect(candidate("unsafe.sql",sql)).destructive,true,sql);
  for(const sql of [
    "CREATE TRIGGER history BEFORE TRUNCATE ON logs EXECUTE FUNCTION f();",
    "-- ALTER TABLE parent DETACH PARTITION child;\nCREATE TABLE safe(id int);",
    "SELECT 'ALTER TABLE logs DISABLE RULE security_rule';",
  ]) assert.equal(inspect(candidate("safe.sql",sql)).destructive,false,sql);
});
test("DB27 flags complex quoted table ancestry instead of accepting missing parents", () => {
  for(const sql of [
    'CREATE TABLE c PARTITION OF "odd parent" FOR VALUES IN (1);',
    'CREATE TABLE c (LIKE "odd parent" INCLUDING ALL);',
    'ALTER TABLE ONLY "odd parent" ADD COLUMN active bool;',
  ]) assert.equal(inspect(candidate("quoted.sql",sql)).lexicalErrors.includes("UNSUPPORTED_QUOTED_DDL_IDENTIFIER"),true,sql);
});


test("DB27 rejects all temporary table CREATE variants rather than reporting no table", () => {
  for (const sql of [
    "CREATE TEMP TABLE work (id uuid);",
    "CREATE TEMPORARY TABLE work (id uuid);",
    "CREATE GLOBAL TEMPORARY TABLE work (id uuid);",
    "CREATE LOCAL TEMP TABLE work (id uuid);",
  ]) {
    const r = analyze({ candidates: [candidate("temp.sql", sql)] });
    assert.equal(r.hazards, true, sql);
    assert.deepEqual(r.lexicalHazards,
      [{ file: "temp.sql", errors: ["UNSUPPORTED_TEMP_TABLE_DDL"] }], sql);
    assert.deepEqual(r.proposedSourceOrder, ["temp.sql"]);
    assert.equal(r.safeForAutomaticPromotion, false);
  }
});

test("DB27 rejects FOREIGN TABLE before migration integrator can miss its dependencies", () => {
  const r = analyze({ candidates: [candidate("foreign.sql",
    "CREATE FOREIGN TABLE cross_db (id uuid) SERVER external_db;")] });
  assert.deepEqual(r.lexicalHazards,
    [{ file: "foreign.sql", errors: ["UNSUPPORTED_FOREIGN_TABLE_DDL"] }]);
  assert.equal(r.hazards, true);
});

test("DB27 fails closed on SELECT INTO table creation but ignores quoted SQL text", () => {
  const risky = inspect(candidate("select-into.sql",
    "SELECT id INTO TEMP TABLE created_from_select FROM users;"));
  assert.deepEqual(risky.lexicalErrors, ["UNSUPPORTED_SELECT_INTO_DDL"]);
  const harmless = inspect(candidate("quoted.sql",
    "SELECT 'SELECT id INTO TEMP TABLE phantom'; CREATE TABLE live (id int);"));
  assert.deepEqual(harmless.lexicalErrors, []);
  assert.deepEqual(harmless.create, ["live"]);
});

test("DB27 does not misreport schema name public as CREATE target for unusual quoted DDL", () => {
  const r = inspect(candidate("complex.sql", 'CREATE TABLE public."bad table" (id uuid);'));
  assert.deepEqual(r.create, []);
  assert.deepEqual(r.lexicalErrors, ["UNSUPPORTED_QUOTED_DDL_IDENTIFIER"]);
});

test("DB27 flags Unicode-escaped quoted DDL identifiers instead of inventing a U table", () => {
  const r = inspect(candidate("unicode.sql", String.raw`CREATE TABLE U&"bad\0020name" (id int);`));
  assert.deepEqual(r.create, []);
  assert.ok(r.lexicalErrors.includes("UNSUPPORTED_UNICODE_DDL_IDENTIFIER"));
  assert.equal(analyze({ candidates: [candidate("unicode.sql",
    String.raw`CREATE TABLE U&"bad\0020name" (id int);`)] }).hazards, true);
});

test("DB27 still recognizes safe schema-qualified quoted create, alter and references", () => {
  const r = inspect(candidate("qualified.sql",
    'CREATE TABLE public."parent" (id uuid); ' +
    'CREATE TABLE "child" (parent_id uuid REFERENCES public."parent"(id)); ' +
    'ALTER TABLE public."child" ADD COLUMN active bool;'));
  assert.deepEqual(r.lexicalErrors, []);
  assert.deepEqual(r.create, ["parent", "child"]);
  assert.deepEqual(r.alter, ["child"]);
  assert.deepEqual(r.references, ["parent"]);
});

test("DB27 unsupported relation patterns inside comments/dollar bodies never invent hazards", () => {
  const sql = [
    "-- CREATE TEMP TABLE fake(id int);",
    "/* CREATE FOREIGN TABLE fake(id int) SERVER x; */",
    "DO $$ BEGIN RAISE NOTICE 'SELECT id INTO TEMP TABLE fake'; END $$;",
    "CREATE TABLE persisted(id int);",
  ].join("\n");
  const r = inspect(candidate("safe.sql",sql));
  assert.deepEqual(r.create, ["persisted"]);
  assert.deepEqual(r.lexicalErrors, []);
});
