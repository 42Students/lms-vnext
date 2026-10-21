# Work packet: edit src/app/(authenticated)/college/projects/page.tsx

7 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-7/u019-college-admin-project-workspaces-list.md

## G2-7-019-005  [P1] GAP  facet F01  effort S
- Legacy: workspaces/index.js:348-350 three direct head actions Create workspace, Bulk reassign mentor, Deleted workspaces
- vNext now: college/projects/page.tsx:112-125 Create directly, reassign in collapsed tools; Deleted route missing
- Fix: Restore three visible head actions and dedicated Deleted workspaces link.

## G2-7-019-049  [P1] MISSING  facet F10  effort S
- Legacy: workspaces/index.js:348-350 bulk reassignment and deleted list navigation
- vNext now: college/projects/page.tsx:123-125 bulk route nested under details; no Deleted link
- Fix: Expose both routes directly in page head.

## G2-7-019-056  [P1] GAP  facet F12  effort S
- Legacy: workspaces/index.js:148-154 jumps to last valid page if archiving empties selected page
- vNext now: college-projects-query-model.ts:52-73 helper exists, college/projects/page.tsx:88-103,149-155 does not invoke
- Fix: Call canonicalCollegeProjectsPageHref when query.page exceeds result.totalPages.

## G2-7-019-096  [P1] MISSING  facet F23  effort S
- Legacy: workspaces/index.js:348-355 `Deleted workspaces` direct action
- vNext now: college/projects/page.tsx:118-135 Archived tab, deleted action absent
- Fix: Restore distinct deleted list; do not conflate ARCHIVED with soft-deleted.

## G2-7-019-036  [P2] GAP  facet F07  effort S
- Legacy: workspaces/index.js:157-164 fallback `Failed to load project workspaces.`
- vNext now: college/projects/page.tsx:71-85 generic `Project workspaces unavailable` and fixed copy
- Fix: Display sanitized API error details with exact fallback.

## G2-7-019-037  [P2] GAP  facet F07  effort S
- Legacy: workspaces/index.js:358-360 `Workspaces could not be loaded` with Retry
- vNext now: college/projects/page.tsx:80-85 `Project workspaces unavailable`, `Retry loading workspaces`
- Fix: Use exact legacy error heading and Retry action.

## G2-7-019-039  [P2] GAP  facet F07  effort S
- Legacy: AdminProjectController.java:315-333 BAD_REQUEST, UNAUTHORIZED, FORBIDDEN, INTERNAL_SERVER_ERROR
- vNext now: college/projects/page.tsx:34-53 missing-college and invalid-filter UI; 71-85 generic server errors
- Fix: Distinguish invalid college and feature disabled from transient load failure.
