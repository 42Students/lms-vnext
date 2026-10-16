/**
 * Database side of NSRIT stage 2b-i (academics). Same rules as stage 2a:
 * plain SQL on a guarded connection (table allowlist in guards.ts), ids are
 * deterministic UUIDv5 values, every row is written with INSERT ... ON
 * CONFLICT (id) DO UPDATE and tracked in legacy_id_map with a source hash, so
 * a re-run with an unchanged snapshot writes nothing. Nothing here touches an
 * outbox, notification or messaging table, and nothing sets a storage key.
 */
import { LoadAbort, LoadContext, loadMapRows, syncTable, ts, writeMap, type Validation } from "./db";
import type { Client } from "pg";
import type { AcademicsPlan } from "./plan-academics";
import type { Plan } from "./plan";

const T = (value: string | null) => ts(value);

/** Verifies the stage 2a rows this plan references exist (same college). */
export async function preflightAcademics(client: Client, base: Plan, plan: AcademicsPlan): Promise<string[]> {
  const problems: string[] = [];
  const sections = [...new Set([...plan.deliveries.map((d) => d.data.sectionId), ...plan.events.map((e) => e.data.sectionId)])];
  const have = await client.query<{ n: string }>(`SELECT count(*) AS n FROM sections WHERE id = ANY($1::uuid[])`, [sections]);
  if (Number(have.rows[0].n) !== sections.length) problems.push("stage 2a sections are missing: apply stage 2a first");
  const memberships = [
    ...new Set([
      ...plan.teaching.map((t) => t.data.membershipId),
      ...plan.progress.map((p) => p.data.membershipId),
      ...plan.attempts.map((a) => a.data.membershipId),
    ]),
  ];
  const m = await client.query<{ n: string }>(`SELECT count(*) AS n FROM college_memberships WHERE id = ANY($1::uuid[])`, [memberships]);
  if (Number(m.rows[0].n) !== memberships.length) problems.push("stage 2a memberships are missing: apply stage 2a first");
  const dept = await client.query<{ n: string }>(
    `SELECT count(*) AS n FROM departments WHERE id = ANY($1::uuid[])`,
    [[...new Set(plan.courses.map((c) => c.data.departmentId))]],
  );
  if (Number(dept.rows[0].n) !== new Set(plan.courses.map((c) => c.data.departmentId)).size) {
    problems.push("stage 2a departments are missing: apply stage 2a first");
  }
  const cols: [string, string][] = [
    ["lesson_contents", "visible_to_students"],
    ["course_quizzes", "shuffle_questions"],
    ["assignment_submissions", "attempt_number"],
    ["learner_content_progress", "first_completed_at"],
  ];
  for (const [table, column] of cols) {
    const r = await client.query(
      `SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = $1 AND column_name = $2`,
      [table, column],
    );
    if (r.rowCount === 0) problems.push(`missing ${table}.${column}: run migrations through 0098 first`);
  }
  void base;
  return problems;
}

