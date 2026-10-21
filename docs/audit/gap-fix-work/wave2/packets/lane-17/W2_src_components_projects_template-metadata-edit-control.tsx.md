# Work packet (wave 2): edit src/components/projects/template-metadata-edit-control.tsx

6 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-7/u035-superadmin-template-overview.md

## G2-7-035-014  [P2] GAP  facet F03  effort S
- Legacy: overview.js:719-724 Save overview primary Button
- vNext now: template-metadata-edit-control.tsx:55-56 Save new version inside Dialog
- Fix: Match Save overview affordance and target fields

## G2-7-035-016  [P2] GAP  facet F04  effort M
- Legacy: overview.js:111-116 summary derived from first goal line or title, capped160
- vNext now: template-metadata-edit-control.tsx:17-29 editable independent summary max2000
- Fix: Derive summary from goal for legacy-compatible Overview save or decide migration

## G2-7-035-050  [P2] GAP  facet F12  effort M
- Legacy: overview.js:111-116 summary from goal first line
- vNext now: template-metadata-edit-control.tsx:18 title/summary independent
- Fix: Restore derivation or document distinct summary workflow

## G2-7-035-063  [P2] GAP  facet F17  effort M
- Legacy: overview.js:597-724 Form.Item labels and field errors associated
- vNext now: template-metadata-edit-control.tsx:42-56 fields labelled, no slug/overview fields
- Fix: Restore semantic labels/error association for all fields

## G2-7-035-066  [P2] GAP  facet F18  effort S
- Legacy: overview.js:720 Save overview
- vNext now: template-metadata-edit-control.tsx:56 Save new version
- Fix: Match visible save label in full Overview editor

## G2-7-035-069  [P2] GAP  facet F19  effort S
- Legacy: overview.js:303-307 Save updates from returned DTO only after reload
- vNext now: template-metadata-edit-control.tsx:29-31 router.refresh whole route
- Fix: Optimize refresh and preserve local scroll/editor state
