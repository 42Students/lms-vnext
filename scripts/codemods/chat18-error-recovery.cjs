#!/usr/bin/env node
"use strict";
/** [chat-18] Per-route recruiter recovery surfaces, preserving copy and retry.
 * Top title = normal page name (old-lms-pages.md:4-6).
 * Phone retry control >=44px through 767px (old-lms-shell.css:73-85).
 * Invocation: node scripts/codemods/chat18-error-recovery.cjs --dry-run
 * Invoking is not required for the committed result; this is the repeatable transform.
 */
const fs=require("node:fs"),path=require("node:path"),root=path.resolve(__dirname,"../..");
const specs=[{"path":"src/app/(authenticated)/hr/calendar/error.tsx","replacements":[["<PageHeader title=\"Calendar\" />","<PageHeader title=\"Calendar\" />"],["<Button type=\"button\" variant=\"secondary\" onClick={reset}>Retry</Button>","<Button type=\"button\" variant=\"secondary\" className=\"min-h-11 md:min-h-9\" onClick={reset}>Retry</Button>"],["<div className=\"min-w-0 space-y-4\">","<div className=\"min-w-0 max-w-full space-y-4\">"]]},{"path":"src/app/(authenticated)/hr/company/error.tsx","replacements":[["<Button type=\"button\" variant=\"secondary\" onClick={reset}>Try again</Button>","<Button type=\"button\" variant=\"secondary\" className=\"min-h-11 md:min-h-9\" onClick={reset}>Try again</Button>"],["<div className=\"min-w-0 space-y-4\">","<div className=\"min-w-0 max-w-full space-y-4\">"]]},{"path":"src/app/(authenticated)/hr/company/reports/error.tsx","replacements":[["<PageHeader title=\"Couldn't load Company Reports\" />","<PageHeader title=\"Company Reports\" />"],["<Button type=\"button\" variant=\"secondary\" onClick={reset}>Retry</Button>","<Button type=\"button\" variant=\"secondary\" className=\"min-h-11 md:min-h-9\" onClick={reset}>Retry</Button>"],["<div className=\"min-w-0 space-y-4\">","<div className=\"min-w-0 max-w-full space-y-4\">"]]},{"path":"src/app/(authenticated)/hr/conversations/error.tsx","replacements":[["<PageHeader title=\"Conversations unavailable\" />","<PageHeader title=\"Messages\" />"],["<Button type=\"button\" variant=\"secondary\" onClick={reset}>Retry</Button>","<Button type=\"button\" variant=\"secondary\" className=\"min-h-11 md:min-h-9\" onClick={reset}>Retry</Button>"]]},{"path":"src/app/(authenticated)/hr/conversations/[threadId]/error.tsx","replacements":[["<Button type=\"button\" variant=\"secondary\" onClick={reset}>Retry</Button>","<Button type=\"button\" variant=\"secondary\" className=\"min-h-11 md:min-h-9\" onClick={reset}>Retry</Button>"],["<div className=\"min-w-0 space-y-4\">","<div className=\"min-w-0 max-w-full space-y-4\">"]]},{"path":"src/app/(authenticated)/hr/messages/error.tsx","replacements":[["<PageHeader title=\"Messages are temporarily unavailable\"/>","<PageHeader title=\"Messages\"/>"],["<Button type=\"button\" variant=\"secondary\" onClick={reset}>Retry messages</Button>","<Button type=\"button\" variant=\"secondary\" className=\"min-h-11 md:min-h-9\" onClick={reset}>Retry messages</Button>"],["<div className=\"min-w-0 space-y-4\">","<div className=\"min-w-0 max-w-full space-y-4\">"]]}];
for(const spec of specs){
 const full=path.join(root,spec.path);
 let source=fs.readFileSync(full,"utf8"),changed=0;
 for(const [from,to] of spec.replacements){
  if(from===to||source.includes(to))continue;
  if(source.split(from).length!==2)throw Error(spec.path+" expected one "+from);
  source=source.replace(from,to);changed++;
 }
 if(changed&&!process.argv.includes("--dry-run"))fs.writeFileSync(full,source);
 process.stdout.write(spec.path+" changes "+changed+"\n");
}
