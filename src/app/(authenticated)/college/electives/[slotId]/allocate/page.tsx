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
import {ErrorState} from "@/components/ui/error-state";

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
  query = "", sectionId = "", limit = 500) {
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
    .limit(limit);
}

export default async function CollegeElectiveAllocatePage({
  params, searchParams,
}: {
  params: Promise<{ slotId: string }>;
  searchParams: Promise<{ q?: string; section?: string; added?: string; failed?: string; reason?: string }>;
}) {
  const { slotId } = await params;
  const input = await searchParams;
  const actor = await getCurrentRequestContext();
  if (!actor.membership || actor.membership.status !== "ACTIVE" ||
      !hasMembershipRole(actor,"COLLEGE_ADMIN")) {
    return <div className="min-w-0 space-y-4">
      <PageHeader title="Allocate elective students" />
      <ErrorState title="Admin not assigned to an active college"
        description="College Admin access is required to allocate learners. Contact your administrator to restore or select an active college membership."
        action={<Link href="/college/electives" className="font-semibold text-link underline underline-offset-4">Back to electives</Link>} />
    </div>;
  }
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
    const mode = String(formData.get("allocationMode") ?? "SELECTED");
    const sectionId = String(formData.get("allocateSectionId") ?? "");
    if (mode !== "SELECTED" && mode !== "SECTION") {
      redirect(base(slotId)+"?failed=1&reason=Choose%20an%20allocation%20mode.");
    }
    let selected: string[] = [];
    let unmatched: string[] = [];
    if (mode === "SECTION") {
      if (!uuid.safeParse(sectionId).success)
        redirect(base(slotId)+"?failed=1&reason=Pick%20a%20class%20before%20allocating%20a%20whole%20section.");
      const roster = await allocationCandidates(current, "", sectionId, 101);
      if (!roster.length)
        redirect(base(slotId)+"?failed=1&reason=No%20eligible%20learners%20were%20found%20in%20this%20section.");
      if (roster.length > 100)
        redirect(base(slotId)+"?failed=1&reason=Whole-section%20allocations%20are%20limited%20to%20100%20learners.%20Narrow%20the%20group%20and%20retry.");
      selected = [...new Set(roster.map(row => row.membershipId))];
    } else {
      const explicit = formData.getAll("membershipId").map(String);
      if (explicit.some(id=>!uuid.safeParse(id).success))
        redirect(base(slotId)+"?failed=1&reason=Invalid%20learner%20selection.%20Refresh%20and%20retry.");
      const identifiers = String(formData.get("identifiers") ?? "")
        .split(/[\s,;]+/).map(token=>token.trim()).filter(Boolean);
      if (identifiers.length > 100)
        redirect(base(slotId)+"?failed=1&reason=Use%20at%20most%20100%20pasted%20roll%20numbers%20or%20membership%20IDs.");
      const invalidTokens=identifiers.filter(token=>
        token.length>100 || !new RegExp("^[A-Za-z0-9._/-]+$").test(token) ||
        (/^[0-9]+$/.test(token) && Number(token)<=0));
      if (invalidTokens.length)
        redirect(base(slotId)+"?failed=1&reason="+encodeURIComponent(
          "Invalid learner identifiers: "+invalidTokens.slice(0,5).join(", ")+
          (invalidTokens.length>5?" and "+(invalidTokens.length-5)+" more.":".")));
      const ids = identifiers.filter(token => uuid.safeParse(token).success);
      const rolls = identifiers.filter(token => !uuid.safeParse(token).success);
      const matches = identifiers.length ? await getDb().select({
        id: collegeMemberships.id,rollNumber:learnerProfiles.rollNumber,
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
        )).limit(101) : [];
      const foundIds=new Set(matches.map(m=>m.id));
      const foundRolls=new Set(matches.map(m=>m.rollNumber).filter((value):value is string=>value!==null));
      unmatched = identifiers.filter(token => !foundIds.has(token) && !foundRolls.has(token));
      selected = [...new Set([...explicit,...matches.map(m=>m.id)])];
      if (!selected.length && !unmatched.length)
        redirect(base(slotId)+"?failed=1&reason=Select%20learners%20or%20paste%20at%20least%20one%20roll%20number.");
      if (selected.length>100)
        redirect(base(slotId)+"?failed=1&reason=A%20maximum%20of%20100%20learners%20can%20be%20allocated%20at%20once.");
    }
    let added = 0, failed = unmatched.length;
    let reason = unmatched.length
      ? "Unmatched roll numbers or IDs: "+unmatched.slice(0,5).join(", ")+
        (unmatched.length>5?" (and "+(unmatched.length-5)+" more).":".")
      : "";
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

  return <div className="min-w-0 max-w-full space-y-[var(--lms-space-4)]">
    <PageHeader title="Eligible students"
      description={"Allocate eligible learners to " + slot.name + ". Existing capacity, waitlist and maximum-choice rules are enforced."}
      actions={<Link href="/college/electives" className="inline-flex min-h-11 items-center text-sm font-semibold text-link underline underline-offset-4 hover:text-[var(--lms-primary-text)] md:min-h-9 active:text-[var(--lms-primary-text)] focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)]">Back to Electives</Link>} />
    {input.failed !== undefined && <Alert tone={Number(input.failed ?? 0)>0?"warning":"success"}>
      Processed {input.added ?? "0"} learner(s); {input.failed ?? "0"} failed.
      {input.reason ? " " + input.reason : ""}
    </Alert>}
    <form method="get" className="grid min-w-0 grid-cols-1 items-end gap-[var(--lms-space-2)] md:grid-cols-2 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto]">
      <label className="grid min-w-0 gap-[var(--lms-space-2)] text-[var(--lms-font-sm)] font-semibold leading-4 text-[var(--lms-neutral-400)]">Class/Section
        <Select name="section" className={fieldStyle} defaultValue={input.section ?? ""}>
          <option value="">All sections</option>
          {allSections.map(s => <option key={s.id} value={s.id}>{s.name} ({s.code})</option>)}
        </Select>
      </label>
      <label className="grid min-w-0 gap-[var(--lms-space-2)] text-[var(--lms-font-sm)] font-semibold leading-4 text-[var(--lms-neutral-400)]">Name, roll number or learner ID
        <Input name="q" type="search" maxLength={128} defaultValue={input.q ?? ""}
          className={fieldStyle} placeholder="Search eligible students" />
      </label>
      <Button type="submit" className="min-h-11 w-full md:min-h-9 md:w-auto">Search</Button>
    </form>
    <form action={allocate} className="space-y-4 border-t border-[var(--lms-canvas-border)] pt-[var(--lms-space-4)]">
      <label className="grid min-w-0 gap-[var(--lms-space-2)] text-[var(--lms-font-sm)] font-semibold leading-4 text-[var(--lms-neutral-400)]">Allocation mode
        <Select name="allocationMode" defaultValue="SELECTED" className={fieldStyle}>
          <option value="SELECTED">Selected learners or pasted identifiers</option>
          <option value="SECTION">Whole section (up to 100 verified eligible learners)</option>
        </Select>
      </label>
      <label className="grid min-w-0 gap-[var(--lms-space-2)] text-[var(--lms-font-sm)] font-semibold leading-4 text-[var(--lms-neutral-400)]">Section for whole-section allocation
        <Select name="allocateSectionId" className={fieldStyle} defaultValue={input.section??""}>
          <option value="">Pick a class</option>
          {allSections.map(section=><option key={section.id} value={section.id}>{section.name} ({section.code})</option>)}
        </Select>
      </label>
      <p className="text-xs text-muted-foreground">Whole-section mode ignores the selected checkboxes and pasted IDs; the server verifies the selected section and all eligible learners before making any changes. Manual mode processes at most 100 learners per request.</p>
      <label className="grid min-w-0 gap-[var(--lms-space-2)] text-[var(--lms-font-sm)] font-semibold leading-4 text-[var(--lms-neutral-400)]">Allocate selected to…
        <Select name="offeringGroup" required className={fieldStyle}>
          <option value="">Choose elective offering</option>
          {offerings.map(o => <option key={o.id} value={o.groupId}>
            {o.name} · {o.enrolled}/{o.seats ?? "unlimited"} seats
          </option>)}
        </Select>
      </label>
      {offerings.length === 0 && <EmptyState title="No elective offerings" description="Add a course offering to this slot before allocating learners."/>}
      <ScrollCue axis="y" label="Eligible students for allocation"
        className="min-w-0" viewportClassName="max-h-[26rem]">
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
      <p className="text-xs text-muted-foreground leading-5">
        Showing up to 500 matching active learners. Checkbox selections are for the currently loaded results only; use pasted roll numbers to allocate learners outside this list.</p>
      <label className="grid min-w-0 gap-[var(--lms-space-2)] text-[var(--lms-font-sm)] font-semibold leading-4 text-[var(--lms-neutral-400)]">Or paste roll numbers / learner membership IDs
        <Textarea name="identifiers" rows={3} maxLength={12000} className={fieldStyle}
          placeholder="One roll number or membership ID per line, comma separated also supported" />
      </label>
      <Button type="submit" disabled={!offerings.length} className="min-h-11 w-full md:min-h-9 md:w-auto">
        Allocate selected to…
      </Button>
    </form>
  </div>;
}
