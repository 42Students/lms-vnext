#!/usr/bin/env node
"use strict";
/**
 * chat-8 Mentor filter labels: old .ln-lb2 is 13px/600/16px with
 * neutral-400 #a9a7ae, not body-text 14px/600.
 * Legacy: components___form.scss:110-115, variables.scss:27-28.
 * Use exact source tokens from globals.css; do not affect content,
 * form values, callbacks, ARIA, other lanes, standalone badges or
 * checkbox labels. Only existing grid gap-1 text-sm semibold labels.
 *
 * node scripts/codemods/chat8-mentor-filter-labels.cjs [--apply]
 */
const fs=require("node:fs"),path=require("node:path"),ts=require("typescript");
const root=process.cwd(),base=path.join(root,"src/app/(authenticated)/mentor");
const apply=process.argv.includes("--apply"),files=[],changed=[],skipped=[];
function walk(d){if(!fs.existsSync(d))return;for(const e of fs.readdirSync(d,{withFileTypes:true})){
 const p=path.join(d,e.name);if(e.isDirectory())walk(p);else if(p.endsWith(".tsx"))files.push(p);
}}walk(base);
for(const file of files){
 const src=fs.readFileSync(file,"utf8");if(!src.includes("text-sm font-semibold text-body"))continue;
 const sf=ts.createSourceFile(file,src,ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX),edits=[];
 function visit(n){
  if((ts.isJsxOpeningElement(n)||ts.isJsxSelfClosingElement(n))&&n.tagName.getText(sf)==="label"){
   const attr=n.attributes.properties.find(a=>ts.isJsxAttribute(a)&&a.name.getText(sf)==="className");
   if(attr&&ts.isJsxAttribute(attr)&&attr.initializer){
    if(!ts.isStringLiteral(attr.initializer))skipped.push(path.relative(root,file)+":dynamic label");
    else{
     const tokens=attr.initializer.text.split(/\s+/g);
     if(["grid","gap-1","text-sm","font-semibold","text-body"].every(t=>tokens.includes(t))){
      const next=tokens.map(t=>t==="text-sm"?"text-[13px]":t==="text-body"?"text-[var(--lms-neutral-400)]":t);
      if(!next.includes("leading-4"))next.push("leading-4");
      edits.push({start:attr.initializer.getStart(sf),end:attr.initializer.getEnd(),value:JSON.stringify(next.join(" "))});
     }
    }
   }
  }ts.forEachChild(n,visit);
 }visit(sf);if(!edits.length)continue;
 let out=src;for(const e of edits.sort((a,b)=>b.start-a.start))out=out.slice(0,e.start)+e.value+out.slice(e.end);
 if(ts.createSourceFile(file,out,ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX).parseDiagnostics.length>sf.parseDiagnostics.length){
  skipped.push(path.relative(root,file)+":parse regression");continue;
 }
 changed.push({path:path.relative(root,file).replace(/\\/g,"/"),labels:edits.length});
 if(apply)fs.writeFileSync(file,out);
}
process.stdout.write(JSON.stringify({apply,changed,skipped},null,2)+"\n");
