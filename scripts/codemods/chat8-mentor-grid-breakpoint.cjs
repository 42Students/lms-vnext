#!/usr/bin/env node
"use strict";
/**
 * chat-8: old LMS keeps phone single-column until width 768.
 * Change only class tokens "sm:grid-cols-2" to "md:grid-cols-2"
 * on static className attached to grid containers in Mentor pages.
 * Keep cards, sections, number of columns, render branches and children.
 * References legacy-styles/components___variables.scss:145-156 and
 * components___listing-page-header.scss:130-159.
 *
 * node scripts/codemods/chat8-mentor-grid-breakpoint.cjs [--apply]
 */
const fs=require("node:fs"),path=require("node:path"),ts=require("typescript");
const ROOT=process.cwd(),APPLY=process.argv.includes("--apply"),files=[],changes=[],skipped=[];
const base=path.join(ROOT,"src/app/(authenticated)/mentor");
function walk(d){if(!fs.existsSync(d))return;for(const e of fs.readdirSync(d,{withFileTypes:true})){
 const p=path.join(d,e.name);if(e.isDirectory())walk(p);else if(e.isFile()&&p.endsWith(".tsx"))files.push(p);
}}walk(base);
for(const file of files){
 const src=fs.readFileSync(file,"utf8");if(!src.includes("sm:grid-cols-2"))continue;
 const sf=ts.createSourceFile(file,src,ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX),edits=[];
 function visit(n){
  if(ts.isJsxOpeningElement(n)||ts.isJsxSelfClosingElement(n)){
   const a=n.attributes.properties.find(x=>ts.isJsxAttribute(x)&&x.name.getText(sf)==="className");
   if(a&&ts.isJsxAttribute(a)&&a.initializer){
    if(!ts.isStringLiteral(a.initializer)){
     skipped.push(path.relative(ROOT,file)+":dynamic classes");}
    else if(a.initializer.text.split(/\s+/).includes("sm:grid-cols-2")){
     const old=a.initializer.text,next=old.replace(/(^|\s)sm:grid-cols-2(?=\s|$)/g,"$1md:grid-cols-2");
     edits.push({start:a.initializer.getStart(sf),end:a.initializer.getEnd(),v:JSON.stringify(next)});
    }
   }
  }
  ts.forEachChild(n,visit);
 }visit(sf);if(!edits.length)continue;
 let after=src;for(const e of edits.sort((a,b)=>b.start-a.start))after=after.slice(0,e.start)+e.v+after.slice(e.end);
 if(ts.createSourceFile(file,after,ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX).parseDiagnostics.length>sf.parseDiagnostics.length){
  skipped.push(path.relative(ROOT,file)+":parse regression");continue;
 }
 changes.push({path:path.relative(ROOT,file).replace(/\\/g,"/"),grids:edits.length});
 if(APPLY)fs.writeFileSync(file,after);
}
process.stdout.write(JSON.stringify({apply:APPLY,scanned:files.length,changes,skipped},null,2)+"\n");
