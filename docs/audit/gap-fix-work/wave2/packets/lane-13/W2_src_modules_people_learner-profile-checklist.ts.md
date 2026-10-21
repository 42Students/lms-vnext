# Work packet (wave 2): edit src/modules/people/learner-profile-checklist.ts

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-1/learner-profile-controller.md

## G2-1-004-004  [P2] GAP  facet F02  effort M
- Legacy: `ProfileSectionsPanel.js:31-51` includes 20 learner sections with header, identity, contact, education, career, video and metadata.
- vNext now: `src/modules/people/learner-profile-checklist.ts:6-11` has 16 completion sections and `learn/profile/page.tsx:56-165` adds verification and coding links.
- Fix: Create a one-to-one section anatomy and order map, distinguishing intentional new verification blocks.
