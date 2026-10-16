/**
 * Derived-count reconciliation for NSRIT stage 2b-i: legacy-computed values
 * (attendance percent, content progress, marks totals; computed from the raw
 * legacy rows with the legacy rules, see plan-academics.ts) compared with the
 * values computed from the loaded vNext rows. Output is by learner and masked
 * (legacy id only, no names).
 */
import type { Tx } from "./db";
import { pct2 } from "./mappers-academics";
import type { LegacyFacts } from "./plan-academics";
import type { Plan } from "./plan";

export type VnextFacts = {
  attendance: { learner: string; held: number; absent: number; percent: number | null }[];
  progress: { learner: string; total: number; completed: number }[];
  marks: { learner: string; assignmentPoints: number; quizScore: number; quizMax: number }[];
};

export type Mismatch = { learner: string; metric: string; legacy: string; vnext: string };

export type ReconciliationOutcome = {
  sampled: { attendance: number; progress: number; marks: number };
  matched: { attendance: number; progress: number; marks: number };
  mismatches: Mismatch[];
};

/** Pure comparison; learners present on one side only are mismatches. */
export function compareFacts(legacy: LegacyFacts, vnext: VnextFacts): ReconciliationOutcome {
  const mismatches: Mismatch[] = [];
  const outcome: ReconciliationOutcome = {
    sampled: { attendance: 0, progress: 0, marks: 0 },
    matched: { attendance: 0, progress: 0, marks: 0 },
    mismatches,
  };
  const keyed = <T extends { learner: string }>(list: T[]) => new Map(list.map((x) => [x.learner, x]));

  const la = keyed(legacy.attendance);
  const va = keyed(vnext.attendance);
  for (const id of [...new Set([...la.keys(), ...va.keys()])].sort((a, b) => Number(a) - Number(b))) {
    outcome.sampled.attendance += 1;
    const l = la.get(id);
    const v = va.get(id);
    if (l && v && l.held === v.held && l.absent === v.absent && pct2(l.percent) === pct2(v.percent)) {
      outcome.matched.attendance += 1;
      continue;
    }
    mismatches.push({
      learner: `learner#${id}`,
      metric: "attendance",
      legacy: l ? `${l.percent}% (${l.held - l.absent}/${l.held})` : "-",
      vnext: v ? `${v.percent}% (${v.held - v.absent}/${v.held})` : "-",
    });
  }
  const lp = keyed(legacy.progress);
  const vp = keyed(vnext.progress);
  for (const id of [...new Set([...lp.keys(), ...vp.keys()])].sort((a, b) => Number(a) - Number(b))) {
    outcome.sampled.progress += 1;
    const l = lp.get(id);
    const v = vp.get(id);
    if (l && v && l.total === v.total && l.completed === v.completed) {
      outcome.matched.progress += 1;
      continue;
    }
    mismatches.push({
      learner: `learner#${id}`,
      metric: "progress",
      legacy: l ? `${l.completed}/${l.total}` : "-",
      vnext: v ? `${v.completed}/${v.total}` : "-",
    });
  }
  const lm = keyed(legacy.marks);
  const vm = keyed(vnext.marks);
  for (const id of [...new Set([...lm.keys(), ...vm.keys()])].sort((a, b) => Number(a) - Number(b))) {
    outcome.sampled.marks += 1;
    const l = lm.get(id);
    const v = vm.get(id);
    if (l && v && l.assignmentPoints === v.assignmentPoints && l.quizScore === v.quizScore && l.quizMax === v.quizMax) {
      outcome.matched.marks += 1;
      continue;
    }
    mismatches.push({
      learner: `learner#${id}`,
      metric: "marks",
      legacy: l ? `assignments ${l.assignmentPoints}, quizzes ${l.quizScore}/${l.quizMax}` : "-",
      vnext: v ? `assignments ${v.assignmentPoints}, quizzes ${v.quizScore}/${v.quizMax}` : "-",
    });
  }
  return outcome;
}

/**
 * vNext-side figures from the loaded tables. Definitions mirror the legacy
 * rules so a difference means a transformation problem:
 *  attendance: marked sessions that started by `asOf` are held; any record that
 *              is not PRESENT counts as an absence (legacy counts every attend row);
 *  progress:   published, learner-visible lesson contents of the learner's
 *              section deliveries, and completed progress rows on them;
 *  marks:      graded submission points and submitted quiz attempt scores.
 */
