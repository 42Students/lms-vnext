# Work packet: edit src/modules/academics/section-service.ts

7 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-5/u014-class-search-controller.md, docs/audit/gap2/lane-2/class-controller.md, docs/audit/gap2/lane-8/l14-u031-academic-structure-cross-cutting.md

## G2-5-014-002  [P1] GAP  facet F01  effort M
- Legacy: Legacy /search allows scoped program filter and global superadmin no-program discovery (`docs/legacy-source/backend/src/main/java/com/_42students/lms/search/classes/ClassSearchController.java:71-108`)
- vNext now: vNext listSections requires cohortId (cannot search all programs directly) (`src/modules/academics/section-service.ts:154-163`)
- Fix: Add scoped cross-cohort search picker with explicit program filter

## G2-5-014-028  [P1] GAP  facet F07  effort M
- Legacy: Legacy absent tenant for non-global raises Tenant scope not available (`docs/legacy-source/backend/src/main/java/com/_42students/lms/search/classes/ClassSearchController.java:51-63`)
- vNext now: vNext listSections uses cohort to infer college scope (`src/modules/academics/section-service.ts:159-168`)
- Fix: Fail closed on missing selected tenant; present exact recovery without leaking names

## G2-5-014-049  [P1] GAP  facet F11  effort M
- Legacy: Legacy refresh restricted to superadmin requireSuperAdmin (`docs/legacy-source/backend/src/main/java/com/_42students/lms/search/classes/ClassSearchController.java:231-239`)
- vNext now: vNext section create restricted academics.manage, not a refresh role (`src/modules/academics/section-service.ts:214-227`)
- Fix: Never use section management permission as replacement for cache refresh privilege

## G2-2-031-035  [P2] GAP  facet F07  effort M
- Legacy: ClassController.java:243-251 delete rejects students/schedules with two separate precise messages.
- vNext now: college-section-lifecycle-action.tsx:48-55 handles archive/restore; section-service.ts:352-397 archive status.
- Fix: Map archive dependency blockers to actionable messages; do not conflate schedule with roster.

## G2-5-014-027  [P2] GAP  facet F07  effort S
- Legacy: Legacy absent principal raises Authentication required (`docs/legacy-source/backend/src/main/java/com/_42students/lms/search/classes/ClassSearchController.java:36-42`)
- vNext now: vNext getCurrentRequestContext/requirePermission emits own code (`src/modules/academics/section-service.ts:154-168`)
- Fix: Map public error codes to authentication-required wording while keeping structured status

## G2-14-031-020  [P2] GAP  facet F07  effort S
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/SemesterController.java:134-140 duplicate semester number text
- vNext now: src/modules/academics/section-service.ts:91-96 unique section error uses separate conflict
- Fix: Map semester-number conflict to old precise message

## G2-14-031-022  [P2] GAP  facet F07  effort S
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/ClassController.java:94-101 'Batch not found' and wrong program reject
- vNext now: src/modules/academics/section-service.ts:100-150 period/cohort validations with different codes
- Fix: Explain and message batch/period mismatch precisely
