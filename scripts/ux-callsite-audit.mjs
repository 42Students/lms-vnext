#!/usr/bin/env node
/** Extract source-linked JSX call sites for backward-compatibility review.
 * This is a source inventory, never a visual snapshot PASS.
 */
import ts from "typescript";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

const root=process.cwd();
const components=new Set([
  "Button","Input","Select","Textarea","Checkbox","Radio","Switch","Dialog","Drawer",
  "ConfirmDialog","ConfirmActionDialog","Tabs","DataTable","Card","StatusBadge",
  "EmptyState","ErrorState","Skeleton","Pagination","FilterBar","PageHeader",
  "Breadcrumbs","FileUpload","StatTile","ToastProvider","ThirdPartyLink",
]);
const files=[];
function walk(folder) {
  for(const e of readdirSync(join(root,folder),{withFileTypes:true})) {
    const path=join(folder,e.name);
    if(e.isDirectory()) walk(path);
    else if(/[.]tsx$/.test(path)) files.push(path);
  }
}
walk("src/app");walk("src/components");
const calls=[];
for(const path of files){
  const source=readFileSync(join(root,path),"utf8");
  const parsed=ts.createSourceFile(path,source,ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX);
  function visit(node) {
    if(ts.isJsxSelfClosingElement(node)||ts.isJsxOpeningElement(node)){
      const name=node.tagName.getText(parsed);
      if(components.has(name)){
        const line=parsed.getLineAndCharacterOfPosition(node.getStart(parsed)).line+1;
        calls.push({file:path,line,component:name});
      }
    }
    ts.forEachChild(node,visit);
  }
  visit(parsed);
}
calls.sort((a,b)=>a.file.localeCompare(b.file)||a.line-b.line);
const affected=calls.filter(call=>/src\/app\/\(authenticated\)\/(college|teacher|mentor|tpo|admin|hr|learn)\//.test(call.file));
if(affected.length<30) {
  process.stderr.write("Only "+affected.length+" authenticated shared-component call sites: need >=30 for compatibility audit.\n");
  process.exit(1);
}
process.stdout.write(JSON.stringify({sourceOnly:true,total:calls.length,authenticated:affected.length,first30:affected.slice(0,30)},null,2)+"\n");
