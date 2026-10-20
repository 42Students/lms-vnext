#!/usr/bin/env node
"use strict";
/**
 * chat-8 Mentor GET filter Apply/Filter form Submit buttons must retain the
 * old-LMS <=767px touch height44, then the measured 36px control at >=768px.
 * Reuses shared Button; never touches props, mutation, callback or global CSS.
 *
 * Old: components___variables.scss:138-149, old-lms-shell-spec.md:22-24.
 * Scope: src/app/(authenticated)/mentor/**/*.tsx only.
 * node scripts/codemods/chat8-mentor-submit-touch.cjs [--apply]
 */
const fs=require("node:fs"),path=require("node:path"),ts=require("typescript");
const root=process.cwd(),base=path.join(root,"src/app/(authenticated)/mentor");
const apply=process.argv.includes("--apply"),files=[],changes=[],skipped=[];
function walk(d){if(!fs.existsSync(d))return;for(const x of fs.readdirSync(d,{withFileTypes:true})){
 const p=path.join(d,x.name);if(x.isDirectory())walk(p);else if(x.isFile()&&p.endsWith(".tsx"))files.push(p);
}}walk(base);
for(const p of files){
 const src=fs.readFileSync(p,"utf8");if(!src.includes("<Button"))continue;
 const sf=ts.createSourceFile(p,src,ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX),edits=[];
 function visit(n){
  if((ts.isJsxOpeningElement(n)||ts.isJsxSelfClosingElement(n))&&n.tagName.getText(sf)==="Button"){
   const attrs=n.attributes.properties;
   const submit=attrs.some(a=>ts.isJsxAttribute(a)&&a.name.getText(sf)==="type"&&ts.isStringLiteral(a.initializer)&&a.initializer.text==="submit");
   if(submit){
    const c=attrs.find(a=>ts.isJsxAttribute(a)&&a.name.getText(sf)==="className");
    if(c&&ts.isJsxAttribute(c)&&c.initializer){
     if(!ts.isStringLiteral(c.initializer))skipped.push(path.relative(root,p)+":dynamic class");
     else{
      const before=c.initializer.text;if(!before.split(/\s+/g).includes("md:min-h-9")){
       const next=before+" min-h-11 md:min-h-9";
       edits.push({start:c.initializer.getStart(sf),end:c.initializer.getEnd(),text:JSON.stringify(next)});
      }
     }
    }else edits.push({start:n.attributes.getEnd(),end:n.attributes.getEnd(),text:' className="min-h-11 md:min-h-9"'});
   }
  }
  ts.forEachChild(n,visit);
 }
 visit(sf);if(!edits.length)continue;
 let out=src;for(const e of edits.sort((a,b)=>b.start-a.start))out=out.slice(0,e.start)+e.text+out.slice(e.end);
 if(ts.createSourceFile(p,out,ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX).parseDiagnostics.length>sf.parseDiagnostics.length){skipped.push(path.relative(root,p)+":syntax");continue}
 changes.push({path:path.relative(root,p).replace(/\\/g,"/"),buttons:edits.length});
 if(apply)fs.writeFileSync(p,out);
}
process.stdout.write(JSON.stringify({apply,changes,skipped},null,2)+"\n");
