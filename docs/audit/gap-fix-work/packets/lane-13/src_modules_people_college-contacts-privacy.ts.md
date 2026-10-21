# Work packet: edit src/modules/people/college-contacts-privacy.ts

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-8/college-admin-people.md

## G2-8-001-011  [P1] GAP  facet F04  effort M
- Legacy: `service/impl/UserServiceImpl.java:84-90,97-103` (backend): email/mobile/phone and website avatar populated from role record
- vNext now: `modules/people/college-contacts-service.ts:74-105` selects canonical name,email,phone and `college-contacts-privacy.ts:1-17` masks phone plus learner email
- Fix: Document consent/privacy decision: raw legacy learner/staff contact fields intentionally masked; preserve restriction, do not reveal protected values
