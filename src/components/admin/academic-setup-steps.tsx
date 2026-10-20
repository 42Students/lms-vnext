import Link from "next/link";
import { StepIndicator } from "@/components/ui/step-indicator";
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
      className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-4 print:hidden">
      <div>
        <StepIndicator current={step} total={steps.length} className="m-0 block" />
        <p className="mt-1 text-xs text-muted-foreground">{steps[step - 1]?.label ?? "Academic Setup"}</p>
      </div>
      <div className="flex flex-wrap gap-2 text-sm">
        <AcademicDirectoryRefresh/>
        <Link href="/admin/academics" className="inline-flex min-h-11 md:min-h-9 items-center rounded-[var(--lms-control-radius)] border border-border bg-surface px-3 text-sm font-semibold text-primary-text hover:border-primary hover:bg-primary-subtle focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)]">Academic Setup overview →</Link>
        {before ? <Link href={before.href}
          className="inline-flex min-h-11 md:min-h-9 items-center rounded-[var(--lms-control-radius)] border border-border bg-surface px-3 text-sm font-semibold text-primary-text hover:border-primary hover:bg-primary-subtle focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)]">
          ← Previous: {before.label}
        </Link> : <span aria-disabled="true" className="inline-flex min-h-11 md:min-h-9 items-center px-4 text-muted-foreground">Previous</span>}
        {after ? <Link href={after.href}
          className="inline-flex min-h-11 md:min-h-9 items-center rounded-[var(--lms-control-radius)] border border-border bg-surface px-3 text-sm font-semibold text-primary-text hover:border-primary hover:bg-primary-subtle focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)]">
          Next: {after.label} →
        </Link> : <span aria-disabled="true" className="inline-flex min-h-11 md:min-h-9 items-center px-4 text-muted-foreground">Next</span>}
      </div>
    </nav>
  );
}
