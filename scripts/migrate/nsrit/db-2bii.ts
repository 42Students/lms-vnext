/**
 * Database side of NSRIT stage 2b-ii (placements, projects, learner in-app
 * notifications). Same rules as stages 2a and 2b-i: plain SQL on a guarded
 * connection (table allowlist in guards.ts), deterministic UUIDv5 ids, every
 * row written with INSERT ... ON CONFLICT (id) DO UPDATE and tracked in
 * legacy_id_map with a source hash, so an unchanged re-run writes nothing.
 *
 * Notifications: each learner notification gets one synthesized activity
 * event (module PLATFORM, event_type legacy_import.notification) because
 * in_app_notifications.event_id is NOT NULL. The loader never writes an
 * outbox, delivery or messaging row; notifications are stored already
 * delivered (read or unread exactly as in legacy) so nothing can re-send.
 */
import type { Client } from "pg";
import { LoadAbort, LoadContext, syncTable, ts, writeMap, type Validation } from "./db";
import type { Plan2bii } from "./plan-2bii";
import type { Planned } from "./plan";

const T = (value: string | null) => ts(value);
const now = (n: number) => `coalesce($${n}::timestamptz, now())`;

type Builder<D> = (item: Planned<D>) => unknown[];

async function sync<D>(ctx: LoadContext, table: string, items: Planned<D>[], sql: string, build: Builder<D>) {
  await syncTable(ctx, {
    table,
    items,
    upsert: async (c, i) => {
      await c.tx.query(sql, build(i));
    },
  });
}

/** Rows that must exist from the earlier stages (same college). */
export async function preflight2bii(client: Client, plan: Plan2bii): Promise<string[]> {
  const problems: string[] = [];
  const need: [string, string][] = [
    ["placement_offers", "bond_amount"],
    ["placement_job_eligibility_policies", "min_pct_throughout_basis_points"],
    ["placement_job_eligibility_policies", "allowed_section_ids"],
    ["placement_recruiter_college_grants", "verification_status"],
    ["placement_jobs", "is_dream"],
    ["project_members", "role_kind"],
    ["project_tasks", "assignee_membership_id"],
    ["project_submissions", "locked_at"],
    ["legacy_id_map", "source_hash"],
  ];
  for (const [table, column] of need) {
    const r = await client.query(
      `SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = $1 AND column_name = $2`,
      [table, column],
    );
    if (r.rowCount === 0) problems.push(`missing ${table}.${column}: run migrations through 0098 first`);
  }
  const count = async (sql: string, ids: string[]) => Number((await client.query<{ n: string }>(sql, [ids])).rows[0].n);
  const p = plan.placements;
  const memberships = [
    ...new Set([
      ...p.applications.map((a) => a.data.membershipId),
      ...p.registrations.map((a) => a.data.membershipId),
      ...p.savedJobs.map((a) => a.data.membershipId),
      ...p.preferences.map((a) => a.data.membershipId),
      ...plan.projects.members.map((a) => a.data.membershipId),
    ]),
  ];
  if ((await count(`SELECT count(*) AS n FROM college_memberships WHERE id = ANY($1::uuid[])`, memberships)) !== memberships.length) {
    problems.push("stage 2a memberships are missing: apply stage 2a first");
  }
  const cohorts = [...new Set([...p.registrations.map((r) => r.data.cohortId), ...p.batchLifecycles.map((r) => r.data.cohortId)])];
  if ((await count(`SELECT count(*) AS n FROM cohorts WHERE id = ANY($1::uuid[])`, cohorts)) !== cohorts.length) {
    problems.push("stage 2a cohorts are missing: apply stage 2a first");
  }
  const users = [
    ...new Set([
      ...p.jobs.map((j) => j.data.createdByUserId),
      ...p.companies.map((j) => j.data.createdByUserId),
      ...plan.projects.instances.map((j) => j.data.createdByUserId),
      ...plan.notifications.notifications.map((n) => n.data.userId),
    ]),
  ];
  if ((await count(`SELECT count(*) AS n FROM users WHERE id = ANY($1::uuid[])`, users)) !== users.length) {
    problems.push("stage 2a users are missing: apply stage 2a first");
  }
  const college = await client.query(`SELECT 1 FROM colleges WHERE id = $1`, [p.season[0]?.data.collegeId ?? p.relationships[0]?.data.collegeId ?? "00000000-0000-0000-0000-000000000000"]);
  if ((p.season.length || p.relationships.length) && college.rowCount === 0) problems.push("NSRIT college row is missing: apply stage 2a first");
  return problems;
}

/** Existing global companies that the loader does not own (by name and domain), for conflict-free reuse. */
export async function findExistingCompanies(client: Client, ownedIds: Set<string>) {
  const byName = new Map<string, string>();
  const byDomain = new Map<string, string>();
  const res = await client.query<{ id: string; name: string; primary_domain: string | null }>(
    `SELECT id, lower(name) AS name, lower(primary_domain) AS primary_domain FROM placement_companies`,
  );
  for (const r of res.rows) {
    if (ownedIds.has(r.id)) continue;
    byName.set(r.name, r.id);
    if (r.primary_domain) byDomain.set(r.primary_domain, r.id);
  }
  return { byName, byDomain };
}

