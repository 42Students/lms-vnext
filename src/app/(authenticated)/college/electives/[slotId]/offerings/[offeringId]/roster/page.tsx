"use server";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { and, count, eq, ilike, isNull, or, sql } from "drizzle-orm";
import { z } from "zod";
import { getDb } from "@/db/client";
import { collegeMemberships, colleges, electiveOfferings, electiveSlots, learnerProfiles, lmsGroupMembers, membershipRoles, users } from "@/db/schema";
import { getCurrentRequestContext } from "@/auth/request-context";
import { PageHeader } from "@/components/ui/page-header";
import { DataTable } from "@/components/ui/data-table";
import { Pagination } from "@/components/ui/pagination";
import { getCollegeGroupDetail } from "@/modules/groups/admin-read-service";
import { leaveGroup, moveElectiveMember } from "@/modules/groups/service";
import { listElectiveOfferings } from "@/modules/electives/service";
import { createCourseTeachingAssignment, endCourseTeachingAssignment,
  listCourseTeachingAssignments } from "@/modules/courses/teaching-assignment-service";
import { hasMembershipRole, isSuperAdmin } from "@/modules/identity/context";
import { requirePermission } from "@/modules/permissions/policy";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert } from "@/components/ui/alert";
import { EmptyState } from "@/components/ui/empty-state";
import { StatusBadge } from "@/components/ui/status-badge";

