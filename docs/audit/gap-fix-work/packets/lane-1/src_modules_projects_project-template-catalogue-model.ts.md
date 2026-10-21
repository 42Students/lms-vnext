# Work packet: edit src/modules/projects/project-template-catalogue-model.ts

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-7/u006-college-admin-project-templates.md

## G2-7-006-038  [P1] GAP  facet F14  effort S
- Legacy: LFE/pages/college-admin/projects/templates/index.js:201-221: `project-templates.csv` with Title, Version, Summary headers.
- vNext now: V/components/projects/project-template-catalogue-export.tsx:8-20; modules/projects/project-template-catalogue-model.ts:30-41: same filename, 8 headers Template/Version/Sections/Overview/Releases/Sprints/Tasks/Resources; summary absent.
- Fix: Restore exact three headers and include title/version/summary; preserve filtered dataset.
