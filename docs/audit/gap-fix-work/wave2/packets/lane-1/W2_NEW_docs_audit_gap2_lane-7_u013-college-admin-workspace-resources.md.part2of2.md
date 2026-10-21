# Work packet (wave 2): NEW / MISSING items from docs/audit/gap2/lane-7/u013-college-admin-workspace-resources.md (part 2 of 2)

1 findings. No vNext file yet: create the needed files, modules or routes inside the feature area of this lane.
Audit documents with full context: docs/audit/gap2/lane-7/u013-college-admin-workspace-resources.md

## G2-7-013-078  [P2] GAP  facet F22  effort M
- Legacy: LFE/components/admin/projects/RepeatingItemEditor.jsx:250-276: max 500 JSON resources, required title
- vNext now: V/db/schema/projects.ts:603-635, validation.ts:696-727: SQL unique sequence/key and max200 title, HTTP URL rules
- Fix: Document max lengths, size limits and collision handling
