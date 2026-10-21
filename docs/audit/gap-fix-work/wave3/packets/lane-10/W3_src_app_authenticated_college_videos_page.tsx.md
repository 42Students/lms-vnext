# Work packet (wave 3): edit src/app/(authenticated)/college/videos/page.tsx

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-18/college-admin-lesson-content.md

## G2-18-007-011  [P1] MISSING  facet F03  effort L
- Legacy: Legacy Video content types `Video (Upload)` and `YouTube Video` selectable (`LessonContent.js:96-107,1283-1300`).
- vNext now: New Videos authoring only `kind=YOUTUBE` (`college/videos/page.tsx:32-37`; `college-content-authoring-control.tsx:13,53`).
- Fix: Add VIDEO Upload content-type option and supported auth upload flow.
