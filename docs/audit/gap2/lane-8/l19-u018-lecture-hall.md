# L19-U018 — LectureHall audit

Evidence basename roots: `LectureHall*.java` and `LectureHalls.js` under `docs/legacy-source/backend/src/main/java/com/_42students/lms/` and `docs/legacy-source/frontend/src/pages/superadmin/sections/`; `lecture-halls.ts` in `src/db/schema/`, `lecture-hall-service.ts` in `src/modules/academics/`, `lecture-hall-manager.tsx` in `src/components/admin/`, `college/lecture-halls/page.tsx` in `src/app/(authenticated)/`. Reviewed DTO/controller/repository/service/room enum and new UI/schema; no code changes.

| ID | Facet | Legacy file:line | vNext file:line | Verdict | Severity | Fix | Effort |
|---|---|---|---|---|---|---|---|
| G2-19-018-001 | F01 | LectureHallController.java:86-101 global/org list | lecture-hall-service.ts:128-138 college-only list | GAP | P1 | Add scoped aggregate read | S |
| G2-19-018-002 | F02 | LectureHalls.js:303-305 two-column Create + Existing | lecture-hall-manager.tsx:188-200 modal Create | GAP | P2 | Restore inline create card | S |
| G2-19-018-003 | F03 | LectureHalls.js:268-295 icon Edit/Delete | lecture-hall-manager.tsx:232-239 Actions dropdown | GAP | P2 | Restore separate actions | S |
| G2-19-018-004 | F04 | LectureHall.java:15-27 deptId integer field | lecture-halls.ts:9 nullable department UUID | GAP | P2 | Map department IDs | S |
| G2-19-018-005 | F05 | LectureHalls.js:45-52 searches name and roomType | lecture-hall-service.ts:177-181 searches name only | GAP | P2 | Search type too | S |
| G2-19-018-006 | F06 | LectureHalls.js:366-368 capacity default50 max1000 | lecture-hall-service.ts:63 max5000 | GAP | P2 | Restore default50; decide input max | S |
| G2-19-018-007 | F07 | LectureHalls.js:341-344 Please enter room name | lecture-hall-manager.tsx:110 Enter a name | GAP | P3 | Use old validation copy | S |
| G2-19-018-008 | F08 | LectureHalls.js:221 Deleted successfully | lecture-hall-manager.tsx:175 Hall archived | GAP | P2 | Explain archive copy | S |
| G2-19-018-009 | F09 | LectureHalls.js:173-185 dirty close prompt | lecture-hall-manager.tsx:258 Cancel closes directly | GAP | P1 | Require discard confirmation | S |
| G2-19-018-010 | F10 | LectureHallController.java:162-195 DELETE permanent row | lecture-hall-service.ts:289-307 archive status | GAP | P1 | Reconcile delete semantics | S |
| G2-19-018-011 | F11 | LectureHallController.java:86-101 Super Admin org/global scope | lecture-hall-service.ts:128-133 selected college required | GAP | P1 | Allow scoped aggregate read | S |
| G2-19-018-012 | F12 | LectureHallServiceImpl.java:148-153 any scheduled class prevents delete | lecture-hall-service.ts:289-307 only upcoming SCHEDULED blocks archive | GAP | P1 | Define schedule conflict parity | S |
| G2-19-018-013 | F13 | LectureHalls.js:411-412 load error Retry | college/lecture-halls/page.tsx:52-65 invalid filters only | GAP | P2 | Add transient retry | S |
| G2-19-018-014 | F14 | LectureHalls.js:390-410 client CSV filtered rows | college/lecture-halls/page.tsx:99 server CSV | GAP | P2 | Match exported columns | S |
| G2-19-018-015 | F15 | LectureHallController.java:186-187 DELETE audit event | lecture-hall-service.ts:318-331 archived activity event | GAP | P2 | Map audit taxonomy | S |
| G2-19-018-016 | F16 | LectureHalls.js:303-305 lg two-column cards | college/lecture-halls/page.tsx:103 full-width filters | GAP | P2 | Recreate breakpoint geometry | S |
| G2-19-018-017 | F17 | LectureHalls.js:274-293 Edit/Delete aria labels | lecture-hall-manager.tsx:232-239 menu actions | GAP | P2 | Restore icon ARIA | S |
| G2-19-018-018 | F18 | LectureHalls.js:305 Create New Lecture Hall / Room | lecture-hall-manager.tsx:191 same text as button | GAP | P3 | Use heading not button title | S |
| G2-19-018-019 | F19 | LectureHalls.js:413-420 page size10 selectable | college/lecture-halls/page.tsx:80 constant size | GAP | P2 | Add 10/page selector | S |
| G2-19-018-020 | F20 | LectureHallServiceImpl.java:98-100 application name uniqueness lock | lecture-halls.ts:18 partial unique index | EXTRA | P3 | Keep DB constraint | S |
| G2-19-018-021 | F21 | LectureHallController.java:115-129 dept/college scope endpoints | lecture-hall-service.ts:167-235 query filter | GAP | P2 | Match picker filtering | S |
| G2-19-018-022 | F22 | LectureHall.java:26-27 RoomType JPA enum ordinal | lecture-halls.ts:13,22 text enumeration | GAP | P1 | Map ordinal to enum name | S |
| G2-19-018-023 | F23 | LectureHalls.js:216-229 hard-delete action | lecture-hall-manager.tsx:152-183 archive/restore | GAP | P2 | Document expanded lifecycle | S |
| G2-19-018-024 | F04 | LectureHalls.js:230-261 Description its own column | lecture-hall-manager.tsx:202 under name | GAP | P2 | Restore Description column | S |
| G2-19-018-025 | F06 | LectureHalls.js:372-374 Description rows2 textarea | lecture-hall-manager.tsx:304-307 single-line Input | GAP | P2 | Use textarea rows2 | S |
| G2-19-018-026 | F07 | LectureHallServiceImpl.java:80-85 duplicate text includes name | lecture-hall-manager.tsx:63-66 generic duplicate | GAP | P2 | Include room name | S |
| G2-19-018-027 | F08 | LectureHalls.js:141,207 create/update success text | lecture-hall-copy.ts:23-24 same copy | MATCH | P3 | Keep these exact toasts | S |
| G2-19-018-028 | F10 | LectureHallController.java:56-78 create returns 200 envelope | lecture-hall-service.ts:237-267 row/event | GAP | P2 | Map response compatibility | S |
| G2-19-018-029 | F12 | LectureHallServiceImpl.java:39-59 trims and capacity1..5000 | lecture-hall-service.ts:51-67 same range | MATCH | P3 | Keep server bounds | S |
| G2-19-018-030 | F22 | LectureHall.java:11-27 int PK in singular table | lecture-halls.ts:6-16 UUID PK plural table | GAP | P1 | Define legacy-to-new ID mapping | M |

23 facets, 30 distinct rows. Follow-up detail: preserve vNext UUID and tenant checks while reconciling legacy room CRUD, filters, pagination, layout and enum conversion.
