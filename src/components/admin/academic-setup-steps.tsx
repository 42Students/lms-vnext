import Link from "next/link";
import {AcademicDirectoryRefresh} from "@/components/admin/academic-directory-refresh";

const steps = [
  { label: "Departments", href: "/admin/departments" },
  { label: "Programs", href: "/admin/programs" },
  { label: "Semesters", href: "/admin/semesters" },
  { label: "Semester–Course Mapping", href: "/admin/semester-courses" },
  { label: "Batches", href: "/admin/batches" },
  { label: "Classes", href: "/admin/classes" },
] as const;

/** Legacy Super Admin Academic Setup: the first six daily-use setup steps. */
export function AcademicSetupSteps({ step }: { step: 1 | 2 | 3 | 4 | 5 | 6 }) {
  const list: readonly (typeof steps)[number][] = steps;
  const before = list[step - 2];
  const after = list[step];
  return (
    <nav aria-label="Academic setup steps"
      className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-4">
      <div>
        <p className="m-0 text-sm font-semibold text-foreground">Academic setup · Step {step} of 6</p>
        <p className="mt-1 text-xs text-muted-foreground">{steps[step - 1]?.label ?? "Academic Setup"}</p>
      </div>
      <div className="flex flex-wrap gap-2 text-sm">
        <AcademicDirectoryRefresh/>
        <Link href="/admin/academics" className="inline-flex min-h-11 sm:min-h-9 items-center rounded-[var(--lms-control-radius,9px)] border border-border bg-surface px-3 text-sm font-semibold text-primary-text hover:bg-primary-subtle">Academic Setup overview →</Link>
        {before ? <Link href={before.href}
          className="inline-flex min-h-11 sm:min-h-9 items-center rounded-[var(--lms-control-radius,9px)] border border-border bg-surface px-3 text-sm font-semibold text-primary-text hover:bg-primary-subtle">
          ← Previous: {before.label}
        </Link> : <span aria-disabled="true" className="inline-flex min-h-11 sm:min-h-9 items-center px-4 text-muted-foreground">Previous</span>}
        {after ? <Link href={after.href}
          className="inline-flex min-h-11 sm:min-h-9 items-center rounded-[var(--lms-control-radius,9px)] border border-border bg-surface px-3 text-sm font-semibold text-primary-text hover:bg-primary-subtle">
          Next: {after.label} →
        </Link> : <span aria-disabled="true" className="inline-flex min-h-11 sm:min-h-9 items-center px-4 text-muted-foreground">Next</span>}
      </div>
    </nav>
  );
}
