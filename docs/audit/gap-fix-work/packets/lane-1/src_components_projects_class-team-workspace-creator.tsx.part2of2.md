# Work packet: edit src/components/projects/class-team-workspace-creator.tsx (part 2 of 2)

11 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-8/super-admin-project-workspace-new.md, docs/audit/gap2/lane-7/u020-college-admin-workspace-create.md

## G2-8-028-038  [P1] GAP  facet F10  effort M
- Legacy: Old single calls createProject payload organizationId,collegeId,classId,templateId,mentorId,learnerIds,status docs/legacy-source/frontend/src/pages/superadmin/projects/workspaces/new.js:298-320.
- vNext now: New admin creator calls class-team-workspaces POST with collegeId,classId,templateId,rosterRevision,teams,baseTitle,baseSlug src/components/projects/class-team-workspace-creator.tsx:124-147.
- Fix: Reinstate single createProjectInstance POST path and accurate payload, not force class-team.

## G2-8-028-051  [P1] GAP  facet F15  effort M
- Legacy: Old classId leaked to single could broadcast Project created to entire class by mistake; class field hidden single docs/legacy-source/frontend/src/pages/superadmin/projects/workspaces/new.js:485-490.
- vNext now: New group/class creator always includes classId, class team service notifies group members src/components/projects/class-team-workspace-creator.tsx:134-139; src/modules/projects/class-team-workspace-service.ts:105-138.
- Fix: Ensure notifications go only to selected roster membership, no class-wide broadcast from single mode.

## G2-8-028-058  [P1] GAP  facet F20  effort M
- Legacy: Old dirty unsaved changes guard before navigation docs/legacy-source/frontend/src/pages/superadmin/projects/workspaces/new.js:10,59,360-363.
- vNext now: New new creator does not guard cancel/route navigation src/components/projects/class-team-workspace-creator.tsx:309-311.
- Fix: Add beforeunload/browser back/SPA navigation confirm with exact discard text.

## G2-8-028-064  [P1] GAP  facet F23  effort M
- Legacy: Old single mode is default and no slug user entry docs/legacy-source/frontend/src/pages/superadmin/projects/workspaces/new.js:35-37,404-416.
- vNext now: New class creator requires base slug and defaults teams, no single form on route src/components/projects/class-team-workspace-creator.tsx:40-46,179-190.
- Fix: Do not claim full parity: add single mode or route to CreateProjectControl.

## G2-7-020-042  [P2] GAP  facet F07  effort S
- Legacy: new.js:539-543 Pick the class to split into teams / Class is required in cohort mode
- vNext now: class-team-workspace-creator.tsx:165-169 native class Select; class-team-create-request.ts:1 Zod errors
- Fix: Render mode-specific validation on class picker

## G2-7-020-043  [P2] GAP  facet F07  effort S
- Legacy: new.js:266-268 pick section to create one workspace per student
- vNext now: class-team-workspace-creator.tsx:309-313 disabled Create when no roster
- Fix: Show actionable missing-class error beyond disabled submit

## G2-7-020-048  [P2] GAP  facet F08  effort S
- Legacy: new.js:291-293 Every eligible student already has a workspace... Nothing was created
- vNext now: class-team-workspace-creator.tsx:269-273 generic no workspaces status
- Fix: Show full all-covered explanatory info text

## G2-8-028-029  [P2] GAP  facet F07  effort M
- Legacy: Old exact title validation Title is required and Title must be 160 characters or fewer docs/legacy-source/frontend/src/pages/superadmin/projects/workspaces/new.js:407-415.
- vNext now: New disabled create if !title.trim(), without field-level Title required copy src/components/projects/class-team-workspace-creator.tsx:309-313.
- Fix: Show inline required/title-length messages on interaction/submit.

## G2-8-028-030  [P2] GAP  facet F07  effort M
- Legacy: Old mentor required before ACTIVE: A mentor is required before a workspace can be Active docs/legacy-source/frontend/src/pages/superadmin/projects/workspaces/new.js:467-472.
- vNext now: New single control errors Assign a Mentor before making this Project active; class-team has no status field src/components/projects/project-create-control.tsx:152-158; src/components/projects/class-team-workspace-creator.tsx:164-204.
- Fix: Use identical mentor requirement wording in all creator paths.

## G2-8-028-033  [P2] GAP  facet F08  effort M
- Legacy: Old single creation success toast Workspace created docs/legacy-source/frontend/src/pages/superadmin/projects/workspaces/new.js:308-311.
- vNext now: New class team notice N Project workspaces created. src/components/projects/class-team-workspace-creator.tsx:136-146.
- Fix: Preserve single-create success wording, contextually show group count.

## G2-8-028-034  [P2] GAP  facet F08  effort M
- Legacy: Old cohort zero count info Every eligible student already has a workspace... docs/legacy-source/frontend/src/pages/superadmin/projects/workspaces/new.js:246-250.
- vNext now: New result text No workspaces were created — selected class may have no active learners src/components/projects/class-team-workspace-creator.tsx:266-273.
- Fix: Distinguish already-covered from empty roster in zero-create message.
