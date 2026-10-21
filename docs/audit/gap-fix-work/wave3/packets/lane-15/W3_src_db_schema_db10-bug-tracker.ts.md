# Work packet (wave 3): edit src/db/schema/db10-bug-tracker.ts

2 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-16/u002-tracker-report.md

## G2-16-002-053  [P1] MISSING  facet F12  effort L
- Legacy: `bugTrackerAttachmentUtils.js:1-20`; `BugTrackerAttachmentService.java:22-25`: max three PNG/JPEG/WebP up to 8MiB each.
- vNext now: `db10-bug-tracker.ts:138-154`: columns constrain MIME/8MiB, UI routes absent.
- Fix: Wire full attach workflow including 3-file cap, MIME and validation, signed storage upload.

## G2-16-002-062  [P1] MISSING  facet F14  effort L
- Legacy: `BugTrackerAttachmentService.java:63-72,75-136`: R2 signed 15-minute PUT, confirm checks metadata/mime/size/key, idempotent confirm.
- vNext now: `db10-bug-tracker.ts:138-154`: schema exists, no intake API to presign/confirm.
- Fix: Implement tenant/private signed upload and confirmed storage verification, with idempotent retry.
