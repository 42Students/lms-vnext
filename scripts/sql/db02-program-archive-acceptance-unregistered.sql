-- DB-005 W04: academic-program archive vs cohort live-parent invariants.
-- Staged PostgreSQL acceptance ONLY. Disposable test database after Chat 1
-- registers DB02; rollback ensures no durable identities are created.
BEGIN;
DO $db02$
DECLARE
  v_org uuid := gen_random_uuid();
  v_college uuid := gen_random_uuid();
  v_dept uuid := gen_random_uuid();
  v_program uuid := gen_random_uuid();
  v_period uuid := gen_random_uuid();
  v_cohort uuid := gen_random_uuid();
  v_other uuid := gen_random_uuid();
  v_tag text := 'db02-program-archive-' || replace(gen_random_uuid()::text,'-','');
  v_status program_status;
BEGIN
  INSERT INTO organizations(id,name) VALUES(v_org,v_tag || ' organization');
  INSERT INTO colleges(id,organization_id,name,code)
    VALUES(v_college,v_org,v_tag || ' college',v_tag || '-college');
  INSERT INTO departments(id,college_id,name)
    VALUES(v_dept,v_college,v_tag || ' department');
  INSERT INTO programs(id,department_id,name,code,duration_terms,status)
    VALUES(v_program,v_dept,v_tag || ' program',v_tag || '-program',4,'ACTIVE');
  INSERT INTO academic_periods(id,college_id,name,code,start_date,end_date,status)
    VALUES(v_period,v_college,v_tag || ' period',v_tag || '-period',
           '2026-07-01','2027-06-30','ACTIVE');
  INSERT INTO cohorts(id,program_id,name,code,start_period_id,status)
    VALUES(v_cohort,v_program,v_tag || ' cohort',v_tag || '-cohort',v_period,'PLANNED');

  -- A PLANNED cohort is a real child even if no learners are enrolled.
  BEGIN
    UPDATE programs SET status='ARCHIVED' WHERE id=v_program;
    RAISE EXCEPTION 'FAIL archived program while PLANNED cohort exists';
  EXCEPTION WHEN check_violation THEN
    IF SQLERRM NOT LIKE '%Cannot archive program with nonarchived cohorts%' THEN
      RAISE;
    END IF;
  END;

  UPDATE cohorts SET status='ACTIVE' WHERE id=v_cohort;
  BEGIN
    UPDATE programs SET status='ARCHIVED' WHERE id=v_program;
    RAISE EXCEPTION 'FAIL archived program while ACTIVE cohort exists';
  EXCEPTION WHEN check_violation THEN
    IF SQLERRM NOT LIKE '%Cannot archive program with nonarchived cohorts%' THEN
      RAISE;
    END IF;
  END;

  UPDATE cohorts SET status='COMPLETED' WHERE id=v_cohort;
  BEGIN
    UPDATE programs SET status='ARCHIVED' WHERE id=v_program;
    RAISE EXCEPTION 'FAIL archived program with COMPLETED historical cohort';
  EXCEPTION WHEN check_violation THEN
    IF SQLERRM NOT LIKE '%Cannot archive program with nonarchived cohorts%' THEN
      RAISE;
    END IF;
  END;

  -- Once the cohort is explicitly archived, program archival is allowed.
  UPDATE cohorts SET status='ARCHIVED' WHERE id=v_cohort;
  UPDATE programs SET status='ARCHIVED' WHERE id=v_program;
  SELECT status INTO v_status FROM programs WHERE id=v_program;
  IF v_status <> 'ARCHIVED' THEN
    RAISE EXCEPTION 'FAIL program archive after cohort archive';
  END IF;

  -- This checks the opposite operation order. No new cohort may be inserted
  -- or resurrected after the academic program became ARCHIVED.
  BEGIN
    INSERT INTO cohorts(id,program_id,name,code,start_period_id,status)
      VALUES(v_other,v_program,v_tag || ' new cohort',
             v_tag || '-cohort-new',v_period,'PLANNED');
    RAISE EXCEPTION 'FAIL created cohort under ARCHIVED program';
  EXCEPTION WHEN check_violation THEN
    IF SQLERRM NOT LIKE '%Cannot activate or create a cohort under archived program%' THEN
      RAISE;
    END IF;
  END;

  BEGIN
    UPDATE cohorts SET status='ACTIVE' WHERE id=v_cohort;
    RAISE EXCEPTION 'FAIL reopened cohort under ARCHIVED program';
  EXCEPTION WHEN check_violation THEN
    IF SQLERRM NOT LIKE '%Cannot activate or create a cohort under archived program%' THEN
      RAISE;
    END IF;
  END;

  UPDATE programs SET status='ACTIVE' WHERE id=v_program;
  -- A real already-archived cohort stays terminal even after reopening program.
  BEGIN
    UPDATE cohorts SET status='ACTIVE' WHERE id=v_cohort;
    RAISE EXCEPTION 'FAIL reopened terminal archived cohort';
  EXCEPTION WHEN check_violation THEN
    IF SQLERRM NOT LIKE '%Archived cohort status is terminal%' THEN
      RAISE;
    END IF;
  END;
  RAISE NOTICE 'DB02 program archive cohort dependencies PASS (rollback-only)';
END;
$db02$;
ROLLBACK;
