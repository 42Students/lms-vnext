/**
 * Derived-number reconciliation for NSRIT stage 2b-ii: numbers computed from
 * the legacy rows that were planned (legacy side) against the same numbers
 * computed from the loaded vNext tables (vNext side). The first verifies the
 * mapping; row filtering is reported separately by the rejection report.
 * Output contains legacy numeric ids and counts only.
 */
import type { Tx } from "./db";
import type { Plan2bii } from "./plan-2bii";
import { projectCompletionPercent } from "../../../src/modules/projects/progress-percentage-policy";

export type Mismatch2bii = { ref: string; metric: string; legacy: string; vnext: string };

export type Reconciliation2bii = {
  placedLearners: { legacy: number; vnext: number };
  offersPerApplication: { compared: number; matched: number };
  applicationsPerDrive: { compared: number; matched: number };
  ctcTotalInr: { legacy: number; vnext: number };
  ctcPerDrive: { compared: number; matched: number };
  stageConsistency: { compared: number; matched: number };
  projectProgress: { compared: number; derivedMatched: number; storedMatched: number };
  mismatches: Mismatch2bii[];
};

type VnextApp = {
  app: string;
  status: string;
  screening: string | null;
  offers: number;
  accepted: number;
  issued: number;
  declinedOrWithdrawn: number;
  failResults: number;
  learner: string | null;
  job: string | null;
};

/** What the legacy stage should look like once decomposed into screening, results and offers. */
export function stageIsConsistent(stage: string, v: Pick<VnextApp, "status" | "screening" | "accepted" | "issued" | "declinedOrWithdrawn" | "failResults">): boolean {
  switch (stage) {
    case "APPLIED":
      return v.status === "SUBMITTED" && v.screening === "PENDING";
    case "SHORTLISTED":
    case "INTERVIEW":
      return v.screening === "SHORTLISTED";
    case "OFFERED":
      return v.issued > 0 || v.accepted > 0;
    case "HIRED":
      return v.accepted > 0;
    case "REJECTED":
      return v.screening === "REJECTED" || v.failResults > 0 || v.declinedOrWithdrawn > 0;
    case "WITHDRAWN":
      return v.status === "WITHDRAWN";
    default:
      return false;
  }
}

