# Work packet: edit src/app/(authenticated)/tracker/mine/[publicId]/page.tsx

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-16/u003-tracker-issue-detail.md

## G2-16-003-043  [P1] GAP  facet F11  effort L
- Legacy: `[issueId].js:174-187`: unprivileged viewer sees status read-only and all core details.
- vNext now: `issues/[publicId]/page.tsx:45-46`: non-Super Admin redirected; alternate `tracker/mine/[publicId]/page.tsx:31-43` has only minimal content.
- Fix: Expose owner-scoped, privacy-safe detail showing core fields and evidence, not global reports.
