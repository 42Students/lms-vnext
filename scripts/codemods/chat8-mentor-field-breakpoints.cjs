#!/usr/bin/env node
"use strict";
/**
 * chat-8: forms on Mentor pages use the old LMS <=767px touch breakpoint.
 * Every shared Input/Select/Textarea with "min-h-11 sm:min-h-9" becomes
 * "min-h-11 md:min-h-9". Existing data/handlers/validation/other class
 * utilities remain exactly as before. No shared components are edited.
 *
 * Based on legacy-styles/components___variables.scss:138-149 and
 * components___listing-page-header.scss:9,130-159.
 * Usage:
 *    node scripts/codemods/chat8-mentor-field-breakpoints.cjs
 *    node scripts/codemods/chat8-mentor-field-breakpoints.cjs --apply
 */
const fs=require("node:fs"),path=require("node:path"),ts=require("typescript");
const ROOT=process.cwd(),APPLY=process.argv.includes("--apply");
const BASE=path.join(ROOT,"src/app/(authenticated)/mentor");
const files=[],changed=[],skipped=[];
function walk(dir){if(!fs.existsSync(dir))return;for(const e of fs.readdirSync(dir,{withFileTypes:true})){
  const p=path.join(dir,e.name);if(e.isDirectory())walk(p);else if(e.isFile()&&e.name.endsWith(".tsx"))files.push(p);
}}
walk(BASE);
for(const file of files){
 const before=fs.readFileSync(file,"utf8");
 if(!before.includes("sm:min-h-9"))continue;
 const sf=ts.createSourceFile(file,before,ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX),edits=[];
 function visit(node){
   if((ts.isJsxOpeningElement(node)||ts.isJsxSelfClosingElement(node))&&
      ["Input","Select","Textarea"].includes(node.tagName.getText(sf))){
     for(const attr of node.attributes.properties){
       if(!ts.isJsxAttribute(attr)||attr.name.getText(sf)!=="className"||!attr.initializer)continue;
       if(!ts.isStringLiteral(attr.initializer)){skipped.push(path.relative(ROOT,file)+": dynamic className");continue;}
       const val=attr.initializer.text;
       if(!/(?:^|\s)min-h-11(?:\s|$)/.test(val)||!/(?:^|\s)sm:min-h-9(?:\s|$)/.test(val))continue;
       const next=val.replace(/(^|\s)sm:min-h-9(?=\s|$)/g,"$1md:min-h-9");
       edits.push({start:attr.initializer.getStart(sf),end:attr.initializer.getEnd(),next:JSON.stringify(next)});
     }
   }
   ts.forEachChild(node,visit);
 }
 visit(sf);
 if(!edits.length)continue;
 let after=before;for(const e of edits.sort((a,b)=>b.start-a.start)){after=after.slice(0,e.start)+e.next+after.slice(e.end);}
 if(ts.createSourceFile(file,after,ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX).parseDiagnostics.length>sf.parseDiagnostics.length){
   skipped.push(path.relative(ROOT,file)+": syntax regression");continue;
 }
 changed.push({file:path.relative(ROOT,file).replace(/\\/g,"/"),fields:edits.length});
 if(APPLY)fs.writeFileSync(file,after);
}
process.stdout.write(JSON.stringify({apply:APPLY,filesScanned:files.length,changedFiles:changed.length,changed,skipped},null,2)+"\n");
