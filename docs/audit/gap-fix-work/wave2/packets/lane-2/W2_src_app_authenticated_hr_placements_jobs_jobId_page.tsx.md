# Work packet (wave 2): edit src/app/(authenticated)/hr/placements/jobs/[jobId]/page.tsx

29 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-11/recruiter-drives-jobid.md

## G2-11-002-002  [P2] GAP  facet F01  effort S
- Legacy: ?review=1 opens focused review `docs/legacy-source/frontend/src/pages/recruiter/drives/[jobId].js:183`
- vNext now: Focused applicant determined from query `src/app/(authenticated)/hr/placements/jobs/[jobId]/page.tsx:153`
- Fix: Restore round selection before review

## G2-11-002-003  [P2] GAP  facet F01  effort S
- Legacy: All drives header-right link `docs/legacy-source/frontend/src/pages/recruiter/drives/[jobId].js:231`
- vNext now: Back link appears above header `src/app/(authenticated)/hr/placements/jobs/[jobId]/page.tsx:276`
- Fix: Put exact link in header-right

## G2-11-002-004  [P2] GAP  facet F01  effort S
- Legacy: Legacy tab keys overview/applicants/rounds/offers/messages `docs/legacy-source/frontend/src/pages/recruiter/drives/[jobId].js:35`
- vNext now: Separate requests/discussion tab state `src/app/(authenticated)/hr/placements/jobs/[jobId]/page.tsx:348`
- Fix: Combine requests and discussion

## G2-11-002-005  [P2] GAP  facet F02  effort S
- Legacy: All five tabs inside one Card `docs/legacy-source/frontend/src/pages/recruiter/drives/[jobId].js:238`
- vNext now: Flat multiple bordered sections `src/app/(authenticated)/hr/placements/jobs/[jobId]/page.tsx:273`
- Fix: Clone Card/padding hierarchy

## G2-11-002-006  [P2] GAP  facet F02  effort S
- Legacy: Drive title and status badge on same line `docs/legacy-source/frontend/src/pages/recruiter/drives/[jobId].js:225`
- vNext now: Status separated into facts section `src/app/(authenticated)/hr/placements/jobs/[jobId]/page.tsx:290`
- Fix: Move badge inline with role

## G2-11-002-007  [P2] GAP  facet F02  effort S
- Legacy: Overview rendered in RecruiterDriveOverview `docs/legacy-source/frontend/src/pages/recruiter/drives/[jobId].js:236`
- vNext now: VNext overview is large multi-section stack `src/app/(authenticated)/hr/placements/jobs/[jobId]/page.tsx:359`
- Fix: Match overview section order

## G2-11-002-008  [P2] GAP  facet F02  effort S
- Legacy: Inline Rounds sections for slots/results `docs/legacy-source/frontend/src/pages/recruiter/drives/[jobId].js:474`
- vNext now: Rounds editor/slots split `src/app/(authenticated)/hr/placements/jobs/[jobId]/page.tsx:756`
- Fix: Use collapsed inline layout

## G2-11-002-010  [P2] GAP  facet F03  effort S
- Legacy: Applicants tab label shows count `docs/legacy-source/frontend/src/pages/recruiter/drives/[jobId].js:239`
- vNext now: Applicants label is static `src/app/(authenticated)/hr/placements/jobs/[jobId]/page.tsx:351`
- Fix: Count in tab label

## G2-11-002-011  [P2] GAP  facet F03  effort S
- Legacy: Offers label includes count when >0 `docs/legacy-source/frontend/src/pages/recruiter/drives/[jobId].js:241`
- vNext now: Offers label static `src/app/(authenticated)/hr/placements/jobs/[jobId]/page.tsx:353`
- Fix: Append count

## G2-11-002-012  [P2] GAP  facet F03  effort S
- Legacy: Discussion label shows n to answer `docs/legacy-source/frontend/src/pages/recruiter/drives/[jobId].js:242`
- vNext now: Separate Requests and Discussion `src/app/(authenticated)/hr/placements/jobs/[jobId]/page.tsx:348`
- Fix: Count to answer in Discussion

## G2-11-002-013  [P2] GAP  facet F03  effort S
- Legacy: Review one by one primary button `docs/legacy-source/frontend/src/pages/recruiter/drives/[jobId].js:309`
- vNext now: Review shown as link when SUBMITTED `src/app/(authenticated)/hr/placements/jobs/[jobId]/page.tsx:517`
- Fix: Match CTA state/size

## G2-11-002-015  [P2] GAP  facet F03  effort S
- Legacy: Propose interview times collapse `docs/legacy-source/frontend/src/pages/recruiter/drives/[jobId].js:475`
- vNext now: External interview slots link `src/app/(authenticated)/hr/placements/jobs/[jobId]/page.tsx:769`
- Fix: Restore inline proposal

## G2-11-002-016  [P2] GAP  facet F04  effort S
- Legacy: Job type/CTC/location/mode/deadline subtitle `docs/legacy-source/frontend/src/pages/recruiter/drives/[jobId].js:229`
- vNext now: VNext header rounds/apply by metadata `src/app/(authenticated)/hr/placements/jobs/[jobId]/page.tsx:279`
- Fix: Restore subtitle order

## G2-11-002-018  [P2] GAP  facet F04  effort S
- Legacy: No students booked yet when no facts `docs/legacy-source/frontend/src/pages/recruiter/drives/[jobId].js:468`
- vNext now: Always displays zero counts `src/app/(authenticated)/hr/placements/jobs/[jobId]/page.tsx:803`
- Fix: Use conditional fallback

