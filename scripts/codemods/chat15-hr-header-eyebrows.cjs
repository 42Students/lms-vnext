// Usage: node scripts/codemods/chat15-hr-header-eyebrows.cjs [--apply]
// Removes redundant role eyebrow props from shared PageHeader in HR/recruiter pages.
// Leave title, description, actions and JSX children intact; dry-run is the default.
"use strict";
const fs = require("fs");
const path = require("path");
const ts = require("typescript");
const roots = [
  "src/app/(authenticated)/hr",
  "src/app/(authenticated)/recruiter",
];
const allow = new Set(["Recruiter", "Employer Recruiter", "Recruiter · Hiring drive"]);
const apply = process.argv.includes("--apply");

function walk(dir, found=[]) {
  if (!fs.existsSync(dir)) return found;
  for (const entry of fs.readdirSync(dir,{withFileTypes:true})) {
    const target = path.join(dir,entry.name);
    if (entry.isDirectory()) walk(target,found);
    else if (entry.isFile() && entry.name.endsWith(".tsx")) found.push(target);
  }
  return found;
}
let editedFiles=0,removed=0;
for(const file of roots.flatMap(root=>walk(path.resolve(root)))) {
  const source=fs.readFileSync(file,"utf8");
  if(!source.includes("<PageHeader")||!source.includes("eyebrow="))continue;
  const ast=ts.createSourceFile(file,source,ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX);
  const edits=[];
  function visit(node) {
    if((ts.isJsxOpeningElement(node)||ts.isJsxSelfClosingElement(node))&&
      node.tagName.getText(ast)==="PageHeader"){
      for(const attr of node.attributes.properties) {
        if(!ts.isJsxAttribute(attr)||attr.name.text!=="eyebrow"||
          !attr.initializer||!ts.isStringLiteral(attr.initializer)||
          !allow.has(attr.initializer.text))continue;
        const start=attr.getStart(ast);
        const end=attr.getEnd();
        // Delete only the attribute and the immediately preceding whitespace.
        let from=start;
        while(from>node.tagName.getEnd()&&/\s/.test(source[from-1]))from--;
        edits.push([from,end]);
      }
    }
    ts.forEachChild(node,visit);
  }
  visit(ast);
  if(!edits.length)continue;
  let output=source;
  for(const [from,end] of edits.sort((a,b)=>b[0]-a[0]))output=output.slice(0,from)+output.slice(end);
  if(output===source)continue;
  editedFiles++;removed+=edits.length;
  process.stdout.write((apply?"UPDATED ":"WOULD UPDATE ")+path.relative(process.cwd(),file)+
    " ("+edits.length+" role eyebrow props)\n");
  if(apply)fs.writeFileSync(file,output);
}
process.stdout.write((apply?"Updated ":"Would update ")+editedFiles+
  " file(s), "+removed+" redundant PageHeader eyebrows.\n");
