# Work packet (wave 2): edit src/components/placements/learner-applications-browse.tsx

22 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-12/placement-applications.md

## G2-12-006-003  [P2] GAP  facet F02  effort M
- Legacy: Compact segmented filter+conditional search above inline accordion articles `docs/legacy-source/frontend/src/pages/learn/my-placements/applications.js:102-117`
- vNext now: Attention block, collapsible filters, export and paged list `src/components/placements/learner-applications-browse.tsx:217-357`
- Fix: Match top-level density and section ordering

## G2-12-006-005  [P2] GAP  facet F02  effort S
- Legacy: Company share preview modal within list `docs/legacy-source/frontend/src/pages/learn/my-placements/applications.js:192-209`
- vNext now: Navigates to separate route `src/components/placements/learner-applications-browse.tsx:392-395`
- Fix: Implement in-place equivalent modal

## G2-12-006-008  [P2] GAP  facet F03  effort S
- Legacy: Inline OfferCard, RoundTrack and View drive/Schedule/Company/Withdraw buttons `docs/legacy-source/frontend/src/pages/learn/my-placements/applications.js:155-170`
- vNext now: Drawer details links + results; offers separate; new History/Assessment actions `src/components/placements/learner-applications-browse.tsx:373-420,439-505`
- Fix: Restore embedded card and legacy action order

## G2-12-006-016  [P2] GAP  facet F05  effort S
- Legacy: Linked applicationId forces All and opens requested card `docs/legacy-source/frontend/src/pages/learn/my-placements/applications.js:56-62`
- vNext now: Drawer selects id, leaves view Progress `src/components/placements/learner-applications-browse.tsx:173-174,368-371`
- Fix: Ensure ended selected application represented in view chips

## G2-12-006-018  [P2] GAP  facet F06  effort S
- Legacy: Three aria-pressed segments, Input.Search allowClear `docs/legacy-source/frontend/src/pages/learn/my-placements/applications.js:105-110`
- vNext now: Tabs control, debounced search, separate Clear filters `src/components/placements/learner-applications-browse.tsx:245-281`
- Fix: Restore segment chrome and clear behavior

## G2-12-006-029  [P2] GAP  facet F09  effort S
- Legacy: Modal title names company with withdraw or ask mode, primary `Withdraw`/`Send to placement cell` `docs/legacy-source/frontend/src/pages/learn/my-placements/applications.js:178-189`
- vNext now: Generic dialog title and `Confirm withdrawal` both modes `src/components/placements/learner-applications-browse.tsx:514-539`
- Fix: Use mode-specific title, primary label and danger style

## G2-12-006-030  [P2] GAP  facet F09  effort S
- Legacy: Company share preview modal title names company; skeleton/error/Close `docs/legacy-source/frontend/src/pages/learn/my-placements/applications.js:192-209`
- vNext now: Separate route opens rather than modal `src/components/placements/learner-applications-browse.tsx:392-395`
- Fix: Restore modal

## G2-12-006-032  [P2] GAP  facet F10  effort S
- Legacy: Company preview fetched GET by jobId on click `docs/legacy-source/frontend/src/pages/learn/my-placements/applications.js:91-96`
- vNext now: Company preview navigates to applicationId scoped route `src/components/placements/learner-applications-browse.tsx:392-395`
- Fix: Match target/authorization and one-click preview

## G2-12-006-034  [P2] GAP  facet F10  effort S
- Legacy: First live application automatically opened `docs/legacy-source/frontend/src/pages/learn/my-placements/applications.js:56-62`
- vNext now: No initial selected Drawer `src/components/placements/learner-applications-browse.tsx:173-174`
- Fix: Auto-open first in-progress record

## G2-12-006-039  [P2] GAP  facet F12  effort S
- Legacy: Suppressed reason Offer declined by candidate `docs/legacy-source/frontend/src/pages/learn/my-placements/applications.js:152-153`
- vNext now: CandidateMessage visible, no identical suppression `src/components/placements/learner-applications-browse.tsx:483-487`
- Fix: Avoid displaying sensitive internal reason

## G2-12-006-042  [P2] GAP  facet F13  effort S
- Legacy: No applications copy You haven't applied to a drive yet, browse open drives `docs/legacy-source/frontend/src/pages/learn/my-placements/applications.js:113-116`
- vNext now: Different longer empty copy `src/components/placements/learner-applications-browse.tsx:337-347`
- Fix: Match exact empty text

