# chat-17 Projects + Placements PostgreSQL integration ledger

**Source:** `tests/integration/support/projects-placements-pg-harness.ts`  
**Runner:** `npm run test:db:projects-harness` (requires disposable, fully migrated `TEST_DATABASE_URL`).

All entries below are **authored test cases, not executed sign-off**. Test fixtures use real `pg.PoolClient`, independent tenant/organization identity rows, transactions, SAVEPOINTs and guaranteed ROLLBACK. A missing database or failed test must be recorded, not waived. Core Projects children use **restrictive** foreign keys: "cascade" is tested as **no unintended destructive cascade**.

| PostgreSQL table group | Canonical tables | Representative tests | DB contract |
|---|---|---|---|
| Tenant hierarchy | organizations; colleges | PROJ-HARNESS-01, -16 | separate organizations, safe tenant predicates |
| Users and roles | users; college_memberships; membership_roles; system_roles | PROJ-HARNESS-01, WEAK-identity-01 | active role fixture, deactivated context denial |
| Templates and versions | project_templates; project_template_versions | PROJ-HARNESS-02; ROLLBACK-03 | unique case-insensitive slug, positive version, child FK RESTRICT |
| Template grants | project_template_college_assignments | PROJ-HARNESS-03 | active assignment unique per college |
| Projects/workspaces | project_instances | PROJ-HARNESS-04, -15, -16 | tenant slug uniqueness, finite states, parent deletion RESTRICT |
| Releases | project_releases | PROJ-HARNESS-05 | unique key and nonnegative sequence |
| Sprints | project_sprints | PROJ-HARNESS-06 | one ACTIVE per project, date check |
| Tasks | project_tasks | PROJ-HARNESS-07, -18 | order/status and savepoint recovery |
| Resources | project_resources | PROJ-HARNESS-08 | per-project resource key and status |
| Roster | project_members | PROJ-HARNESS-09 | unique active member, primary mentor only |
| Task submissions | project_task_submissions | PROJ-HARNESS-10 | versions, active unique, review state fields |
| Final submission | project_submissions | PROJ-HARNESS-11 | open submission unique, state atom |
| Delivery history | project_delivery_events | PROJ-HARNESS-20 | reason constraint and composite project/submission FK |
| Review | project_submission_reviews | PROJ-HARNESS-12 | feedback for changes requested |
| Grading | project_evaluations; project_evaluation_items | PROJ-HARNESS-13 | score bounds, rubric sequence |
| Meetings | project_meetings | PROJ-HARNESS-14 | chronological windows and required scheduling actor |
| Placement companies/relationship | placement_companies; placement_company_relationships | PROJ-HARNESS-17, PLACEMENTS-01 | tenant relationship uniqueness |
| Placement seasons | placement_seasons | PLACEMENTS-01, -02, -02B | one ACTIVE college season; second drive reuses it |
| Drives/jobs | placement_jobs | PROJ-HARNESS-17, PLACEMENTS-01, -07 | season FK, lifecycle, deletion RESTRICT |
| Drive rounds | placement_job_rounds | PROJ-HARNESS-17, PLACEMENTS-01, -04 | unique active sequence and schedule shape |
| Applications | placement_applications | PLACEMENTS-01, -03, -08 | unique membership per job; fixture rejects foreign college |
| Screening | placement_application_screenings | PLACEMENTS-03 | decision metadata required |
| Round outcomes | placement_round_results | PLACEMENTS-04 | HOLD rank and unique active outcome |
| Offers | placement_offers | PLACEMENTS-05 | active uniqueness, valid acceptance and expiry |
| Joining | placement_joining_outcomes | PLACEMENTS-06 | JOINED requires actor+date |
| Transaction lifecycle | all groups | PROJ-HARNESS-18, -19, -21; ROLLBACK-01, -02 | SAVEPOINT handles 235xx, success and failure ROLLBACK, distinct PostgreSQL sessions |
| Tenant isolation | all groups | PROJ-HARNESS-16, PLACEMENTS-08 | explicit tenant filtering and no cross-college fixture actor |

**Test totals:** 21 project-group witnesses + 9 placement witnesses (the eight numbered cases plus PLACEMENTS-02B) + 3 rollback witnesses = **33 integration cases**, plus 7 unit guard groups. The shared UI-kit has 38 registered TSX files with 21 behavioral groups, 38 source hygiene entries and eight scroll/motion test groups.

**Known boundaries:** These tests verify database schema constraints and fixture correctness, NOT authorization of external routes, storage signatures, workflow idempotence, notification dedupe or service-level IDOR. The frozen/registered Drizzle journal differs from staged DB073/074/075 migrations, which require separate opt-in acceptance. Schema presence checks require 32 canonical tables. Nothing here waives other lanes' release-blocking project defects.