const uuid = z.string().uuid();
const ROSTER_PAGE_SIZE = 50;
function csvCell(value: string | null | undefined): string {
  const text = String(value ?? "");
  const safe = /^[=+@\-\t\r]/.test(text) ? "'" + text : text;
  return '"' + safe.replace(/"/g, '""') + '"';
}
const href = (slotId: string, offeringId: string) =>
  "/college/electives/" + slotId + "/offerings/" + offeringId + "/roster";
async function scoped(slotId: string, offeringId: string) {
  const context = await getCurrentRequestContext();
  if (context.user.platformStatus !== "ACTIVE" ||
      (!isSuperAdmin(context) && !hasMembershipRole(context, "COLLEGE_ADMIN"))) redirect("/dashboard");
  const parsedSlot = uuid.safeParse(slotId);
  const parsedOffering = uuid.safeParse(offeringId);
  if (!parsedSlot.success || !parsedOffering.success) notFound();
  const [row] = await getDb().select({
    slot: electiveSlots, offering: electiveOfferings, organizationId: colleges.organizationId,
  }).from(electiveOfferings)
    .innerJoin(electiveSlots, eq(electiveSlots.id, electiveOfferings.slotId))
    .innerJoin(colleges, eq(colleges.id, electiveSlots.collegeId))
    .where(and(eq(electiveSlots.id, parsedSlot.data),
      eq(electiveOfferings.id, parsedOffering.data),
      isNull(electiveSlots.deletedAt), isNull(electiveOfferings.deletedAt)))
    .limit(1);
  if (!row) notFound();
  if (isSuperAdmin(context) && context.adminScope?.collegeId !== row.slot.collegeId) redirect("/admin");
  requirePermission(context, "academics.manage", {
    collegeId: row.slot.collegeId, organizationId: row.organizationId,
  });
  return { context, ...row };
}
export default async function ElectiveRoster({
  params, searchParams,
}: {
  params: Promise<{ slotId: string; offeringId: string }>;
  searchParams: Promise<{ updated?: string; error?: string; q?: string; state?: string; page?: string }>;
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
      .where(and(eq(collegeMemberships.collegeId, slot.collegeId),
        eq(collegeMemberships.status, "ACTIVE")))
      .orderBy(users.displayName).limit(500),
  ]);
  const archived = slot.status !== "ACTIVE" || offering.status !== "ACTIVE";
  const targets = options.filter(item => item.offeringId !== offering.id);
  const back = href(slotId, offeringId);
  const search = (feedback.q ?? "").trim().slice(0, 100);
  const state = ["ACTIVE", "WAITLISTED", "REMOVED", "ALL"].includes(feedback.state ?? "")
    ? feedback.state! : "ACTIVE";
  const pageInput = Number(feedback.page ?? "1");
  const requestedPage = Number.isSafeInteger(pageInput) && pageInput > 0 ? pageInput : 1;
  const filterHref = (page: number) => back + "?state=" + encodeURIComponent(state) +
    "&q=" + encodeURIComponent(search) + "&page=" + page;
  const matching = and(
    eq(lmsGroupMembers.groupId, detail.group.id),
    state === "ALL" ? undefined : eq(lmsGroupMembers.state, state as "ACTIVE" | "WAITLISTED" | "REMOVED"),
    search ? or(
      ilike(users.displayName, "%" + search + "%"),
      ilike(learnerProfiles.rollNumber, "%" + search + "%"),
      sql`exists (
        select 1 from learner_program_enrollments e
        join programs p on p.id = e.program_id
        join departments d on d.id = p.department_id
        where e.membership_id = ${lmsGroupMembers.membershipId}
          and e.status = 'ACTIVE'
          and d.name ilike ${"%" + search + "%"}
      )`,
    ) : undefined,
  );
  const rosterDb = getDb();
  const baseRoster = () => rosterDb.select({
    membershipId: lmsGroupMembers.membershipId,
    displayName: users.displayName,
    rollNumber: learnerProfiles.rollNumber,
    state: lmsGroupMembers.state,
    waitlistPosition: lmsGroupMembers.waitlistPosition,
    source: lmsGroupMembers.source,
    joinedAt: lmsGroupMembers.joinedAt,
    department: sql<string | null>`(
      select d.name from learner_program_enrollments e
      join programs p on p.id = e.program_id
      join departments d on d.id = p.department_id
      where e.membership_id = ${lmsGroupMembers.membershipId}
        and e.status = 'ACTIVE'
      order by e.admitted_at desc limit 1
    )`,
  }).from(lmsGroupMembers)
    .innerJoin(collegeMemberships, eq(collegeMemberships.id, lmsGroupMembers.membershipId))
    .innerJoin(users, eq(users.id, collegeMemberships.userId))
    .leftJoin(learnerProfiles, eq(learnerProfiles.membershipId, collegeMemberships.id));
  const [totals] = await rosterDb.select({ total: count() }).from(lmsGroupMembers)
    .innerJoin(collegeMemberships, eq(collegeMemberships.id, lmsGroupMembers.membershipId))
    .innerJoin(users, eq(users.id, collegeMemberships.userId))
    .leftJoin(learnerProfiles, eq(learnerProfiles.membershipId, collegeMemberships.id))
    .where(matching);
  const total = totals?.total ?? 0;
  const pageCount = Math.max(1, Math.ceil(total / ROSTER_PAGE_SIZE));
  const page = Math.min(requestedPage, pageCount);
  const rosterRows = await baseRoster().where(matching)
    .orderBy(users.displayName, lmsGroupMembers.membershipId)
    .limit(ROSTER_PAGE_SIZE).offset((page - 1) * ROSTER_PAGE_SIZE);
  const fullCounts = await rosterDb.select({ state: lmsGroupMembers.state, total: count() })
    .from(lmsGroupMembers).where(eq(lmsGroupMembers.groupId, detail.group.id))
    .groupBy(lmsGroupMembers.state);
  const countFor = (value: string) => fullCounts.find(item => item.state === value)?.total ?? 0;
  const csv = [
    "name,rollNumber,department,state,since",
    ...rosterRows.map(member => [
      member.displayName, member.rollNumber, member.department, member.state,
      member.joinedAt ? new Intl.DateTimeFormat("en-IN", {
        dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Kolkata",
      }).format(member.joinedAt) : "",
    ].map(csvCell).join(",")),
  ].join("\r\n");
  async function mutate(form: FormData) {
    if (form.get("confirm") !== "yes") redirect(back + "?error=Please%20confirm");
    const { context, slot, offering } = await scoped(slotId, offeringId);
    if (slot.status !== "ACTIVE" || offering.status !== "ACTIVE")
      redirect(back + "?error=Archived%20offerings%20are%20read-only");
    const action = String(form.get("action") ?? "");
    let error = "";
    let outcome = action;
    try {
      const membershipId = uuid.parse(String(form.get("membershipId") ?? ""));
      if (action === "MOVE") {
        const moved = await moveElectiveMember(context, offering.id,
          uuid.parse(String(form.get("targetOfferingId") ?? "")), membershipId);
        outcome = moved.state;
      } else if (action === "REMOVE") {
        await leaveGroup(context, offering.groupId, membershipId, "MANUAL");
        outcome = "REMOVED";
      } else error = "Unsupported action";
    } catch (cause) {
      error = "Could not update this student. Check eligibility and capacity, then try again.";
    }
    redirect(back + (error ? "?error=" + encodeURIComponent(error) : "?updated=" + encodeURIComponent(outcome)));
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
  return <div className="min-w-0 max-w-full space-y-[var(--lms-space-4)]">
    <PageHeader 
      title={"Offering roster · " + slot.name}
      description="Student state, source, joining date and confirmed movement between offerings."
      actions={<Link href="/college/electives" className="inline-flex min-h-11 items-center font-semibold text-link underline md:min-h-9 underline-offset-4 hover:text-[var(--lms-primary-text)] hover:underline active:text-[var(--lms-primary-text)] focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)]">
        Back to Electives</Link>} />
    <div className="flex min-w-0 flex-wrap items-center gap-x-[var(--lms-space-4)] gap-y-[var(--lms-space-2)] border-b border-[var(--lms-canvas-border)] pb-[var(--lms-space-3)] text-sm leading-5">
      <span>Seats: {offering.capacity ?? "Unlimited"}</span>
      <span>Enrolled: {countFor("ACTIVE")}</span>
      <span>Waitlisted: {countFor("WAITLISTED")}</span>
      <span className="inline-flex items-center gap-2">Status: <StatusBadge tone={offering.status==="ACTIVE"?"success":"neutral"}>{offering.status}</StatusBadge></span>
    </div>
    {feedback.updated && <Alert tone="success">
      {feedback.updated === "WAITLISTED" ? "Moved (WAITLISTED)." :
        feedback.updated === "ACTIVE" ? "Moved (ENROLLED)." : "Roster updated."}
    </Alert>}
    {feedback.error && <Alert tone="error">{feedback.error}</Alert>}
    {archived && <Alert tone="warning">Archived offerings are read-only.</Alert>}
    <section className="min-w-0 space-y-[var(--lms-space-3)]" aria-label="Elective offering roster">
      <form method="get" className="flex min-w-0 flex-wrap items-end gap-3">
        <label className="min-w-0 flex-1 text-sm font-semibold">Search students
          <Input name="q" defaultValue={search} placeholder="Search students" maxLength={100} className="mt-1 w-full min-w-0" />
        </label>
        <label className="text-sm font-semibold">State
          <Select name="state" defaultValue={state} className="mt-1 min-w-36">
            <option value="ACTIVE">Enrolled</option>
            <option value="WAITLISTED">Waitlisted</option>
            <option value="REMOVED">Removed</option>
            <option value="ALL">All</option>
          </Select>
        </label>
        <Button type="submit" variant="secondary">Search</Button>
        <Link href={back} className="inline-flex min-h-11 items-center font-semibold text-link underline md:min-h-9">Refresh / Reset</Link>
        <a href={"data:text/csv;charset=utf-8," + encodeURIComponent("\uFEFF" + csv)}
          download={"elective-" + offering.id + "-roster.csv"}
          className="inline-flex min-h-11 items-center font-semibold text-link underline md:min-h-9">
          Export this page (CSV)
        </a>
      </form>
      <p className="text-sm text-muted-foreground">
        {total === 0 ? "No students in this state." :
          "Showing " + ((page - 1) * ROSTER_PAGE_SIZE + 1) + "–" +
          Math.min(page * ROSTER_PAGE_SIZE, total) + " of " + total + " matching students."}
        {" "}The CSV export includes this page only.
      </p>
      <DataTable
        caption="Elective offering roster"
        rows={rosterRows}
        getRowKey={member => member.membershipId}
        empty={<EmptyState title="No students allocated" description="No students have been allocated to this elective offering."/>}
        columns={[
          { key: "student", header: "Student", mobilePriority: "primary",
            cell: member => (member.displayName ?? member.membershipId) + (member.rollNumber ? " · " + member.rollNumber : "") },
          { key: "department", header: "Dept", cell: member => member.department ?? "—" },
          { key: "state", header: "State", mobilePriority: "secondary",
            cell: member => <StatusBadge tone={member.state==="ACTIVE"?"success":member.state==="WAITLISTED"?"warning":"neutral"}>{member.state + (member.waitlistPosition ? " #" + member.waitlistPosition : "")}</StatusBadge> },
          { key: "source", header: "Source", mobilePriority: "secondary",
            cell: member => member.source },
          { key: "since", header: "Since", mobilePriority: "secondary",
            cell: member => member.joinedAt ? new Intl.DateTimeFormat("en-IN",{dateStyle:"medium",timeStyle:"short",timeZone:"Asia/Kolkata"}).format(member.joinedAt) : "—" },
          { key: "actions", header: "Actions", mobilePriority: "action",
            cell: member => !archived && ["ACTIVE", "WAITLISTED"].includes(member.state)
              ? <div className="grid gap-2">
                {targets.length > 0 && <form action={mutate} className="grid min-w-0 gap-[var(--lms-space-2)] sm:grid-cols-[minmax(0,1fr)_auto_auto] sm:items-center">
                  <Input type="hidden" name="action" value="MOVE" />
                  <Input type="hidden" name="membershipId" value={member.membershipId} />
                  <Select name="targetOfferingId" required defaultValue="" className="min-w-0 w-full max-w-full"
                    aria-label="Move to another offering"
                    >
                    <option value="" disabled>Move to another offering</option>
                    {targets.map(target => <option key={target.offeringId} value={target.offeringId}>
                      {target.courseName} ({target.courseCode})</option>)}
                  </Select>
                  <label className="inline-flex min-h-11 items-center gap-2">
                    <Checkbox name="confirm" value="yes" required /> Confirm
                  </label>
                  <Button type="submit" variant="secondary" className="min-h-11 w-full sm:w-auto md:min-h-9">Move</Button>
                </form>}
                <form action={mutate} className="flex min-w-0 flex-col gap-[var(--lms-space-2)] sm:flex-row sm:items-center">
                  <Input type="hidden" name="action" value="REMOVE" />
                  <Input type="hidden" name="membershipId" value={member.membershipId} />
                  <label className="inline-flex min-h-11 items-center gap-2">
                    <Checkbox name="confirm" value="yes" required /> Confirm removal
                  </label>
                  <Button type="submit" variant="secondary" className="min-h-11 w-full sm:w-auto md:min-h-9">Remove</Button>
                </form>
              </div> : "—" },
        ]}
      />
      {pageCount > 1 && <Pagination label="Roster pages" page={page} pageCount={pageCount} hrefForPage={filterHref} />}
    </section>
    <section className="min-w-0 space-y-[var(--lms-space-3)] border-t border-[var(--lms-canvas-border)] pt-[var(--lms-space-4)]">
      <h2 className="m-0 text-[var(--lms-font-lg)] font-semibold leading-7 text-[var(--lms-heading)]">Faculty</h2>
      <p className="text-sm text-muted-foreground leading-[22px]">Assign a primary lecturer and co-teachers to this offering&apos;s course delivery.</p>
      {assignments.length === 0 && <EmptyState title="No faculty assigned" description="Assign an eligible faculty member to this elective offering."/>}
      {assignments.map(item => <div key={item.id} className="flex min-w-0 flex-col items-start gap-[var(--lms-space-2)] border-b border-[var(--lms-canvas-border)] py-[var(--lms-space-3)] text-sm sm:flex-row sm:items-center sm:justify-between">
        <span>{item.displayName ?? item.membershipId} · {item.role}</span>
        {!archived && <form action={changeFaculty}>
          <Input type="hidden" name="action" value="END" />
          <Input type="hidden" name="assignmentId" value={item.id} />
          <Button type="submit" variant="danger" className="min-h-11 md:min-h-9">Remove faculty</Button>
        </form>}
      </div>)}
      {!archived && <form action={changeFaculty} className="grid min-w-0 items-end gap-[var(--lms-space-3)] md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto]">
        <Input type="hidden" name="action" value="ASSIGN" />
        <label className="grid min-w-0 gap-[var(--lms-space-2)] max-[767px]:w-full text-[var(--lms-font-sm)] font-semibold leading-4 text-[var(--lms-neutral-400)]">Faculty
          <Select name="membershipId" required defaultValue="" className="w-full max-w-full">
            <option value="" disabled>Choose faculty</option>
            {faculty.map(item => <option key={item.id} value={item.id}>{item.name ?? item.id}</option>)}
          </Select>
        </label>
        <label className="grid min-w-0 gap-[var(--lms-space-2)] max-[767px]:w-full text-[var(--lms-font-sm)] font-semibold leading-4 text-[var(--lms-neutral-400)]">Role
          <Select name="role" className="w-full max-w-full">
            <option value="PRIMARY">Primary</option>
            <option value="CO_TEACHER">Co-Teacher</option>
          </Select>
        </label>
        <Button type="submit" disabled={faculty.length === 0} className="min-h-11 w-full md:min-h-9 md:w-auto">
          Assign faculty
        </Button>
      </form>}
    </section>

  </div>;
}
