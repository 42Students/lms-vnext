# Work packet: edit src/modules/people/college-contacts-service.ts

9 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-1/user-controller.md, docs/audit/gap2/lane-8/college-admin-people.md, docs/audit/gap2/lane-8/people-directory-component.md

## G2-1-008-055  [P1] GAP  facet F11  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/UserController.java:441-447`: staff-only contacts (excludes learner/recruiter), college access check.
- vNext now: `src/modules/people/college-contacts-service.ts:21-31`: college directory requires active COLLEGE_ADMIN and people.manage.
- Fix: Preserve faculty staff contact lookup through separate authorized view/service.

## G2-1-008-056  [P1] GAP  facet F11  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/UserController.java:512-516`,`docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/UserController.java:535-539`: requireAccessProgram and requireAccessDepartment.
- vNext now: `src/modules/people/college-contacts-service.ts:21-31`,`src/modules/people/college-contacts-service.ts:49-61`: college-admin permission plus academic filters.
- Fix: Require program/department scope on any replacement API, not just college scope.

## G2-8-001-011  [P1] GAP  facet F04  effort M
- Legacy: `service/impl/UserServiceImpl.java:84-90,97-103` (backend): email/mobile/phone and website avatar populated from role record
- vNext now: `modules/people/college-contacts-service.ts:74-105` selects canonical name,email,phone and `college-contacts-privacy.ts:1-17` masks phone plus learner email
- Fix: Document consent/privacy decision: raw legacy learner/staff contact fields intentionally masked; preserve restriction, do not reveal protected values

## G2-8-001-015  [P1] GAP  facet F05  effort M
- Legacy: `components/contacts/ContactsGrid.js:105-116`: immediate client-side case-insensitive match over name,email,mobile
- vNext now: `modules/people/college-contacts-service.ts:51-64`: server name or staff-only email filtering; no mobile search
- Fix: Document privacy-driven omission of learner email/mobile search; preserve masking, optionally enable safe staff mobile search within authorized college

## G2-8-001-030  [P1] GAP  facet F11  effort S
- Legacy: `pages/college-admin/people.js:7-17`: missing college shows warning `Admin not assigned to a college`
- vNext now: `app/(authenticated)/college/contacts/page.tsx:27-28`: membership/role guard redirects; service active college and persisted permission `college-contacts-service.ts:21-35`
- Fix: Preserve actionable missing-college warning while restricting unscoped contact access

## G2-8-001-031  [P1] GAP  facet F11  effort M
- Legacy: `controller/UserController.java:441-447`: same-college staff allowed; learners/recruiters denied
- vNext now: `modules/people/college-contacts-service.ts:20-35`: only active COLLEGE_ADMIN membership permitted
- Fix: Decide if faculty/TPO directory role is intentionally removed; if yes document policy and provide staff alternate; else extend read-only scope safely

## G2-8-003-015  [P1] GAP  facet F05  effort M
- Legacy: `.../components/contacts/ContactsGrid.js:105-116`: client substring name/email/mobile search
- vNext now: `src/modules/people/college-contacts-service.ts:51-64`: name/staff email only, admin `admin-user-directory-service.ts:26-29` name/college
- Fix: Set explicit privacy-safe cross-role search behavior, do not enable learner PII enumeration

## G2-8-003-023  [P1] GAP  facet F07  effort M
- Legacy: `.../controller/UserController.java:441-447`: blocks learners/recruiters, enforces selected college
- vNext now: `src/modules/people/college-contacts-service.ts:21-35`: only active College Admin; admin directory service `:10-18` Super Admin
- Fix: Document intentional restriction and verify faculty/TPO access expectations before extending

## G2-8-003-030  [P1] GAP  facet F11  effort M
- Legacy: `.../controller/UserController.java:441-447`: selected-college staff read, excluding learner and recruiter
- vNext now: `src/modules/people/college-contacts-service.ts:21-35`: only active College Admin; `admin-user-directory-service.ts:10-14` only Super Admin
- Fix: Define read-only staff permissions and blocked-role UX; do not assume role parity means safe raw contact exposure
