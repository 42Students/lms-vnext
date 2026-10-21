# Work packet (wave 2): edit src/app/(authenticated)/hr/profile/page.tsx

20 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-1/recruiter-profile.md, docs/audit/gap2/lane-10/recruiter-self-controller.md

## G2-1-035-002  [P2] GAP  facet F01  effort S
- Legacy: docs/legacy-source/frontend/src/pages/recruiter/profile.js:145-151: header title 'Profile', dirty badge top-right.
- vNext now: src/app/(authenticated)/hr/profile/page.tsx:20-24: PageHeader Profile + subtitle; E:89 dirty near bottom save row.
- Fix: Move Unsaved changes indicator into page heading.

## G2-1-035-004  [P2] GAP  facet F02  effort S
- Legacy: docs/legacy-source/frontend/src/pages/recruiter/profile.js:153-205: two-column layout main Your details + College access, sidebar Account.
- vNext now: src/app/(authenticated)/hr/profile/page.tsx:26-154: full-width stacked Your details, Account, Recruiter account status, College access.
- Fix: Restore two-column recruiter-profile__layout and card hierarchy.

## G2-1-035-005  [P2] GAP  facet F02  effort S
- Legacy: docs/legacy-source/frontend/src/pages/recruiter/profile.js:155-158: Your details Card description, alert, form.
- vNext now: src/app/(authenticated)/hr/profile/page.tsx:26-40: section border-b with extra About these details disclosure.
- Fix: Use AntD-style Card title and description immediately visible.

## G2-1-035-006  [P2] GAP  facet F02  effort S
- Legacy: docs/legacy-source/frontend/src/pages/recruiter/profile.js:179-190: College access second card, list per school.
- vNext now: src/app/(authenticated)/hr/profile/page.tsx:94-154: College access last, header/list + details-based table.
- Fix: Place college-access card above Account sidebar.

## G2-1-035-007  [P2] GAP  facet F02  effort S
- Legacy: docs/legacy-source/frontend/src/pages/recruiter/profile.js:193-203: Account sidebar card with Work email, Company, College.
- vNext now: src/app/(authenticated)/hr/profile/page.tsx:40-59: Work email under Your details and Company in separate Account; College not there.
- Fix: Reunite three read-only account fields in aside.

## G2-1-035-013  [P2] GAP  facet F03  effort S
- Legacy: docs/legacy-source/frontend/src/pages/recruiter/profile.js:194-202: Account read-only Descriptions Work email/Company/College.
- vNext now: src/app/(authenticated)/hr/profile/page.tsx:40-58: name/email/company separately, no College identity field.
- Fix: Show selected college or '—' in Account Card.

## G2-1-035-017  [P2] GAP  facet F04  effort S
- Legacy: docs/legacy-source/frontend/src/pages/recruiter/profile.js:196-199: read-only work email, companyName, selected collegeName.
- vNext now: src/app/(authenticated)/hr/profile/page.tsx:40-58: work email and company, no selected college name.
- Fix: Render current college as an Account row.

## G2-1-035-054  [P2] GAP  facet F13  effort S
- Legacy: docs/legacy-source/frontend/src/pages/recruiter/profile.js:115-124: DetailSkeleton label Loading recruiter profile.
- vNext now: src/app/(authenticated)/hr/profile/page.tsx:13-20: async server data load without identical route-specific skeleton.
- Fix: Add old skeleton state at loading.tsx.

## G2-1-035-061  [P2] GAP  facet F16  effort S
- Legacy: docs/legacy-source/frontend/src/pages/recruiter/profile.js:153-205: main+aside recruiter-profile__layout; 2 columns and card grid.
- vNext now: src/app/(authenticated)/hr/profile/page.tsx:20-154: all sections full-width, no recruiter-specific aside.
- Fix: Recreate 2-column desktop layout.

