import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { and, asc, eq, ilike, inArray, isNull, or } from "drizzle-orm";
import { z } from "zod";
import { getDb } from "@/db/client";
import {
  collegeMemberships, electiveOfferings, electiveSlots, learnerProfiles,
  learnerProgramEnrollments, lmsGroups, sectionEnrollments, sections, users,
} from "@/db/schema";
import { getCurrentRequestContext } from "@/auth/request-context";
import { PageHeader } from "@/components/ui/page-header";
import { hasMembershipRole } from "@/modules/identity/context";
import { requirePermission } from "@/modules/permissions/policy";
import { joinGroup } from "@/modules/groups/service";

const uuid = z.string().uuid();
const fieldStyle = "min-h-11 w-full rounded-md border border-border bg-surface px-3 text-sm text-foreground";
const base = (id: string) => "/college/electives/" + encodeURIComponent(id) + "/allocate";

async function scopedSlot(slotId: string) {
  const context = await getCurrentRequestContext();
  if (!context.membership || context.membership.status !== "ACTIVE" ||
      !hasMembershipRole(context, "COLLEGE_ADMIN")) redirect("/dashboard");
  requirePermission(context, "academics.manage", {
    collegeId: context.membership.collegeId,
    organizationId: context.membership.organizationId,
  });
  const [slot] = await getDb().select().from(electiveSlots).where(and(
    eq(electiveSlots.id, uuid.parse(slotId)),
    eq(electiveSlots.collegeId, context.membership.collegeId),
    eq(electiveSlots.status, "ACTIVE"), isNull(electiveSlots.deletedAt),
  )).limit(1);
  if (!slot) notFound();
  return { context, slot };
}

async function allocationCandidates(slot: { collegeId: string; programId: string; academicPeriodId: string | null },
  query = "", sectionId = "") {
  const filter = query.trim().slice(0, 128);
  return getDb().select({
    membershipId: collegeMemberships.id,
    name: users.displayName,
    rollNumber: learnerProfiles.rollNumber,
    sectionId: sections.id,
    sectionName: sections.name,
    sectionCode: sections.code,
  }).from(learnerProgramEnrollments)
    .innerJoin(collegeMemberships,
      eq(collegeMemberships.id, learnerProgramEnrollments.membershipId))
    .innerJoin(users, eq(users.id, collegeMemberships.userId))
    .innerJoin(sectionEnrollments, and(
      eq(sectionEnrollments.learnerEnrollmentId, learnerProgramEnrollments.id),
      eq(sectionEnrollments.status, "ACTIVE")))
    .innerJoin(sections, and(eq(sections.id, sectionEnrollments.sectionId),
      eq(sections.status, "ACTIVE")))
    .leftJoin(learnerProfiles, eq(learnerProfiles.membershipId, collegeMemberships.id))
    .where(and(
      eq(collegeMemberships.collegeId, slot.collegeId),
      eq(collegeMemberships.status, "ACTIVE"),
      eq(learnerProgramEnrollments.programId, slot.programId),
      eq(learnerProgramEnrollments.status, "ACTIVE"),
      slot.academicPeriodId ? eq(sectionEnrollments.academicPeriodId, slot.academicPeriodId) : undefined,
      sectionId && uuid.safeParse(sectionId).success ? eq(sections.id, sectionId) : undefined,
      filter ? or(ilike(users.displayName, "%" + filter + "%"),
        ilike(learnerProfiles.rollNumber, "%" + filter + "%"),
        uuid.safeParse(filter).success ? eq(collegeMemberships.id, filter) : undefined) : undefined,
    ))
    .orderBy(asc(sections.name), asc(users.displayName))
    .limit(500);
}

