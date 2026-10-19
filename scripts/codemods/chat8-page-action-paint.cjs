#!/usr/bin/env node
"use strict";
/**
 * chat-8: PageHeader's button-shaped secondary Links in Mentor/Tracker
 * need the exact legacy shell secondary paint. The element-level link
 * skin otherwise forces teal text and font-weight 500 even on buttons.
 *
 * Keep href/content/aria/focus and callbacks intact. Set data-unskin on
 * *only* the painted secondary header link and provide explicit 14px/650,
 * neutral-on-white default and 150ms teal-hover treatment.
 *
 * Legacy: docs/design/old-lms-shell-spec.md:22-24, legacy-styles/
 * components___listing-page-header.scss:106-128 and variables.scss:10,25,91.
 * Usage: node scripts/codemods/chat8-page-action-paint.cjs [--apply]
 */
const fs=require("node:fs"),path=require("node:path"),ts=require("typescript");
const ROOT=process.cwd(),APPLY=process.argv.includes("--apply");
const DIRS=["src/app/(authenticated)/mentor","src/app/(authenticated)/tracker"];
const paths=[];function walk(d){if(!fs.existsSync(d))return;for(const e of fs.readdirSync(d,{withFileTypes:true})){
 const p=path.join(d,e.name);if(e.isDirectory())walk(p);else if(e.isFile()&&e.name.endsWith(".tsx"))paths.push(p);
}}
for(const d of DIRS)walk(path.join(ROOT,d));
const changed=[],skipped=[];
for(const p of paths){
 const before=fs.readFileSync(p,"utf8");
 if(!before.includes("<PageHeader")||!before.includes("actions="))continue;
 const sf=ts.createSourceFile(p,before,ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX),edits=[];
 function inspect(n){
  if((ts.isJsxOpeningElement(n)||ts.isJsxSelfClosingElement(n))&&n.tagName.getText(sf)==="PageHeader"){
   const a=n.attributes.properties.find(v=>ts.isJsxAttribute(v)&&v.name.getText(sf)==="actions");
   if(a&&ts.isJsxAttribute(a)&&a.initializer&&ts.isJsxExpression(a.initializer)&&a.initializer.expression){
    function visit(x){
     if((ts.isJsxOpeningElement(x)||ts.isJsxSelfClosingElement(x))&&x.tagName.getText(sf)==="Link"){
      const cls=x.attributes.properties.find(q=>ts.isJsxAttribute(q)&&q.name.getText(sf)==="className");
      if(!cls||!ts.isJsxAttribute(cls)||!cls.initializer||!ts.isStringLiteral(cls.initializer))return;
      const old=cls.initializer.text;
      if(!/(?:^|\s)border(?:\s|$)/.test(old)||!old.includes("text-link")||!old.includes("rounded-"))return;
      if(x.attributes.properties.some(q=>ts.isJsxAttribute(q)&&q.name.getText(sf)==="data-unskin"))return;
      let next=old.replace(/(^|\s)font-semibold(?=\s|$)/g,"$1font-[650]")
       .replace(/(^|\s)text-link(?=\s|$)/g,"$1text-[var(--lms-body-text)]");
      next+=" bg-white hover:bg-[rgba(38,186,199,0.05)] hover:border-[var(--lms-primary)] hover:text-[var(--lms-primary)] transition-colors duration-150 motion-reduce:transition-none";
      edits.push({start:cls.initializer.getStart(sf),end:cls.initializer.getEnd(),v:JSON.stringify(next)});
      edits.push({start:x.tagName.getEnd(),end:x.tagName.getEnd(),v:' data-unskin=""'});
     }
     ts.forEachChild(x,visit);
    }
    visit(a.initializer.expression);
   }
  }
  ts.forEachChild(n,inspect);
 }
 inspect(sf);
 if(!edits.length)continue;
 let after=before;for(const e of edits.sort((a,b)=>b.start-a.start))after=after.slice(0,e.start)+e.v+after.slice(e.end);
 if(ts.createSourceFile(p,after,ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX).parseDiagnostics.length>sf.parseDiagnostics.length){
  skipped.push(path.relative(ROOT,p)+": parser regression");continue;
 }
 changed.push({file:path.relative(ROOT,p).replace(/\\/g,"/"),links:edits.length/2});
 if(APPLY)fs.writeFileSync(p,after);
}
process.stdout.write(JSON.stringify({apply:APPLY,changed,skipped},null,2)+"\n");