export async function reconcile2bii(tx: Tx, plan: Plan2bii, collegeId: string): Promise<Reconciliation2bii> {
  const facts = plan.placements.facts;
  const mismatches: Mismatch2bii[] = [];
  const apps = await tx.query<VnextApp & Record<string, unknown>>(
    `SELECT m.legacy_id AS app, a.status, s.status AS screening,
            (SELECT count(*) FROM placement_offers o WHERE o.application_id = a.id)::int AS offers,
            (SELECT count(*) FROM placement_offers o WHERE o.application_id = a.id AND o.status = 'ACCEPTED')::int AS accepted,
            (SELECT count(*) FROM placement_offers o WHERE o.application_id = a.id AND o.status = 'ISSUED')::int AS issued,
            (SELECT count(*) FROM placement_offers o WHERE o.application_id = a.id AND o.status IN ('DECLINED','WITHDRAWN'))::int AS "declinedOrWithdrawn",
            (SELECT count(*) FROM placement_round_results r WHERE r.application_id = a.id AND r.outcome = 'FAIL' AND r.status <> 'SUPERSEDED')::int AS "failResults",
            ml.legacy_id AS learner, mj.legacy_id AS job
       FROM placement_applications a
       JOIN legacy_id_map m ON m.new_id = a.id AND m.new_entity_type = 'placement_applications' AND m.college_id = $1
       LEFT JOIN placement_application_screenings s ON s.application_id = a.id
       LEFT JOIN legacy_id_map ml ON ml.new_id = a.membership_id AND ml.new_entity_type = 'college_memberships' AND ml.legacy_entity_type = 'learner' AND ml.college_id = $1
       LEFT JOIN legacy_id_map mj ON mj.new_id = a.job_id AND mj.new_entity_type = 'placement_jobs' AND mj.college_id = $1`,
    [collegeId],
  );
  const byApp = new Map(apps.rows.map((r) => [String(r.app), r]));

  // offers per application and stage consistency
  let offersMatched = 0;
  let stageMatched = 0;
  for (const f of facts.applications) {
    const v = byApp.get(f.application);
    if (!v) {
      mismatches.push({ ref: `job_application#${f.application}`, metric: "present", legacy: "planned", vnext: "missing" });
      continue;
    }
    if (v.offers === f.offers) offersMatched += 1;
    else mismatches.push({ ref: `job_application#${f.application}`, metric: "offers", legacy: String(f.offers), vnext: String(v.offers) });
    if (stageIsConsistent(f.stage, v)) stageMatched += 1;
    else mismatches.push({ ref: `job_application#${f.application}`, metric: `stage ${f.stage}`, legacy: f.stage, vnext: `status ${v.status} / screening ${v.screening ?? "-"} / offers ${v.offers} (accepted ${v.accepted}, issued ${v.issued}) / failed rounds ${v.failResults}` });
  }

  // applications per drive and CTC per drive
  const perJob = new Map<string, { applications: number }>();
  for (const v of apps.rows) {
    if (!v.job) continue;
    const e = perJob.get(String(v.job)) ?? { applications: 0 };
    e.applications += 1;
    perJob.set(String(v.job), e);
  }
  const ctc = await tx.query<{ job: string; inr: string }>(
    `SELECT mj.legacy_id AS job, coalesce(sum(o.annual_ctc_inr), 0)::text AS inr
       FROM placement_offers o
       JOIN placement_applications a ON a.id = o.application_id
       JOIN legacy_id_map m ON m.new_id = a.id AND m.new_entity_type = 'placement_applications' AND m.college_id = $1
       JOIN legacy_id_map mj ON mj.new_id = a.job_id AND mj.new_entity_type = 'placement_jobs' AND mj.college_id = $1
      WHERE o.status = 'ACCEPTED' GROUP BY mj.legacy_id`,
    [collegeId],
  );
  const ctcByJob = new Map(ctc.rows.map((r) => [r.job, Number(r.inr)]));
  let driveMatched = 0;
  let ctcMatched = 0;
  let vnextCtcTotal = 0;
  for (const j of facts.jobs) {
    const v = perJob.get(j.job)?.applications ?? 0;
    if (v === j.applications) driveMatched += 1;
    else mismatches.push({ ref: `job#${j.job}`, metric: "applications", legacy: String(j.applications), vnext: String(v) });
    const c = ctcByJob.get(j.job) ?? 0;
    vnextCtcTotal += c;
    if (c === j.ctcInr) ctcMatched += 1;
    else mismatches.push({ ref: `job#${j.job}`, metric: "accepted CTC (INR)", legacy: String(j.ctcInr), vnext: String(c) });
  }

  // placed learners: learners with an accepted offer
  const placedVnext = new Set(apps.rows.filter((v) => v.accepted > 0 && v.learner).map((v) => String(v.learner)));
  const placedLegacy = new Set(facts.placedLearners);
  for (const l of placedLegacy) if (!placedVnext.has(l)) mismatches.push({ ref: `learner#${l}`, metric: "placed", legacy: "HIRED", vnext: "no accepted offer" });
  for (const l of placedVnext) if (!placedLegacy.has(l)) mismatches.push({ ref: `learner#${l}`, metric: "placed", legacy: "not HIRED", vnext: "accepted offer" });

  // project progress
  const proj = await tx.query<{ project: string; tasks: string; done: string; sprints: string; completed: string }>(
    `SELECT m.legacy_id AS project,
            (SELECT count(*) FROM project_tasks t WHERE t.project_id = i.id)::text AS tasks,
            (SELECT count(*) FROM project_tasks t WHERE t.project_id = i.id AND t.status = 'DONE')::text AS done,
            (SELECT count(*) FROM project_sprints s WHERE s.project_id = i.id)::text AS sprints,
            (SELECT count(*) FROM project_sprints s WHERE s.project_id = i.id AND s.status = 'COMPLETED')::text AS completed
       FROM project_instances i JOIN legacy_id_map m ON m.new_id = i.id AND m.new_entity_type = 'project_instances' AND m.college_id = $1`,
    [collegeId],
  );
  const vProj = new Map(proj.rows.map((r) => [r.project, r]));
  let derivedMatched = 0;
  let storedMatched = 0;
  for (const f of plan.projects.facts.projects) {
    const v = vProj.get(f.project);
    if (!v) {
      mismatches.push({ ref: `project_workspace#${f.project}`, metric: "present", legacy: "planned", vnext: "missing" });
      continue;
    }
    const vnextPercent = projectCompletionPercent(Number(v.done) + Number(v.completed), Number(v.tasks) + Number(v.sprints));
    if (vnextPercent === f.derivedPercent) derivedMatched += 1;
    else mismatches.push({ ref: `project_workspace#${f.project}`, metric: "progress (same formula)", legacy: String(f.derivedPercent), vnext: String(vnextPercent) });
    if (f.storedProgress !== null && vnextPercent !== null && Math.round(f.storedProgress) === vnextPercent) storedMatched += 1;
    else if (f.storedProgress !== null) {
      mismatches.push({ ref: `project_workspace#${f.project}`, metric: "progress (legacy stored value)", legacy: String(f.storedProgress), vnext: String(vnextPercent) });
    }
  }

  return {
    placedLearners: { legacy: placedLegacy.size, vnext: placedVnext.size },
    offersPerApplication: { compared: facts.applications.length, matched: offersMatched },
    applicationsPerDrive: { compared: facts.jobs.length, matched: driveMatched },
    ctcTotalInr: { legacy: facts.offerCtcInr, vnext: vnextCtcTotal },
    ctcPerDrive: { compared: facts.jobs.length, matched: ctcMatched },
    stageConsistency: { compared: facts.applications.length, matched: stageMatched },
    projectProgress: { compared: plan.projects.facts.projects.length, derivedMatched, storedMatched },
    mismatches,
  };
}