export async function loadAcademics2b(ctx: LoadContext, plan: AcademicsPlan) {
  await syncTable(ctx, {
    table: "courses",
    items: plan.courses,
    upsert: async (c, i) => {
      const d = i.data;
      await c.tx.query(
        `INSERT INTO courses (id, department_id, name, code, description, status, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, coalesce($7::timestamptz, now()), coalesce($8::timestamptz, now()))
         ON CONFLICT (id) DO UPDATE SET name = excluded.name, code = excluded.code, description = excluded.description,
           status = excluded.status, updated_at = excluded.updated_at`,
        [i.newId, d.departmentId, d.name, d.code, d.description, d.status, T(d.createdAt), T(d.updatedAt)],
      );
    },
  });
  await syncTable(ctx, {
    table: "course_offerings",
    items: plan.offerings,
    upsert: async (c, i) => {
      const d = i.data;
      await c.tx.query(
        `INSERT INTO course_offerings (id, course_id, cohort_id, academic_period_id, type, credits, display_order, status, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, 'ACTIVE', coalesce($8::timestamptz, now()), coalesce($9::timestamptz, now()))
         ON CONFLICT (id) DO UPDATE SET type = excluded.type, credits = excluded.credits, display_order = excluded.display_order,
           updated_at = excluded.updated_at`,
        [i.newId, d.courseId, d.cohortId, d.academicPeriodId, d.type, d.credits, d.displayOrder, T(d.createdAt), T(d.updatedAt)],
      );
    },
  });
  await syncTable(ctx, {
    table: "course_section_deliveries",
    items: plan.deliveries,
    upsert: async (c, i) => {
      const d = i.data;
      await c.tx.query(
        `INSERT INTO course_section_deliveries (id, offering_id, section_id, started_at, created_at, updated_at)
         VALUES ($1, $2, $3, $4::timestamptz, coalesce($5::timestamptz, now()), coalesce($6::timestamptz, now()))
         ON CONFLICT (id) DO UPDATE SET started_at = excluded.started_at, updated_at = excluded.updated_at`,
        [i.newId, d.offeringId, d.sectionId, d.startedAt, T(d.createdAt), T(d.updatedAt)],
      );
    },
  });
  await syncTable(ctx, {
    table: "course_teaching_assignments",
    items: plan.teaching,
    upsert: async (c, i) => {
      const d = i.data;
      await c.tx.query(
        `INSERT INTO course_teaching_assignments (id, delivery_id, membership_id, role, started_at, ended_at, created_at, updated_at)
         VALUES ($1, $2, $3, $4::course_teaching_role, $5::timestamptz, $6::timestamptz, coalesce($7::timestamptz, now()), coalesce($8::timestamptz, now()))
         ON CONFLICT (id) DO UPDATE SET role = excluded.role, started_at = excluded.started_at, ended_at = excluded.ended_at,
           updated_at = excluded.updated_at`,
        [i.newId, d.deliveryId, d.membershipId, d.role, d.startedAt, T(d.endedAt), T(d.createdAt), T(d.updatedAt)],
      );
    },
  });
  await syncTable(ctx, {
    table: "faculty_course_associations",
    items: plan.associations,
    upsert: async (c, i) => {
      const d = i.data;
      await c.tx.query(
        `INSERT INTO faculty_course_associations (id, membership_id, course_id, started_at, ended_at)
         VALUES ($1, $2, $3, $4::timestamptz, $5::timestamptz)
         ON CONFLICT (id) DO UPDATE SET started_at = excluded.started_at, ended_at = excluded.ended_at, updated_at = now()`,
        [i.newId, d.membershipId, d.courseId, d.startedAt, T(d.endedAt)],
      );
    },
  });
  await syncTable(ctx, {
    table: "course_learning_paths",
    items: plan.paths,
    upsert: async (c, i) => {
      const d = i.data;
      await c.tx.query(
        `INSERT INTO course_learning_paths (id, offering_id, title, status, created_at, updated_at)
         VALUES ($1, $2, $3, $4::learning_path_status, coalesce($5::timestamptz, now()), coalesce($6::timestamptz, now()))
         ON CONFLICT (id) DO UPDATE SET title = excluded.title, status = excluded.status, updated_at = excluded.updated_at`,
        [i.newId, d.offeringId, d.title, d.status, T(d.createdAt), T(d.updatedAt)],
      );
    },
  });
  await syncTable(ctx, {
    table: "course_lessons",
    items: plan.lessons,
    upsert: async (c, i) => {
      const d = i.data;
      await c.tx.query(
        `INSERT INTO course_lessons (id, learning_path_id, name, sequence, status, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5::course_lesson_status, coalesce($6::timestamptz, now()), coalesce($7::timestamptz, now()))
         ON CONFLICT (id) DO UPDATE SET name = excluded.name, sequence = excluded.sequence, status = excluded.status, updated_at = excluded.updated_at`,
        [i.newId, d.learningPathId, d.name, d.sequence, d.status, T(d.createdAt), T(d.updatedAt)],
      );
    },
  });
  await syncTable(ctx, {
    table: "lesson_contents",
    items: plan.contents,
    upsert: async (c, i) => {
      const d = i.data;
      await c.tx.query(
        `INSERT INTO lesson_contents (id, lesson_id, delivery_id, content_type, title, notes, external_url, sequence, status, visible_to_students, created_by_user_id, created_at, updated_at)
         VALUES ($1, $2, $3, $4::lesson_content_type, $5, $6, $7, $8, $9::lesson_content_status, $10, $11, coalesce($12::timestamptz, now()), coalesce($13::timestamptz, now()))
         ON CONFLICT (id) DO UPDATE SET title = excluded.title, notes = excluded.notes, external_url = excluded.external_url,
           sequence = excluded.sequence, status = excluded.status, visible_to_students = excluded.visible_to_students, updated_at = excluded.updated_at`,
        [i.newId, d.lessonId, d.deliveryId, d.contentType, d.title, d.notes, d.externalUrl, d.sequence, d.status, d.visibleToStudents, d.createdByUserId, T(d.createdAt), T(d.updatedAt)],
      );
    },
  });
  await syncTable(ctx, {
    table: "course_assignments",
    items: plan.assignments,
    upsert: async (c, i) => {
      const d = i.data;
      await c.tx.query(
        `INSERT INTO course_assignments (id, lesson_id, delivery_id, title, description, due_at, max_points, sequence, status, created_by_user_id, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6::timestamptz, $7, $8, $9::course_assignment_status, $10, coalesce($11::timestamptz, now()), coalesce($12::timestamptz, now()))
         ON CONFLICT (id) DO UPDATE SET title = excluded.title, description = excluded.description, due_at = excluded.due_at,
           max_points = excluded.max_points, sequence = excluded.sequence, status = excluded.status, updated_at = excluded.updated_at`,
        [i.newId, d.lessonId, d.deliveryId, d.title, d.description, T(d.dueAt), d.maxPoints, d.sequence, d.status, d.createdByUserId, T(d.createdAt), T(d.updatedAt)],
      );
    },
  });
  await syncTable(ctx, {
    table: "course_quizzes",
    items: plan.quizzes,
    upsert: async (c, i) => {
      const d = i.data;
      await c.tx.query(
        `INSERT INTO course_quizzes (id, lesson_id, delivery_id, title, description, due_at, max_attempts, total_points, sequence, status,
                                     results_published, shuffle_questions, shuffle_options, created_by_user_id, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6::timestamptz, $7, $8, $9, $10::course_quiz_status, $11, $12, $13, $14,
                 coalesce($15::timestamptz, now()), coalesce($16::timestamptz, now()))
         ON CONFLICT (id) DO UPDATE SET title = excluded.title, description = excluded.description, due_at = excluded.due_at,
           max_attempts = excluded.max_attempts, total_points = excluded.total_points, sequence = excluded.sequence, status = excluded.status,
           results_published = excluded.results_published, shuffle_questions = excluded.shuffle_questions,
           shuffle_options = excluded.shuffle_options, updated_at = excluded.updated_at`,
        [i.newId, d.lessonId, d.deliveryId, d.title, d.description, T(d.dueAt), d.maxAttempts, d.totalPoints, d.sequence, d.status, d.resultsPublished, d.shuffleQuestions, d.shuffleOptions, d.createdByUserId, T(d.createdAt), T(d.updatedAt)],
      );
    },
  });
  await syncTable(ctx, {
    table: "quiz_questions",
    items: plan.questions,
    upsert: async (c, i) => {
      const d = i.data;
      await c.tx.query(
        `INSERT INTO quiz_questions (id, quiz_id, question_type, prompt, points, sequence, created_at, updated_at)
         VALUES ($1, $2, $3::quiz_question_type, $4, $5, $6, coalesce($7::timestamptz, now()), coalesce($8::timestamptz, now()))
         ON CONFLICT (id) DO UPDATE SET question_type = excluded.question_type, prompt = excluded.prompt, points = excluded.points,
           sequence = excluded.sequence, updated_at = excluded.updated_at`,
        [i.newId, d.quizId, d.questionType, d.prompt, d.points, d.sequence, T(d.createdAt), T(d.updatedAt)],
      );
    },
  });
  await syncTable(ctx, {
    table: "quiz_options",
    items: plan.options,
    upsert: async (c, i) => {
      const d = i.data;
      await c.tx.query(
        `INSERT INTO quiz_options (id, question_id, option_text, is_correct, sequence, created_at)
         VALUES ($1, $2, $3, $4, $5, coalesce($6::timestamptz, now()))
         ON CONFLICT (id) DO UPDATE SET option_text = excluded.option_text, is_correct = excluded.is_correct, sequence = excluded.sequence`,
        [i.newId, d.questionId, d.optionText, d.isCorrect, d.sequence, T(d.createdAt)],
      );
    },
  });
  await syncTable(ctx, {
    table: "assignment_submissions",
    items: plan.submissions,
    upsert: async (c, i) => {
      const d = i.data;
      await c.tx.query(
        `INSERT INTO assignment_submissions (id, assignment_id, delivery_id, membership_id, submission_type, text_content, submission_url, submitted_at,
                                             points_awarded, attempt_number, previous_points, grading_status, grade_published, graded_by_user_id, graded_at,
                                             created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5::assignment_submission_type, $6, $7, $8::timestamptz, $9, $10, $11, $12::assignment_grading_status, $13, $14, $15::timestamptz,
                 coalesce($16::timestamptz, now()), coalesce($17::timestamptz, now()))
         ON CONFLICT (id) DO UPDATE SET text_content = excluded.text_content, submission_url = excluded.submission_url,
           submitted_at = excluded.submitted_at, points_awarded = excluded.points_awarded, attempt_number = excluded.attempt_number,
           previous_points = excluded.previous_points, grading_status = excluded.grading_status, grade_published = excluded.grade_published,
           graded_by_user_id = excluded.graded_by_user_id, graded_at = excluded.graded_at, updated_at = excluded.updated_at`,
        [i.newId, d.assignmentId, d.deliveryId, d.membershipId, d.submissionType, d.textContent, d.submissionUrl, d.submittedAt, d.pointsAwarded, d.attemptNumber, d.previousPoints, d.gradingStatus, d.gradePublished, d.gradedByUserId, T(d.gradedAt), T(d.createdAt), T(d.updatedAt)],
      );
    },
  });
  await syncTable(ctx, {
    table: "learner_content_progress",
    items: plan.progress.map((p) => ({ ...p, data: { ...p.data } })),
    upsert: async (c, i) => {
      const d = i.data;
      await c.tx.query(
        `INSERT INTO learner_content_progress (id, membership_id, lesson_content_id, last_position_seconds, completed_at, first_completed_at, attempt, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5::timestamptz, $6::timestamptz, $7, coalesce($8::timestamptz, now()), coalesce($9::timestamptz, now()))
         ON CONFLICT (id) DO UPDATE SET last_position_seconds = excluded.last_position_seconds, completed_at = excluded.completed_at,
           first_completed_at = excluded.first_completed_at, attempt = excluded.attempt, updated_at = excluded.updated_at`,
        [i.newId, d.membershipId, d.lessonContentId, d.lastPositionSeconds, T(d.completedAt), T(d.firstCompletedAt), d.attempt, T(d.createdAt), T(d.updatedAt)],
      );
    },
  });
  await syncTable(ctx, {
    table: "quiz_attempts",
    items: plan.attempts,
    upsert: async (c, i) => {
      const d = i.data;
      await c.tx.query(
        `INSERT INTO quiz_attempts (id, quiz_id, delivery_id, membership_id, attempt_number, score, max_score, submitted_at, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8::timestamptz, coalesce($9::timestamptz, now()))
         ON CONFLICT (id) DO UPDATE SET score = excluded.score, max_score = excluded.max_score, submitted_at = excluded.submitted_at`,
        [i.newId, d.quizId, d.deliveryId, d.membershipId, d.attemptNumber, d.score, d.maxScore, d.submittedAt, T(d.createdAt)],
      );
    },
  });
  await syncTable(ctx, {
    table: "quiz_attempt_answers",
    items: plan.answers,
    upsert: async (c, i) => {
      const d = i.data;
      await c.tx.query(
        `INSERT INTO quiz_attempt_answers (id, attempt_id, question_id, question_type, prompt_snapshot, points_possible, selected_option_ids, options_snapshot,
                                           correct, points_awarded, created_at)
         VALUES ($1, $2, $3, $4::quiz_question_type, $5, $6, $7::jsonb, $8::jsonb, $9, $10, coalesce($11::timestamptz, now()))
         ON CONFLICT (id) DO UPDATE SET prompt_snapshot = excluded.prompt_snapshot, points_possible = excluded.points_possible,
           selected_option_ids = excluded.selected_option_ids, options_snapshot = excluded.options_snapshot, correct = excluded.correct,
           points_awarded = excluded.points_awarded`,
        [i.newId, d.attemptId, d.questionId, d.questionType, d.promptSnapshot, d.pointsPossible, JSON.stringify(d.selectedOptionIds), JSON.stringify(d.optionsSnapshot), d.correct, d.pointsAwarded, T(d.createdAt)],
      );
    },
  });
  await syncTable(ctx, {
    table: "section_schedule_events",
    items: plan.events,
    upsert: async (c, i) => {
      const d = i.data;
      await c.tx.query(
        `INSERT INTO section_schedule_events (id, section_id, faculty_membership_id, lecture_hall_id, title, starts_at, ends_at, status, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6::timestamptz, $7::timestamptz, 'SCHEDULED', coalesce($8::timestamptz, now()), coalesce($9::timestamptz, now()))
         ON CONFLICT (id) DO UPDATE SET faculty_membership_id = excluded.faculty_membership_id, lecture_hall_id = excluded.lecture_hall_id,
           title = excluded.title, starts_at = excluded.starts_at, ends_at = excluded.ends_at, updated_at = excluded.updated_at`,
        [i.newId, d.sectionId, d.facultyMembershipId, d.lectureHallId, d.title, d.startsAt, d.endsAt, T(d.createdAt), T(d.updatedAt)],
      );
    },
  });
  // Event -> course delivery links (keyed by the event id; map row new_id = event id).
  await syncTable(ctx, {
    table: "section_schedule_event_courses",
    items: plan.events
      .filter((e) => e.data.deliveryId !== null)
      .map((e) => ({ ...e, newType: "section_schedule_event_courses", newId: e.newId })),
    upsert: async (c, i) => {
      await c.tx.query(
        `INSERT INTO section_schedule_event_courses (schedule_event_id, delivery_id) VALUES ($1, $2)
         ON CONFLICT (schedule_event_id) DO UPDATE SET delivery_id = excluded.delivery_id`,
        [i.newId, i.data.deliveryId],
      );
    },
  });
  await syncTable(ctx, {
    table: "attendance_sessions",
    items: plan.sessions,
    upsert: async (c, i) => {
      const d = i.data;
      await c.tx.query(
        `INSERT INTO attendance_sessions (schedule_event_id, status, marked_by_user_id, marked_at)
         VALUES ($1, $2, $3, $4::timestamptz)
         ON CONFLICT (schedule_event_id) DO UPDATE SET status = excluded.status, marked_by_user_id = excluded.marked_by_user_id,
           marked_at = excluded.marked_at, updated_at = now()`,
        [d.scheduleEventId, d.status, d.markedByUserId, T(d.markedAt)],
      );
    },
  });
  await syncTable(ctx, {
    table: "attendance_records",
    items: plan.records,
    upsert: async (c, i) => {
      const d = i.data;
      await c.tx.query(
        `INSERT INTO attendance_records (id, schedule_event_id, membership_id, status, note, marked_by_user_id, marked_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7::timestamptz)
         ON CONFLICT (id) DO UPDATE SET status = excluded.status, note = excluded.note, marked_by_user_id = excluded.marked_by_user_id,
           marked_at = excluded.marked_at, updated_at = now()`,
        [i.newId, d.scheduleEventId, d.membershipId, d.status, d.note, d.markedByUserId, d.markedAt],
      );
    },
  });
  await syncTable(ctx, {
    table: "course_discussion_messages",
    items: plan.messages,
    upsert: async (c, i) => {
      const d = i.data;
      await c.tx.query(
        `INSERT INTO course_discussion_messages (id, delivery_id, sender_membership_id, sender_role, message_text, pinned, pinned_by_user_id, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, coalesce($8::timestamptz, now()), coalesce($9::timestamptz, now()))
         ON CONFLICT (id) DO UPDATE SET message_text = excluded.message_text, pinned = excluded.pinned,
           pinned_by_user_id = excluded.pinned_by_user_id, updated_at = excluded.updated_at`,
        [i.newId, d.deliveryId, d.senderMembershipId, d.senderRole, d.messageText, d.pinned, d.pinnedByUserId, T(d.createdAt), T(d.updatedAt)],
      );
    },
  });
  await syncTable(ctx, {
    table: "announcements",
    items: plan.announcements,
    upsert: async (c, i) => {
      const d = i.data;
      await c.tx.query(
        `INSERT INTO announcements (id, organization_id, college_id, receiver_type, receiver_id, title, message, sender_user_id, sender_type,
                                    scheduled_at, expires_at, is_pinned, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10::timestamptz, $11::timestamptz, $12, coalesce($13::timestamptz, now()), coalesce($14::timestamptz, now()))
         ON CONFLICT (id) DO UPDATE SET title = excluded.title, message = excluded.message, scheduled_at = excluded.scheduled_at,
           expires_at = excluded.expires_at, is_pinned = excluded.is_pinned, updated_at = excluded.updated_at`,
        [i.newId, d.organizationId, d.collegeId, d.receiverType, d.receiverId, d.title, d.message, d.senderUserId, d.senderType, T(d.scheduledAt), T(d.expiresAt), d.isPinned, T(d.createdAt), T(d.updatedAt)],
      );
    },
  });
  // Provenance-only rows: legacy submissions that wait for the files stage.
  // Unchanged rows (same source hash) are left on their original batch.
  const known = await loadMapRows(ctx, "assignment_submissions");
  for (const f of plan.fileDeferred) {
    const mapRow = known.get(`${f.legacyType}|${f.legacyId}`);
    if (mapRow && mapRow.source_hash === f.hash && mapRow.new_id === f.newId) {
      ctx.bump("legacy_id_map_deferred_files", "unchanged");
      continue;
    }
    await writeMap(ctx, f.legacyType, f.legacyId, f.newType, f.newId, f.hash, f.metadata);
    ctx.bump("legacy_id_map_deferred_files", mapRow ? "updated" : "inserted");
  }
}

