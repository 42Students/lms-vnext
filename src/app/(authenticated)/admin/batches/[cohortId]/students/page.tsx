import Link from "next/link";
import { FilterBar } from "@/components/ui/filter-bar";
import { notFound, redirect } from "next/navigation";
import { and, eq, ilike, or } from "drizzle-orm";
import { z } from "zod";
import { getDb } from "@/db/client";
import {
  cohorts, collegeMemberships, departments, learnerProfiles,
  learnerProgramEnrollments, programs, sectionEnrollments, sections, users,
} from "@/db/schema";
import { getCurrentRequestContext } from "@/auth/request-context";
import { PageHeader } from "@/components/ui/page-header";
import { PageBackLink } from "@/components/ui/page-back-link";
import { EmptyState } from "@/components/ui/empty-state";
import { DataTable } from "@/components/ui/data-table";
import { StudentClassMoveAction } from "@/components/college/student-class-move-action";
import { resolveActingCollege } from "@/modules/permissions/acting-college";
import { isSuperAdmin } from "@/modules/identity/context";
import { Alert } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";

export default async function SuperAdminBatchStudentsPage({
  params, searchParams,
}: {
  params: Promise<{ cohortId: string }>;
  searchParams: Promise<{ q?: string; sectionId?: string }>;
}) {
  const context = await getCurrentRequestContext();
  if (!isSuperAdmin(context)) redirect("/dashboard");
  // A Super Admin only operates inside the selected, active acting college.
  // This same persisted policy is enforced by section-move GET/PATCH.
  if (!context.adminScope?.collegeId) return <div className="min-w-0 space-y-4">
    <PageHeader title="Students" />
    <Alert tone="warning">Select a college in the header to view its batch roster.</Alert>
    <PageBackLink href="/admin/batches" label="Back to batches" />
  </div>;
  const acting = await resolveActingCollege(context, "academics.manage");
  const { cohortId: rawId } = await params;
  const checkedId = z.string().uuid().safeParse(rawId);
  if (!checkedId.success) notFound();
  const cohortId = checkedId.data;
  const input = await searchParams;
  const q = typeof input.q === "string" ? input.q.trim().slice(0, 100) : "";
  const sectionId = z.string().uuid().safeParse(input.sectionId).success ? input.sectionId : null;
  const db = getDb();
  const [batch] = await db.select({ id: cohorts.id, name: cohorts.name, program: programs.name })
    .from(cohorts).innerJoin(programs, eq(programs.id, cohorts.programId))
    .innerJoin(departments, eq(departments.id, programs.departmentId))
    .where(and(eq(cohorts.id, cohortId),
      eq(departments.collegeId, acting.collegeId))).limit(1);
  if (!batch) notFound();
  const [classes, students] = await Promise.all([
    db.select({ id: sections.id, name: sections.name, capacity: sections.capacity })
      .from(sections).where(and(eq(sections.cohortId, batch.id), eq(sections.status, "ACTIVE")))
      .orderBy(sections.name),
    db.select({
      membershipId: collegeMemberships.id,
      name: users.displayName, email: users.email, roll: learnerProfiles.rollNumber,
      sectionId: sections.id, sectionName: sections.name,
    }).from(learnerProgramEnrollments)
      .innerJoin(collegeMemberships,
        eq(collegeMemberships.id, learnerProgramEnrollments.membershipId))
      .innerJoin(users, eq(users.id, collegeMemberships.userId))
      .leftJoin(learnerProfiles, eq(learnerProfiles.membershipId, collegeMemberships.id))
      .leftJoin(sectionEnrollments, and(
        eq(sectionEnrollments.learnerEnrollmentId, learnerProgramEnrollments.id),
        eq(sectionEnrollments.status, "ACTIVE")))
      .leftJoin(sections, eq(sections.id, sectionEnrollments.sectionId))
      .where(and(eq(learnerProgramEnrollments.cohortId, batch.id),
        eq(learnerProgramEnrollments.status, "ACTIVE"),
        eq(collegeMemberships.collegeId, acting.collegeId),
        eq(collegeMemberships.status, "ACTIVE"),
        sectionId ? eq(sections.id, sectionId) : undefined,
        q ? or(ilike(users.displayName, "%" + q + "%"),
          ilike(users.email, "%" + q + "%"),
          ilike(learnerProfiles.rollNumber, "%" + q + "%")) : undefined))
      .orderBy(users.displayName).limit(500),
  ]);
  return <div className="min-w-0 max-w-full space-y-[var(--lms-space-4)]">
    <PageHeader title={"Students · " + batch.name}
      description={batch.program + " · Search the batch roster and move students to another class."}
      actions={<PageBackLink href="/admin/batches" label="Back to batches" />} />
    <FilterBar title="Filters" activeCount={Number(Boolean(q)) + Number(Boolean(sectionId))}
      search={<label className="grid min-w-0 gap-[var(--lms-space-2)] text-[var(--lms-font-sm)] font-semibold leading-4 text-[var(--lms-neutral-400)]">Name, roll or email
        <Input type="search" name="q" form="batch-students-roster-filters" defaultValue={q} maxLength={100} />
      </label>}
      action={<Button type="submit" form="batch-students-roster-filters" className="min-h-11 min-w-24 md:min-h-9">Search</Button>}>
      <form id="batch-students-roster-filters" method="get" className="grid min-w-0 items-end gap-[8px] md:max-w-[320px]">
        <label className="grid min-w-0 gap-[var(--lms-space-2)] text-[var(--lms-font-sm)] font-semibold leading-4 text-[var(--lms-neutral-400)]">Class/Section
          <Select name="sectionId" defaultValue={sectionId ?? ""}>
            <option value="">All classes</option>
            {classes.map(item => <option key={item.id} value={item.id}>
              {item.name} ({item.capacity ?? "No cap"} seats)</option>)}
          </Select>
        </label>
        <Button type="submit" className="min-h-11 w-full md:hidden">Search</Button>
      </form>
    </FilterBar>
    <section aria-label="Students in this batch" className="min-w-0 space-y-[var(--lms-space-3)]">
      <p className="text-xs text-muted-foreground leading-5">Showing up to 500 matching students in this batch.</p>
      <DataTable
        caption="Students in this batch"
        rows={students}
        getRowKey={item => item.membershipId}
        empty={<EmptyState title="No matching students" description="No students in this batch match the current search filters."
          action={(q || sectionId) ? <Link href={"/admin/batches/" + cohortId + "/students"} className="inline-flex min-h-11 items-center font-semibold text-link underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lms-primary)]">Clear filters</Link> : undefined} />}
        columns={[
          { key: "name", header: "Name", mobilePriority: "primary", cell: item => item.name ?? item.membershipId },
          { key: "roll", header: "Roll Number", mobilePriority: "secondary", cell: item => item.roll ?? "—" },
          { key: "email", header: "Email", mobilePriority: "secondary", cell: item => item.email ?? "—" },
          { key: "class", header: "Current class", mobilePriority: "secondary", cell: item => item.sectionName ?? "Not in a class" },
          { key: "action", header: "Action", mobilePriority: "action", cell: item => item.sectionId
            ? <StudentClassMoveAction membershipId={item.membershipId}
                name={item.name ?? item.roll ?? "student"} />
            : <span className="text-muted-foreground">No active class to move from</span> },
        ]}
      />
    </section>
  </div>;
}
