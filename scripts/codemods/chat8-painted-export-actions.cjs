#!/usr/bin/env node
"use strict";
/**
 * chat-8: Restore old LMS secondary painted control chrome on project/mentor
 * file export LINKS (download attribute), without modifying CSV URL/download
 * behavior. Applies to static classNames already painted with border+rounded.
 * 36px desktop, 44px through 767px; text14/650, white fill, neutral text,
 * 1px hairline and teal 5%-tint hover (shell-spec.md:22-24;
 * legacy-styles/components___listing-page-header.scss:106-128).
 *
 * node scripts/codemods/chat8-painted-export-actions.cjs [--apply]
 */
const fs=require("node:fs"),path=require("node:path"),ts=require("typescript");
const root=process.cwd(),apply=process.argv.includes("--apply");
const dirs=["src/app/(authenticated)/mentor","src/app/(authenticated)/tracker","src/components/projects"];
const files=[],changed=[],skips=[];
function walk(d){if(!fs.existsSync(d))return;for(const x of fs.readdirSync(d,{withFileTypes:true})){
 const p=path.join(d,x.name);if(x.isDirectory())walk(p);else if(p.endsWith(".tsx"))files.push(p);
}}for(const d of dirs)walk(path.join(root,d));
for(const file of files){
 const src=fs.readFileSync(file,"utf8");if(!src.includes("download"))continue;
 const sf=ts.createSourceFile(file,src,ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX),edits=[];
 function visit(n){
  if((ts.isJsxOpeningElement(n)||ts.isJsxSelfClosingElement(n))&&n.tagName.getText(sf)==="Link"){
   const props=n.attributes.properties;
   const isDownload=props.some(a=>ts.isJsxAttribute(a)&&a.name.getText(sf)==="download");
   const already=props.some(a=>ts.isJsxAttribute(a)&&a.name.getText(sf)==="data-unskin");
   const a=props.find(x=>ts.isJsxAttribute(x)&&x.name.getText(sf)==="className");
   if(isDownload&&!already&&a&&ts.isJsxAttribute(a)&&a.initializer){
    if(!ts.isStringLiteral(a.initializer)){skips.push(path.relative(root,file)+":dynamic class");}
    else{
     const tokens=a.initializer.text.split(/\s+/);
     if(tokens.includes("border")&&tokens.some(s=>s.startsWith("rounded-"))&&tokens.includes("min-h-11")){
      const next=tokens.filter(x=>x!=="font-semibold"&&x!=="text-link"&&x!=="sm:min-h-9");
      for(const x of ["inline-flex","text-sm","font-[650]","text-[var(--lms-body-text)]","bg-white","md:min-h-9"]){
       if(!next.includes(x))next.push(x);
      }
      if(next.includes("py-2")&&!next.includes("md:py-0"))next.push("md:py-0");
      next.push("hover:bg-[rgba(38,186,199,0.05)]","hover:border-[var(--lms-primary)]",
        "hover:text-[var(--lms-primary)]","transition-colors","duration-150","motion-reduce:transition-none");
      edits.push({start:a.initializer.getStart(sf),end:a.initializer.getEnd(),value:JSON.stringify(next.join(" "))});
      edits.push({start:n.tagName.getEnd(),end:n.tagName.getEnd(),value:' data-unskin=""'});
     }
    }
   }
  }ts.forEachChild(n,visit);
 }visit(sf);if(!edits.length)continue;
 let out=src;for(const e of edits.sort((a,b)=>b.start-a.start))out=out.slice(0,e.start)+e.value+out.slice(e.end);
 if(ts.createSourceFile(file,out,ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX).parseDiagnostics.length>sf.parseDiagnostics.length){
  skips.push(path.relative(root,file)+":syntax");continue;
 }
 changed.push({path:path.relative(root,file).replace(/\\/g,"/"),links:edits.length/2});
 if(apply)fs.writeFileSync(file,out);
}
process.stdout.write(JSON.stringify({apply,changed,skips},null,2)+"\n");
