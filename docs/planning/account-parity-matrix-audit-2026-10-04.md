# Account parity matrix audit — 2026-10-04

## Why this audit exists

Matrix v1 was created from top-level route/navigation comparison. Before continuing implementation, it was adversarially audited to catch omissions caused by:
- hidden/deep-link routes;
- pages reachable only from another page rather than the sidebar;
- redirect stubs mistaken for product pages;
- reusable components accidentally living under Next.js `src/pages`;
- giant pages represented by one umbrella checklist row;
- public/ops surfaces outside the seven account sidebars.

## Evidence checked

1. Complete legacy `src/pages` tree at `38cdd38e592a6f416c8e8e99ce36438f548ed577`.
2. Learner/Faculty/Mentor/TPO/HR navigation definitions.
3. College Admin and Super Admin grouped navigation definitions.
4. Course tabs and placement tabs.
5. TPO Leads, Company, Drive, Students, Calendar, Reports, Settings, Notifications, More and Profile.
6. HR Home/Profile/Drive/Calendar/Messages/Company surfaces.
7. Mentor redirect stubs and conditional landing.
8. Super Admin Tenant Setup/Settings/Module Access/HR Accounts.
9. Admin/Super Admin Project list/template/workspace section taxonomy.
10. Shared/public pages, protected standalone AI grading, auth handoff, recruiter invite, company share, tracker and marketing/legal surfaces.

## Mechanical result

Legacy contains **294 non-API files under `src/pages`** at the audited SHA.

Important categories include:
- 65 reusable component files under Pages Router paths (`Dashboard/course/**`, `superadmin/sections/**`) that are not intended product destinations;
- redirect-only routes for several old Mentor/Faculty/HR paths;
- account pages not present in sidebar navigation;
- shared/public/ops product routes that matrix v1 did not track.

The exhaustive file-by-file classification is in `docs/planning/legacy-ui-route-manifest.md`.

## Material matrix-v1 corrections

- Added TPO Companies.
- Added TPO Profile.
- Upgraded TPO More from VERIFY to MISSING because it is a real secondary/mobile utility page.
- Downgraded role-specific Notifications from automatic DONE to PARTIAL where behavior is not proven.
- Reclassified Mentor Courses/Contacts/All Quizzes/File Explorer/Profile as RETIRED redirect stubs.
- Reclassified Faculty File Explorer as RETIRED redirect stub.
- Reclassified HR `/hr/colleges` as RETIRED redirect; chooser behavior remains tracked on HR Home.
- Added Mentor conditional landing / Projects-disabled state.
- Split TPO Drive detail into tabs and critical actions.
- Split HR Drive detail into tabs and nested interview/result/offer actions.
- Split TPO Settings into ten sections.
- Split TPO Reports into ten named reports.
- Split TPO Students into intelligence, roster, requests and bulk workflows.
- Split College/Super Admin project workspace into ten explicit sections.
- Split Super Admin tenant onboarding, settings groups, module-access explainability and HR-account administration.
- Added public recruiter invite and company-share workflows.
- Added auth handoff, standalone AI grading, tracker/ops, marketing/legal and custom error surfaces for explicit ownership decisions.

## Guardrail added

`npm run parity:status` now counts every terminal matrix status. Parity release closure requires zero PARTIAL, MISSING, VERIFY and BLOCKED rows.

This audit does **not** mean no future legacy change can add a surface. Final sign-off still requires a fresh diff against the latest `prod-2026`.


## Final negative route-coverage check

After matrix v2 was written, the frozen route manifest was checked back against the matrix in the opposite direction: every route classified as account product, shared product, operational tool, public marketing or error surface had to have a textual matrix/accounting footprint.

- candidate real routes checked: **210**
- unmatched after tightening exact route references: **0**

This is route-level completeness for the audited legacy SHA. It does not replace section/action/workflow auditing, which remains encoded as PARTIAL/MISSING rows.


## Second-layer page/workflow audit

The route-complete master matrix still left one failure mode: a page could be represented while an internal tab, button, form, modal, drawer, filter, empty state or permission-sensitive workflow was forgotten.

A second layer was therefore added under `docs/parity/`:

- Learner
- Faculty
- Mentor
- College Admin
- Super Admin
- TPO
- HR / Recruiter
- Shared / public / operational

The specs were built by reading the actual legacy route files **and the components they render**. They enumerate, page by page:
- sections/tabs/cards/KPIs;
- primary and secondary actions;
- forms and validation;
- filters/search/sort/pagination/URL state;
- modals/drawers/popovers/confirmation flows;
- loading/empty/error/stale/partial-data states;
- role/tenant/read-only boundaries;
- destructive consequences/audit/history;
- responsive/mobile behavior;
- regression coverage.

Initial detailed inventory: **1,517 closure checks** across the eight specs. 9 were already evidence-backed as checked at creation and 1,508 were intentionally left open until exact vNext comparison. That raw ratio must never be presented as overall LMS implementation completeness.

Examples of hidden work now made explicit include:
- Learner Applications detail/history/company-preview/withdrawal/offer-confirmation modals;
- Learner Interviews detail/reschedule/summary/withdrawal flows;
- Learner Profile's full resume/identity/experience/education/skills/projects/certifications/achievements/languages/extracurricular/hobbies/job-preferences surface;
- College Admin Batch Students + Move Student modals;
- College Admin recurring Class schedule modal and attendance Session/Record correction modals;
- Student Group lock/remove/add/rule-preview/apply/history workflows;
- Super Admin DNS verification/primary-domain destructive confirmation, Module Access drawers and access trace, HR Account detail/access/session controls;
- TPO Leads table/board/companies, import/invite/not-now/prepared-message overlays;
- TPO Drive publish/reject/send-back/extend/cancel/share/messages workflows;
- TPO Settings' ten operational sections and Reports' ten report types;
- HR Drive round/applicant/slot/result/selection/message workflows;
- recruiter invite, company applicant sharing, auth handoff, AI grading and Tracker operations.

## Second-layer release gate

`npm run parity:pages` counts these checkboxes. Final parity requires **zero open detailed checks** in addition to a blocker-free master matrix.

A page is never complete merely because the route renders.
