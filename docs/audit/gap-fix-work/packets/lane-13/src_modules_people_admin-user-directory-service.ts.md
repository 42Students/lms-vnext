# Work packet: edit src/modules/people/admin-user-directory-service.ts

3 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-8/people-directory-component.md, docs/audit/gap2/lane-15/learner-search-controller.md

## G2-8-003-015  [P1] GAP  facet F05  effort M
- Legacy: `.../components/contacts/ContactsGrid.js:105-116`: client substring name/email/mobile search
- vNext now: `src/modules/people/college-contacts-service.ts:51-64`: name/staff email only, admin `admin-user-directory-service.ts:26-29` name/college
- Fix: Set explicit privacy-safe cross-role search behavior, do not enable learner PII enumeration

## G2-8-003-030  [P1] GAP  facet F11  effort M
- Legacy: `.../controller/UserController.java:441-447`: selected-college staff read, excluding learner and recruiter
- vNext now: `src/modules/people/college-contacts-service.ts:21-35`: only active College Admin; `admin-user-directory-service.ts:10-14` only Super Admin
- Fix: Define read-only staff permissions and blocked-role UX; do not assume role parity means safe raw contact exposure

## G2-15-013-033  [P3] GAP  facet F07  effort S
- Legacy: Popular success Popular learners retrieved. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/search/learners/LearnerSearchController.java:156-157`)
- vNext now: Generic list result no success envelope. (`src/modules/people/admin-user-directory-service.ts:55-58`)
- Fix: Restore response contract if search autocomplete consumers depend on it.
