#!/usr/bin/env node
"use strict";
/** [chat-18] Deterministic recruiter notification breakpoint repair.
 * Legacy sources: old-lms-shell.css:73-85; old-lms-shell-spec.md:12-18.
 * Run with --dry-run to inspect. Idempotent and scoped.
 */
const fs=require("node:fs"), path=require("node:path");
const root=path.resolve(__dirname,"../..");
const specs=[{"path":"src/components/hr/hr-recruiter-bell.tsx","changes":[["sm:!h-9 sm:!w-9 sm:!min-w-9","md:!h-9 md:!w-9 md:!min-w-9"],["variant=\"secondary\">{loading?\"Saving…\":\"Mark all read\"}</Button>","variant=\"secondary\" className=\"min-h-11 md:min-h-9\">{loading?\"Saving…\":\"Mark all read\"}</Button>"]]},{"path":"src/components/hr/recruiter-notification-bell.tsx","changes":[["variant=\"secondary\" className=\"relative min-h-11 min-w-11 !px-2\"","variant=\"secondary\" className=\"relative min-h-11 min-w-11 !p-0 md:min-h-9 md:min-w-9\""],["onClick={()=>void load()} variant=\"secondary\">Retry","onClick={()=>void load()} variant=\"secondary\" className=\"min-h-11 md:min-h-9\">Retry"],["variant=\"secondary\" className=\"w-full justify-start text-left\"","variant=\"secondary\" className=\"min-h-11 w-full justify-start text-left md:min-h-9\""]]},{"path":"src/components/hr/recruiter-decision-read-button.tsx","changes":[["className=\"min-h-9 max-sm:min-h-11\"","className=\"min-h-11 md:min-h-9\""]]}];
const dry=process.argv.includes("--dry-run");
for(const spec of specs){
 const filename=path.join(root,spec.path);
 let content=fs.readFileSync(filename,"utf8"), changed=0;
 for(const [before,after] of spec.changes){
  if(content.includes(after))continue;
  if(content.split(before).length!==2)throw Error(spec.path+": expected one "+before);
  content=content.replace(before,after);changed++;
 }
 if(changed&&!dry)fs.writeFileSync(filename,content);
 process.stdout.write(spec.path+" changes="+changed+"\n");
}
