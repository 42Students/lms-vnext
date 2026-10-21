# Work packet: edit src/modules/projects/college-projects-query-model.ts

2 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-7/u019-college-admin-project-workspaces-list.md

## G2-7-019-056  [P1] GAP  facet F12  effort S
- Legacy: workspaces/index.js:148-154 jumps to last valid page if archiving empties selected page
- vNext now: college-projects-query-model.ts:52-73 helper exists, college/projects/page.tsx:88-103,149-155 does not invoke
- Fix: Call canonicalCollegeProjectsPageHref when query.page exceeds result.totalPages.

## G2-7-019-083  [P1] GAP  facet F20  effort S
- Legacy: workspaces/index.js:148-154 auto-clamp empty page after archiving
- vNext now: college-projects-query-model.ts:52-73 clamp helper not called in page.tsx:88-103
- Fix: Wire helper and redirect to last in-range page when total shrinks.
