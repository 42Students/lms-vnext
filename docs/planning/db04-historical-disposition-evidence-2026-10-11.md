# DB04 historical disposition evidence — 2026-10-11

**Worker:** Chat 3 / DB-007  
**Evidence level:** source/disposition only; no retirement approval and no PostgreSQL/runtime verification  
**Legacy backend:** `21bad59d4dfaf2fa11fdeaf9353327ce105697d5`  
**Legacy frontend:** `e6b09e6dd14ac7b6a0dae1697a7c08ddb27cdde2`

## student_registration

The historical snapshot contains a tenant-scoped `student_registration` table with `source='crm_sync'`, copied learner/contact/academic identifiers, sync timestamp and metadata.

Independent DB02 work now records `EXTERNAL_STUDENT_REGISTRATION_NO_DB02_DEPENDENCY` with status `SOURCE_EVIDENCE_NO_DB02_DEPENDENCY_PRODUCT_RETIREMENT_OPEN`: pinned legacy backend/frontend searches found zero `student_registration` / `crm_sync` consumers, the canonical academics model has no dependency on this table, and the connected-source peer sweep found no producer.

Do not recreate it in canonical DB02/DB04 and do not confuse it with `placement_registration`. If a detached external roster/CRM importer exists, model that actual contract separately. Otherwise explicit product retirement can close it.

## approver_id_card

The historical snapshot shows `approver_id_card.assigned_exam_id -> assigned_exam.id`. The same snapshot contains `assigned_exam`, `attempted_question` and `examinee`.

Independent DB06 reconciliation classifies those parents in a 12-table / 128-field historical exam/proctoring retirement-candidate family, with no current JPA entity and no frozen current UI route.

Chat 3 additionally checked the current production tree: no `AssignedExam`, `ApproverIdCard`, `AttemptedQuestion`, or current `Examinee` implementation class exists; current question code uses the first-class `QuizQuestion` model.

Every Flyway migration after the V150 snapshot was inspected: **44 migrations, V151–V194, zero references** to `approver_id_card`, `assigned_exam`, `attempted_question`, or `examinee`.

Do not clone `approver_id_card` into vNext merely because it survives in the historical snapshot. A future proctor identity/evidence feature should be designed against the current assessment engine plus secure object receipts.

## Gate impact

- 33 historical DB04 fields now have strong source retirement-candidate evidence.
- 0 historical DB04 fields have explicit retirement approval.
- 0 DB04 fields are PostgreSQL/runtime verified.
- Active qualification/profile-image/private-document work still requires W01 registration and independent PostgreSQL witnesses.

This narrows the blockers without turning source absence into a false verified-retirement claim.
