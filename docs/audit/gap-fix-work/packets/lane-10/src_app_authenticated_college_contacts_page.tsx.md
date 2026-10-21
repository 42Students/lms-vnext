# Work packet: edit src/app/(authenticated)/college/contacts/page.tsx

4 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-8/college-admin-people.md, docs/audit/gap2/lane-8/people-directory-component.md, docs/audit/gap2/lane-1/user-controller.md

## G2-8-001-023  [P1] GAP  facet F07  effort M
- Legacy: `controller/UserController.java:441-447`: learner/recruiter forbidden with text `The contacts directory is for staff only`
- vNext now: `app/(authenticated)/college/contacts/page.tsx:27-28`: non-College Admin redirected to dashboard
- Fix: Confirm intended faculty/TPO staff eligibility; return role-appropriate denial instead of always redirecting permitted staff

## G2-8-001-030  [P1] GAP  facet F11  effort S
- Legacy: `pages/college-admin/people.js:7-17`: missing college shows warning `Admin not assigned to a college`
- vNext now: `app/(authenticated)/college/contacts/page.tsx:27-28`: membership/role guard redirects; service active college and persisted permission `college-contacts-service.ts:21-35`
- Fix: Preserve actionable missing-college warning while restricting unscoped contact access

## G2-8-003-021  [P1] GAP  facet F07  effort M
- Legacy: `.../PeopleDirectory.js:37-38`: when no valid collegeId, `Select a college to browse contacts` warning
- vNext now: `src/app/(authenticated)/college/contacts/page.tsx:27-28`: unauthorized redirect; admin directory `page.tsx:24-25,60-61`: global view possible
- Fix: Match no-college warning in each context; retain Super Admin safe global mode only with explicit policy

## G2-1-008-040  [P2] GAP  facet F07  effort S
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/UserController.java:513-515`,`docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/UserController.java:535-537`: positive-integer program/department messages.
- vNext now: `src/modules/people/college-contacts-model.ts:22-25`,`src/app/(authenticated)/college/contacts/page.tsx:32-34`: UUID filters and generic contact filter error.
- Fix: Map invalid identifiers to field-specific errors for migrated consumers.
