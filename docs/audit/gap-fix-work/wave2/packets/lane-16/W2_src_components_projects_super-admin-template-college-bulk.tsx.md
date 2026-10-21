# Work packet (wave 2): edit src/components/projects/super-admin-template-college-bulk.tsx

4 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-7/u033-superadmin-template-colleges.md

## G2-7-033-011  [P2] GAP  facet F03  effort S
- Legacy: colleges.js:278-282 Assign selected / Remove selected buttons with selected count
- vNext now: super-admin-template-college-bulk.tsx:78-155 selected count and same buttons but separate disclosure
- Fix: Match location and disabled styling without secondary list duplication

## G2-7-033-034  [P2] GAP  facet F09  effort S
- Legacy: colleges.js:280-282 bulk destructive Popconfirm Remove this template from N selected colleges?
- vNext now: super-admin-template-college-bulk.tsx:145-156 ConfirmDialog full modal with same title
- Fix: Match popconfirm geometry, button labels, danger treatment

## G2-7-033-053  [P2] GAP  facet F17  effort M
- Legacy: colleges.js:286-290 AntD Table rowSelection checkboxes and row label associations
- vNext now: super-admin-template-college-bulk.tsx:98-115 separate checkbox list with labels
- Fix: Preserve header select-all, selection count and no duplicate row interactive ambiguity

## G2-7-033-051  [P3] GAP  facet F16  effort S
- Legacy: colleges.js:273-283 Space wrap bulk actions and count
- vNext now: super-admin-template-college-bulk.tsx:78-90 stacked mobile controls
- Fix: Verify exact wrap/breakpoints and button dimensions
