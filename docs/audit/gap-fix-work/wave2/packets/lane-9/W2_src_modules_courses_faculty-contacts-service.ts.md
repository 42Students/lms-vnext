# Work packet (wave 2): edit src/modules/courses/faculty-contacts-service.ts

3 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-6/teacher-contacts-tab.md

## G2-6-004-017  [P2] GAP  facet F04  effort M
- Legacy: Old image source mapped `Faculty.website` or `Learner.website` into profileImageUrl `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/UserServiceImpl.java:84-91` `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/UserServiceImpl.java:96-104`
- vNext now: New list does not select/serve photo field `src/modules/courses/faculty-contacts-service.ts:72-79`
- Fix: Implement safe profile photo field or initials fallback; never render arbitrary website URL without validation

## G2-6-004-043  [P2] GAP  facet F12  effort M
- Legacy: Old fetches learnerList and facultyList even for one role `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/UserServiceImpl.java:77-80`
- vNext now: New per-role SQL filtering and active account constraints `src/modules/courses/faculty-contacts-service.ts:58-99`
- Fix: Compare totals when legacy includes suspended/deleted users; document exclusion policy

## G2-6-004-070  [P2] GAP  facet F22  effort M
- Legacy: Old userType is one string and All merges both lists `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/UserServiceImpl.java:81-133`
- vNext now: New membership may contain several roles, All returns one membership with role array `src/modules/courses/faculty-contacts-service.ts:72-115` `src/db/schema/memberships.ts:52-68`
- Fix: Define duplicate handling and labels for multi-role users across All/Teachers/Students
