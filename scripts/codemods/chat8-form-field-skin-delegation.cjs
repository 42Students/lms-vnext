#!/usr/bin/env node
"use strict";
/**
 * chat-8: inherited field appearance must come from the old LMS shared
 * Input/Select/Textarea, not 9px button radius or white card background.
 *
 * Old form: legacy-styles/components___form.scss:117-143
 *    field background #fbfcfd, radius 10px, body ink #0a0517,
 *    14px/400, 0.2px tracking; teal 2px/15% focus halo.
 * Shared fields: ui/input.tsx, ui/select.tsx, ui/textarea.tsx;
 * globals.css --lms-field-radius:10px; --lms-form-bg:#fbfcfd.
 *
 * For static JSX className only, strip solely conflicting field paint:
 * "rounded-[var(--lms-control-radius)]" (9px) and "bg-surface" (#fff).
 * Keep width, height, padding, border, validation and callbacks unchanged.
 * Dynamic expressions and raw native controls are deliberately skipped.
 *
 * node scripts/codemods/chat8-form-field-skin-delegation.cjs [--apply]
 */
const fs=require("node:fs"),path=require("node:path"),ts=require("typescript");
const ROOT=process.cwd(),APPLY=process.argv.includes("--apply");
const DIRS=["src/app/(authenticated)/mentor","src/app/(authenticated)/tracker","src/components/projects"];
const files=[],changed=[],skipped=[];
function walk(dir){
 if(!fs.existsSync(dir))return;
 for(const entry of fs.readdirSync(dir,{withFileTypes:true})){
  const p=path.join(dir,entry.name);
  if(entry.isDirectory())walk(p);
  else if(entry.isFile()&&p.endsWith(".tsx"))files.push(p);
 }
}
for(const d of DIRS)walk(path.join(ROOT,d));
for(const file of files){
 const src=fs.readFileSync(file,"utf8");
 if(!src.includes("rounded-[var(--lms-control-radius)]")&&!src.includes("bg-surface"))continue;
 const sf=ts.createSourceFile(file,src,ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX);
 const replacements=[];
 function visit(n){
  if((ts.isJsxOpeningElement(n)||ts.isJsxSelfClosingElement(n))&&
   ["Input","Select","Textarea"].includes(n.tagName.getText(sf))){
   const attr=n.attributes.properties.find(a=>ts.isJsxAttribute(a)&&a.name.getText(sf)==="className");
   if(attr&&ts.isJsxAttribute(attr)&&attr.initializer){
    if(!ts.isStringLiteral(attr.initializer)){
     skipped.push(path.relative(ROOT,file)+":"+(sf.getLineAndCharacterOfPosition(n.getStart(sf)).line+1)+" dynamic class");
    } else {
     const before=attr.initializer.text;
     const after=before.split(/\s+/g).filter(s=>
      s!=="rounded-[var(--lms-control-radius)]"&&s!=="bg-surface").join(" ");
     if(after!==before)replacements.push({
      start:attr.initializer.getStart(sf),end:attr.initializer.getEnd(),v:JSON.stringify(after)
     });
    }
   }
  }
  ts.forEachChild(n,visit);
 }
 visit(sf);
 if(!replacements.length)continue;
 let next=src;for(const r of replacements.sort((a,b)=>b.start-a.start)){
  next=next.slice(0,r.start)+r.v+next.slice(r.end);
 }
 if(ts.createSourceFile(file,next,ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX).parseDiagnostics.length>sf.parseDiagnostics.length){
  skipped.push(path.relative(ROOT,file)+": parse regression");continue;
 }
 changed.push({path:path.relative(ROOT,file).replace(/\\/g,"/"),fields:replacements.length});
 if(APPLY)fs.writeFileSync(file,next);
}
process.stdout.write(JSON.stringify({apply:APPLY,scanned:files.length,changed,skipped},null,2)+"\n");
