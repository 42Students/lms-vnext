# Work packet: NEW / MISSING items from docs/audit/gap2/lane-2/admin-college-summary-controller.md

11 findings. These findings have no vNext file yet: create the files, modules or routes needed, inside the feature area of this lane.
Audit documents with full context: docs/audit/gap2/lane-2/admin-college-summary-controller.md

## G2-2-013-009  [P1] GAP  facet F04  effort S
- Legacy: LC:76-78 learner repository includes via class, including older college assignment shape
- vNext now: NL:88-91 counts active LEARNER membershipRoles only
- Fix: Map legacy enrolments with college via class, not merely active membership role.

## G2-2-013-018  [P1] GAP  facet F10  effort S
- Legacy: LC:75-102 independently catches exceptions for each metric
- vNext now: NL:33-97 one Promise.all over fourteen queries; one failure rejects entire summary
- Fix: Use individual settled COUNT queries for FOUR summary metrics; unaffected tiles must still load.

## G2-2-013-020  [P1] GAP  facet F11  effort S
- Legacy: LC:67-72 requireAccessCollege for authorized principal; access differs from admin mutations
- vNext now: NL:16-26 requires COLLEGE_ADMIN role and college.read
- Fix: Allow permitted scoped Super Admin reader equivalent under selected acting-college context.

## G2-2-013-022  [P1] GAP  facet F12  effort S
- Legacy: LC:76-78 students includes learners linked via class
- vNext now: NL:88-91 active memberships only
- Fix: Preserve legacy count membership fallback or document deliberate status policy change.

## G2-2-013-026  [P1] GAP  facet F13  effort S
- Legacy: LC:79-81 failed one student count returns null, other three computed
- vNext now: NL:33-97 one query error rejects entire summary; NS:12 comment explicitly all fails
- Fix: Implement per-field fallback null; never replace failure with zero.

## G2-2-013-035  [P1] GAP  facet F20  effort S
- Legacy: LC:83-102 recover from individually broken repo
- vNext now: NL:33-97 rejects entire list on individual query exception
- Fix: Isolate failures and preserve precision of '—' vs real zero.

## G2-2-013-038  [P1] GAP  facet F22  effort S
- Legacy: LC:76-102 nullable counts on failures
- vNext now: NM:39-50 projection allows null count, but NL:33-97 throw all before projection
- Fix: Return partial counts and carry null per failing dimension.

## G2-2-013-039  [P1] GAP  facet F23  effort S
- Legacy: LC:75-102 independent fault isolation
- vNext now: NL:33-97 coupling fourteen setup COUNT queries into four summary cards
- Fix: Separate summary dependency from unrelated setup metrics.

## G2-2-013-014  [P3] GAP  facet F07  effort S
- Legacy: LC:63-65 exact 400 'collegeId must be a positive integer'
- vNext now: NP:27-45 EmptyState for no active college
- Fix: Map new route failure to safe equivalent copy.

## G2-2-013-015  [P3] GAP  facet F07  effort S
- Legacy: LC:68-70 401 'Authentication required'
- vNext now: NP:24 getCurrentRequestContext throws to protected shell
- Fix: Verify 401/redirect semantics for unauthenticated API/SSR clients.

## G2-2-013-016  [P3] GAP  facet F08  effort S
- Legacy: LC:104 returns Response OK and map
- vNext now: NS:18 `{setup,cards}` SSR service response
- Fix: Version old REST response envelope for clients, no success toast requirement.