export async function loadPlacementsProjects2bii(ctx: LoadContext, plan: Plan2bii) {
  const p = plan.placements;

  // ----------------------------------------------------------- module switches
  // A rule an administrator already set for the college (same scope and module, other id) is left untouched.
  await sync(
    ctx,
    "module_access_rules",
    p.moduleRules,
    `INSERT INTO module_access_rules (id, scope_type, scope_id, module, enabled, locked, updated_by_user_id, created_at, updated_at)
     VALUES ($1, 'COLLEGE', $2, $3, $4, $8::boolean, $5, ${now(6)}, ${now(7)})
     ON CONFLICT (scope_type, scope_id, module) WHERE scope_id IS NOT NULL
     DO UPDATE SET enabled = excluded.enabled, locked = excluded.locked, updated_at = excluded.updated_at WHERE module_access_rules.id = excluded.id`,
    (i) => [i.newId, i.data.scopeId, i.data.module, i.data.enabled, i.data.updatedByUserId, T(i.data.createdAt), T(i.data.updatedAt), i.data.locked],
  );

  // -------------------------------------------------------------- companies
  await sync(
    ctx,
    "placement_companies",
    p.companies,
    `INSERT INTO placement_companies (id, name, website_url, primary_domain, status, created_by_user_id, created_at, updated_at)
     VALUES ($1, $2, $3, $4, $5, $6, ${now(7)}, ${now(8)})
     ON CONFLICT (id) DO UPDATE SET name = excluded.name, website_url = excluded.website_url, primary_domain = excluded.primary_domain, updated_at = excluded.updated_at`,
    (i) => [i.newId, i.data.name, i.data.websiteUrl, i.data.primaryDomain, i.data.status, i.data.createdByUserId, T(i.data.createdAt), T(i.data.updatedAt)],
  );
  // Companies that already existed (other colleges): provenance only, never written or deleted by the loader.
  for (const r of p.reusedCompanies) {
    await writeMap(ctx, r.legacyType, r.legacyId, r.newType, r.newId, r.hash);
    ctx.bump("placement_companies_existing", "unchanged");
  }
  await sync(
    ctx,
    "placement_company_relationships",
    p.relationships,
    `INSERT INTO placement_company_relationships (id, college_id, company_id, status, is_trusted, owner_membership_id, created_by_user_id, created_at, updated_at)
     VALUES ($1, $2, $3, 'ACTIVE', $4, $5, $6, ${now(7)}, ${now(8)})
     ON CONFLICT (id) DO UPDATE SET is_trusted = excluded.is_trusted, owner_membership_id = excluded.owner_membership_id, updated_at = excluded.updated_at`,
    (i) => [i.newId, i.data.collegeId, i.data.companyId, i.data.isTrusted, i.data.ownerMembershipId, i.data.createdByUserId, T(i.data.createdAt), T(i.data.updatedAt)],
  );

  // -------------------------------------------------------------- recruiters
  await sync(
    ctx,
    "users",
    p.recruiterUsers,
    `INSERT INTO users (id, identity_uid, phone_e164, email, display_name, platform_status, created_at, updated_at)
     VALUES ($1, $2, $3, $4, $5, 'ACTIVE', ${now(6)}, ${now(7)})
     ON CONFLICT (id) DO UPDATE SET phone_e164 = excluded.phone_e164, email = excluded.email, display_name = excluded.display_name, updated_at = excluded.updated_at`,
    (i) => [i.newId, i.data.identityUid, i.data.phoneE164, i.data.email, i.data.displayName, T(i.data.createdAt), T(i.data.updatedAt)],
  );
  await sync(
    ctx,
    "placement_recruiter_profiles",
    p.recruiterProfiles,
    `INSERT INTO placement_recruiter_profiles (user_id, company_id, title, status, created_by_user_id, archived_at, created_at, updated_at)
     VALUES ($1, $2, $3, $4, $5, $6::timestamptz, ${now(7)}, ${now(8)})
     ON CONFLICT (user_id) DO UPDATE SET title = excluded.title, status = excluded.status, archived_at = excluded.archived_at, updated_at = excluded.updated_at`,
    (i) => [i.data.userId, i.data.companyId, i.data.title, i.data.status, i.data.createdByUserId, T(i.data.archivedAt), T(i.data.createdAt), T(i.data.updatedAt)],
  );
  await sync(
    ctx,
    "placement_recruiter_college_grants",
    p.grants,
    `INSERT INTO placement_recruiter_college_grants (id, recruiter_user_id, company_relationship_id, status, granted_by_user_id, revoked_by_user_id, revoked_at,
                                                    valid_until, capabilities, verification_status, revoke_reason, created_at, updated_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7::timestamptz, $8::timestamptz, $9::text[], $10, $11, $12::timestamptz, ${now(13)})
     ON CONFLICT (id) DO UPDATE SET status = excluded.status, revoked_by_user_id = excluded.revoked_by_user_id, revoked_at = excluded.revoked_at,
       valid_until = excluded.valid_until, capabilities = excluded.capabilities, verification_status = excluded.verification_status,
       revoke_reason = excluded.revoke_reason, updated_at = excluded.updated_at`,
    (i) => [i.newId, i.data.recruiterUserId, i.data.companyRelationshipId, i.data.status, i.data.grantedByUserId, i.data.revokedByUserId, T(i.data.revokedAt), i.data.validUntil, i.data.capabilities, i.data.verificationStatus, i.data.revokeReason, i.data.createdAt, T(i.data.updatedAt)],
  );

  // ------------------------------------------------------------------ season
  await sync(
    ctx,
    "placement_seasons",
    p.season,
    `INSERT INTO placement_seasons (id, college_id, name, code, start_date, end_date, status, created_by_user_id, closed_by_user_id, closed_at, created_at, updated_at)
     VALUES ($1, $2, $3, $4, $5::date, $6::date, $7, $8, $9, $10::timestamptz, ${now(11)}, ${now(12)})
     ON CONFLICT (id) DO UPDATE SET name = excluded.name, start_date = excluded.start_date, end_date = excluded.end_date, status = excluded.status,
       closed_by_user_id = excluded.closed_by_user_id, closed_at = excluded.closed_at, updated_at = excluded.updated_at`,
    (i) => [i.newId, i.data.collegeId, i.data.name, i.data.code, i.data.startDate, i.data.endDate, i.data.status, i.data.createdByUserId, i.data.closedByUserId, T(i.data.closedAt), T(i.data.createdAt), T(i.data.updatedAt)],
  );

  // -------------------------------------------------------------------- jobs
  await sync(
    ctx,
    "placement_jobs",
    p.jobs,
    `INSERT INTO placement_jobs (id, college_id, season_id, company_relationship_id, title, description, employment_type, work_mode, locations, openings,
                                 minimum_annual_ctc_inr, maximum_annual_ctc_inr, application_mode, external_application_url, application_deadline, status,
                                 is_dream, published_at, closed_at, created_by_user_id, created_at, updated_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9::text[], $10, $11, $12, $13, $14, $15::timestamptz, $16, $17, $18::timestamptz, $19::timestamptz, $20, ${now(21)}, ${now(22)})
     ON CONFLICT (id) DO UPDATE SET title = excluded.title, description = excluded.description, employment_type = excluded.employment_type,
       work_mode = excluded.work_mode, locations = excluded.locations, minimum_annual_ctc_inr = excluded.minimum_annual_ctc_inr,
       maximum_annual_ctc_inr = excluded.maximum_annual_ctc_inr, application_mode = excluded.application_mode,
       external_application_url = excluded.external_application_url, application_deadline = excluded.application_deadline, status = excluded.status,
       is_dream = excluded.is_dream, published_at = excluded.published_at, closed_at = excluded.closed_at, updated_at = excluded.updated_at`,
    (i) => {
      const d = i.data;
      return [i.newId, d.collegeId, d.seasonId, d.companyRelationshipId, d.title, d.description, d.employmentType, d.workMode, d.locations, d.openings, d.minimumAnnualCtcInr, d.maximumAnnualCtcInr, d.applicationMode, d.externalApplicationUrl, T(d.applicationDeadline), d.status, d.isDream, T(d.publishedAt), T(d.closedAt), d.createdByUserId, T(d.createdAt), T(d.updatedAt)];
    },
  );
  await sync(
    ctx,
    "placement_job_role_options",
    p.roleOptions,
    `INSERT INTO placement_job_role_options (id, job_id, title, employment_type, work_mode, locations, openings, minimum_annual_ctc_inr, maximum_annual_ctc_inr,
                                             fixed_lpa, variable_lpa, joining_bonus_lpa, bond_months, bond_amount, is_primary, status, created_at, updated_at)
     VALUES ($1, $2, $3, $4, $5, $6::text[], NULL, $7, $8, $9::numeric, $10::numeric, $11::numeric, $12, NULL, $13, 'ACTIVE', ${now(14)}, ${now(15)})
     ON CONFLICT (id) DO UPDATE SET title = excluded.title, employment_type = excluded.employment_type, work_mode = excluded.work_mode,
       locations = excluded.locations, minimum_annual_ctc_inr = excluded.minimum_annual_ctc_inr, maximum_annual_ctc_inr = excluded.maximum_annual_ctc_inr,
       fixed_lpa = excluded.fixed_lpa, variable_lpa = excluded.variable_lpa, joining_bonus_lpa = excluded.joining_bonus_lpa,
       bond_months = excluded.bond_months, is_primary = excluded.is_primary, updated_at = excluded.updated_at`,
    (i) => {
      const d = i.data;
      return [i.newId, d.jobId, d.title, d.employmentType, d.workMode, d.locations, d.minimumAnnualCtcInr, d.maximumAnnualCtcInr, d.fixedLpa, d.variableLpa, d.joiningBonusLpa, d.bondMonths, d.isPrimary, T(d.createdAt), T(d.updatedAt)];
    },
  );
  await sync(
    ctx,
    "placement_job_eligibility_policies",
    p.policies,
    `INSERT INTO placement_job_eligibility_policies (job_id, allowed_program_ids, allowed_cohort_ids, allowed_section_ids, min_cgpa_hundredths,
                                                     min_tenth_pct_basis_points, min_twelfth_pct_basis_points, min_diploma_pct_basis_points,
                                                     min_undergraduate_pct_basis_points, min_pct_throughout_basis_points, allowed_passing_years,
                                                     require_verified_evidence, updated_by_user_id, created_at, updated_at)
     VALUES ($1, $2::uuid[], $3::uuid[], $4::uuid[], $5, $6, $7, $8, $9, $10, $11::int[], $12, $13, ${now(14)}, ${now(15)})
     ON CONFLICT (job_id) DO UPDATE SET allowed_program_ids = excluded.allowed_program_ids, allowed_cohort_ids = excluded.allowed_cohort_ids,
       allowed_section_ids = excluded.allowed_section_ids, min_cgpa_hundredths = excluded.min_cgpa_hundredths,
       min_tenth_pct_basis_points = excluded.min_tenth_pct_basis_points, min_twelfth_pct_basis_points = excluded.min_twelfth_pct_basis_points,
       min_diploma_pct_basis_points = excluded.min_diploma_pct_basis_points, min_undergraduate_pct_basis_points = excluded.min_undergraduate_pct_basis_points,
       min_pct_throughout_basis_points = excluded.min_pct_throughout_basis_points, allowed_passing_years = excluded.allowed_passing_years,
       require_verified_evidence = excluded.require_verified_evidence, updated_at = excluded.updated_at`,
    (i) => {
      const d = i.data;
      return [d.jobId, d.allowedProgramIds, d.allowedCohortIds, d.allowedSectionIds, d.minCgpaHundredths, d.minTenthPctBasisPoints, d.minTwelfthPctBasisPoints, d.minDiplomaPctBasisPoints, d.minUndergraduatePctBasisPoints, d.minPctThroughoutBasisPoints, d.allowedPassingYears, d.requireVerifiedEvidence, d.updatedByUserId, T(d.createdAt), T(d.updatedAt)];
    },
  );
  await sync(
    ctx,
    "placement_job_rounds",
    p.rounds,
    `INSERT INTO placement_job_rounds (id, job_id, sequence, kind, name, mode, scheduled_at, timezone, venue, meeting_url, what_to_bring, platform, test_url,
                                       duration_minutes, results_due_at, status, completed_at, cancelled_at, created_by_user_id, created_at, updated_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7::timestamptz, $8, $9, $10, $11, $12, NULL, $13, $14::timestamptz, $15, $16::timestamptz, $17::timestamptz, $18, ${now(19)}, ${now(20)})
     ON CONFLICT (id) DO UPDATE SET sequence = excluded.sequence, kind = excluded.kind, name = excluded.name, mode = excluded.mode,
       scheduled_at = excluded.scheduled_at, timezone = excluded.timezone, venue = excluded.venue, meeting_url = excluded.meeting_url,
       what_to_bring = excluded.what_to_bring, platform = excluded.platform, duration_minutes = excluded.duration_minutes,
       results_due_at = excluded.results_due_at, status = excluded.status, completed_at = excluded.completed_at, cancelled_at = excluded.cancelled_at,
       updated_at = excluded.updated_at`,
    (i) => {
      const d = i.data;
      return [i.newId, d.jobId, d.sequence, d.kind, d.name, d.mode, T(d.scheduledAt), d.timezone, d.venue, d.meetingUrl, d.whatToBring, d.platform, d.durationMinutes, T(d.resultsDueAt), d.status, T(d.completedAt), T(d.cancelledAt), d.createdByUserId, T(d.createdAt), T(d.updatedAt)];
    },
  );
  await sync(
    ctx,
    "placement_hr_interview_slots",
    p.slots,
    `INSERT INTO placement_hr_interview_slots (id, college_id, job_id, round_id, start_at, end_at, timezone, mode, meeting_location, panel_label, capacity,
                                               booked_count, status, created_by_user_id, created_at, updated_at)
     VALUES ($1, $2, $3, $4, $5::timestamptz, $6::timestamptz, $7, $8, $9, $10, $11, $12, $13, $14, ${now(15)}, ${now(16)})
     ON CONFLICT (id) DO UPDATE SET start_at = excluded.start_at, end_at = excluded.end_at, mode = excluded.mode, meeting_location = excluded.meeting_location,
       panel_label = excluded.panel_label, capacity = excluded.capacity, booked_count = excluded.booked_count, status = excluded.status, updated_at = excluded.updated_at`,
    (i) => {
      const d = i.data;
      return [i.newId, d.collegeId, d.jobId, d.roundId, d.startAt, d.endAt, d.timezone, d.mode, d.meetingLocation, d.panelLabel, d.capacity, d.bookedCount, d.status, d.createdByUserId, T(d.createdAt), T(d.updatedAt)];
    },
  );

  // ------------------------------------------------------------ applications
  await sync(
    ctx,
    "placement_applications",
    p.applications,
    `INSERT INTO placement_applications (id, job_id, role_option_id, membership_id, channel, status, eligibility_status, eligibility_snapshot,
                                         submitted_by_user_id, submitted_at, withdrawn_at, updated_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8::jsonb, $9, $10::timestamptz, $11::timestamptz, ${now(12)})
     ON CONFLICT (id) DO UPDATE SET status = excluded.status, withdrawn_at = excluded.withdrawn_at, eligibility_snapshot = excluded.eligibility_snapshot,
       submitted_at = excluded.submitted_at, updated_at = excluded.updated_at`,
    (i) => {
      const d = i.data;
      return [i.newId, d.jobId, d.roleOptionId, d.membershipId, d.channel, d.status, d.eligibilityStatus, JSON.stringify(d.eligibilitySnapshot), d.submittedByUserId, d.submittedAt, T(d.withdrawnAt), T(d.updatedAt)];
    },
  );
  await sync(
    ctx,
    "placement_application_status_history",
    p.appHistory,
    `INSERT INTO placement_application_status_history (id, application_id, from_status, to_status, actor_user_id, reason, created_at)
     VALUES ($1, $2, $3, $4, $5, $6, ${now(7)})
     ON CONFLICT (id) DO UPDATE SET reason = excluded.reason, created_at = excluded.created_at`,
    (i) => [i.newId, i.data.applicationId, i.data.fromStatus, i.data.toStatus, i.data.actorUserId, i.data.reason, T(i.data.createdAt)],
  );
  await sync(
    ctx,
    "placement_application_screenings",
    p.screenings,
    `INSERT INTO placement_application_screenings (application_id, status, candidate_message, internal_reason, decided_by_user_id, decided_at, updated_at)
     VALUES ($1, $2, $3, $4, $5, $6::timestamptz, ${now(7)})
     ON CONFLICT (application_id) DO UPDATE SET status = excluded.status, candidate_message = excluded.candidate_message,
       internal_reason = excluded.internal_reason, decided_by_user_id = excluded.decided_by_user_id, decided_at = excluded.decided_at, updated_at = excluded.updated_at`,
    (i) => [i.data.applicationId, i.data.status, i.data.candidateMessage, i.data.internalReason, i.data.decidedByUserId, T(i.data.decidedAt), T(i.data.updatedAt)],
  );
  await sync(
    ctx,
    "placement_application_screening_history",
    p.screeningHistory,
    `INSERT INTO placement_application_screening_history (id, application_id, from_status, to_status, candidate_message, internal_reason, actor_user_id, created_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, ${now(8)})
     ON CONFLICT (id) DO UPDATE SET to_status = excluded.to_status, candidate_message = excluded.candidate_message,
       internal_reason = excluded.internal_reason, created_at = excluded.created_at`,
    (i) => [i.newId, i.data.applicationId, i.data.fromStatus, i.data.toStatus, i.data.candidateMessage, i.data.internalReason, i.data.actorUserId, T(i.data.createdAt)],
  );
  await sync(
    ctx,
    "placement_round_results",
    // superseded rows first: the unique "current result" index covers the others
    [...p.results].sort((a, b) => Number(b.data.status === "SUPERSEDED") - Number(a.data.status === "SUPERSEDED") || a.data.version - b.data.version),
    `INSERT INTO placement_round_results (id, round_id, application_id, version, outcome, waitlist_rank, score_percent, reason_category, candidate_message,
                                          internal_comment, source, status, submitted_by_user_id, submitted_at, applied_by_user_id, applied_at, superseded_at, updated_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14::timestamptz, $15, $16::timestamptz, $17::timestamptz, ${now(18)})
     ON CONFLICT (id) DO UPDATE SET outcome = excluded.outcome, waitlist_rank = excluded.waitlist_rank, score_percent = excluded.score_percent,
       reason_category = excluded.reason_category, candidate_message = excluded.candidate_message, internal_comment = excluded.internal_comment,
       source = excluded.source, status = excluded.status, applied_by_user_id = excluded.applied_by_user_id, applied_at = excluded.applied_at,
       superseded_at = excluded.superseded_at, updated_at = excluded.updated_at`,
    (i) => {
      const d = i.data;
      return [i.newId, d.roundId, d.applicationId, d.version, d.outcome, d.waitlistRank, d.scorePercent, d.reasonCategory, d.candidateMessage, d.internalComment, d.source, d.status, d.submittedByUserId, d.submittedAt, d.appliedByUserId, T(d.appliedAt), T(d.supersededAt), T(d.updatedAt)];
    },
  );
  await sync(
    ctx,
    "placement_offers",
    // withdrawn (superseded) versions first so the unique active-offer index never sees two active rows
    [...p.offers].sort((a, b) => Number(b.data.status === "WITHDRAWN") - Number(a.data.status === "WITHDRAWN") || a.data.version - b.data.version),
    `INSERT INTO placement_offers (id, application_id, version, kind, status, role_title, annual_ctc_inr, fixed_lpa, variable_lpa, joining_bonus_lpa, bond_months, bond_amount,
                                   acceptance_channel, accepted_disputable_until, cascade_id, revoke_reason, joining_date, expires_at, issued_by_user_id, issued_at,
                                   responded_by_user_id, responded_at, withdrawn_by_user_id, withdrawn_at, updated_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8::numeric, $9::numeric, $10::numeric, $11, NULL, $12, $13::timestamptz, $14::uuid, $15, $16::date, $17::timestamptz, $18,
             $19::timestamptz, $20, $21::timestamptz, $22, $23::timestamptz, ${now(24)})
     ON CONFLICT (id) DO UPDATE SET kind = excluded.kind, status = excluded.status, role_title = excluded.role_title, annual_ctc_inr = excluded.annual_ctc_inr,
       fixed_lpa = excluded.fixed_lpa, variable_lpa = excluded.variable_lpa, joining_bonus_lpa = excluded.joining_bonus_lpa, bond_months = excluded.bond_months,
       acceptance_channel = excluded.acceptance_channel, accepted_disputable_until = excluded.accepted_disputable_until, cascade_id = excluded.cascade_id,
       revoke_reason = excluded.revoke_reason, joining_date = excluded.joining_date, expires_at = excluded.expires_at, issued_at = excluded.issued_at,
       responded_by_user_id = excluded.responded_by_user_id, responded_at = excluded.responded_at, withdrawn_by_user_id = excluded.withdrawn_by_user_id,
       withdrawn_at = excluded.withdrawn_at, updated_at = excluded.updated_at`,
    (i) => {
      const d = i.data;
      return [i.newId, d.applicationId, d.version, d.kind, d.status, d.roleTitle, d.annualCtcInr, d.fixedLpa, d.variableLpa, d.joiningBonusLpa, d.bondMonths, d.acceptanceChannel, T(d.acceptedDisputableUntil), d.cascadeId, d.revokeReason, d.joiningDate, T(d.expiresAt), d.issuedByUserId, d.issuedAt, d.respondedByUserId, T(d.respondedAt), d.withdrawnByUserId, T(d.withdrawnAt), T(d.updatedAt)];
    },
  );
  await sync(
    ctx,
    "placement_offer_status_history",
    p.offerHistory,
    `INSERT INTO placement_offer_status_history (id, offer_id, from_status, to_status, actor_user_id, reason, cascade_id, created_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7::uuid, ${now(8)})
     ON CONFLICT (id) DO UPDATE SET reason = excluded.reason, created_at = excluded.created_at`,
    (i) => [i.newId, i.data.offerId, i.data.fromStatus, i.data.toStatus, i.data.actorUserId, i.data.reason, i.data.cascadeId, T(i.data.createdAt)],
  );

  // ---------------------------------------- batch, registration, decisions, ...
  await sync(
    ctx,
    "placement_batch_lifecycles",
    p.batchLifecycles,
    `INSERT INTO placement_batch_lifecycles (cohort_id, college_id, registration_deadline, invited_at, finished_at, rules_override, created_by_user_id,
                                             updated_by_user_id, created_at, updated_at)
     VALUES ($1, $2, $3::timestamptz, $4::timestamptz, $5::timestamptz, NULL, $6, $6, ${now(7)}, ${now(8)})
     ON CONFLICT (cohort_id) DO UPDATE SET registration_deadline = excluded.registration_deadline, invited_at = excluded.invited_at,
       finished_at = excluded.finished_at, updated_at = excluded.updated_at`,
    (i) => [i.data.cohortId, i.data.collegeId, T(i.data.registrationDeadline), T(i.data.invitedAt), T(i.data.finishedAt), i.data.createdByUserId, T(i.data.createdAt), T(i.data.updatedAt)],
  );
  await sync(
    ctx,
    "placement_batch_registrations",
    p.registrations,
    `INSERT INTO placement_batch_registrations (id, college_id, cohort_id, membership_id, choice, consent_version, consent_at, source, recorded_by_user_id,
                                                version, created_at, updated_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7::timestamptz, $8, $9, 0, ${now(10)}, ${now(11)})
     ON CONFLICT (id) DO UPDATE SET choice = excluded.choice, consent_version = excluded.consent_version, consent_at = excluded.consent_at,
       source = excluded.source, updated_at = excluded.updated_at`,
    (i) => {
      const d = i.data;
      return [i.newId, d.collegeId, d.cohortId, d.membershipId, d.choice, d.consentVersion, T(d.consentAt), d.source, d.recordedByUserId, T(d.createdAt), T(d.updatedAt)];
    },
  );
  await sync(
    ctx,
    "placement_eligibility_decisions",
    p.decisions,
    `INSERT INTO placement_eligibility_decisions (id, college_id, scope_type, scope_id, status, reason, note, decided_by_user_id, decided_at, created_at, updated_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9::timestamptz, $9::timestamptz, $9::timestamptz)
     ON CONFLICT (id) DO UPDATE SET status = excluded.status, reason = excluded.reason, note = excluded.note, decided_by_user_id = excluded.decided_by_user_id,
       decided_at = excluded.decided_at, updated_at = excluded.updated_at`,
    (i) => [i.newId, i.data.collegeId, i.data.scopeType, i.data.scopeId, i.data.status, i.data.reason, i.data.note, i.data.decidedByUserId, i.data.decidedAt],
  );
  await sync(
    ctx,
    "placement_saved_jobs",
    p.savedJobs,
    `INSERT INTO placement_saved_jobs (id, college_id, membership_id, job_id, saved_at)
     VALUES ($1, $2, $3, $4, ${now(5)})
     ON CONFLICT (id) DO UPDATE SET saved_at = excluded.saved_at`,
    (i) => [i.newId, i.data.collegeId, i.data.membershipId, i.data.jobId, i.data.savedAt],
  );
  await sync(
    ctx,
    "placement_candidate_preferences",
    p.preferences,
    `INSERT INTO placement_candidate_preferences (membership_id, preferred_role_titles, preferred_locations, shift_preference, notify_matching_jobs, created_at, updated_at)
     VALUES ($1, $2::text[], $3::text[], $4, $5, ${now(6)}, ${now(7)})
     ON CONFLICT (membership_id) DO UPDATE SET preferred_role_titles = excluded.preferred_role_titles, preferred_locations = excluded.preferred_locations,
       shift_preference = excluded.shift_preference, notify_matching_jobs = excluded.notify_matching_jobs, updated_at = excluded.updated_at`,
    (i) => [i.data.membershipId, i.data.preferredRoleTitles, i.data.preferredLocations, i.data.shiftPreference, i.data.notifyMatchingJobs, T(i.data.createdAt), T(i.data.updatedAt)],
  );

  // =========================================================== projects
  const q = plan.projects;
  await sync(
    ctx,
    "project_templates",
    q.templates,
    `INSERT INTO project_templates (id, slug, title, summary, status, current_version, published_version, created_by_user_id, archived_at, created_at, updated_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9::timestamptz, ${now(10)}, ${now(11)})
     ON CONFLICT (id) DO UPDATE SET title = excluded.title, summary = excluded.summary, status = excluded.status, current_version = excluded.current_version,
       published_version = excluded.published_version, archived_at = excluded.archived_at, updated_at = excluded.updated_at`,
    (i) => {
      const d = i.data;
      return [i.newId, d.slug, d.title, d.summary, d.status, d.currentVersion, d.publishedVersion, d.createdByUserId, T(d.archivedAt), T(d.createdAt), T(d.updatedAt)];
    },
  );
  await sync(
    ctx,
    "project_template_versions",
    q.templateVersions,
    `INSERT INTO project_template_versions (id, template_id, version, title, summary, blueprint, change_note, created_by_user_id, created_at)
     VALUES ($1, $2, $3, $4, $5, $6::jsonb, $7, $8, ${now(9)})
     ON CONFLICT (id) DO UPDATE SET title = excluded.title, summary = excluded.summary, blueprint = excluded.blueprint, change_note = excluded.change_note`,
    (i) => [i.newId, i.data.templateId, i.data.version, i.data.title, i.data.summary, JSON.stringify(i.data.blueprint), i.data.changeNote, i.data.createdByUserId, T(i.data.createdAt)],
  );
  await sync(
    ctx,
    "project_template_college_assignments",
    q.templateAssignments,
    `INSERT INTO project_template_college_assignments (id, template_id, template_version_id, college_id, assigned_by_user_id, assigned_at, revoked_at)
     VALUES ($1, $2, $3, $4, $5, $6::timestamptz, $7::timestamptz)
     ON CONFLICT (id) DO UPDATE SET template_version_id = excluded.template_version_id, revoked_at = excluded.revoked_at, assigned_at = excluded.assigned_at`,
    (i) => [i.newId, i.data.templateId, i.data.templateVersionId, i.data.collegeId, i.data.assignedByUserId, i.data.assignedAt, T(i.data.revokedAt)],
  );
  await sync(
    ctx,
    "project_instances",
    q.instances,
    `INSERT INTO project_instances (id, college_id, template_id, template_version_id, slug, title, summary, status, created_by_user_id, materialized_at, archived_at,
                                    created_at, updated_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, ${now(10)}, $11::timestamptz, ${now(12)}, ${now(13)})
     ON CONFLICT (id) DO UPDATE SET title = excluded.title, summary = excluded.summary, status = excluded.status, archived_at = excluded.archived_at, updated_at = excluded.updated_at`,
    (i) => {
      const d = i.data;
      return [i.newId, d.collegeId, d.templateId, d.templateVersionId, d.slug, d.title, d.summary, d.status, d.createdByUserId, T(d.materializedAt), T(d.archivedAt), T(d.createdAt), T(d.updatedAt)];
    },
  );
  await sync(
    ctx,
    "project_releases",
    q.releases,
    `INSERT INTO project_releases (id, project_id, template_key, title, description, sequence, status, created_at, updated_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, ${now(8)}, ${now(9)})
     ON CONFLICT (id) DO UPDATE SET title = excluded.title, description = excluded.description, sequence = excluded.sequence, status = excluded.status, updated_at = excluded.updated_at`,
    (i) => [i.newId, i.data.projectId, i.data.templateKey, i.data.title, i.data.description, i.data.sequence, i.data.status, T(i.data.createdAt), T(i.data.updatedAt)],
  );
  await sync(
    ctx,
    "project_sprints",
    q.sprints,
    `INSERT INTO project_sprints (id, project_id, release_id, template_key, title, description, sequence, status, created_at, updated_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, ${now(9)}, ${now(10)})
     ON CONFLICT (id) DO UPDATE SET title = excluded.title, description = excluded.description, sequence = excluded.sequence, status = excluded.status, updated_at = excluded.updated_at`,
    (i) => [i.newId, i.data.projectId, i.data.releaseId, i.data.templateKey, i.data.title, i.data.description, i.data.sequence, i.data.status, T(i.data.createdAt), T(i.data.updatedAt)],
  );
  await sync(
    ctx,
    "project_tasks",
    q.tasks,
    `INSERT INTO project_tasks (id, project_id, sprint_id, template_key, title, description, acceptance_criteria, priority, status, sequence, assignee_membership_id,
                                blocker_reason, due_date, estimate_points, task_type, created_at, updated_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13::date, $14, $15, ${now(16)}, ${now(17)})
     ON CONFLICT (id) DO UPDATE SET sprint_id = excluded.sprint_id, title = excluded.title, description = excluded.description, acceptance_criteria = excluded.acceptance_criteria,
       priority = excluded.priority, status = excluded.status, sequence = excluded.sequence, assignee_membership_id = excluded.assignee_membership_id,
       blocker_reason = excluded.blocker_reason, due_date = excluded.due_date, estimate_points = excluded.estimate_points, task_type = excluded.task_type,
       updated_at = excluded.updated_at`,
    (i) => {
      const d = i.data;
      return [i.newId, d.projectId, d.sprintId, d.templateKey, d.title, d.description, d.acceptanceCriteria, d.priority, d.status, d.sequence, d.assigneeMembershipId, d.blockerReason, d.dueDate, d.estimatePoints, d.taskType, T(d.createdAt), T(d.updatedAt)];
    },
  );
  await sync(
    ctx,
    "project_task_submissions",
    q.taskSubmissions,
    `INSERT INTO project_task_submissions (id, project_id, task_id, version, submitted_by_membership_id, submission_url, note, status, submitted_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9::timestamptz)
     ON CONFLICT (id) DO UPDATE SET submission_url = excluded.submission_url, note = excluded.note, status = excluded.status, submitted_at = excluded.submitted_at`,
    (i) => [i.newId, i.data.projectId, i.data.taskId, i.data.version, i.data.submittedByMembershipId, i.data.submissionUrl, i.data.note, i.data.status, i.data.submittedAt],
  );
  await sync(
    ctx,
    "project_task_comments",
    q.comments,
    `INSERT INTO project_task_comments (id, project_id, task_id, author_membership_id, body, created_at, updated_at)
     VALUES ($1, $2, $3, $4, $5, ${now(6)}, ${now(7)})
     ON CONFLICT (id) DO UPDATE SET body = excluded.body, updated_at = excluded.updated_at`,
    (i) => [i.newId, i.data.projectId, i.data.taskId, i.data.authorMembershipId, i.data.body, T(i.data.createdAt), T(i.data.updatedAt)],
  );
  await sync(
    ctx,
    "project_members",
    q.members,
    `INSERT INTO project_members (id, project_id, membership_id, role, role_kind, can_mutate, is_primary, role_label, started_at, ended_at, created_by_user_id, created_at, updated_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9::timestamptz, $10::timestamptz, $11, ${now(12)}, ${now(13)})
     ON CONFLICT (id) DO UPDATE SET role = excluded.role, role_kind = excluded.role_kind, can_mutate = excluded.can_mutate, is_primary = excluded.is_primary,
       role_label = excluded.role_label, started_at = excluded.started_at, ended_at = excluded.ended_at, updated_at = excluded.updated_at`,
    (i) => {
      const d = i.data;
      return [i.newId, d.projectId, d.membershipId, d.role, d.roleKind, d.canMutate, d.isPrimary, d.roleLabel, d.startedAt, T(d.endedAt), d.createdByUserId, T(d.createdAt), T(d.updatedAt)];
    },
  );
  await sync(
    ctx,
    "project_resources",
    q.resources,
    `INSERT INTO project_resources (id, project_id, template_key, title, description, url, required, sequence, status, visibility, created_at, updated_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, ${now(11)}, ${now(12)})
     ON CONFLICT (id) DO UPDATE SET title = excluded.title, description = excluded.description, url = excluded.url, required = excluded.required,
       sequence = excluded.sequence, status = excluded.status, visibility = excluded.visibility, updated_at = excluded.updated_at`,
    (i) => {
      const d = i.data;
      return [i.newId, d.projectId, d.templateKey, d.title, d.description, d.url, d.required, d.sequence, d.status, d.visibility, T(d.createdAt), T(d.updatedAt)];
    },
  );
  await sync(
    ctx,
    "project_meetings",
    q.meetings,
    `INSERT INTO project_meetings (id, project_id, status, meeting_type, title, agenda, starts_at, ends_at, time_zone, meeting_url, requested_by_membership_id,
                                   scheduled_by_user_id, scheduled_by_membership_id, linked_sprint_id, linked_task_id, outcome, created_by_user_id, created_at, updated_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7::timestamptz, $8::timestamptz, $9, $10, $11, $12, $13, $14, $15, $16, $17, ${now(18)}, ${now(19)})
     ON CONFLICT (id) DO UPDATE SET status = excluded.status, meeting_type = excluded.meeting_type, title = excluded.title, agenda = excluded.agenda,
       starts_at = excluded.starts_at, ends_at = excluded.ends_at, time_zone = excluded.time_zone, meeting_url = excluded.meeting_url,
       requested_by_membership_id = excluded.requested_by_membership_id, scheduled_by_user_id = excluded.scheduled_by_user_id,
       scheduled_by_membership_id = excluded.scheduled_by_membership_id, linked_sprint_id = excluded.linked_sprint_id, linked_task_id = excluded.linked_task_id,
       outcome = excluded.outcome, updated_at = excluded.updated_at`,
    (i) => {
      const d = i.data;
      return [i.newId, d.projectId, d.status, d.meetingType, d.title, d.agenda, d.startsAt, d.endsAt, d.timeZone, d.meetingUrl, d.requestedByMembershipId, d.scheduledByUserId, d.scheduledByMembershipId, d.linkedSprintId, d.linkedTaskId, d.outcome, d.createdByUserId, T(d.createdAt), T(d.updatedAt)];
    },
  );
  await sync(
    ctx,
    "project_submissions",
    q.submissions,
    `INSERT INTO project_submissions (id, project_id, version, status, summary, source_url, demo_url, notes, created_by_membership_id, submitted_by_membership_id,
                                      submitted_at, locked_at, attachments, created_at, updated_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11::timestamptz, $12::timestamptz, '[]'::jsonb, ${now(13)}, ${now(14)})
     ON CONFLICT (id) DO UPDATE SET status = excluded.status, summary = excluded.summary, source_url = excluded.source_url, demo_url = excluded.demo_url, notes = excluded.notes,
       submitted_by_membership_id = excluded.submitted_by_membership_id, submitted_at = excluded.submitted_at, locked_at = excluded.locked_at, updated_at = excluded.updated_at`,
    (i) => {
      const d = i.data;
      return [i.newId, d.projectId, d.version, d.status, d.summary, d.sourceUrl, null, d.notes, d.createdByMembershipId, d.submittedByMembershipId, T(d.submittedAt), T(d.lockedAt), T(d.createdAt), T(d.updatedAt)];
    },
  );
  await sync(
    ctx,
    "project_submission_reviews",
    q.reviews,
    `INSERT INTO project_submission_reviews (id, project_id, submission_id, decision, feedback, reviewed_by_user_id, reviewed_by_membership_id, reviewed_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8::timestamptz)
     ON CONFLICT (id) DO UPDATE SET decision = excluded.decision, feedback = excluded.feedback, reviewed_at = excluded.reviewed_at`,
    (i) => [i.newId, i.data.projectId, i.data.submissionId, i.data.decision, i.data.feedback, i.data.reviewedByUserId, i.data.reviewedByMembershipId, i.data.reviewedAt],
  );
  await sync(
    ctx,
    "project_delivery_events",
    q.deliveryEvents,
    `INSERT INTO project_delivery_events (id, project_id, submission_id, event_type, actor_membership_id, reason, occurred_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7::timestamptz)
     ON CONFLICT (id) DO UPDATE SET reason = excluded.reason, occurred_at = excluded.occurred_at`,
    (i) => [i.newId, i.data.projectId, i.data.submissionId, i.data.eventType, i.data.actorMembershipId, i.data.reason, i.data.occurredAt],
  );

  // ====================================================== notifications
  await loadNotifications(ctx, plan);
}

