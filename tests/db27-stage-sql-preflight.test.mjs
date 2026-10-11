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
