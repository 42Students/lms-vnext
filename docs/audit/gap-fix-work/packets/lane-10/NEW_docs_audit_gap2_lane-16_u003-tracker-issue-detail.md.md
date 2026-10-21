# Work packet: NEW / MISSING items from docs/audit/gap2/lane-16/u003-tracker-issue-detail.md

2 findings. These findings have no vNext file yet: create the files, modules or routes needed, inside the feature area of this lane.
Audit documents with full context: docs/audit/gap2/lane-16/u003-tracker-issue-detail.md

## G2-16-003-039  [P1] GAP  facet F10  effort L
- Legacy: `BugTrackerService.js:68-85`; `PublicBugTrackerController.java:49-82`: GET public issue, attachments, activity in separate calls.
- vNext now: `admin-service.ts:209-288`: single admin DB read for report plus paged activity/attachment metadata.
- Fix: Return equivalent safe detail and signed previews for reporter scope with independently retryable attachment fetch.

## G2-16-003-056  [P1] GAP  facet F14  effort L
- Legacy: `[issueId].js:203-224`: all screenshot previews loaded by URLs returned with attachment API.
- vNext now: `admin-service.ts:263-274`: deliberately omits storage key and unsigned URL; metadata only.
- Fix: Return short-lived signed GET URLs only with authorization, not public object keys.
