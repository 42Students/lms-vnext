# Work packet (wave 2): NEW / MISSING items from docs/audit/gap2/lane-2/admin-project-controller.md

3 findings. No vNext file yet: create the needed files, modules or routes inside the feature area of this lane.
Audit documents with full context: docs/audit/gap2/lane-2/admin-project-controller.md

## G2-2-020-018  [P2] MISSING  facet F05  effort M
- Legacy: AdminProjectController.java:339-364 separate deleted page with page0,size25
- vNext now: src/app/(authenticated)/admin/projects/workspaces/deleted/page.tsx:NOT_FOUND
- Fix: Add deleted-only paged listing.

## G2-2-020-049  [P2] MISSING  facet F13  effort M
- Legacy: Legacy workspaces/deleted.js:168-180 distinct unavailable from empty/Retry
- vNext now: src/app/(authenticated)/admin/projects/workspaces/deleted/page.tsx:NOT_FOUND
- Fix: Add real deleted-list loading/error/empty/retry states.

## G2-2-020-060  [P2] MISSING  facet F18  effort M
- Legacy: Legacy workspaces/deleted.js:119-123 Restore this workspace? explicit warning
- vNext now: src/app/(authenticated)/admin/projects/workspaces/deleted/page.tsx:NOT_FOUND
- Fix: Restore literal confirm text and data-loss description.
