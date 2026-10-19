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
  ["schedule/page.tsx","Schedule",null,"min-w-0 space-y-6"],
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
      const marker='<Link href="'+href+'"';
      const matchAt=after.indexOf(marker);
      if(matchAt<0||after.indexOf(marker,matchAt+1)>=0)throw Error("expected one link action");
      const start=after.lastIndexOf("\n",matchAt)+1;
      const close=after.indexOf("</Link>",matchAt);
      if(close<0)throw Error("link closing tag missing");
      const end=close+"</Link>".length;
      const action=after.slice(start,end).trim();
      after=after.slice(0,start)+after.slice(end).replace(/^[ \t]*\r?\n/,"");
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
