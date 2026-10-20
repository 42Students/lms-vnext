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
import { requirePermission } from "@/modules/permissions/policy";
import {Input} from "@/components/ui/input";
import {Select} from "@/components/ui/select";
import {Button} from "@/components/ui/button";

export default async function CollegeBatchStudentsPage({
  params, searchParams,
}: {
  params: Promise<{ cohortId: string }>;
  searchParams: Promise<{ q?: string; sectionId?: string }>;
}) {
  const context = await getCurrentRequestContext();
  if (!context.membership || context.membership.status !== "ACTIVE") redirect("/dashboard");
  requirePermission(context, "academics.manage", {
    collegeId: context.membership.collegeId,
    organizationId: context.membership.organizationId,
  });
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
      eq(departments.collegeId, context.membership.collegeId))).limit(1);
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
        eq(collegeMemberships.collegeId, context.membership.collegeId),
        eq(collegeMemberships.status, "ACTIVE"),
        sectionId ? eq(sections.id, sectionId) : undefined,
        q ? or(ilike(users.displayName, "%" + q + "%"),
          ilike(users.email, "%" + q + "%"),
          ilike(learnerProfiles.rollNumber, "%" + q + "%")) : undefined))
      .orderBy(users.displayName).limit(500),
  ]);
  return <main className="min-w-0 max-w-full overflow-x-clip space-y-5">
    <PageHeader title={"Students · " + batch.name}
      description={batch.program + " · Search the batch roster and move students to another class."}
      actions={<PageBackLink href="/college/batches" label="Back to batches"/>} />
    <form method="get" className="flex min-w-0 flex-wrap items-end gap-3 border-t border-border pt-4">
      <label className="grid min-w-0 w-full flex-1 gap-1 text-sm font-semibold text-body md:min-w-48">Name, roll or email
        <Input type="search" name="q" defaultValue={q} maxLength={100} className="min-h-11 min-w-0 md:min-h-9"
          />
      </label>
      <label className="grid min-w-0 w-full gap-1 text-sm font-semibold text-body md:w-auto">Class/Section
        <Select name="sectionId" defaultValue={sectionId ?? ""} className="min-h-11 min-w-0 md:min-h-9"
          >
          <option value="">All classes</option>
          {classes.map(item => <option key={item.id} value={item.id}>
            {item.name} ({item.capacity ?? "No cap"} seats)</option>)}
        </Select>
      </label>
      <Button type="submit" className="min-h-11 md:min-h-9">Search</Button>
    </form>
    <section aria-label="Students in this batch" className="min-w-0 space-y-3">
      <p className="text-xs text-muted-foreground">Showing up to 500 matching students in this batch.</p>
      <DataTable
        caption="Students in this batch"
        rows={students}
        getRowKey={item => item.membershipId}
        empty={<EmptyState title="No matching students" description="No matching students."/>}
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
  </main>;
}