## G2-12-006-043  [P2] GAP  facet F13  effort S
- Legacy: Filtered empty differentiates search/no live/nothing ended `docs/legacy-source/frontend/src/pages/learn/my-placements/applications.js:115-116`
- vNext now: Generic `No applications match these filters.` `src/components/placements/learner-applications-browse.tsx:349-356`
- Fix: Restore condition-specific empty text

## G2-12-006-046  [P2] GAP  facet F14  effort S
- Legacy: Resume View link new tab noopener noreferrer `docs/legacy-source/frontend/src/pages/learn/my-placements/applications.js:203-203`
- vNext now: Resume not accessible in list (company route instead) `src/components/placements/learner-applications-browse.tsx:392-395`
- Fix: Preserve secure resume link in preview

## G2-12-006-049  [P2] GAP  facet F16  effort S
- Legacy: Search max width280, top right only when apps>5 `docs/legacy-source/frontend/src/pages/learn/my-placements/applications.js:102-110`
- vNext now: Collapsible mobile filter panel, 3-column desktop grid `src/components/placements/learner-applications-browse.tsx:245-309`
- Fix: Match responsive bar layout

## G2-12-006-050  [P2] GAP  facet F16  effort S
- Legacy: Responsive article accordion with embedded process `docs/legacy-source/frontend/src/pages/learn/my-placements/applications.js:123-175`
- vNext now: Full-width mobile Drawer with footer buttons `src/components/placements/learner-applications-browse.tsx:368-512`
- Fix: Match inline mobile expansion

## G2-12-006-052  [P2] GAP  facet F17  effort S
- Legacy: Card expand role button tabIndex and Enter/Space `docs/legacy-source/frontend/src/pages/learn/my-placements/applications.js:124-125`
- vNext now: Selection opens drawer not inline article `src/components/placements/learner-applications-browse.tsx:368-371`
- Fix: Restore accessible expand/collapse

## G2-12-006-056  [P2] GAP  facet F18  effort S
- Legacy: Legacy action labels View drive / See in schedule / What company sees / Withdraw `docs/legacy-source/frontend/src/pages/learn/my-placements/applications.js:161-170`
- vNext now: Extra Full history, Application detail, Assessments/Interviews and different withdraw `src/components/placements/learner-applications-browse.tsx:373-420`
- Fix: Align action order and names

## G2-12-006-057  [P2] GAP  facet F18  effort S
- Legacy: Cancelled banner contains exact company cancellation reason `docs/legacy-source/frontend/src/pages/learn/my-placements/applications.js:145-150`
- vNext now: Generic notices link and no cancellation reason `src/components/placements/learner-applications-browse.tsx:424-428`
- Fix: Restore reason

## G2-12-006-058  [P2] GAP  facet F18  effort S
- Legacy: Withdrawal dialog asks You leave <role> for good and cannot undo `docs/legacy-source/frontend/src/pages/learn/my-placements/applications.js:182-188`
- vNext now: Generic status-change disclaimer with 5–500 reason hint `src/components/placements/learner-applications-browse.tsx:523-564`
- Fix: Restore irreversible warning and precise helper text

## G2-12-006-066  [P2] GAP  facet F21  effort S
- Legacy: Legacy request/jobService and company preview API `docs/legacy-source/frontend/src/pages/learn/my-placements/applications.js:9-15,82-96`
- vNext now: Conceptual replacement actions routes and company detail link `src/components/placements/learner-applications-browse.tsx:133-148,392-395`
- Fix: Trace equivalent server notifications and company preview

## G2-12-006-072  [P2] GAP  facet F23  effort S
- Legacy: Inline article and in-context company preview `docs/legacy-source/frontend/src/pages/learn/my-placements/applications.js:123-209`
- vNext now: Drawer and separate company route `src/components/placements/learner-applications-browse.tsx:368-512`
- Fix: Document intentional redesign decision or restore layout

## G2-12-006-044  [P3] GAP  facet F13  effort S
- Legacy: Company preview modal error recovery `docs/legacy-source/frontend/src/pages/learn/my-placements/applications.js:194-196`
- vNext now: Separate route/no modal recovery in list `src/components/placements/learner-applications-browse.tsx:392-395`
- Fix: Provide row-level retry
