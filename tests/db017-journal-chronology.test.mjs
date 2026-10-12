import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync, mkdtempSync, mkdirSync, writeFileSync, rmSync} from "node:fs";
import os from "node:os";
import path from "node:path";
import {verifyDrizzleJournal} from "../scripts/verify-drizzle-journal.mjs";

const live=JSON.parse(readFileSync("drizzle/meta/_journal.json","utf8"));
test("registered Drizzle migration timestamps increase in application order",()=>{
  for(let i=1;i<live.entries.length;i++)assert.ok(live.entries[i].when>live.entries[i-1].when,
    live.entries[i].tag+" must run after "+live.entries[i-1].tag);
});
test("journal preflight rejects a syntactically valid but out-of-order timestamp",()=>{
 const root=mkdtempSync(path.join(os.tmpdir(),"db017-journal-order-"));
 try {
   const dir=path.join(root,"drizzle"),meta=path.join(dir,"meta");
   mkdirSync(meta,{recursive:true});
   const entries=[{idx:0,tag:"0000_initial",when:200,version:"7",breakpoints:true},{idx:1,tag:"0001_second",when:100,version:"7",breakpoints:true}];
   writeFileSync(path.join(meta,"_journal.json"),JSON.stringify({version:"7",dialect:"postgresql",entries}));
   for(let i=0;i<2;i++){
     writeFileSync(path.join(dir,entries[i].tag+".sql"),"SELECT 1;");
     writeFileSync(path.join(meta,String(i).padStart(4,"0")+"_snapshot.json"),JSON.stringify({id:"snapshot-"+i,prevId:i?"snapshot-0":null}));
   }
   assert.throws(()=>verifyDrizzleJournal(root),/Migration timestamp is not strictly increasing/);
 } finally {rmSync(root,{recursive:true,force:true})}
});
