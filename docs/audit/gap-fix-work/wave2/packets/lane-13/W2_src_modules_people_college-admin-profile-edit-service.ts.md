# Work packet (wave 2): edit src/modules/people/college-admin-profile-edit-service.ts

3 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-1/college-admin-profile.md

## G2-1-026-041  [P2] GAP  facet F10  effort S
- Legacy: docs/legacy-source/frontend/src/components/profile/about.js:201-228: Promise.allSettled parallel section reads, retains successful sections.
- vNext now: src/modules/people/college-admin-profile-edit-service.ts:53-65: one JSON document parse; corrupt data drops to empty.
- Fix: Parse independently and preserve valid sections.

## G2-1-026-052  [P2] GAP  facet F13  effort S
- Legacy: docs/legacy-source/frontend/src/components/profile/about.js:905-913: partial-load failure banner lists sections with Retry sections.
- vNext now: src/modules/people/college-admin-profile-edit-service.ts:53-65: blob fallback makes missing parts appear genuinely empty.
- Fix: Distinguish missing data from unavailable data.

## G2-1-026-073  [P2] GAP  facet F22  effort L
- Legacy: docs/legacy-source/frontend/src/components/profile/about.js:201-258: disparate faculty section tables including personal, contacts, address and social.
- vNext now: src/modules/people/college-admin-profile-edit-service.ts:58-65,75-89: facultyProfiles.profileDocument.collegeAdmin JSON and users.displayName.
- Fix: Map each legacy section/column into explicit JSON keys and prove disposition.
