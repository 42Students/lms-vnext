-- Pass 5: aggregate-only relational integrity witness (NOT a prevention test).
-- Run only on an explicitly authorized disposable PostgreSQL fixture database.
-- Do not run against production or export identifying application rows.
-- psql -q -X -A -t -v ON_ERROR_STOP=1 "$TEST_DATABASE_URL" -f scripts/sql/vnext-pass5-relational-witness.sql > /tmp/vnext-pass5.jsonl
-- node scripts/db-parity-pass5-evaluate.mjs /tmp/vnext-pass5.jsonl
-- Nonzero witness counts prove invalid combinations EXIST. Zero counts do NOT prove protection.
-- An empty database will return zero for every probe and cannot satisfy the release gate.
BEGIN TRANSACTION READ ONLY;
-- P5-01: Project member belongs to a different college than the project
SELECT jsonb_build_object('check_id','P5-01','violations',(SELECT count(*) FROM project_members pm JOIN project_instances p ON p.id=pm.project_id JOIN college_memberships m ON m.id=pm.membership_id WHERE m.college_id <> p.college_id))::text;
-- P5-02: Task submission references a task from another project
SELECT jsonb_build_object('check_id','P5-02','violations',(SELECT count(*) FROM project_task_submissions s JOIN project_tasks t ON t.id=s.task_id WHERE s.project_id <> t.project_id))::text;
-- P5-03: Task submitter belongs to another college
SELECT jsonb_build_object('check_id','P5-03','violations',(SELECT count(*) FROM project_task_submissions s JOIN project_instances p ON p.id=s.project_id JOIN college_memberships m ON m.id=s.submitted_by_membership_id WHERE m.college_id <> p.college_id))::text;
-- P5-04: Task reviewer membership belongs to another college
SELECT jsonb_build_object('check_id','P5-04','violations',(SELECT count(*) FROM project_task_submissions s JOIN project_instances p ON p.id=s.project_id JOIN college_memberships m ON m.id=s.reviewed_by_membership_id WHERE m.college_id <> p.college_id))::text;
-- P5-05: Project task references sprint from another project
SELECT jsonb_build_object('check_id','P5-05','violations',(SELECT count(*) FROM project_tasks t JOIN project_sprints s ON s.id=t.sprint_id WHERE t.project_id <> s.project_id))::text;
-- P5-06: Project sprint release belongs to another project
SELECT jsonb_build_object('check_id','P5-06','violations',(SELECT count(*) FROM project_sprints s JOIN project_releases r ON r.id=s.release_id WHERE s.project_id <> r.project_id))::text;
-- P5-07: Placement job and season have different colleges
SELECT jsonb_build_object('check_id','P5-07','violations',(SELECT count(*) FROM placement_jobs j JOIN placement_seasons s ON s.id=j.season_id WHERE j.college_id <> s.college_id))::text;
-- P5-08: Placement job and company relationship have different colleges
SELECT jsonb_build_object('check_id','P5-08','violations',(SELECT count(*) FROM placement_jobs j JOIN placement_company_relationships r ON r.id=j.company_relationship_id WHERE j.college_id <> r.college_id))::text;
-- P5-09: Company relationship owner is a different-college member
SELECT jsonb_build_object('check_id','P5-09','violations',(SELECT count(*) FROM placement_company_relationships r JOIN college_memberships m ON m.id=r.owner_membership_id WHERE r.college_id <> m.college_id))::text;
-- P5-10: Application learner membership belongs to another college than job
SELECT jsonb_build_object('check_id','P5-10','violations',(SELECT count(*) FROM placement_applications a JOIN placement_jobs j ON j.id=a.job_id JOIN college_memberships m ON m.id=a.membership_id WHERE j.college_id <> m.college_id))::text;
-- P5-11: Application's role option belongs to another job
SELECT jsonb_build_object('check_id','P5-11','violations',(SELECT count(*) FROM placement_applications a JOIN placement_job_role_options o ON o.id=a.role_option_id WHERE a.job_id <> o.job_id))::text;
-- P5-12: Round attendance combines application and round from different jobs
SELECT jsonb_build_object('check_id','P5-12','violations',(SELECT count(*) FROM placement_round_attendance a JOIN placement_applications ap ON ap.id=a.application_id JOIN placement_job_rounds r ON r.id=a.round_id WHERE ap.job_id <> r.job_id))::text;
-- P5-13: Application round exception combines different jobs
SELECT jsonb_build_object('check_id','P5-13','violations',(SELECT count(*) FROM placement_application_round_exceptions e JOIN placement_applications a ON a.id=e.application_id JOIN placement_job_rounds r ON r.id=e.round_id WHERE a.job_id <> r.job_id))::text;
-- P5-14: Round exception's request is for another application
SELECT jsonb_build_object('check_id','P5-14','violations',(SELECT count(*) FROM placement_application_round_exceptions e JOIN placement_learner_requests r ON r.id=e.request_id WHERE e.application_id <> r.application_id))::text;
-- P5-15: Learner request's round is for another job
SELECT jsonb_build_object('check_id','P5-15','violations',(SELECT count(*) FROM placement_learner_requests r JOIN placement_applications a ON a.id=r.application_id JOIN placement_job_rounds j ON j.id=r.round_id WHERE a.job_id <> j.job_id))::text;
-- P5-16: Learner request's offer is for another application
SELECT jsonb_build_object('check_id','P5-16','violations',(SELECT count(*) FROM placement_learner_requests r JOIN placement_offers o ON o.id=r.offer_id WHERE r.application_id <> o.application_id))::text;
-- P5-17: Section enrollment academic period differs from section
SELECT jsonb_build_object('check_id','P5-17','violations',(SELECT count(*) FROM section_enrollments e JOIN sections s ON s.id=e.section_id WHERE e.academic_period_id <> s.academic_period_id))::text;
-- P5-18: Section enrollment cohort differs from learner program enrollment
SELECT jsonb_build_object('check_id','P5-18','violations',(SELECT count(*) FROM section_enrollments e JOIN sections s ON s.id=e.section_id JOIN learner_program_enrollments l ON l.id=e.learner_enrollment_id WHERE s.cohort_id <> l.cohort_id))::text;
-- P5-19: Course delivery offering/section cohort or term mismatch
SELECT jsonb_build_object('check_id','P5-19','violations',(SELECT count(*) FROM course_section_deliveries d JOIN course_offerings o ON o.id=d.offering_id JOIN sections s ON s.id=d.section_id WHERE o.cohort_id <> s.cohort_id OR o.academic_period_id <> s.academic_period_id))::text;
-- P5-20: Quiz attempt's quiz belongs to another delivery
SELECT jsonb_build_object('check_id','P5-20','violations',(SELECT count(*) FROM quiz_attempts a JOIN course_quizzes q ON q.id=a.quiz_id WHERE a.delivery_id <> q.delivery_id))::text;
-- P5-21: Assignment submission's assignment belongs to another delivery
SELECT jsonb_build_object('check_id','P5-21','violations',(SELECT count(*) FROM assignment_submissions s JOIN course_assignments a ON a.id=s.assignment_id WHERE s.delivery_id <> a.delivery_id))::text;
COMMIT;
