-- DB-008 / Chat6: READ-ONLY state-invariant preflight for
-- scripts/sql/db05-hierarchy-active-child-archive-guard.draft.sql
-- NOT a migration. Run against an approved DISPOSABLE PostgreSQL fixture
-- or an independently authorized read-only environment only.
-- Zero mismatches on all three rows are necessary, NEVER sufficient, for
-- migration registration/acceptance. Test concurrent INSERT/UPDATE races too.
-- No writes, no DDL, no secrets or personally identifying projections.
SELECT 'ACTIVE_OFFERING_UNDER_ARCHIVED_COURSE' AS violation,
       count(*)::bigint AS offending_rows
  FROM course_offerings offering
  JOIN courses parent ON parent.id = offering.course_id
 WHERE offering.status = 'ACTIVE' AND parent.status <> 'ACTIVE'
UNION ALL
SELECT 'LIVE_DELIVERY_UNDER_ARCHIVED_OFFERING',
       count(*)::bigint
  FROM course_section_deliveries delivery
  JOIN course_offerings parent ON parent.id = delivery.offering_id
 WHERE delivery.ended_at IS NULL AND parent.status <> 'ACTIVE'
UNION ALL
SELECT 'ACTIVE_TEACHER_UNDER_ENDED_DELIVERY',
       count(*)::bigint
  FROM course_teaching_assignments teacher
  JOIN course_section_deliveries parent ON parent.id = teacher.delivery_id
 WHERE teacher.ended_at IS NULL AND parent.ended_at IS NOT NULL
ORDER BY violation;
