#!/usr/bin/env node
"use strict";
// chat-18: exact-message feedback to shared Alert on four HR messaging controls.
// Usage: node scripts/codemods/chat18-secondary-feedback.cjs [--dry-run]
const fs=require("node:fs"),path=require("node:path");
const entries={
 "src/components/hr/recruiter-conversation-read-control.tsx":[
  '{notice?<p role="status" className="text-sm text-body">{notice}</p>:null}',
  '{notice?<Alert tone={notice==="Read status updated."?"success":"error"}>{notice}</Alert>:null}'
 ],
 "src/components/hr/hr-notification-read-button.tsx":[
  '{message?<span role="status" className="text-xs text-body">{message}</span>:null}',
  '{message?<Alert tone="error">{message}</Alert>:null}'
 ],
 "src/components/hr/recruiter-decision-read-button.tsx":[
  '{error?<p role="alert" className="text-sm text-error">{error}</p>:null}',
  '{error?<Alert tone="error">{error}</Alert>:null}'
 ]
};
for(const [name,[before,after]] of Object.entries(entries)){
 const file=path.join(__dirname,"../..",name);
 let content=fs.readFileSync(file,"utf8");
 if(content.includes(before)){
  content='import { Alert } from "@/components/ui/alert";\n'+content.replace(before,after);
  if(!process.argv.includes("--dry-run"))fs.writeFileSync(file,content);
  console.log(name);
 }
}
// The reply-form status is a two-line conditional with two dynamic classes;
// migrate that judgement case manually to avoid swallowing arbitrary JSX.
