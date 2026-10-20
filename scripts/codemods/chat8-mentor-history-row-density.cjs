#!/usr/bin/env node
"use strict";
/**
 * chat-8 old LMS line-separated activity/review/meeting rows:
 * common.scss:700-726 neutral-200 1px separators, compact 12px vertical;
 * globals.css --lms-canvas-border:#e5e9f0, --lms-space-3:12px.
 * Only Mentor TSX, only semantic <ol> or <div> containers already marked
 * divide-y divide-border, followed by data-mapped <li>/<article> nodes.
 * Leaves grids, board cards, data fields, table layout and other lanes intact.
 *
 * node scripts/codemods/chat8-mentor-history-row-density.cjs [--apply]
 */
const fs=require("node:fs"),path=require("node:path"),ts=require("typescript");
const root=process.cwd(),dir=path.join(root,"src/app/(authenticated)/mentor");
const apply=process.argv.includes("--apply"),files=[],result=[],skipped=[];
function walk(d){if(!fs.existsSync(d))return;for(const e of fs.readdirSync(d,{withFileTypes:true})){
 const p=path.join(d,e.name);if(e.isDirectory())walk(p);else if(e.isFile()&&p.endsWith(".tsx"))files.push(p);
}}walk(dir);
for(const file of files){
 const before=fs.readFileSync(file,"utf8");if(!before.includes("divide-y divide-border"))continue;
 const sf=ts.createSourceFile(file,before,ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX),edits=[];
 function visit(n){
  if((ts.isJsxOpeningElement(n)||ts.isJsxSelfClosingElement(n))&&
    ["ol","div"].includes(n.tagName.getText(sf))){
   const a=n.attributes.properties.find(x=>ts.isJsxAttribute(x)&&x.name.getText(sf)==="className");
   if(a&&ts.isJsxAttribute(a)&&a.initializer&&ts.isStringLiteral(a.initializer)){
    const cls=a.initializer.text;
    if(cls.split(/\s+/).includes("divide-y")&&cls.split(/\s+/).includes("divide-border")){
     const next=cls.replace(/\bdivide-border\b/,"divide-[var(--lms-canvas-border)]")+" border-y border-[var(--lms-canvas-border)]";
     edits.push({start:a.initializer.getStart(sf),end:a.initializer.getEnd(),v:JSON.stringify(next)});
    }
   }
  }
  if((ts.isJsxOpeningElement(n)||ts.isJsxSelfClosingElement(n))&&["li","article"].includes(n.tagName.getText(sf))){
   const a=n.attributes.properties.find(x=>ts.isJsxAttribute(x)&&x.name.getText(sf)==="className");
   if(a&&ts.isJsxAttribute(a)&&a.initializer&&ts.isStringLiteral(a.initializer)){
    const cls=a.initializer.text;
    if(cls.split(/\s+/).includes("py-4")&&n.getText(sf).slice(0,120).includes("key=")){
      edits.push({start:a.initializer.getStart(sf),end:a.initializer.getEnd(),
        v:JSON.stringify(cls.replace(/\bpy-4\b/,"py-[var(--lms-space-3)]"))});
    }
   }
  }
  ts.forEachChild(n,visit);
 }
 visit(sf);if(!edits.length)continue;
 let after=before;for(const e of edits.sort((a,b)=>b.start-a.start))after=after.slice(0,e.start)+e.v+after.slice(e.end);
 if(ts.createSourceFile(file,after,ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX).parseDiagnostics.length>sf.parseDiagnostics.length){
  skipped.push(path.relative(root,file)+": JSX syntax regression");continue;
 }
 result.push({path:path.relative(root,file).replace(/\\/g,"/"),changes:edits.length});
 if(apply)fs.writeFileSync(file,after);
}
process.stdout.write(JSON.stringify({apply,filesScanned:files.length,result,skipped},null,2)+"\n");