export default async function CollegeElectiveAllocatePage({
  params, searchParams,
}: {
  params: Promise<{ slotId: string }>;
  searchParams: Promise<{ q?: string; section?: string; added?: string; failed?: string; reason?: string }>;
}) {
  const { slotId } = await params;
  const input = await searchParams;
  const { slot } = await scopedSlot(slotId);
  const db = getDb();
  const [offerings, students, allSections] = await Promise.all([
    db.select({ id: electiveOfferings.id, groupId: electiveOfferings.groupId,
      name: lmsGroups.name, seats: lmsGroups.capacity, enrolled: lmsGroups.activeCount })
      .from(electiveOfferings)
      .innerJoin(lmsGroups, eq(lmsGroups.id, electiveOfferings.groupId))
      .where(and(eq(electiveOfferings.slotId, slot.id),
        eq(electiveOfferings.status, "ACTIVE"),
        isNull(electiveOfferings.deletedAt), isNull(lmsGroups.deletedAt))),
    allocationCandidates(slot, input.q ?? "", input.section ?? ""),
    db.select({ id: sections.id, name: sections.name, code: sections.code })
      .from(sections)
      .innerJoin(learnerProgramEnrollments,
        eq(learnerProgramEnrollments.cohortId, sections.cohortId))
      .where(eq(learnerProgramEnrollments.programId, slot.programId))
      .groupBy(sections.id, sections.name, sections.code)
      .orderBy(asc(sections.name)).limit(200),
  ]);

  async function allocate(formData: FormData) {
    "use server";
    const { context, slot: current } = await scopedSlot(slotId);
    const groupId = String(formData.get("offeringGroup") ?? "");
    const [target] = await getDb().select({ id: electiveOfferings.id })
      .from(electiveOfferings).where(and(
        eq(electiveOfferings.slotId, current.id),
        eq(electiveOfferings.groupId, uuid.parse(groupId)),
        eq(electiveOfferings.status, "ACTIVE"), isNull(electiveOfferings.deletedAt),
      )).limit(1);
    if (!target) notFound();
    const explicit = formData.getAll("membershipId").map(String).filter(v => uuid.safeParse(v).success);
    const identifiers = String(formData.get("identifiers") ?? "")
      .split(/[\s,;]+/).map(t => t.trim()).filter(Boolean).slice(0, 100);
    const ids = identifiers.filter(t => uuid.safeParse(t).success);
    const rolls = identifiers.filter(t => !uuid.safeParse(t).success).slice(0, 100);
    const matches = identifiers.length ? await getDb().select({
      id: collegeMemberships.id,
    }).from(collegeMemberships)
      .innerJoin(learnerProgramEnrollments,
        eq(learnerProgramEnrollments.membershipId, collegeMemberships.id))
      .leftJoin(learnerProfiles, eq(learnerProfiles.membershipId, collegeMemberships.id))
      .where(and(
        eq(collegeMemberships.collegeId, current.collegeId),
        eq(collegeMemberships.status, "ACTIVE"),
        eq(learnerProgramEnrollments.programId, current.programId),
        eq(learnerProgramEnrollments.status, "ACTIVE"),
        or(ids.length ? inArray(collegeMemberships.id, ids) : undefined,
          rolls.length ? inArray(learnerProfiles.rollNumber, rolls) : undefined),
      )).limit(100) : [];
    const selected = [...new Set([...explicit, ...matches.map(m => m.id)])].slice(0, 100);
    let added = 0, failed = identifiers.length - matches.length;
    let reason = failed ? "Some roll numbers or learner IDs were not found." : "";
    for (const membershipId of selected) {
      try {
        // Kernel serializes the slot, checks current section/program eligibility
        // and max-pick, and assigns ACTIVE or WAITLISTED under capacity policy.
        await joinGroup(context, groupId, membershipId, "MANUAL");
        added++;
      } catch (error) {
        failed++;
        if (!reason) reason = "Some students could not be allocated. Review their eligibility and the available seats.";
      }
    }
    redirect(base(slotId) + "?added=" + added + "&failed=" + failed +
      (reason ? "&reason=" + encodeURIComponent(reason) : ""));
  }

  return <main className="min-w-0 space-y-6">
    <PageHeader eyebrow="College Admin · Academic Setup" title="Eligible students"
      description={"Allocate eligible learners to " + slot.name + ". Existing capacity, waitlist and maximum-choice rules are enforced."}
      actions={<Link href="/college/electives" className="font-semibold text-primary-text">Back to Electives</Link>} />
    {input.added !== undefined && <p role="status" className="rounded-md border border-border p-3">
      Processed {input.added} learner(s); {input.failed ?? "0"} failed.
      {input.reason ? " " + input.reason : ""}
    </p>}
    <form method="get" className="flex flex-wrap items-end gap-3 rounded-lg border border-border bg-surface p-4">
      <label className="grid min-w-52 flex-1 gap-1 text-sm font-semibold">Class/Section
        <select name="section" className={fieldStyle} defaultValue={input.section ?? ""}>
          <option value="">All sections</option>
          {allSections.map(s => <option key={s.id} value={s.id}>{s.name} ({s.code})</option>)}
        </select>
      </label>
      <label className="grid min-w-52 flex-1 gap-1 text-sm font-semibold">Name, roll number or learner ID
        <input name="q" type="search" maxLength={128} defaultValue={input.q ?? ""}
          className={fieldStyle} placeholder="Search eligible students" />
      </label>
      <button className="min-h-11 rounded-md bg-primary px-4 font-semibold text-on-primary">Search</button>
    </form>
    <form action={allocate} className="space-y-4 rounded-lg border border-border bg-surface p-4">
      <label className="grid gap-1 text-sm font-semibold">Allocate selected to…
        <select name="offeringGroup" required className={fieldStyle}>
          <option value="">Choose elective offering</option>
          {offerings.map(o => <option key={o.id} value={o.groupId}>
            {o.name} · {o.enrolled}/{o.seats ?? "unlimited"} seats
          </option>)}
        </select>
      </label>
      {offerings.length === 0 && <p className="text-sm text-muted-foreground">
        Add a course offering to this slot before allocating learners.</p>}
      <div className="max-h-80 overflow-auto rounded-md border border-border">
        <table className="w-full text-left text-sm">
          <thead className="sticky top-0 z-10 bg-surface"><tr className="border-b border-border">
            <th className="p-2">Select</th><th className="p-2">Student</th>
            <th className="p-2">Roll No.</th><th className="p-2">Section</th>
          </tr></thead>
          <tbody>{students.map(s => <tr key={s.membershipId} className="border-b border-border">
            <td className="p-2"><input type="checkbox" name="membershipId" value={s.membershipId} /></td>
            <td className="p-2">{s.name ?? s.membershipId}</td>
            <td className="p-2">{s.rollNumber ?? "—"}</td>
            <td className="p-2">{s.sectionName}</td>
          </tr>)}</tbody>
        </table>
      </div>
      <p className="text-xs text-muted-foreground">
        Showing up to 500 matching active learners. Filter by section or search for a smaller list.</p>
      <label className="grid gap-1 text-sm font-semibold">Or paste roll numbers / learner membership IDs
        <textarea name="identifiers" rows={3} maxLength={12000} className={fieldStyle}
          placeholder="One roll number or membership ID per line, comma separated also supported" />
      </label>
      <button type="submit" disabled={!offerings.length}
        className="min-h-11 rounded-md bg-primary px-4 font-semibold text-on-primary disabled:opacity-50">
        Allocate selected to…
      </button>
    </form>
  </main>;
}
