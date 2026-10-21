# Work packet: NEW / MISSING items from docs/audit/gap2/lane-7/u006-college-admin-project-templates.md

3 findings. These findings have no vNext file yet: create the files, modules or routes needed, inside the feature area of this lane.
Audit documents with full context: docs/audit/gap2/lane-7/u006-college-admin-project-templates.md

## G2-7-006-002  [P1] GAP  facet F01  effort M
- Legacy: LFE/pages/college-admin/projects/templates/index.js:44-64: search stored in shareable `?search=` with shallow URL replace.
- vNext now: V/app/(authenticated)/college/projects/templates/page.tsx:40-46,78-84: accepts `?q=` instead; old `?search=` ignored.
- Fix: Support legacy `search` URL alias and canonical rewrite to q.

## G2-7-006-023  [P1] GAP  facet F07  effort M
- Legacy: LBE/controller/AdminProjectTemplateController.java:70-92: errors 401/400/403/500 differentiated.
- vNext now: V/app/(authenticated)/college/projects/templates/page.tsx:27-37: catches all service errors into one unavailable.
- Fix: Separate authorization/no-scope from transient DB error.

## G2-7-006-022  [P2] GAP  facet F07  effort S
- Legacy: LFE/pages/college-admin/projects/templates/index.js:169-182: `Templates could not be loaded`, server error and Retry button, no table on failure.
- vNext now: V/app/(authenticated)/college/projects/templates/page.tsx:27-37: `Project templates unavailable`, generic copy and Retry loading templates.
- Fix: Restore literal error title and safe server message.
