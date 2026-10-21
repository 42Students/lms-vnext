# Work packet: edit src/components/projects/project-admin-reassign-mentor-page.tsx

3 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-7/u021-college-admin-mentor-reassignment.md

## G2-7-021-081  [P1] GAP  facet F19  effort M
- Legacy: reassign-mentor.js:51-82 searches faculty by remote query, no hard 100 cap
- vNext now: project-admin-reassign-mentor-page.tsx:51-55 mentor candidates limit100 with separate Search
- Fix: Allow all eligible mentors through reliable search/pagination

## G2-7-021-035  [P2] GAP  facet F07  effort S
- Legacy: reassign-mentor.js:112-116 Failed to load project workspaces fallback
- vNext now: project-admin-reassign-mentor-page.tsx:56-65 Mentor reassignment unavailable with retry
- Fix: Distinguish workspace load failure and exact fallback

## G2-7-021-036  [P2] GAP  facet F07  effort M
- Legacy: reassign-mentor.js:434 Mentor options could not be loaded Retry mentors alert
- vNext now: project-admin-reassign-mentor-page.tsx:56-65 full-page unavailable on mentor fetch error
- Fix: Show field-level retry mentors affordance
