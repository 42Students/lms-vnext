# Lane chat-15 wave 1 proof

- `src_db_schema_placements.ts.part1of15.md` | Applied schema foundations for G2-3-011-034, G2-15-019-007/014/028, G2-10-004-019/087/088, G2-15-022-047, G2-1-009-055; existing academic basis point fields checked. Created migration 0138. | Skipped/deferred: G2-15-022-032 fail-closed policy conflict; G2-1-009-009/010/011 learner UI, G2-10-004-081 directory projection, G2-12-020-005/020/037 another schema owner, G2-12-019-001/005/007 application service/role policy; all handoffs recorded. 0138 NOT RUN.
- `src_db_schema_placements.ts.part2of15.md` | Applied storage foundations for G2-12-019-011/012/014/017/020/021/022/026/029/040/042/046/053/054/056 through migration 0139, including version, public ref and private application artifacts. Reviewed distinct joining outcomes/history G2-16-031-040. | Deferred service wiring and lineage: G2-12-019-059/060, G2-16-031-059/060 and application CAS/secure attachments. Retained vNext per-role cardinality; handoffs recorded. 0139 NOT RUN.

## Application legacy crosswalk
- learner_id → membership_id; job_id → job_id; organization_id → placement_jobs.college_id; old unique learner/job → intentionally per-role member, pending TPO decision.
- application_status → SUBMITTED/WITHDRAWN plus screening/college stages/rounds/offers/joining; applied_at → submitted_at; status_updated_at/by → new fields and status/stage events.
- source → channel + source_provider; pap_requested → new flag; resume_url/history → staff-only legacy_resume_url/object_path and JSON history; assessment_url → staff-only artifacts.
- internal_notes → staff-only artifacts; internal_reason and rejection_reason → staff-stage/screening fields. withdrawn reason/prior status/opt-out and appliedByCollege → new columns.
- offer letter URL/sentAt → separate placement offers, pending service crosswalk; transient screening score/partial → screening projection, not stored on core.
- @Version → application.version with transactional CAS required; current_round_id → same-job FK; external_ref → new column; public_ref → A + random 32-character UUID hexadecimal (DB default).
- Company: two distinct domains may have same company name; college relationship notes private. Academic source metadata preserves import provenance; null unverified scores remain null.