async function loadNotifications(ctx: LoadContext, plan: Plan2bii) {
  const n = plan.notifications;
  await syncTable(ctx, {
    table: "activity_events",
    items: n.events,
    upsert: async (c, i) => {
      const d = i.data;
      await c.tx.query(
        `INSERT INTO activity_events (id, organization_id, college_id, actor_user_id, actor_membership_id, module, event_type, importance, subject_type, subject_id,
                                      subject_label, summary, metadata, group_key, dedupe_key, occurred_at)
         VALUES ($1, $2, $3, NULL, NULL, 'PLATFORM', 'legacy_import.notification', 'LOW', 'legacy_notification', $4, NULL, $5, $6::jsonb, NULL, $7, ${now(8)})
         ON CONFLICT (id) DO UPDATE SET summary = excluded.summary, occurred_at = excluded.occurred_at`,
        [i.newId, d.organizationId, d.collegeId, d.legacyId, d.summary, JSON.stringify({ legacyImport: true, legacyId: d.legacyId, batchId: c.batchId }), d.dedupeKey, T(d.occurredAt)],
      );
    },
  });
  const eventByLegacy = new Map(n.events.map((e) => [e.legacyId, e.newId]));
  await syncTable(ctx, {
    table: "in_app_notifications",
    items: n.notifications,
    upsert: async (c, i) => {
      const d = i.data;
      const eventId = eventByLegacy.get(i.legacyId);
      if (!eventId) throw new LoadAbort("notification without its synthesized event");
      await c.tx.query(
        `INSERT INTO in_app_notifications (id, user_id, event_id, title, body, action_href, read_at, created_at)
         VALUES ($1, $2, $3, $4, $5, NULL, $6::timestamptz, ${now(7)})
         ON CONFLICT (id) DO UPDATE SET title = excluded.title, body = excluded.body, read_at = excluded.read_at`,
        [i.newId, d.userId, eventId, d.title, d.body, T(d.readAt), T(d.createdAt)],
      );
    },
  });
}

