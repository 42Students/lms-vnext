# Work packet: edit src/components/projects/class-team-workspace-creator.tsx (part 1 of 2)

20 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-7/u020-college-admin-workspace-create.md, docs/audit/gap2/lane-8/super-admin-project-workspace-new.md

## G2-7-020-023  [P1] GAP  facet F04  effort L
- Legacy: new.js:322-345 created title/ID and failure strings in outcome report
- vNext now: class-team-workspace-creator.tsx:266-284 individualResults with created/covered but no failure strings
- Fix: Preserve specific per-student failures for recovery

## G2-7-020-027  [P1] GAP  facet F05  effort L
- Legacy: new.js:186-246 400ms debounced server-side search for four selects
- vNext now: project-create-control.tsx:78-150 finite mentor100 and class roster; class-team-workspace-creator.tsx:165-175 static
- Fix: Add paged search for mentors, templates, classes and learners

## G2-7-020-034  [P1] GAP  facet F06  effort M
- Legacy: new.js:533-555 class only cohort/teams and required there
- vNext now: project-create-control.tsx:324-330 optional class in single; class-team-workspace-creator.tsx:165-169 required class
- Fix: Hide class field in single mode except deliberate add-class shortcut

## G2-7-020-045  [P1] GAP  facet F07  effort M
- Legacy: new.js:287-288 invalid cohort preflight yields Nothing was created error
- vNext now: class-team-workspace-creator.tsx:109-119 failed fetch silently clears preflight
- Fix: Render preflight load and invalid response errors explicitly

## G2-7-020-049  [P1] GAP  facet F08  effort M
- Legacy: new.js:335-344 partial creation and zero-workspace warning toasts
- vNext now: class-team-workspace-creator.tsx:269-273 inline status only
- Fix: Show warning with failure count and repeat-safety advice

## G2-7-020-056  [P1] GAP  facet F10  effort L
- Legacy: AdminService.js:347-351 POST /api/v1/admin/projects/bulk/preflight then /bulk
- vNext now: class-team-workspace-creator.tsx:109-119 GET cohort-preflight, :124-149 POST class-team-workspaces
- Fix: Match preflight freshness and detailed outcome semantics

## G2-7-020-066  [P1] GAP  facet F12  effort M
- Legacy: new.js:283-316 refresh preflight every submit before confirmation
- vNext now: class-team-workspace-creator.tsx:109-119 preflight in effect on roster/params change
- Fix: Revalidate before each confirmation and show fresh count

## G2-7-020-092  [P1] GAP  facet F19  effort L
- Legacy: new.js:194-246 remote lookups each 400ms debounced
- vNext now: project-create-control.tsx:82-101 mentor-candidates hard limit100; class-team-workspace-creator.tsx:61-69 loads all classes
- Fix: Add paged remote picker queries and debounce to avoid inaccessible mentors

## G2-7-020-094  [P1] GAP  facet F19  effort M
- Legacy: new.js:46-49,76-89 report in localStorage per admin/college, expires in seven days
- vNext now: class-team-workspace-creator.tsx:55-57 only in-memory outcome
- Fix: Persist per-admin report for seven days after reload

## G2-7-020-097  [P1] GAP  facet F20  effort L
- Legacy: new.js:318-346 distinguishes partial success, zero and already covered
- vNext now: class-team-workspace-creator.tsx:142-156 latch resets for INDIVIDUAL mode
- Fix: Prevent duplicate cohort writes after partial response or retry

## G2-8-028-006  [P1] GAP  facet F02  effort M
- Legacy: Old initial default mode single and Status ACTIVE docs/legacy-source/frontend/src/pages/superadmin/projects/workspaces/new.js:36-50,205-213.
- vNext now: New default TEAMS mode and new created projects default PLANNED, no status in class-team creator src/components/projects/class-team-workspace-creator.tsx:40-46,159-203.
- Fix: Restore original default single-workspace flow with ACTIVE/mentor requirement or owner-approved default policy.

## G2-8-028-012  [P1] GAP  facet F04  effort M
- Legacy: Old single-workspace form stores title, summary, status, templateId, mentorId, learnerIds docs/legacy-source/frontend/src/pages/superadmin/projects/workspaces/new.js:298-307,404-527.
- vNext now: New class-team stores baseTitle,baseSlug,teams,rosterRevision; class-mode no summary/mentor/status/individual selection src/components/projects/class-team-workspace-creator.tsx:33-57,134-139,164-204.
- Fix: Implement equivalent single workspace branch with full data fields rather than silently converting to class team.

