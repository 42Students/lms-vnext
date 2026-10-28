import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, writeFileSync, rmSync, readFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { verifyDrizzleJournal } from "../scripts/verify-drizzle-journal.mjs";

function fixture() {
  const folder = mkdtempSync(path.join(os.tmpdir(), "drizzle-journal-"));
  const meta = path.join(folder, "drizzle", "meta");
  mkdirSync(meta, { recursive:true });
  const id0 = randomUUID(), id1 = randomUUID();
  const journal = { version:"7", dialect:"postgresql", entries:[
    { idx:0, version:"7", when:1000, tag:"0000_seed", breakpoints:true },
    { idx:1, version:"7", when:2000, tag:"0001_next", breakpoints:true },
  ] };
  const writeJournal=()=>writeFileSync(path.join(meta,"_journal.json"),JSON.stringify(journal));
  writeJournal();
  writeFileSync(path.join(folder,"drizzle","0000_seed.sql"),"SELECT 1;\n");
  writeFileSync(path.join(folder,"drizzle","0001_next.sql"),"SELECT 2;\n");
  writeFileSync(path.join(meta,"0000_snapshot.json"),JSON.stringify({id:id0,prevId:"00000000-0000-0000-0000-000000000000",version:"7",dialect:"postgresql",tables:{}}));
  writeFileSync(path.join(meta,"0001_snapshot.json"),JSON.stringify({id:id1,prevId:id0,version:"7",dialect:"postgresql",tables:{}}));
  return { folder, meta, journal, writeJournal,
    cleanup:()=>rmSync(folder,{recursive:true,force:true}) };
}

test("the real repo journal is structurally complete", () => {
  const result=verifyDrizzleJournal(process.cwd());
  assert.ok(result.migrations >= 41);
  assert.match(result.first,/^0000_/);
});

test("accepts a well-ordered journal and snapshot chain",()=>{
  const f=fixture();
  try { assert.equal(verifyDrizzleJournal(f.folder).migrations,2); }
  finally {f.cleanup();}
});

test("rejects a duplicate or out-of-order tag/index",()=>{
  const f=fixture();
  try {
    f.journal.entries[1].tag="0000_seed";
    f.journal.entries[1].idx=0;
    f.writeJournal();
    assert.throws(()=>verifyDrizzleJournal(f.folder),/idx|matching zero-padded|Duplicate journal/);
  } finally {f.cleanup();}
});

test("rejects orphan migration SQL and snapshots",()=>{
  const f=fixture();
  try {
    writeFileSync(path.join(f.folder,"drizzle","0002_orphan.sql"),"SELECT 3;");
    writeFileSync(path.join(f.meta,"0002_snapshot.json"),"{}");
    assert.throws(()=>verifyDrizzleJournal(f.folder),/Unregistered migration SQL/);
  } finally {f.cleanup();}
});

test("rejects broken snapshot ancestry",()=>{
  const f=fixture();
  try {
    writeFileSync(path.join(f.meta,"0001_snapshot.json"),
      JSON.stringify({id:randomUUID(),prevId:"not-the-parent",tables:{}}));
    assert.throws(()=>verifyDrizzleJournal(f.folder),/Broken snapshot ancestry/);
  } finally {f.cleanup();}
});

test("rejects empty registered SQL",()=>{
  const f=fixture();
  try {
    writeFileSync(path.join(f.folder,"drizzle","0001_next.sql"),"  ");
    assert.throws(()=>verifyDrizzleJournal(f.folder),/Empty registered SQL/);
  } finally {f.cleanup();}
});

test("rejects a corrupted root snapshot even when later ancestry is intact", () => {
  const f=fixture();
  try {
    const original=JSON.parse(readFileSync(path.join(f.meta,"0000_snapshot.json"),"utf8"));
    writeFileSync(path.join(f.meta,"0000_snapshot.json"),
      JSON.stringify({...original,prevId:"arbitrary-parent"}));
    assert.throws(()=>verifyDrizzleJournal(f.folder),/Root snapshot/);
  } finally {f.cleanup();}
});

test("rejects journal dialect and per-entry version corruption", () => {
  const f=fixture();
  try {
    f.journal.dialect="sqlite";
    f.writeJournal();
    assert.throws(()=>verifyDrizzleJournal(f.folder),/Journal version\/dialect/);
    f.journal.dialect="postgresql";
    f.journal.entries[1].version="6";
    f.writeJournal();
    assert.throws(()=>verifyDrizzleJournal(f.folder),/mismatched version/);
  } finally {f.cleanup();}
});

test("rejects a snapshot with a different dialect or version", () => {
  const f=fixture();
  try {
    const previous=JSON.parse(readFileSync(path.join(f.meta,"0001_snapshot.json"),"utf8"));
    writeFileSync(path.join(f.meta,"0001_snapshot.json"),
      JSON.stringify({...previous,version:"6",dialect:"sqlite"}));
    assert.throws(()=>verifyDrizzleJournal(f.folder),/version\/dialect differs/);
  } finally {f.cleanup();}
});
