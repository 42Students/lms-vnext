# Work packet (wave 2): edit src/modules/people/college-contacts-service.ts

21 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-1/user-controller.md, docs/audit/gap2/lane-8/college-admin-people.md, docs/audit/gap2/lane-8/people-directory-component.md

## G2-1-008-004  [P2] GAP  facet F01  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/UserController.java:434-439`: GET /contacts?userType&collegeId&pageNumber&pageSize.
- vNext now: `src/app/(authenticated)/college/contacts/page.tsx:26-35`,`src/modules/people/college-contacts-service.ts:16-24`: /college/contacts server-read page, not same endpoint.
- Fix: Map legacy contacts consumers to the scoped new service and link.

## G2-1-008-005  [P2] GAP  facet F01  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/UserController.java:510-551`: GET learnerContactsByProgramId and facultyContactsByDeptId.
- vNext now: `src/modules/people/college-contacts-service.ts:49-61`: academic filter predicates inside college directory; no identical API.
- Fix: Provide permissioned replacement route or documented client mapping for each specialized endpoint.

## G2-1-008-016  [P2] GAP  facet F04  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/dto/response/ContactDTO.java:7-13`: firstName,lastName,userType,email,contactMobile,contactPhone,profileImageUrl.
- vNext now: `src/modules/people/college-contacts-service.ts:78-99`: displayName, roles, status, joinedAt, masked phone/email, membershipId.
- Fix: Write complete field-by-field conversion preserving allowed fields.

## G2-1-008-017  [P2] MISSING  facet F04  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/UserServiceImpl.java:83-90`,`docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/UserServiceImpl.java:95-104`: contact profile image sourced from website.
- vNext now: `src/modules/people/college-contacts-service.ts:78-97`: no photo selected; `src/app/(authenticated)/college/contacts/page.tsx:214-235` no image cell.
- Fix: Fetch authorized profile image and fallback initial without leaking private URL.

## G2-1-008-019  [P2] GAP  facet F04  effort S
- Legacy: `docs/legacy-source/frontend/src/components/contacts/ContactsGrid.js:125-130`: first and last concatenation; fallback em dash.
- vNext now: `src/modules/people/college-contacts-service.ts:95-97`: trimmed displayName fallback `Unnamed person`.
- Fix: Adopt one documented empty-name display policy; reflect legacy dash where needed.

## G2-1-008-021  [P2] GAP  facet F04  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/UserController.java:457-479`: response ContactResponseDTO contactDTOList and size.
- vNext now: `src/modules/people/college-contacts-service.ts:99`: result items/total/filter/pageSize.
- Fix: Translate response shape for old consumers, avoiding unauthorized broad directory reads.

## G2-1-008-025  [P2] GAP  facet F05  effort S
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/UserServiceImpl.java:107-130`,`docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/UserController.java:448-475`: faculty-first then learner order before in-memory page.
- vNext now: `src/modules/people/college-contacts-service.ts:71-83`: default case-insensitive display-name A-Z with ID tie break.
- Fix: Decide legacy order versus new stable alphabetical default and document sort UX.

## G2-1-008-054  [P2] GAP  facet F10  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/UserController.java:510-551`: filtered program/dept contact DTO endpoints.
- vNext now: `src/modules/people/college-contacts-service.ts:49-61`,`src/modules/people/college-contacts-service.ts:78-99`: scoped academic filters and canonical member rows.
- Fix: Implement per-resource authorization on replacements, response conversion.

## G2-1-008-062  [P2] GAP  facet F12  effort S
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/UserServiceImpl.java:94-130`: `student`/`learner` aliases; otherwise faculty followed by learner.
- vNext now: `src/modules/people/college-contacts-model.ts:12`,`src/modules/people/college-contacts-service.ts:38-39`: typed STUDENT/FACULTY/ALL and coalesced roles.
- Fix: Map old learner alias and explain merged dual-role row count.

## G2-1-008-086  [P2] GAP  facet F22  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/UserController.java:448-475`,`docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/UserServiceImpl.java:77-133`: separate Faculty/Learner contacts arrays, possible dual rows.
- vNext now: `src/db/schema/memberships.ts:17-67`,`src/modules/people/college-contacts-service.ts:78-97`: one canonical User+college membership with role list.
- Fix: Crosswalk dual-role de-duplication and statuses, tenant uniqueness and name.

## G2-8-001-012  [P2] GAP  facet F04  effort S
- Legacy: `components/contacts/ContactsGrid.js:125,241-250`: blank names/email/contact represented by em dash
- vNext now: `modules/people/college-contacts-service.ts:96-104` uses `Unnamed person`, `Not provided`, masked values
- Fix: Use legacy em dash for non-sensitive absent display values; retain intentional masking and descriptive privacy text