## G2-8-028-015  [P1] GAP  facet F04  effort M
- Legacy: Old outcome has Created/Failed, workspace ID, details, completedAt timestamp docs/legacy-source/frontend/src/pages/superadmin/projects/workspaces/new.js:267-276,567-585.
- vNext now: New outcome individual results CREATED/ALREADY_COVERED, no Failed row or completedAt timestamp src/components/projects/class-team-workspace-creator.tsx:266-285.
- Fix: Restore failure explanation per learner and completion timestamp for bulk auditing.

## G2-8-028-021  [P1] MISSING  facet F06  effort M
- Legacy: Old Summary optional multiline rows3 placeholder Short live workspace summary docs/legacy-source/frontend/src/pages/superadmin/projects/workspaces/new.js:418-420.
- vNext now: New class/team creator omits Summary completely src/components/projects/class-team-workspace-creator.tsx:164-204.
- Fix: Add summary input and pass to all created workspace records.

## G2-8-028-023  [P1] MISSING  facet F06  effort M
- Legacy: Old Mentor optional except ACTIVE required, helper Every workspace needs a mentor. docs/legacy-source/frontend/src/pages/superadmin/projects/workspaces/new.js:49-50,467-483.
- vNext now: New class/team creator has no mentor input; service validates optional primary mentor if payload provided src/components/projects/class-team-workspace-creator.tsx:164-204; src/modules/projects/class-team-workspace-service.ts:91-98.
- Fix: Restore mentor selector/ACTIVE requirement, pass selected mentor into bulk write.

## G2-8-028-024  [P1] GAP  facet F06  effort M
- Legacy: Old Class selector only cohort/teams, required placeholder Required in cohort mode — search by class name docs/legacy-source/frontend/src/pages/superadmin/projects/workspaces/new.js:485-507.
- vNext now: New always-required Class for every mode, placeholder Select a class src/components/projects/class-team-workspace-creator.tsx:164-170.
- Fix: Add no-class single workspace mode, maintain required class only for cohort/team modes.

## G2-8-028-025  [P1] GAP  facet F06  effort M
- Legacy: Old Students multiselect max500, search by student name and Or add a whole class docs/legacy-source/frontend/src/pages/superadmin/projects/workspaces/new.js:511-545.
- vNext now: New group roster auto derives all class members; no manual arbitrary student subset in creator src/components/projects/class-team-workspace-creator.tsx:79-100,233-261.
- Fix: Support selected learners/whole class option for single workspaces with 500 max.

## G2-8-028-028  [P1] GAP  facet F06  effort M
- Legacy: Old Cancel/Back guards dirty changes via useUnsavedFormGuard and confirmDiscardIfDirty docs/legacy-source/frontend/src/pages/superadmin/projects/workspaces/new.js:10,59,358-363.
- vNext now: New Cancel directly router.push with no dirty prompt src/components/projects/class-team-workspace-creator.tsx:309-311.
- Fix: Implement browser+route dirty guard, preserve edited team allocations.

## G2-8-028-032  [P1] GAP  facet F07  effort M
- Legacy: Old preflight invalid server response exact The server did not return a valid cohort preflight. Nothing was created. docs/legacy-source/frontend/src/pages/superadmin/projects/workspaces/new.js:240-245.
- vNext now: New preflight fetch catch sets preflight null, disabled create with no page-level error src/components/projects/class-team-workspace-creator.tsx:109-119,309-313.
- Fix: Show explicit preflight fetch error and retry instead of silently disabling create.

## G2-8-028-035  [P1] GAP  facet F08  effort M
- Legacy: Old partial failure remains on page, toast N workspace(s) created; N students failed, export report docs/legacy-source/frontend/src/pages/superadmin/projects/workspaces/new.js:288-295.
- vNext now: New individual outcome may report failure count but results schema individualResults has only CREATED/ALREADY_COVERED src/components/projects/class-team-workspace-creator.tsx:25-30,266-285.
- Fix: Include failed outcome rows and their exact reasons in exported report and UI.
