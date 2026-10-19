#!/usr/bin/env node
"use strict";
// chat-1 learner placement headers. Dry run unless --apply.
// node scripts/codemods/chat1-learner-page-headings.cjs --apply
// Orchestrator owns execution and syntax checks. Never scans courses or shared UI.
const fs=require("node:fs");
const path=require("node:path");
const ts=require("typescript");
const apply=process.argv.includes("--apply");
const root=path.join(process.cwd(),"src/app/(authenticated)/learn/my-placements");
const imp='import { PageHeader } from "@/components/ui/page-header";';
const plans=[
  ["applications/page.tsx","Applications","/learn/my-placements/offers","min-w-0 space-y-6"],
  ["jobs/page.tsx","Drives","/learn/my-placements/rules?from=drives","min-w-0 space-y-6"],
  ["placement/page.tsx","Placement cell",null,"space-y-7"],
];
const results=[];
let failed=false;
for(const [relative,title,href,css] of plans){
  const file=path.join(root,relative);
  try{
    const before=fs.readFileSync(file,"utf8");
    if(before.includes("<PageHeader ")){results.push([relative,"already done"]);continue;}
    const wrapper='<div className="'+css+'">';
    if(before.split(wrapper).length!==2)throw Error("unexpected root: refusing replacement");
    let after=before;
    let header='      <PageHeader title="'+title+'"';
    if(href){
      const quote=href.replace(/[.*+?^$()|[\]{}\\]/g,"\\$&");
      const rx=new RegExp('^[ \\t]*<Link href="'+quote+'"[\\s\\S]*?<\\/Link>[ \\t]*\\r?\\n',"gm");
      const matches=[...after.matchAll(rx)];
      if(matches.length!==1)throw Error("expected one link action");
      const action=matches[0][0].trim();
      after=after.replace(matches[0][0],"");
      header+=" actions={(\n        "+action+"\n      )}";
    }
    header+=" />";
    after=after.replace(wrapper,wrapper+"\n"+header);
    if(!after.includes(imp))after=imp+"\n"+after;
    const sf=ts.createSourceFile(file,after,ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX);
    if(sf.parseDiagnostics.length)throw Error("generated TSX parse diagnostics");
    if(apply)fs.writeFileSync(file,after,"utf8");
    results.push([relative,apply?"changed":"would change"]);
  }catch(e){failed=true;results.push([relative,String(e)]);}
}
process.stdout.write(JSON.stringify({mode:apply?"apply":"dry-run",results},null,2)+"\n");
if(failed)process.exitCode=1;
