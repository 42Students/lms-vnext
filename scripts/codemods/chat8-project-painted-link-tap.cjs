#!/usr/bin/env node
"use strict";
/**
 * chat-8: old LMS min touch target 44px through 767, 36px tablet+.
 * Static, painted button-shaped Link and <a> elements with min-h-9
 * (and optional sm:min-h-9) must use min-h-11 md:min-h-9.
 * Does not change inline underline-only links, href, target, download,
 * focus attributes or click semantics. Only projects/mentor/tracker.
 *
 * Old: components___variables.scss:138-149, old-lms-shell-spec.md:22-24.
 * node scripts/codemods/chat8-project-painted-link-tap.cjs [--apply]
 */
const fs=require("node:fs"),path=require("node:path"),ts=require("typescript");
const ROOT=process.cwd(),APPLY=process.argv.includes("--apply");
const DIRS=["src/app/(authenticated)/mentor","src/app/(authenticated)/tracker","src/components/projects"];
const files=[],changed=[],skipped=[];
function walk(dir){if(!fs.existsSync(dir))return;for(const e of fs.readdirSync(dir,{withFileTypes:true})){
 const p=path.join(dir,e.name);if(e.isDirectory())walk(p);
 else if(e.isFile()&&p.endsWith(".tsx"))files.push(p);
}}for(const d of DIRS)walk(path.join(ROOT,d));
for(const file of files){
 const src=fs.readFileSync(file,"utf8");
 if(!src.includes("min-h-9"))continue;
 const sf=ts.createSourceFile(file,src,ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX),edits=[];
 function visit(node){
  if((ts.isJsxOpeningElement(node)||ts.isJsxSelfClosingElement(node))&&
   ["Link","a"].includes(node.tagName.getText(sf))){
   const a=node.attributes.properties.find(v=>ts.isJsxAttribute(v)&&v.name.getText(sf)==="className");
   if(a&&ts.isJsxAttribute(a)&&a.initializer){
    if(!ts.isStringLiteral(a.initializer)){skipped.push(path.relative(ROOT,file)+":dynamic");}
    else{
     const cls=a.initializer.text,tokens=cls.split(/\s+/g);
     if(tokens.includes("min-h-9")&&!tokens.includes("min-h-11")&&tokens.some(v=>v.startsWith("rounded-"))&&tokens.includes("border")){
      const next=tokens.filter(x=>x!=="min-h-9"&&x!=="sm:min-h-9");
      next.push("min-h-11","md:min-h-9");
      edits.push({start:a.initializer.getStart(sf),end:a.initializer.getEnd(),v:JSON.stringify(next.join(" "))});
     }
    }
   }
  }
  ts.forEachChild(node,visit);
 }visit(sf);if(!edits.length)continue;
 let out=src;for(const e of edits.sort((a,b)=>b.start-a.start))out=out.slice(0,e.start)+e.v+out.slice(e.end);
 if(ts.createSourceFile(file,out,ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX).parseDiagnostics.length>sf.parseDiagnostics.length){
  skipped.push(path.relative(ROOT,file)+":parse regression");continue;
 }
 changed.push({path:path.relative(ROOT,file).replace(/\\/g,"/"),links:edits.length});
 if(APPLY)fs.writeFileSync(file,out);
}
process.stdout.write(JSON.stringify({apply,filesScanned:files.length,changed,skipped},null,2)+"\n");
