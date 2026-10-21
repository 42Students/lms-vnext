import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { and, eq, isNull, sql } from "drizzle-orm";
import { z } from "zod";
import { getCurrentRequestContext } from "@/auth/request-context";
import { getDb } from "@/db/client";
import { departments, electiveSlots, programs } from "@/db/schema";
import { resolveActingCollege } from "@/modules/permissions/acting-college";
import { listCollegeElectiveSlotOptions } from "@/modules/electives/college-slot-mutation-service";
import { CollegeSlotManager } from "@/components/electives/college-slot-manager";
import { ErrorState } from "@/components/ui/error-state";
import { PageHeader } from "@/components/ui/page-header";
import { StatusBadge } from "@/components/ui/status-badge";

export default async function CollegeElectiveSlotDetail({params}:{
  params: Promise<{slotId: string}>;
}) {
  const context = await getCurrentRequestContext();
  if (!context.membership) redirect("/dashboard");
  const {slotId} = await params;
  if (!z.string().uuid().safeParse(slotId).success) notFound();
  const member = await resolveActingCollege(context, "academics.read");
  const back = <Link href="/college/electives" className="font-semibold text-link underline">Back to electives</Link>;
  let slot: {
    id: string; name: string; description: string | null; version: number;
    credits: number; minPick: number; maxPick: number; status: string;
    semesterNumber: number; academicYear: string | null; programName: string;
    programId: string; academicPeriodId: string | null; hasEnrollmentHistory: boolean;
  } | undefined;
  try {
    [slot] = await getDb().select({
      id: electiveSlots.id, name: electiveSlots.name,
      description: electiveSlots.description, version: electiveSlots.version,
      credits: electiveSlots.credits, minPick: electiveSlots.minPick,
      maxPick: electiveSlots.maxPick, status: electiveSlots.status,
      semesterNumber: electiveSlots.semesterNumber, academicYear: electiveSlots.academicYear,
      programId: electiveSlots.programId, academicPeriodId: electiveSlots.academicPeriodId,
      hasEnrollmentHistory: sql<boolean>`exists (
        select 1 from elective_offerings eo where eo.slot_id = ${electiveSlots.id}
        and (exists (select 1 from lms_group_members gm where gm.group_id=eo.group_id)
          or exists (select 1 from lms_group_member_events ev where ev.group_id=eo.group_id))
      )`,
      programName: programs.name,
    }).from(electiveSlots)
      .innerJoin(programs, eq(programs.id, electiveSlots.programId))
      .innerJoin(departments, and(
        eq(departments.id, programs.departmentId),
        eq(departments.collegeId, member.collegeId),
      ))
      .where(and(eq(electiveSlots.id, slotId),
        eq(electiveSlots.collegeId, member.collegeId),
        isNull(electiveSlots.deletedAt))).limit(1);
  } catch {
    return <div className="space-y-4"><PageHeader title="Elective slot" />
      <ErrorState title="Could not refresh this elective slot"
        description="The previous list is still available. Retry loading this slot without losing your directory filters."
        action={<><a href={"/college/electives/" + encodeURIComponent(slotId)}
          className="font-semibold text-link underline">Retry</a>{back}</>} /></div>;
  }
  if (!slot) notFound();
  const options = slot.status === "ACTIVE"
    ? await listCollegeElectiveSlotOptions(context).catch(() => null) : null;
  return <div className="min-w-0 space-y-4">
    <PageHeader title={slot.name} actions={back} />
    <p className="text-sm text-muted-foreground">{slot.programName} · Semester {slot.semesterNumber}</p>
    <div className="flex flex-wrap items-center gap-3 border-b border-border pb-3">
      <StatusBadge tone={slot.status === "ACTIVE" ? "success" : "neutral"}>{slot.status}</StatusBadge>
      <span>{slot.credits} credits</span>
      <span>Select {slot.minPick}–{slot.maxPick}</span>
      {slot.academicYear ? <span>{slot.academicYear}</span> : null}
    </div>
    <p className="text-sm text-body">{slot.description || "No description recorded."}</p>
    {options ? <CollegeSlotManager options={options} row={slot} /> :
      slot.status === "ACTIVE" ? <ErrorState title="Could not load elective options"
        description="Retry options before editing this slot."
        action={<a href={"/college/electives/" + encodeURIComponent(slotId)}
          className="font-semibold text-link underline">Retry options</a>} /> : null}
    <Link href={"/college/electives/" + encodeURIComponent(slotId) + "/allocate"}
      className="inline-flex min-h-9 items-center font-semibold text-link underline">Eligible students</Link>
  </div>;
}