## G2-1-035-066  [P2] GAP  facet F18  effort S
- Legacy: docs/legacy-source/frontend/src/pages/recruiter/profile.js:202: 'ask the placement cell' to change company name/logo.
- vNext now: src/app/(authenticated)/hr/profile/page.tsx:56: 'Ask 42 if its name or logo is wrong.'
- Fix: Change guidance to placement cell.

## G2-1-035-067  [P2] GAP  facet F18  effort S
- Legacy: docs/legacy-source/frontend/src/pages/recruiter/profile.js:196-198: 'Work email', 'Company', 'College' empty '—'.
- vNext now: src/app/(authenticated)/hr/profile/page.tsx:40-59: 'Work email' default Not provided, Company raw, College absent.
- Fix: Use em dash placeholders and College field.

## G2-10-025-002  [P2] GAP  facet F01  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/RecruiterSelfController.java:131-166 — GET /me supports global chooser and scoped session.
- vNext now: src/app/(authenticated)/hr/profile/page.tsx:13-17; src/app/(authenticated)/hr/home/page.tsx:42-73 — Profile and Today perform direct scoped reads.
- Fix: Expose one canonical self/session payload for chooser and profile

## G2-10-025-005  [P2] GAP  facet F02  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/RecruiterSelfController.java:131-166 — /me response user/scope/collegeId/capabilities/colleges and globalMembershipKey.
- vNext now: src/app/(authenticated)/hr/profile/page.tsx:19-119 — Page splits details, account, status and access areas.
- Fix: Expose fields in equivalent profile/chooser UI

## G2-10-025-010  [P2] GAP  facet F03  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/RecruiterSelfController.java:189-191 — College item shows validUntil and accessStatus.
- vNext now: src/app/(authenticated)/hr/profile/page.tsx:94-119 — Profile grant list hides explicit expiry/status in mapped props.
- Fix: Expose grant validity and state badges

## G2-10-025-025  [P2] GAP  facet F06  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/RecruiterSelfController.java:233-237 — firstName cleans/trims/max100; lastName max100.
- vNext now: src/app/(authenticated)/hr/profile/page.tsx:35-38; src/modules/placements/recruiter-profile-details-service.ts:20-22 — Name join from new displayName model, max may differ.
- Fix: Align split name max100 and sanitize behavior

## G2-10-025-040  [P2] GAP  facet F09  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/RecruiterSelfController.java:227-255 — Controller edit body all fields in one PUT.
- vNext now: src/app/(authenticated)/hr/profile/page.tsx:26-47 — Profile editor nested in page and save through PATCH, not modal.
- Fix: Preserve field grouping and no unnecessary modal

## G2-10-025-063  [P2] GAP  facet F13  effort S
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/RecruiterSelfController.java:258-267 — Unauthorized/inactive recruiter returns 403 before body.
- vNext now: src/app/(authenticated)/hr/profile/page.tsx:13-16 — Redirect /dashboard for inactive account.
- Fix: Offer explicit access-denied state and safe login route

## G2-1-035-051  [P3] GAP  facet F12  effort S
- Legacy: docs/legacy-source/frontend/src/pages/recruiter/profile.js:15-16: different company requires new account.
- vNext now: src/app/(authenticated)/hr/profile/page.tsx:44-56: equivalent email/company concept; company name message says ask 42 not placement cell.
- Fix: Use original placement-cell guidance to avoid platform support confusion.

## G2-10-025-080  [P3] GAP  facet F18  effort S
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/RecruiterSelfController.java:242-244 — Work email error exact 'Your work email is how you sign in, so it can't be changed here.'
- vNext now: src/app/(authenticated)/hr/profile/page.tsx:40-45 — Explanation similar but adds company sentence.
- Fix: Use exact copy in field-level help

## G2-10-025-083  [P3] GAP  facet F18  effort S
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/RecruiterSelfController.java:260-260 — Forbidden actor 'Recruiter access required'.
- vNext now: src/app/(authenticated)/hr/profile/page.tsx:15-16 — Redirect dashboard, not copy.
- Fix: Add explicit safe denial text