## G2-11-002-020  [P2] GAP  facet F04  effort S
- Legacy: CTC missing dash; raw LPA string `docs/legacy-source/frontend/src/pages/recruiter/drives/[jobId].js:500`
- vNext now: VNext INR conversion and em dash `src/app/(authenticated)/hr/placements/jobs/[jobId]/page.tsx:725`
- Fix: Match formatting

## G2-11-002-021  [P2] GAP  facet F04  effort S
- Legacy: Reply by D MMM,h:mm A `docs/legacy-source/frontend/src/pages/recruiter/drives/[jobId].js:502`
- vNext now: medium en-IN/IST date `src/app/(authenticated)/hr/placements/jobs/[jobId]/page.tsx:727`
- Fix: Exact date string

## G2-11-002-022  [P2] GAP  facet F04  effort S
- Legacy: Missing joining status renders - `docs/legacy-source/frontend/src/pages/recruiter/drives/[jobId].js:503`
- vNext now: Not recorded placeholder `src/app/(authenticated)/hr/placements/jobs/[jobId]/page.tsx:732`
- Fix: Use hyphen

## G2-11-002-023  [P2] GAP  facet F05  effort S
- Legacy: Stage chip row only if multiple stages `docs/legacy-source/frontend/src/pages/recruiter/drives/[jobId].js:313`
- vNext now: Stage tabs always rendered `src/app/(authenticated)/hr/placements/jobs/[jobId]/page.tsx:528`
- Fix: Conditional chips

## G2-11-002-026  [P2] GAP  facet F05  effort S
- Legacy: Your rating column conditional on notes existence `docs/legacy-source/frontend/src/pages/recruiter/drives/[jobId].js:549`
- vNext now: Rating in drawer, not grid `src/app/(authenticated)/hr/placements/jobs/[jobId]/page.tsx:612`
- Fix: Add conditional table rating

## G2-11-002-028  [P2] GAP  facet F05  effort S
- Legacy: Offers pageSize15 hideOnSinglePage `docs/legacy-source/frontend/src/pages/recruiter/drives/[jobId].js:496`
- vNext now: VNext 15 with visible nav `src/app/(authenticated)/hr/placements/jobs/[jobId]/page.tsx:664`
- Fix: Hide pagination for single page

## G2-11-002-029  [P2] GAP  facet F05  effort S
- Legacy: Round results bulk table pageSize25 `docs/legacy-source/frontend/src/pages/recruiter/drives/[jobId].js:620`
- vNext now: Results grid read-only with staging controls above `src/app/(authenticated)/hr/placements/jobs/[jobId]/page.tsx:855`
- Fix: Match bulk table geometry

## G2-11-002-036  [P2] GAP  facet F06  effort S
- Legacy: Slots RangePicker time and date; cap min1, optional panel `docs/legacy-source/frontend/src/pages/recruiter/drives/[jobId].js:690`
- vNext now: Link to slots route `src/app/(authenticated)/hr/placements/jobs/[jobId]/page.tsx:769`
- Fix: Match inline fields

## G2-11-002-067  [P2] GAP  facet F13  effort S
- Legacy: Not found title We could not find this drive `docs/legacy-source/frontend/src/pages/recruiter/drives/[jobId].js:195`
- vNext now: Generic notFound `src/app/(authenticated)/hr/placements/jobs/[jobId]/page.tsx:116`
- Fix: Route-specific copy

## G2-11-002-068  [P2] GAP  facet F13  effort S
- Legacy: No access to this college `docs/legacy-source/frontend/src/pages/recruiter/drives/[jobId].js:194`
- vNext now: Redirect dashboard `src/app/(authenticated)/hr/placements/jobs/[jobId]/page.tsx:95`
- Fix: Show ended state

## G2-11-002-071  [P2] GAP  facet F14  effort S
- Legacy: Download list CSV with disclosed columns `docs/legacy-source/frontend/src/pages/recruiter/drives/[jobId].js:546`
- vNext now: Export applicant API `src/app/(authenticated)/hr/placements/jobs/[jobId]/page.tsx:522`
- Fix: Same filename/columns

## G2-11-002-076  [P2] GAP  facet F15  effort S
- Legacy: Confidentiality text Students never see this `docs/legacy-source/frontend/src/pages/recruiter/drives/[jobId].js:840`
- vNext now: Discussion heading without helper `src/app/(authenticated)/hr/placements/jobs/[jobId]/page.tsx:475`
- Fix: Restore exact helper

## G2-11-002-077  [P2] GAP  facet F16  effort S
- Legacy: Legacy PageShell/Card responsive spacing `docs/legacy-source/frontend/src/pages/recruiter/drives/[jobId].js:208`
- vNext now: Flat section and media grids `src/app/(authenticated)/hr/placements/jobs/[jobId]/page.tsx:274`
- Fix: Match breakpoints

## G2-11-002-084  [P2] GAP  facet F18  effort S
- Legacy: No offers yet; invite to send selection `docs/legacy-source/frontend/src/pages/recruiter/drives/[jobId].js:496`
- vNext now: No offers yet; placement cell will issue `src/app/(authenticated)/hr/placements/jobs/[jobId]/page.tsx:735`
- Fix: Exact empty copy

## G2-11-002-085  [P2] GAP  facet F18  effort S
- Legacy: Date to be set by the placement cell `docs/legacy-source/frontend/src/pages/recruiter/drives/[jobId].js:466`
- vNext now: Date to be decided `src/app/(authenticated)/hr/placements/jobs/[jobId]/page.tsx:800`
- Fix: Exact copy
