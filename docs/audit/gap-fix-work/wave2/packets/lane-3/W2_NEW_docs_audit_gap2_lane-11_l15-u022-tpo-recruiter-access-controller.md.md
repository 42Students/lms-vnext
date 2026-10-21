# Work packet (wave 2): NEW / MISSING items from docs/audit/gap2/lane-11/l15-u022-tpo-recruiter-access-controller.md

10 findings. No vNext file yet: create the needed files, modules or routes inside the feature area of this lane.
Audit documents with full context: docs/audit/gap2/lane-11/l15-u022-tpo-recruiter-access-controller.md

## G2-15-022-003  [P2] GAP  facet F02  effort M
- Legacy: Legacy recruiter rules and recruiter-access card appear in Settings > Recruiters; settings.js:609-680,714-719
- vNext now: Grant form, duration/public link disclosure, grant history, export and about; recruiters/page.tsx:116-162,167-334
- Fix: Align section order and visual shell with legacy: rules first then access table; allow extra grant form as separate subsection.

## G2-15-022-004  [P2] GAP  facet F02  effort S
- Legacy: Legacy card `Recruiters with access to your college`; settings.js:714-717
- vNext now: Page title `Recruiter access`, section `College recruiter grants` / `Grant records`; recruiters/page.tsx:111-118,164-174,221-226
- Fix: Use legacy copy for equivalent section title while preserving historical-grants distinction in helper text.

## G2-15-022-005  [P2] GAP  facet F03  effort M
- Legacy: Legacy table action buttons `Extend…` / `Give access again…`, `Remove`; settings.js:730-736
- vNext now: vNext `Manage access` disclosure and nested controls for ACTIVE grants; recruiters/page.tsx:275-284
- Fix: Render direct row actions as legacy with identical labels and conditional expired wording.

## G2-15-022-006  [P2] GAP  facet F03  effort S
- Legacy: Legacy states `Until`, `Ended`, `Removed`, `No end date`, warning soon; settings.js:699-709
- vNext now: vNext `Ended or removed` badge and `Valid through (IST)` column; recruiters/page.tsx:271-288
- Fix: Separate expired vs revoked vs indefinite grant labels with correct badges and support `No end date`.

## G2-15-022-007  [P2] MISSING  facet F03  effort S
- Legacy: Legacy settings link `Invites not yet accepted` to `/tpo/recruiters?f_stage=INVITED`; settings.js:716-717
- vNext now: No corresponding link in grant section inspected; recruiters/page.tsx:164-224
- Fix: Restore invites shortcut with legacy label and filter target.

## G2-15-022-013  [P2] GAP  facet F05  effort M
- Legacy: Legacy settings table columns Recruiter (+designation), Company, Joined through, Access, actions; settings.js:719-736
- vNext now: vNext Recruiter, Company, Grant status, Granted, Valid through, Access & verification, Revoked; recruiters/page.tsx:258-297
- Fix: Restore joined-through and inline actions, decide whether extra audit columns live under optional Columns view.

## G2-15-022-026  [P2] GAP  facet F09  effort M
- Legacy: Extend Modal.confirm dynamic name + duration; content explains base; button `Extend`; settings.js:732-734
- vNext now: Manage access disclosure opens vNext controls; recruiters/page.tsx:276-285
- Fix: Match exact modal title, explanatory copy, button label, focus/close behavior.

## G2-15-022-035  [P2] GAP  facet F13  effort S
- Legacy: No-college GET returns empty list, mutations throw `Not found`; TpoRecruiterAccessController.java:60-62,96-99
- vNext now: vNext missing TPO membership redirects /dashboard, invalid filters error state; recruiters/page.tsx:57-101
- Fix: Map no-scope/non-TPO states without leaking records; consider legacy empty vs redirect only if approved.

## G2-15-022-036  [P2] GAP  facet F13  effort S
- Legacy: Legacy load failure `Couldn't load your recruiters` retry; settings.js:686-696
- vNext now: vNext server loader + invalid filter error/empty states; recruiters/page.tsx:69-101,246-258
- Fix: Preserve retry affordance for transport failure separate from zero grants.

## G2-15-022-041  [P2] GAP  facet F18  effort S
- Legacy: Exact legacy labels `Recruiters with access to your college`, `Joined through`, `Access`, `Extend…`, `Remove`; settings.js:716-736
- vNext now: New `College recruiter grants`, `Grant records`, `Grant status`, `Valid through (IST)`; recruiters/page.tsx:165-290
- Fix: Replace equivalent UI copy with legacy labels, keep extra historical explanatory text explicitly annotated.
