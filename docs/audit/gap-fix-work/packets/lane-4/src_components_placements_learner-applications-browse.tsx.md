# Work packet: edit src/components/placements/learner-applications-browse.tsx

13 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-12/placement-applications.md

## G2-12-006-004  [P1] GAP  facet F02  effort M
- Legacy: Each article expands inline for selection process/offers/actions `docs/legacy-source/frontend/src/pages/learn/my-placements/applications.js:123-174`
- vNext now: Application selected in side Drawer with actions `src/components/placements/learner-applications-browse.tsx:368-512`
- Fix: Restore inline accordion details for visual parity

## G2-12-006-007  [P1] GAP  facet F03  effort S
- Legacy: Contextual staff opt-out, cancelled reason, company rejection banners `docs/legacy-source/frontend/src/pages/learn/my-placements/applications.js:145-154`
- vNext now: Generic cancelled warning without cancel reason or opt-out banner `src/components/placements/learner-applications-browse.tsx:424-428,483-487`
- Fix: Recreate each conditionally visible banner

## G2-12-006-020  [P1] GAP  facet F06  effort S
- Legacy: Request textarea rows3 max900 `docs/legacy-source/frontend/src/pages/learn/my-placements/applications.js:186-188`
- vNext now: Both paths rows4 max500 with hint 5–500 `src/components/placements/learner-applications-browse.tsx:548-565`
- Fix: Align textarea and schema/legacy

## G2-12-006-021  [P1] GAP  facet F06  effort S
- Legacy: Withdraw button shown if server `a.withdraw` SELF/REQUEST `docs/legacy-source/frontend/src/pages/learn/my-placements/applications.js:165-170`
- vNext now: Button shown for SUBMITTED only, mode guessed by shortlisted+rounds `src/components/placements/learner-applications-browse.tsx:399-411`
- Fix: Expose server-derived withdrawal grant

## G2-12-006-022  [P1] GAP  facet F07  effort S
- Legacy: Request submit disabled below3 characters, self action allowed blank reason `docs/legacy-source/frontend/src/pages/learn/my-placements/applications.js:178-180`
- vNext now: All submit reasons required; JSX 5–500 while schema min3 max900 `src/components/placements/learner-applications-browse.tsx:533-565`
- Fix: Unify runtime and DOM validation with each mode

## G2-12-006-028  [P1] GAP  facet F09  effort S
- Legacy: Inline collapse triggered via role=button/aria-expanded `docs/legacy-source/frontend/src/pages/learn/my-placements/applications.js:123-143`
- vNext now: Drawer controlled by applicationId URL `src/components/placements/learner-applications-browse.tsx:368-371`
- Fix: Restore expandable cards

## G2-12-006-038  [P1] GAP  facet F12  effort S
- Legacy: Staff-applied can opt out before optOutUntil `docs/legacy-source/frontend/src/pages/learn/my-placements/applications.js:121-121,145-147`
- vNext now: UI uses generic withdraw without dedicated deadline `src/components/placements/learner-applications-browse.tsx:399-411`
- Fix: Honor opt-out deadline visibly and in action

## G2-12-006-040  [P1] GAP  facet F12  effort S
- Legacy: Backend supplied `withdraw` permission SELF/REQUEST `docs/legacy-source/frontend/src/pages/learn/my-placements/applications.js:165-170`
- vNext now: Client heuristic for mode `src/components/placements/learner-applications-browse.tsx:124-129`
- Fix: Avoid heuristic permission derivation

## G2-12-006-023  [P2] GAP  facet F07  effort S
- Legacy: API errorText uses response message before fallback `docs/legacy-source/frontend/src/pages/learn/my-placements/applications.js:64-79`
- vNext now: Every failed response gets generic withdrawal error `src/components/placements/learner-applications-browse.tsx:141-150`
- Fix: Preserve server-safe specific errors

## G2-12-006-024  [P2] GAP  facet F07  effort S
- Legacy: Preview error alert and Retry button `docs/legacy-source/frontend/src/pages/learn/my-placements/applications.js:194-196`
- vNext now: Preview separate route and no per-row retry `src/components/placements/learner-applications-browse.tsx:392-395`
- Fix: Add in-context retry

## G2-12-006-025  [P2] GAP  facet F08  effort S
- Legacy: Self toast `Application withdrawn` `docs/legacy-source/frontend/src/pages/learn/my-placements/applications.js:82-89`
- vNext now: Inline `Application withdrawn. The updated status ...` `src/components/placements/learner-applications-browse.tsx:144-148`
- Fix: Restore exact toast

## G2-12-006-026  [P2] GAP  facet F08  effort S
- Legacy: Request toast `Sent. The placement cell will reply.` `docs/legacy-source/frontend/src/pages/learn/my-placements/applications.js:82-89`
- vNext now: Inline `Withdrawal request sent... active until approved` `src/components/placements/learner-applications-browse.tsx:144-148`
- Fix: Restore toast/copy

## G2-12-006-027  [P3] GAP  facet F08  effort S
- Legacy: Errors toast `Could not withdraw`/`Could not send the request` `docs/legacy-source/frontend/src/pages/learn/my-placements/applications.js:64-79`
- vNext now: Inline generic error `src/components/placements/learner-applications-browse.tsx:141-150`
- Fix: Align wording/placement
