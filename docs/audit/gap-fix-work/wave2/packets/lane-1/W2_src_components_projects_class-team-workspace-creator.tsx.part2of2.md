# Work packet (wave 2): edit src/components/projects/class-team-workspace-creator.tsx (part 2 of 2)

12 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-8/super-admin-project-workspace-new.md, docs/audit/gap2/lane-2/admin-project-controller.md, docs/audit/gap2/lane-7/u020-college-admin-workspace-create.md

## G2-8-028-037  [P2] GAP  facet F09  effort M
- Legacy: Old teamSplit has preview/report Card driven by hook docs/legacy-source/frontend/src/pages/superadmin/projects/workspaces/new.js:60-66,555-556.
- vNext now: New previews always displayed inline with move/swap dropdowns src/components/projects/class-team-workspace-creator.tsx:233-263.
- Fix: Compare preview interactions and team assignment report after creation.

## G2-8-028-043  [P2] GAP  facet F11  effort M
- Legacy: Old options for faculty, class, learners loaded by college from APIs docs/legacy-source/frontend/src/pages/superadmin/projects/workspaces/new.js:95-116.
- vNext now: New class-team-roster-service bounds class to selected college membership; no faculty selection src/components/projects/class-team-workspace-creator.tsx:60-89.
- Fix: Restore authorized mentor faculty search and avoid returning users out of college.

## G2-8-028-049  [P2] GAP  facet F13  effort M
- Legacy: Old no cohort create leaves outcome on page and failure alert docs/legacy-source/frontend/src/pages/superadmin/projects/workspaces/new.js:280-292,567-587.
- vNext now: New zero creates notice with individual results, but no failed reasons src/components/projects/class-team-workspace-creator.tsx:266-285.
- Fix: Show stable retry state with explicit failures after create.

## G2-8-028-050  [P2] GAP  facet F14  effort M
- Legacy: Old outcome CSV filename project-cohort-outcome.csv, columns Outcome,Workspace ID,Details docs/legacy-source/frontend/src/pages/superadmin/projects/workspaces/new.js:567-575.
- vNext now: New cohort-creation-outcome.csv with per-learner result CSV generated client-side src/components/projects/class-team-workspace-creator.tsx:287-307.
- Fix: Match filename/schema or provide backward-compatible export mapping.

## G2-8-028-053  [P2] GAP  facet F16  effort M
- Legacy: Old Ant Card/Form vertical labels, Table pagination and Space wrap docs/legacy-source/frontend/src/pages/superadmin/projects/workspaces/new.js:369-407,557-585.
- vNext now: New 1/2-column md grid, sticky bottom buttons, mobile full-width controls src/components/projects/class-team-workspace-creator.tsx:159-204,309-315.
- Fix: Screenshot and match old 375/768/1280 label order, sticky bar and card boundaries.

## G2-8-028-054  [P2] GAP  facet F17  effort M
- Legacy: Old Ant Form validate per field, Modal.confirm focus+cancel, title counter docs/legacy-source/frontend/src/pages/superadmin/projects/workspaces/new.js:251-265,407-416.
- vNext now: New native Select/Input labels, window.confirm and error role=alert src/components/projects/class-team-workspace-creator.tsx:124-131,176-180,263-264.
- Fix: Replace window.confirm with accessible dialog and focus first invalid field.

## G2-8-028-055  [P2] GAP  facet F18  effort M
- Legacy: Old exact title Create project workspace, label Template, Students, Mentor, Summary docs/legacy-source/frontend/src/pages/superadmin/projects/workspaces/new.js:353-356,418-527.
- vNext now: New class creator labels Published template, Workspace mode, Base slug, no Mentor/Summary src/components/projects/class-team-workspace-creator.tsx:164-204.
- Fix: Restore original labels for equivalent create mode, note additions as extra.

## G2-8-028-056  [P2] GAP  facet F18  effort M
- Legacy: Old placeholder Campus Event Coordination, Short live workspace summary, Search by template title docs/legacy-source/frontend/src/pages/superadmin/projects/workspaces/new.js:415-420,463-464.
- vNext now: New Capstone Project and nonsearchable assigned template src/components/projects/class-team-workspace-creator.tsx:171-178.
- Fix: Restore literal old placeholders and search helper.

## G2-8-028-057  [P2] GAP  facet F19  effort M
- Legacy: Old all four searches debounced 400ms, paged cohort grid20/outcome15 docs/legacy-source/frontend/src/pages/superadmin/projects/workspaces/new.js:144-203,560-585.
- vNext now: New all classes/roster loaded and rendered in bounded scroll, no pagination src/components/projects/class-team-workspace-creator.tsx:60-89,212-230,274-285.
- Fix: Use paginated/bounded roster fetch and virtual list for 10k-class edge.

## G2-8-028-063  [P2] GAP  facet F22  effort M
- Legacy: Old cohort preflight includes separate created/failures rows docs/legacy-source/frontend/src/pages/superadmin/projects/workspaces/new.js:267-276.
- vNext now: New cohortCreationOutcome schema created,individualResults only CREATED/ALREADY_COVERED src/components/projects/class-team-workspace-creator.tsx:25-30.
- Fix: Preserve failure provenance in audit event or result schema.

## G2-2-020-061  [P3] GAP  facet F18  effort S
- Legacy: Legacy workspaces/new.js:293 Created N workspace(s) for the class roster.
- vNext now: src/components/projects/class-team-workspace-creator.tsx:142 N Project workspaces created.
- Fix: Align successful cohort copy.

## G2-7-020-020  [P3] GAP  facet F04  effort S
- Legacy: new.js:141-147 class name fallback to className or Class id
- vNext now: class-team-workspace-creator.tsx:165-169 name with code
- Fix: Use consistent fallback and class naming
