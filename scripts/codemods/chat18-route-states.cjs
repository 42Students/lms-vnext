#!/usr/bin/env node
"use strict";
// chat-18: shared loading/error route standardisation.
// Regenerate the exact scoped files from the shared-state manifest, no global edits.
const fs = require("node:fs");
const path = require("node:path");
const loading = {
  "src/app/(authenticated)/hr/calendar/loading.tsx": [
    "Loading recruiter calendar…",
    "directory"
  ],
  "src/app/(authenticated)/hr/company/reports/loading.tsx": [
    "Loading recruiter company reports…",
    "card"
  ],
  "src/app/(authenticated)/hr/conversations/loading.tsx": [
    "Loading conversations…",
    "directory"
  ],
  "src/app/(authenticated)/hr/conversations/[threadId]/loading.tsx": [
    "Loading conversation history…",
    "directory"
  ],
  "src/app/(authenticated)/tracker/audit-findings/loading.tsx": [
    "Loading audit findings…",
    "directory"
  ]
};
const errors = {
  "src/app/(authenticated)/hr/activity/error.tsx": [
    "Hiring activity",
    "Hiring activity could not load",
    "The authorized employer history is unavailable. A failed read does not mean no events occurred. No applicant information has been loaded.",
    "Retry hiring activity"
  ],
  "src/app/(authenticated)/hr/messages/error.tsx": [
    "Messages",
    "Messages are temporarily unavailable",
    "We could not retrieve your employer-college conversations. This does not mean your messages are missing or have been marked read.",
    "Retry messages"
  ],
  "src/app/(authenticated)/hr/company/error.tsx": [
    "Company & Team",
    "Company & Team could not load",
    "Company and team details are unavailable. Retry to load the authorized details.",
    "Try again"
  ],
  "src/app/(authenticated)/hr/company/reports/error.tsx": [
    "Company Reports",
    "Couldn't load Company Reports",
    "Hiring report records could not be retrieved for your selected college. This error does not establish that there are zero applications, drives or offers.",
    "Retry"
  ],
  "src/app/(authenticated)/hr/calendar/error.tsx": [
    "Calendar",
    "Couldn't load your recruiter calendar",
    "Your authorized hiring events could not be retrieved. This is a loading error, not evidence that your calendar is empty.",
    "Retry"
  ],
  "src/app/(authenticated)/hr/conversations/error.tsx": [
    "Messages",
    "Conversations unavailable",
    "Your employer messages could not be loaded.",
    "Retry"
  ],
  "src/app/(authenticated)/hr/conversations/[threadId]/error.tsx": [
    "Messages",
    "Unable to load conversation",
    "Message history could not be read. This does not mean there are no messages.",
    "Retry"
  ]
};
const root = path.resolve(__dirname,"../..");
const dry = process.argv.includes("--dry-run");
for (const [relative,[label,shape]] of Object.entries(loading)) {
 const content = 'import { GracefulPageLoading } from "@/components/ui/graceful-page-loading";\n\nexport default function Loading() {\n  return <GracefulPageLoading label='+JSON.stringify(label)+' shape='+JSON.stringify(shape)+' />;\n}\n';
 if (!dry) fs.writeFileSync(path.join(root,relative),content);
 console.log((dry?"Would update ":"Updated ")+relative);
}
for (const [relative,[title,problem,description,action]] of Object.entries(errors)) {
 const content = '"use client";\n\nimport { Button } from "@/components/ui/button";\nimport { ErrorState } from "@/components/ui/error-state";\nimport { PageHeader } from "@/components/ui/page-header";\n\nexport default function RouteError({ reset }: {\n  error: Error & { digest?: string };\n  reset: () => void;\n}) {\n  return <div className="min-w-0 space-y-4">\n    <PageHeader title='+JSON.stringify(title)+' />\n    <ErrorState\n      title='+JSON.stringify(problem)+'\n      description='+JSON.stringify(description)+'\n      action={<Button type="button" variant="secondary" onClick={reset}>'+action+'</Button>}\n    />\n  </div>;\n}\n';
 if (!dry) fs.writeFileSync(path.join(root,relative),content);
 console.log((dry?"Would update ":"Updated ")+relative);
}