/** Mapped row counts per target table must equal the plan, plus structural checks. */
export async function validate2bii(ctx: LoadContext, plan: Plan2bii): Promise<Validation[]> {
  const out: Validation[] = [];
  const cid = [ctx.collegeId];
  const check = async (name: string, sql: string, expect: (n: number) => boolean, detail: (n: number) => string, params: unknown[] = cid) => {
    const res = await ctx.tx.query<{ n: string }>(sql, params);
    const n = Number(res.rows[0]?.n ?? 0);
    out.push({ check: name, ok: expect(n), detail: detail(n) });
  };
  const p = plan.placements;
  const q = plan.projects;
  const expected: [string, number][] = [
    ["module_access_rules", p.moduleRules.length],
    ["placement_companies", p.companies.length],
    ["placement_company_relationships", p.relationships.length],
    ["placement_recruiter_profiles", p.recruiterProfiles.length],
    ["placement_recruiter_college_grants", p.grants.length],
    ["placement_seasons", p.season.length],
    ["placement_jobs", p.jobs.length],
    ["placement_job_role_options", p.roleOptions.length],
    ["placement_job_eligibility_policies", p.policies.length],
    ["placement_job_rounds", p.rounds.length],
    ["placement_hr_interview_slots", p.slots.length],
    ["placement_applications", p.applications.length],
    ["placement_application_status_history", p.appHistory.length],
    ["placement_application_screenings", p.screenings.length],
    ["placement_application_screening_history", p.screeningHistory.length],
    ["placement_round_results", p.results.length],
    ["placement_offers", p.offers.length],
    ["placement_offer_status_history", p.offerHistory.length],
    ["placement_batch_lifecycles", p.batchLifecycles.length],
    ["placement_batch_registrations", p.registrations.length],
    ["placement_eligibility_decisions", p.decisions.length],
    ["placement_saved_jobs", p.savedJobs.length],
    ["placement_candidate_preferences", p.preferences.length],
    ["project_templates", q.templates.length],
    ["project_template_versions", q.templateVersions.length],
    ["project_template_college_assignments", q.templateAssignments.length],
    ["project_instances", q.instances.length],
    ["project_releases", q.releases.length],
    ["project_sprints", q.sprints.length],
    ["project_tasks", q.tasks.length],
    ["project_task_submissions", q.taskSubmissions.length],
    ["project_task_comments", q.comments.length],
    ["project_members", q.members.length],
    ["project_resources", q.resources.length],
    ["project_meetings", q.meetings.length],
    ["project_submissions", q.submissions.length],
    ["project_submission_reviews", q.reviews.length],
    ["project_delivery_events", q.deliveryEvents.length],
    ["activity_events", plan.notifications.events.length],
    ["in_app_notifications", plan.notifications.notifications.length],
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
    "every mapped application uses a role option of its own job",
    `SELECT count(*) AS n FROM placement_applications a JOIN legacy_id_map m ON m.new_id = a.id AND m.new_entity_type = 'placement_applications' AND m.college_id = $1
       JOIN placement_job_role_options r ON r.id = a.role_option_id WHERE r.job_id <> a.job_id`,
    (n) => n === 0,
    (n) => `${n} applications`,
  );
  await check(
    "every mapped job belongs to the NSRIT college and its company relationship",
    `SELECT count(*) AS n FROM placement_jobs j JOIN legacy_id_map m ON m.new_id = j.id AND m.new_entity_type = 'placement_jobs' AND m.college_id = $1
       JOIN placement_company_relationships r ON r.id = j.company_relationship_id WHERE j.college_id <> $1 OR r.college_id <> $1`,
    (n) => n === 0,
    (n) => `${n} jobs`,
  );
  await check(
    "every mapped round result belongs to the job of its application",
    `SELECT count(*) AS n FROM placement_round_results r JOIN legacy_id_map m ON m.new_id = r.id AND m.new_entity_type = 'placement_round_results' AND m.college_id = $1
       JOIN placement_applications a ON a.id = r.application_id JOIN placement_job_rounds x ON x.id = r.round_id WHERE a.job_id <> x.job_id`,
    (n) => n === 0,
    (n) => `${n} results`,
  );
  await check(
    "at most one active offer per mapped application",
    `SELECT count(*) AS n FROM (SELECT o.application_id FROM placement_offers o JOIN legacy_id_map m ON m.new_id = o.id AND m.new_entity_type = 'placement_offers' AND m.college_id = $1
       WHERE o.status IN ('ISSUED','ACCEPTED') GROUP BY o.application_id HAVING count(*) > 1) x`,
    (n) => n === 0,
    (n) => `${n} applications`,
  );
  await check(
    "every mapped task sits in a sprint of its own project",
    `SELECT count(*) AS n FROM project_tasks t JOIN legacy_id_map m ON m.new_id = t.id AND m.new_entity_type = 'project_tasks' AND m.college_id = $1
       JOIN project_sprints s ON s.id = t.sprint_id WHERE s.project_id <> t.project_id`,
    (n) => n === 0,
    (n) => `${n} tasks`,
  );
  await check(
    "every mapped project has at most one active sprint and one primary mentor",
    `SELECT count(*) AS n FROM project_instances i JOIN legacy_id_map m ON m.new_id = i.id AND m.new_entity_type = 'project_instances' AND m.college_id = $1
      WHERE (SELECT count(*) FROM project_sprints s WHERE s.project_id = i.id AND s.status = 'ACTIVE') > 1
         OR (SELECT count(*) FROM project_members x WHERE x.project_id = i.id AND x.is_primary AND x.ended_at IS NULL) > 1`,
    (n) => n === 0,
    (n) => `${n} projects`,
  );
  await check(
    "every mapped notification points at a legacy-import event of the same college",
    `SELECT count(*) AS n FROM in_app_notifications x JOIN legacy_id_map m ON m.new_id = x.id AND m.new_entity_type = 'in_app_notifications' AND m.college_id = $1
       JOIN activity_events e ON e.id = x.event_id WHERE e.module <> 'PLATFORM' OR e.event_type <> 'legacy_import.notification' OR e.college_id <> $1`,
    (n) => n === 0,
    (n) => `${n} notifications`,
  );
  return out;
}
