# Work packet (wave 2): edit src/modules/projects/mentor-project-order-model.ts

2 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-7/u028-mentor-projects-list.md

## G2-7-028-031  [P2] GAP  facet F05  effort M
- Legacy: ProjectsContent.jsx:134-151 archived last, Team N numeric within same series, otherwise backend order
- vNext now: mentor-project-order-model.ts:2-8 global numeric collator and recency ordering; SQL paged service :74-79 uses naturalTitle
- Fix: Restrict Team N numeric sort to same Team series and preserve backend recency elsewhere

## G2-7-028-061  [P2] GAP  facet F12  effort S
- Legacy: ProjectsContent.jsx:130-151 stable sort archive last then numbered team else input order
- vNext now: mentor-project-order-model.ts:4-8 archive last, recency then global collator
- Fix: Keep numeric sort only among Team prefix peers
