#!/usr/bin/env node
"use strict";
/**
 * Legacy project/tile grid desktop threshold: $smd:991px, $md:992px.
 * Correct only static Mentor metric grid classes that are "grid gap-3
 * md:grid-cols-2 lg:grid-cols-4|5"; switch desktop threshold 1024->992.
 * Keep number of columns, cards and all content unchanged.
 *
 * legacy-styles/components___variables.scss:145-156.
 * node scripts/codemods/chat8-mentor-metric-grid-992.cjs [--apply]
 */
const fs=require("node:fs"),path=require("node:path"),ts=require("typescript");
const root=process.cwd(),base=path.join(root,"src/app/(authenticated)/mentor");
const apply=process.argv.includes("--apply"),changed=[],files=[],skipped=[];
function walk(d){if(!fs.existsSync(d))return;for(const e of fs.readdirSync(d,{withFileTypes:true})){
 const p=path.join(d,e.name);if(e.isDirectory())walk(p);else if(p.endsWith(".tsx"))files.push(p);
}}walk(base);
for(const p of files){
 const src=fs.readFileSync(p,"utf8");
 if(!src.includes("lg:grid-cols-"))continue;
 const sf=ts.createSourceFile(p,src,ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX),edits=[];
 function visit(n){
  if(ts.isJsxOpeningElement(n)||ts.isJsxSelfClosingElement(n)){
   const a=n.attributes.properties.find(v=>ts.isJsxAttribute(v)&&v.name.getText(sf)==="className");
   if(a&&ts.isJsxAttribute(a)&&a.initializer&&ts.isStringLiteral(a.initializer)){
    const tokens=a.initializer.text.split(/\s+/);
    if(["grid","gap-3","md:grid-cols-2"].every(v=>tokens.includes(v))){
     const t=tokens.map(v=>v==="lg:grid-cols-4"?"min-[992px]:grid-cols-4":v==="lg:grid-cols-5"?"min-[992px]:grid-cols-5":v);
     if(t.join(" ")!==tokens.join(" "))edits.push({start:a.initializer.getStart(sf),end:a.initializer.getEnd(),value:JSON.stringify(t.join(" "))});
    }
   }
  }ts.forEachChild(n,visit);
 }visit(sf);if(!edits.length)continue;
 let out=src;for(const e of edits.sort((a,b)=>b.start-a.start))out=out.slice(0,e.start)+e.value+out.slice(e.end);
 if(ts.createSourceFile(p,out,ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX).parseDiagnostics.length>sf.parseDiagnostics.length){skipped.push(path.relative(root,p)+":syntax");continue;}
 changed.push({path:path.relative(root,p).replace(/\\/g,"/"),grids:edits.length});
 if(apply)fs.writeFileSync(p,out);
}
process.stdout.write(JSON.stringify({apply,changed,skipped},null,2)+"\n");