export async function computeVnextFacts(tx: Tx, base: Plan, collegeId: string, asOf: string): Promise<VnextFacts> {
  const learnerByMembership = new Map<string, string>();
  for (const p of base.people) {
    if (p.legacyType === "learner" && p.data.enrollment) learnerByMembership.set(p.data.membershipId, p.legacyId);
  }
  const memberships = [...learnerByMembership.keys()];
  const idOf = (membership: string) => learnerByMembership.get(membership)!;

  const attendance = await tx.query<{ membership_id: string; held: string; absent: string }>(
    `SELECT r.membership_id, count(*) FILTER (WHERE true) AS held,
            count(*) FILTER (WHERE r.status <> 'PRESENT') AS absent
       FROM attendance_records r
       JOIN attendance_sessions s ON s.schedule_event_id = r.schedule_event_id AND s.status = 'MARKED'
       JOIN section_schedule_events e ON e.id = r.schedule_event_id AND e.starts_at <= $2::timestamptz
       JOIN college_memberships cm ON cm.id = r.membership_id AND cm.college_id = $1
      WHERE r.membership_id = ANY($3::uuid[])
      GROUP BY r.membership_id`,
    [collegeId, asOf, memberships],
  );
  const progress = await tx.query<{ membership_id: string; total: string; completed: string }>(
    `SELECT se_m.membership_id,
            count(DISTINCT lc.id) AS total,
            count(DISTINCT lc.id) FILTER (WHERE lcp.completed_at IS NOT NULL) AS completed
       FROM (SELECT le.membership_id, se.section_id
               FROM section_enrollments se JOIN learner_program_enrollments le ON le.id = se.learner_enrollment_id
              WHERE se.status = 'ACTIVE' AND le.membership_id = ANY($2::uuid[])) se_m
       JOIN course_section_deliveries d ON d.section_id = se_m.section_id
       JOIN lesson_contents lc ON lc.delivery_id = d.id AND lc.status = 'PUBLISHED' AND lc.visible_to_students
       JOIN college_memberships cm ON cm.id = se_m.membership_id AND cm.college_id = $1
       LEFT JOIN learner_content_progress lcp ON lcp.lesson_content_id = lc.id AND lcp.membership_id = se_m.membership_id
      GROUP BY se_m.membership_id`,
    [collegeId, memberships],
  );
  const submissions = await tx.query<{ membership_id: string; points: string }>(
    `SELECT membership_id, coalesce(sum(points_awarded), 0) AS points FROM assignment_submissions
      WHERE grading_status = 'GRADED' AND membership_id = ANY($1::uuid[]) GROUP BY membership_id`,
    [memberships],
  );
  const attempts = await tx.query<{ membership_id: string; score: string; max_score: string }>(
    `SELECT membership_id, coalesce(sum(score), 0) AS score, coalesce(sum(max_score), 0) AS max_score FROM quiz_attempts
      WHERE membership_id = ANY($1::uuid[]) GROUP BY membership_id`,
    [memberships],
  );
  const marks = new Map<string, { a: number; q: number; m: number }>();
  for (const row of submissions.rows) marks.set(row.membership_id, { a: Number(row.points), q: 0, m: 0 });
  for (const row of attempts.rows) {
    const e = marks.get(row.membership_id) ?? { a: 0, q: 0, m: 0 };
    e.q = Number(row.score);
    e.m = Number(row.max_score);
    marks.set(row.membership_id, e);
  }
  return {
    attendance: attendance.rows.map((r) => {
      const held = Number(r.held);
      const absent = Number(r.absent);
      return { learner: idOf(r.membership_id), held, absent, percent: held > 0 ? pct2((Math.max(held - absent, 0) / held) * 100) : null };
    }),
    progress: progress.rows
      .map((r) => ({ learner: idOf(r.membership_id), total: Number(r.total), completed: Number(r.completed) }))
      .filter((x) => x.total > 0 || x.completed > 0),
    marks: [...marks.entries()].map(([membership, e]) => ({ learner: idOf(membership), assignmentPoints: e.a, quizScore: e.q, quizMax: e.m })),
  };
}