## G2-8-001-013  [P2] GAP  facet F04  effort M
- Legacy: `dto/response/ContactDTO.java:7-13`: firstName,lastName,userType,email,contactMobile,contactPhone,profileImageUrl
- vNext now: `modules/people/college-contacts-service.ts:12-15`: membershipId,name,email,phone,roles,status,joinedAt; no image/secondary phone
- Fix: Add role-profile image read-model or explicit no-photo fallback; map contact vs secondary phone consistently

## G2-8-001-028  [P2] GAP  facet F10  effort M
- Legacy: `hooks/useContacts.js:17-27`: GET `/users/contacts` params userType,collegeId,pageNumber,pageSize; no mutations
- vNext now: `modules/people/college-contacts-service.ts:16-18,78-90`: server Drizzle reads via `listCollegeContacts`, no API GET in page; `/api/college/contacts/export` separately
- Fix: Document endpoint mapping and ensure result/total/error equivalence; do not reintroduce legacy endpoint unnecessarily

## G2-8-001-032  [P2] GAP  facet F12  effort M
- Legacy: `service/impl/UserServiceImpl.java:77-130`: Faculty tab all faculty records, Student tab all learners, All concatenates faculty then learner; duplicate dual-role possible
- vNext now: `modules/people/college-contacts-service.ts:39-51,92-105`: one collegeMembership per user, role predicates faculty/learner; one dual-role item
- Fix: Decide dual-role legacy duplicate semantics vs identity de-duplication; display clear dual-role indicator

## G2-8-001-045  [P2] GAP  facet F20  effort M
- Legacy: `components/contacts/ContactsGrid.js:105-116`: lowercased substring search matches emails/mobiles including `%` characters literally
- vNext now: `modules/people/college-contacts-service.ts:51-64`: SQL ilike wildcards escaped, excludes learner email and mobile from search
- Fix: Test escaped `%`, `_`, backslashes and casefold parity without weakening PII masking

## G2-8-001-049  [P2] GAP  facet F22  effort M
- Legacy: `dto/response/ContactDTO.java:7-13`: separate firstName and lastName
- vNext now: `db/schema/users.ts:19`, `modules/people/college-contacts-service.ts:92-105`: single displayName
- Fix: Verify lossless display for split names, whitespace and initials; use canonical split metadata only if available

## G2-8-003-011  [P2] GAP  facet F04  effort M
- Legacy: `.../dto/response/ContactDTO.java:7-13`: split names, userType, email, contactMobile, contactPhone, profileImageUrl
- vNext now: `src/modules/people/college-contacts-service.ts:12-15,92-105` and `admin-user-directory-service.ts:31-42`: displayName/phone/roles/status, no profileImageUrl
- Fix: Map image and split names if available; avoid inventing legacy secondary phone from canonical phone

## G2-8-003-012  [P2] GAP  facet F04  effort S
- Legacy: `.../components/contacts/ContactsGrid.js:125,241-250`: absent name/contact shown as em dash
- vNext now: `src/modules/people/college-contacts-service.ts:96-104`: Unnamed person/Not provided; admin directory `page.tsx:124-127` Unnamed user/No email recorded
- Fix: Normalize absent-value text to legacy em dash where privacy explanation not required

## G2-8-003-027  [P2] GAP  facet F10  effort M
- Legacy: `.../hooks/useContacts.js:17-45`: GET `/users/contacts`, AbortController, success maps contactDTOList+size, 0-based paging
- vNext now: `src/modules/people/college-contacts-service.ts:16-105` and `admin-user-directory-service.ts:8-59`: server DB reads, 1-based paging
- Fix: Write explicit API-to-query adapter expectations, preserve filters/total and cancellation semantics

## G2-8-003-031  [P2] GAP  facet F12  effort M
- Legacy: `.../service/impl/UserServiceImpl.java:81-130`: FACULTY, LEARNER filter or combined concat; dual-role yields two rows
- vNext now: `src/modules/people/college-contacts-service.ts:39-51,92-105`: role predicates with one membership row, admin service aggregates roles
- Fix: Document de-duplication and role precedence for dual-role identities

## G2-1-008-081  [P3] GAP  facet F20  effort S
- Legacy: `docs/legacy-source/frontend/src/components/contacts/ContactsGrid.js:32-37`,`docs/legacy-source/frontend/src/components/contacts/ContactsGrid.js:62-69`: stable tinted initials avatar, blank name becomes `?`.
- vNext now: `src/modules/people/college-contacts-service.ts:95-97`,`src/app/(authenticated)/college/contacts/page.tsx:215-217`: name fallback `Unnamed person` without avatar.
- Fix: Implement deterministic tint and character fallback across very long names.
