import Link from "next/link";
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
import { StudentClassMoveAction } from "@/components/college/student-class-move-action";
import { requirePermission } from "@/modules/permissions/policy";

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
  const cohortId = z.string().uuid().parse(rawId);
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
  return <main className="space-y-5">
    <PageHeader eyebrow="College Admin · Batches" title={"Students · " + batch.name}
      description={batch.program + " · Search the batch roster and move students to another class."}
      actions={<Link href="/college/batches" className="font-semibold text-primary-text">Back to batches</Link>} />
    <form method="get" className="flex flex-wrap items-end gap-3 rounded-xl border border-border bg-surface p-4">
      <label className="grid flex-1 gap-1 text-sm font-semibold">Name, roll or email
        <input type="search" name="q" defaultValue={q} maxLength={100}
          className="min-h-11 rounded-md border border-border bg-surface px-3" />
      </label>
      <label className="grid gap-1 text-sm font-semibold">Class/Section
        <select name="sectionId" defaultValue={sectionId ?? ""}
          className="min-h-11 rounded-md border border-border bg-surface px-3">
          <option value="">All classes</option>
          {classes.map(item => <option key={item.id} value={item.id}>
            {item.name} ({item.capacity ?? "No cap"} seats)</option>)}
        </select>
      </label>
      <button className="min-h-11 rounded bg-primary px-4 font-semibold text-on-primary">Search</button>
    </form>
    <div className="overflow-x-auto rounded-xl border border-border bg-surface">
      <p className="p-3 text-xs text-muted-foreground">Showing up to 500 matching students in this batch.</p>
      <table className="w-full min-w-[700px] text-left text-sm">
        <thead className="sticky top-0 z-10 bg-surface"><tr className="border-y border-border">
          {["Name", "Roll Number", "Email", "Current class", "Action"].map(label =>
            <th key={label} className="p-3 font-semibold">{label}</th>)}
        </tr></thead>
        <tbody>{students.map(item => <tr key={item.membershipId} className="border-b border-border">
          <td className="p-3 font-semibold">{item.name ?? item.membershipId}</td>
          <td className="p-3">{item.roll ?? "—"}</td>
          <td className="p-3">{item.email ?? "—"}</td>
          <td className="p-3">{item.sectionName ?? "Not in a class"}</td>
          <td className="p-3">{item.sectionId
            ? <StudentClassMoveAction membershipId={item.membershipId}
                name={item.name ?? item.roll ?? "student"} />
            : <span className="text-muted-foreground">No active class to move from</span>}</td>
        </tr>)}</tbody>
      </table>
      {!students.length && <p className="p-6 text-sm text-muted-foreground">No matching students.</p>}
    </div>
  </main>;
}
