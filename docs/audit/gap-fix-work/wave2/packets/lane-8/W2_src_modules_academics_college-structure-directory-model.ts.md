# Work packet (wave 2): edit src/modules/academics/college-structure-directory-model.ts

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-5/u003-college-admin-classes.md

## G2-5-003-020  [P2] GAP  facet F05 Tables/lists  effort S
- Legacy: No status default filter: all real sections, excluding GROUP_BACKED electives. (docs/legacy-source/frontend/src/pages/superadmin/sections/Classes.js:219-228)
- vNext now: Default status ACTIVE, archived entries hidden unless manually changed. (src/modules/academics/college-structure-directory-service.ts:107-109; src/modules/academics/college-structure-directory-model.ts:12-18)
- Fix: Clarify archived visibility and default all real sections for parity.