/** Mapped row counts per target table must equal the plan. */
export async function validateAcademics(ctx: LoadContext, plan: AcademicsPlan): Promise<Validation[]> {
  const out: Validation[] = [];
  const cid = [ctx.collegeId];
  const check = async (name: string, sql: string, expect: (n: number) => boolean, detail: (n: number) => string) => {
    const res = await ctx.tx.query<{ n: string }>(sql, cid);
    const n = Number(res.rows[0]?.n ?? 0);
    out.push({ check: name, ok: expect(n), detail: detail(n) });
  };
  const expected: [string, number][] = [
    ["courses", plan.courses.length],
    ["course_offerings", plan.offerings.length],
    ["course_section_deliveries", plan.deliveries.length],
    ["course_teaching_assignments", plan.teaching.length],
    ["faculty_course_associations", plan.associations.length],
    ["course_learning_paths", plan.paths.length],
    ["course_lessons", plan.lessons.length],
    ["lesson_contents", plan.contents.length],
    ["course_assignments", plan.assignments.length],
    ["course_quizzes", plan.quizzes.length],
    ["quiz_questions", plan.questions.length],
    ["quiz_options", plan.options.length],
    // Deferred file submissions keep a provenance-only map row under the same type.
    ["assignment_submissions", plan.submissions.length + plan.fileDeferred.length],
    ["learner_content_progress", plan.progress.length],
    ["quiz_attempts", plan.attempts.length],
    ["quiz_attempt_answers", plan.answers.length],
    ["section_schedule_events", plan.events.length],
    ["attendance_sessions", plan.sessions.length],
    ["attendance_records", plan.records.length],
    ["course_discussion_messages", plan.messages.length],
    ["announcements", plan.announcements.length],
  ];
  for (const [table, want] of expected) {
    await check(
      `mapped ${table} equals planned`,
      `SELECT count(*) AS n FROM legacy_id_map WHERE college_id = $1 AND source_system = 'LMS_LEGACY' AND new_entity_type = '${table}'`,
      (n) => n === want,
      (n) => `${n} mapped, ${want} planned`,
    );
  }
  await check(
    "every mapped lesson content has a lesson in the same path as its offering",
    `SELECT count(*) AS n FROM lesson_contents lc JOIN legacy_id_map m ON m.new_id = lc.id AND m.new_entity_type = 'lesson_contents' AND m.college_id = $1
       JOIN course_lessons l ON l.id = lc.lesson_id JOIN course_learning_paths p ON p.id = l.learning_path_id
       JOIN course_section_deliveries d ON d.id = lc.delivery_id
      WHERE d.offering_id <> p.offering_id`,
    (n) => n === 0,
    (n) => `${n} contents attached to a delivery of a different offering`,
  );
  await check(
    "every attendance session has one record per enrolled learner",
    `SELECT count(*) AS n FROM attendance_sessions s JOIN legacy_id_map m ON m.new_id = s.schedule_event_id AND m.new_entity_type = 'attendance_sessions' AND m.college_id = $1
       JOIN section_schedule_events e ON e.id = s.schedule_event_id
      WHERE s.status = 'MARKED' AND (SELECT count(*) FROM attendance_records r WHERE r.schedule_event_id = s.schedule_event_id)
        <> (SELECT count(*) FROM section_enrollments se WHERE se.section_id = e.section_id AND se.status = 'ACTIVE')`,
    (n) => n === 0,
    (n) => `${n} marked sessions whose record count differs from active enrollment`,
  );
  await check(
    "quiz total points equal the sum of question points",
    `SELECT count(*) AS n FROM course_quizzes q JOIN legacy_id_map m ON m.new_id = q.id AND m.new_entity_type = 'course_quizzes' AND m.college_id = $1
      WHERE q.total_points <> (SELECT coalesce(sum(points), 0) FROM quiz_questions x WHERE x.quiz_id = q.id)`,
    (n) => n === 0,
    (n) => `${n} quizzes`,
  );
  void LoadAbort;
  return out;
}
