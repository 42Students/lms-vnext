# Work packet: edit src/modules/projects/admin-reassign-mentor-query-model.ts

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-7/u021-college-admin-mentor-reassignment.md

## G2-7-021-003  [P1] GAP  facet F01  effort L
- Legacy: reassign-mentor.js:89-100 ?fromMentorId numeric bookmark, prefilters rows
- vNext now: admin-reassign-mentor-query-model.ts:9-30 only UUID or UNASSIGNED, strict query
- Fix: Map old numeric IDs to UUID and preserve bookmarked mentor filters
