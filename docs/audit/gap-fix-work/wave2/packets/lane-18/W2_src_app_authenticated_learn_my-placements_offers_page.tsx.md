# Work packet (wave 2): edit src/app/(authenticated)/learn/my-placements/offers/page.tsx

16 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-13/learner-offers.md

## G2-13-005-001  [P2] GAP  facet F01  effort M
- Legacy: Student route is /learn/my-placements/offers under PlacementsTabsLayout (`docs/legacy-source/frontend/src/pages/learn/my-placements/offers.js:61-61`)
- vNext now: Same route uses local PageHeader and status tabs; not PlacementsTabsLayout (`src/app/(authenticated)/learn/my-placements/offers/page.tsx:107-122`)
- Fix: Restore common placements tab strip and page context around My offers.

## G2-13-005-004  [P2] GAP  facet F02  effort M
- Legacy: Waiting first, heading Needs your reply; answered later under Earlier offers (`docs/legacy-source/frontend/src/pages/learn/my-placements/offers.js:25-47`)
- vNext now: Single paginated list with status tabs; list component renders all selected statuses (`src/app/(authenticated)/learn/my-placements/offers/page.tsx:122-247`)
- Fix: Default all view should visibly group pending under exact heading, then answered.

## G2-13-005-005  [P2] GAP  facet F02  effort S
- Legacy: Answered-only heading changes to Your offers when no waiting offers (`docs/legacy-source/frontend/src/pages/learn/my-placements/offers.js:43-46`)
- vNext now: Title always My offers; no per-group heading (`src/app/(authenticated)/learn/my-placements/offers/page.tsx:116-116`)
- Fix: Restore conditional group headings.

## G2-13-005-006  [P2] GAP  facet F02  effort S
- Legacy: One page panel How offers work below offers with 16px top margin (`docs/legacy-source/frontend/src/pages/learn/my-placements/offers.js:53-56`)
- vNext now: Full-width rules explanation section follows pagination and links (`src/app/(authenticated)/learn/my-placements/offers/page.tsx:287-296`)
- Fix: Restore compact .sp-panel bordered card and margin.

## G2-13-005-019  [P2] GAP  facet F05  effort M
- Legacy: All waiting RELEASED offers shown first, answered second with source order (`docs/legacy-source/frontend/src/pages/learn/my-placements/offers.js:25-47`)
- vNext now: New sorts priority, offers new sort variants and paginates 15 (`src/app/(authenticated)/learn/my-placements/offers/page.tsx:86-95`)
- Fix: Default sort/group order must match old; avoid splitting waiting group across pages.

## G2-13-005-021  [P2] GAP  facet F05  effort M
- Legacy: Old offers list is unpaginated (`docs/legacy-source/frontend/src/pages/learn/my-placements/offers.js:37-47`)
- vNext now: New 15 offers/page with count and Pagination (`src/app/(authenticated)/learn/my-placements/offers/page.tsx:93-95`)
- Fix: Clearly show pending all-page totals, preserve deep links and pagination state.

## G2-13-005-039  [P2] GAP  facet F10  effort M
- Legacy: GET `/api/v1/learner/placement/journey` drives cards (`docs/legacy-source/frontend/src/api/Services/TpoHubService.js:169-171`)
- vNext now: Server directly calls getOwnLearnerOfferBrowse and optional requests (`src/app/(authenticated)/learn/my-placements/offers/page.tsx:74-79`)
- Fix: Compare old journey offer projection and new offer table owner scope.

## G2-13-005-053  [P2] GAP  facet F13  effort M
- Legacy: Old rules loading Skeleton 3 rows / failure We couldn't load the rules, Retry (`docs/legacy-source/frontend/src/components/Placements/student/PlacementRules.jsx:24-27`)
- vNext now: New rules section always static explanation and link (`src/app/(authenticated)/learn/my-placements/offers/page.tsx:287-295`)
- Fix: Show dynamic rules including failure/loading state or label static explanation not policy.

## G2-13-005-054  [P2] GAP  facet F14  effort S
- Legacy: Old Offer letter button opens linked letter in new tab (`docs/legacy-source/frontend/src/components/Placements/student/OfferCard.jsx:83-87`)
- vNext now: New View offer letter link no target blank; href checked by safeLearnerOfferLetterHref (`src/app/(authenticated)/learn/my-placements/offers/page.tsx:263-265`)
- Fix: Restore new-tab opening and secure signed URL if letter stored privately.

## G2-13-005-061  [P2] GAP  facet F17  effort S
- Legacy: Old accessible aria-labelledby section headings Needs your reply/Earlier offers (`docs/legacy-source/frontend/src/pages/learn/my-placements/offers.js:37-46`)
- vNext now: New status tab list renders no matching group region headings (`src/app/(authenticated)/learn/my-placements/offers/page.tsx:122-247`)
- Fix: Restore group headings with IDs and aria-labelledby for screen readers.

## G2-13-005-062  [P2] GAP  facet F18  effort S
- Legacy: Legacy title per waiting group Needs your reply (`docs/legacy-source/frontend/src/pages/learn/my-placements/offers.js:37-40`)
- vNext now: New status tab label uses generated text rather than visible Needs your reply section (`src/app/(authenticated)/learn/my-placements/offers/page.tsx:44-51`)
- Fix: Copy exact grouping label.

## G2-13-005-063  [P2] GAP  facet F18  effort S
- Legacy: Legacy answered group Earlier offers, or Your offers (`docs/legacy-source/frontend/src/pages/learn/my-placements/offers.js:43-46`)
- vNext now: New page title My offers and status tabs (`src/app/(authenticated)/learn/my-placements/offers/page.tsx:116-122`)
- Fix: Restore conditional group heading.

## G2-13-005-065  [P2] GAP  facet F18  effort S
- Legacy: Legacy Need more time on an offer, or got an offer outside campus? request link (`docs/legacy-source/frontend/src/pages/learn/my-placements/offers.js:49-50`)
- vNext now: New Need more time? Send a request to placement cell, omits outside-campus wording (`src/app/(authenticated)/learn/my-placements/offers/page.tsx:287-295`)
- Fix: Restore explicit outside-campus offer instruction.

## G2-13-005-073  [P2] GAP  facet F21  effort M
- Legacy: Old getPlacementRules fetches dynamic college rules (`docs/legacy-source/frontend/src/components/Placements/student/PlacementRules.jsx:15-20`)
- vNext now: New static explanation plus link to Rules route (`src/app/(authenticated)/learn/my-placements/offers/page.tsx:287-295`)
- Fix: Restore personalized Where you stand and dynamic rule bullets on offers page.

## G2-13-005-076  [P2] GAP  facet F22  effort M
- Legacy: Old internship counts as placed false only when configured false (`docs/legacy-source/frontend/src/components/Placements/student/OfferCard.jsx:76-77`)
- vNext now: New helper uses offer kind and job employmentType/role (`src/app/(authenticated)/learn/my-placements/offers/page.tsx:264-267`)
- Fix: Confirm internship/LOI classification with old stored flags.

## G2-13-005-079  [P2] MISSING  facet F23  effort M
- Legacy: Old embedded personalized placement rules with collapsible See all the rules (`docs/legacy-source/frontend/src/components/Placements/student/PlacementRules.jsx:28-39`)
- vNext now: New static rules paragraph and links, no personalized note (`src/app/(authenticated)/learn/my-placements/offers/page.tsx:287-295`)
- Fix: Recreate personalized rules preview/collapsible with exact text and load failure.
