#!/usr/bin/env node
"use strict";
/**
 * Old LMS: filter label groups stack full-width on <=767px phones.
 * Change only flex-wrap GET filter forms already using gap-3 in Mentor pages;
 * no data/filter logic, DOM changes, field dimensions or shared UI edits.
 * Dynamic classes are skipped with a report for manual resolution.
 *
 * Reference: components___listing-page-header.scss:130-165; 767px cutoff.
 * node scripts/codemods/chat8-mentor-phone-filter-label-flow.cjs [--apply]
 */
const fs=require("node:fs"),path=require("node:path"),ts=require("typescript");
const ROOT=process.cwd(),APPLY=process.argv.includes("--apply"),root=path.join(ROOT,"src/app/(authenticated)/mentor");
const files=[],changed=[],skipped=[];
function walk(d){if(!fs.existsSync(d))return;for(const e of fs.readdirSync(d,{withFileTypes:true})){
 const p=path.join(d,e.name);if(e.isDirectory())walk(p);else if(p.endsWith(".tsx"))files.push(p);
}}walk(root);
for(const file of files){
 const before=fs.readFileSync(file,"utf8");if(!before.includes("<form"))continue;
 const sf=ts.createSourceFile(file,before,ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX),edits=[];
 function visit(n){
  if((ts.isJsxOpeningElement(n)||ts.isJsxSelfClosingElement(n))&&n.tagName.getText(sf)==="form"){
   const props=n.attributes.properties;
   const method=props.find(a=>ts.isJsxAttribute(a)&&a.name.getText(sf)==="method");
   const cls=props.find(a=>ts.isJsxAttribute(a)&&a.name.getText(sf)==="className");
   if(method&&ts.isJsxAttribute(method)&&ts.isStringLiteral(method.initializer)&&method.initializer.text==="get"&&cls&&ts.isJsxAttribute(cls)&&cls.initializer){
    if(!ts.isStringLiteral(cls.initializer)){skipped.push(path.relative(ROOT,file)+":dynamic form class");}
    else{
     const t=cls.initializer.text.split(/\s+/);
     if(["flex","flex-wrap","gap-3"].every(x=>t.includes(x))&&!t.includes("max-[767px]:[&_label]:w-full")){
      edits.push({start:cls.initializer.getStart(sf),end:cls.initializer.getEnd(),
       value:JSON.stringify(cls.initializer.text+" max-[767px]:[&_label]:w-full")});
     }
    }
   }
  }ts.forEachChild(n,visit);
 }visit(sf);if(!edits.length)continue;
 let after=before;for(const e of edits.sort((a,b)=>b.start-a.start))after=after.slice(0,e.start)+e.value+after.slice(e.end);
 if(ts.createSourceFile(file,after,ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX).parseDiagnostics.length>sf.parseDiagnostics.length){skipped.push(path.relative(ROOT,file)+":syntax");continue;}
 changed.push({path:path.relative(ROOT,file).replace(/\\/g,"/"),forms:edits.length});
 if(APPLY)fs.writeFileSync(file,after);
}
process.stdout.write(JSON.stringify({apply,changed,skipped},null,2)+"\n");
