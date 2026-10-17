import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { and, eq, isNull } from "drizzle-orm";
import { z } from "zod";
import { getDb } from "@/db/client";
import { collegeMemberships, electiveOfferings, electiveSlots, membershipRoles, users } from "@/db/schema";
import { getCurrentRequestContext } from "@/auth/request-context";
import { PageHeader } from "@/components/ui/page-header";
import { getCollegeGroupDetail } from "@/modules/groups/admin-read-service";
import { leaveGroup, moveElectiveMember } from "@/modules/groups/service";
import { listElectiveOfferings } from "@/modules/electives/service";
import { createCourseTeachingAssignment, endCourseTeachingAssignment,
  listCourseTeachingAssignments } from "@/modules/courses/teaching-assignment-service";
import { hasMembershipRole } from "@/modules/identity/context";
import { requirePermission } from "@/modules/permissions/policy";

const uuid = z.string().uuid();
const href = (slotId: string, offeringId: string) =>
  "/college/electives/" + slotId + "/offerings/" + offeringId + "/roster";
async function scoped(slotId: string, offeringId: string) {
  const context = await getCurrentRequestContext();
  if (!context.membership || context.membership.status !== "ACTIVE" ||
      !hasMembershipRole(context, "COLLEGE_ADMIN")) redirect("/dashboard");
  requirePermission(context, "academics.manage", {
    collegeId: context.membership.collegeId, organizationId: context.membership.organizationId,
  });
  const [row] = await getDb().select({
    slot: electiveSlots, offering: electiveOfferings,
  }).from(electiveOfferings)
    .innerJoin(electiveSlots, eq(electiveSlots.id, electiveOfferings.slotId))
    .where(and(eq(electiveSlots.id, uuid.parse(slotId)),
      eq(electiveOfferings.id, uuid.parse(offeringId)),
      eq(electiveSlots.collegeId, context.membership.collegeId),
      isNull(electiveSlots.deletedAt), isNull(electiveOfferings.deletedAt)))
    .limit(1);
  if (!row) notFound();
  return { context, ...row };
}
export default async function ElectiveRoster({
  params, searchParams,
}: {
  params: Promise<{ slotId: string; offeringId: string }>;
  searchParams: Promise<{ updated?: string; error?: string }>;
}) {
  const { slotId, offeringId } = await params;
  const feedback = await searchParams;
  const { context, slot, offering } = await scoped(slotId, offeringId);
  const [detail, options, assignments, faculty] = await Promise.all([
    getCollegeGroupDetail(context, offering.groupId),
    listElectiveOfferings(context, slotId),
    listCourseTeachingAssignments(context, offering.backedDeliveryId),
    getDb().select({ id: collegeMemberships.id, name: users.displayName })
      .from(collegeMemberships)
      .innerJoin(membershipRoles, and(
        eq(membershipRoles.membershipId, collegeMemberships.id),
        eq(membershipRoles.role, "FACULTY")))
      .innerJoin(users, eq(users.id, collegeMemberships.userId))
      .where(and(eq(collegeMemberships.collegeId, context.membership!.collegeId),
        eq(collegeMemberships.status, "ACTIVE")))
      .orderBy(users.displayName).limit(500),
  ]);
  const archived = slot.status !== "ACTIVE" || offering.status !== "ACTIVE";
  const targets = options.filter(item => item.offeringId !== offering.id);
  const back = href(slotId, offeringId);
  async function mutate(form: FormData) {
    "use server";
    if (form.get("confirm") !== "yes") redirect(back + "?error=Please%20confirm");
    const { context, slot, offering } = await scoped(slotId, offeringId);
    if (slot.status !== "ACTIVE" || offering.status !== "ACTIVE")
      redirect(back + "?error=Archived%20offerings%20are%20read-only");
    const membershipId = uuid.parse(String(form.get("membershipId") ?? ""));
    const action = String(form.get("action") ?? "");
    let error = "";
    try {
      if (action === "MOVE") {
        await moveElectiveMember(context, offering.id,
          uuid.parse(String(form.get("targetOfferingId") ?? "")), membershipId);
      } else if (action === "REMOVE") {
        await leaveGroup(context, offering.groupId, membershipId, "MANUAL");
      } else error = "Unsupported action";
    } catch (cause) {
      error = "Could not update this student. Check eligibility and capacity, then try again.";
    }
    redirect(back + (error ? "?error=" + encodeURIComponent(error) : "?updated=" + action));
  }
  async function changeFaculty(form: FormData) {
    "use server";
    const { context, slot, offering } = await scoped(slotId, offeringId);
    if (slot.status !== "ACTIVE" || offering.status !== "ACTIVE")
      redirect(back + "?error=Archived%20offerings%20are%20read-only");
    let error = "";
    try {
      if (form.get("action") === "ASSIGN") {
        const membershipId = uuid.parse(String(form.get("membershipId") ?? ""));
        const role = String(form.get("role") ?? "");
        if (role !== "PRIMARY" && role !== "CO_TEACHER") throw new Error("Invalid teaching role");
        await createCourseTeachingAssignment(context, {
          deliveryId: offering.backedDeliveryId, membershipId, role,
        });
      } else if (form.get("action") === "END") {
        await endCourseTeachingAssignment(context, uuid.parse(String(form.get("assignmentId") ?? "")));
      } else throw new Error("Unsupported teaching action");
    } catch (cause) {
      error = "Could not update the faculty assignment. Refresh the roster and try again.";
    }
    redirect(back + (error ? "?error=" + encodeURIComponent(error) : "?updated=faculty"));
  }
  return <main className="space-y-5">
    <PageHeader eyebrow="College Admin · Electives"
      title={"Offering roster · " + slot.name}
      description="Student state, source, joining date and confirmed movement between offerings."
      actions={<Link href="/college/electives" className="font-semibold text-primary-text">
        Back to Electives</Link>} />
    <div className="flex flex-wrap gap-4 rounded-xl border border-border bg-surface p-4 text-sm">
      <span>Seats: {offering.capacity ?? "Unlimited"}</span>
      <span>Enrolled: {detail.counts.active}</span>
      <span>Waitlisted: {detail.counts.waitlisted}</span>
      <span>Status: {offering.status}</span>
    </div>
    {feedback.updated && <p role="status" className="text-sm">Roster updated.</p>}
    {feedback.error && <p role="alert" className="text-sm text-error">{feedback.error}</p>}
    {archived && <p className="text-sm text-muted-foreground">Archived offerings are read-only.</p>}
    <section className="space-y-3 rounded-xl border border-border bg-surface p-4">
      <h2 className="text-lg font-semibold">Faculty</h2>
      <p className="text-sm text-muted-foreground">Assign a primary lecturer and co-teachers to this offering&apos;s course delivery.</p>
      {assignments.length === 0 && <p className="text-sm text-muted-foreground">No faculty assigned.</p>}
      {assignments.map(item => <div key={item.id} className="flex flex-wrap items-center justify-between gap-2 border-b border-border py-2 text-sm">
        <span>{item.displayName ?? item.membershipId} · {item.role}</span>
        {!archived && <form action={changeFaculty}>
          <input type="hidden" name="action" value="END" />
          <input type="hidden" name="assignmentId" value={item.id} />
          <button className="rounded border border-border px-3 py-2 text-error">Remove faculty</button>
        </form>}
      </div>)}
      {!archived && <form action={changeFaculty} className="flex flex-wrap items-end gap-3">
        <input type="hidden" name="action" value="ASSIGN" />
        <label className="grid gap-1 text-sm">Faculty
          <select name="membershipId" required defaultValue="" className="min-h-11 rounded border border-border bg-surface p-2">
            <option value="" disabled>Choose faculty</option>
            {faculty.map(item => <option key={item.id} value={item.id}>{item.name ?? item.id}</option>)}
          </select>
        </label>
        <label className="grid gap-1 text-sm">Role
          <select name="role" className="min-h-11 rounded border border-border bg-surface p-2">
            <option value="PRIMARY">Primary</option>
            <option value="CO_TEACHER">Co-teacher</option>
          </select>
        </label>
        <button disabled={faculty.length === 0}
          className="min-h-11 rounded bg-primary px-4 font-semibold text-on-primary disabled:opacity-50">
          Assign faculty
        </button>
      </form>}
    </section>
    <div className="overflow-x-auto rounded-xl border border-border bg-surface">
      <table className="w-full min-w-[780px] text-left text-sm">
        <thead className="sticky top-0 z-10 bg-surface"><tr className="border-b border-border">
          {["Student", "State", "Source", "Since", "Actions"].map(x=><th key={x} className="p-3">{x}</th>)}
        </tr></thead>
        <tbody>{detail.members.map(member=><tr key={member.membershipId}
          className="border-b border-border align-top">
          <td className="p-3 font-semibold">{member.displayName ?? member.membershipId}</td>
          <td className="p-3">{member.state}{member.waitlistPosition ? " #"+member.waitlistPosition : ""}</td>
          <td className="p-3">{member.source}</td>
          <td className="p-3">{member.joinedAt?.toLocaleString("en-IN", { timeZone: "Asia/Kolkata" }) ?? "—"}</td>
          <td className="p-3">{!archived && ["ACTIVE", "WAITLISTED"].includes(member.state)
            ? <div className="grid gap-2">
              {targets.length>0 && <form action={mutate} className="flex flex-wrap gap-2">
                <input type="hidden" name="action" value="MOVE" />
                <input type="hidden" name="membershipId" value={member.membershipId} />
                <select name="targetOfferingId" required defaultValue=""
                  aria-label="Move to another offering"
                  className="min-h-11 rounded border border-border bg-surface px-2">
                  <option value="" disabled>Move to another offering</option>
                  {targets.map(t=><option key={t.offeringId} value={t.offeringId}>
                    {t.courseName} ({t.courseCode})</option>)}
                </select>
                <label><input type="checkbox" name="confirm" value="yes" required /> Confirm</label>
                <button className="rounded border border-border px-3 text-primary-text">Move</button>
              </form>}
              <form action={mutate} className="flex flex-wrap gap-2">
                <input type="hidden" name="action" value="REMOVE" />
                <input type="hidden" name="membershipId" value={member.membershipId} />
                <label><input type="checkbox" name="confirm" value="yes" required /> Confirm removal</label>
                <button className="rounded border border-border px-3 text-error">Remove</button>
              </form>
            </div>: "—"}</td>
        </tr>)}</tbody>
      </table>
      {detail.members.length===0 && <p className="p-4 text-sm text-muted-foreground">No students allocated.</p>}
      {detail.members.length>=500 && <p className="p-3 text-xs">Showing first 500 members.</p>}
    </div>
  </main>;
}
