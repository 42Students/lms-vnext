"use server";
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
import { DataTable } from "@/components/ui/data-table";
import { ScrollCue } from "@/components/ui/scroll-cue";
import { hasMembershipRole } from "@/modules/identity/context";
import { requirePermission } from "@/modules/permissions/policy";
import { joinGroup } from "@/modules/groups/service";
import {Button} from "@/components/ui/button";
import {Select} from "@/components/ui/select";
import {Input} from "@/components/ui/input";
import {Textarea} from "@/components/ui/textarea";
import {Checkbox} from "@/components/ui/checkbox";
import {Alert} from "@/components/ui/alert";
import {EmptyState} from "@/components/ui/empty-state";

const uuid = z.string().uuid();
const fieldStyle = "min-h-11 min-w-0 md:min-h-9";
const base = (id: string) => "/college/electives/" + encodeURIComponent(id) + "/allocate";

async function scopedSlot(slotId: string) {
  const context = await getCurrentRequestContext();
  if (!context.membership || context.membership.status !== "ACTIVE" ||
      !hasMembershipRole(context, "COLLEGE_ADMIN")) redirect("/dashboard");
  requirePermission(context, "academics.manage", {
    collegeId: context.membership.collegeId,
    organizationId: context.membership.organizationId,
  });
  const checkedSlot = uuid.safeParse(slotId);
  if (!checkedSlot.success) notFound();
  const [slot] = await getDb().select().from(electiveSlots).where(and(
    eq(electiveSlots.id, checkedSlot.data),
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
    const { context, slot: current } = await scopedSlot(slotId);
    const groupId = String(formData.get("offeringGroup") ?? "");
    const checkedGroup = uuid.safeParse(groupId);
    if (!checkedGroup.success) redirect(base(slotId) + "?failed=1&reason=Choose%20an%20elective%20offering.");
    const [target] = await getDb().select({ id: electiveOfferings.id })
      .from(electiveOfferings).where(and(
        eq(electiveOfferings.slotId, current.id),
        eq(electiveOfferings.groupId, checkedGroup.data),
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

  return <main className="min-w-0 overflow-x-clip space-y-6">
    <PageHeader eyebrow="College Admin · Academic Setup" title="Eligible students"
      description={"Allocate eligible learners to " + slot.name + ". Existing capacity, waitlist and maximum-choice rules are enforced."}
      actions={<Link href="/college/electives" className="inline-flex min-h-11 items-center font-semibold text-link underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lms-primary)] md:min-h-9">Back to Electives</Link>} />
    {input.added !== undefined && <Alert tone={Number(input.failed ?? 0)>0?"warning":"success"}>
      Processed {input.added} learner(s); {input.failed ?? "0"} failed.
      {input.reason ? " " + input.reason : ""}
    </Alert>}
    <form method="get" className="flex flex-wrap items-end gap-3 border-b border-border pb-4">
      <label className="grid min-w-0 md:min-w-52 flex-1 gap-1 text-sm font-semibold">Class/Section
        <Select name="section" className={fieldStyle} defaultValue={input.section ?? ""}>
          <option value="">All sections</option>
          {allSections.map(s => <option key={s.id} value={s.id}>{s.name} ({s.code})</option>)}
        </Select>
      </label>
      <label className="grid min-w-0 md:min-w-52 flex-1 gap-1 text-sm font-semibold">Name, roll number or learner ID
        <Input name="q" type="search" maxLength={128} defaultValue={input.q ?? ""}
          className={fieldStyle} placeholder="Search eligible students" />
      </label>
      <Button type="submit" className="min-h-11 md:min-h-9">Search</Button>
    </form>
    <form action={allocate} className="space-y-4 border-b border-border pb-4">
      <label className="grid gap-1 text-sm font-semibold">Allocate selected to…
        <Select name="offeringGroup" required className={fieldStyle}>
          <option value="">Choose elective offering</option>
          {offerings.map(o => <option key={o.id} value={o.groupId}>
            {o.name} · {o.enrolled}/{o.seats ?? "unlimited"} seats
          </option>)}
        </Select>
      </label>
      {offerings.length === 0 && <EmptyState title="No elective offerings" description="Add a course offering to this slot before allocating learners."/>}
      <ScrollCue axis="y" label="Eligible students for allocation"
        className="min-w-0 rounded-[var(--lms-control-radius)] border border-border" viewportClassName="max-h-80">
        <DataTable
          caption="Eligible students for allocation"
          rows={students}
          getRowKey={student => student.membershipId}
          empty={<EmptyState title="No eligible learners" description="No eligible students match these filters."/>}
          columns={[
            { key: "select", header: "Select", mobilePriority: "action", cell: student =>
              <label className="flex min-h-11 min-w-11 items-center justify-center">
                <Checkbox
                  aria-label={"Select " + (student.name ?? student.rollNumber ?? "student") + " for allocation"}
                  name="membershipId" value={student.membershipId} />
              </label> },
            { key: "name", header: "Student", mobilePriority: "primary", cell: student => student.name ?? student.membershipId },
            { key: "roll", header: "Roll No.", mobilePriority: "secondary", cell: student => student.rollNumber ?? "—" },
            { key: "section", header: "Section", mobilePriority: "secondary", cell: student => student.sectionName },
          ]}
        />
      </ScrollCue>
      <p className="text-xs text-muted-foreground">
        Showing up to 500 matching active learners. Filter by section or search for a smaller list.</p>
      <label className="grid gap-1 text-sm font-semibold">Or paste roll numbers / learner membership IDs
        <Textarea name="identifiers" rows={3} maxLength={12000} className={fieldStyle}
          placeholder="One roll number or membership ID per line, comma separated also supported" />
      </label>
      <Button type="submit" disabled={!offerings.length} className="min-h-11 md:min-h-9">
        Allocate selected to…
      </Button>
    </form>
  </main>;
}
