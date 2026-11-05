import { StepIndicator } from "@/components/ui/step-indicator";
import {AcademicDirectoryRefresh} from "@/components/admin/academic-directory-refresh";
import { ButtonLink } from "@/components/ui/button-link";

const steps = [
  { label: "Departments", href: "/admin/departments" },
  { label: "Programs", href: "/admin/programs" },
  { label: "Semesters", href: "/admin/semesters" },
  { label: "Semester–Course Mapping", href: "/admin/semester-courses" },
  { label: "Batches", href: "/admin/batches" },
  { label: "Classes", href: "/admin/classes" },
] as const;

/** Legacy Super Admin Academic Setup: the first six daily-use setup steps. */
export function AcademicSetupSteps({ step, showRefresh = true }: { step: 1 | 2 | 3 | 4 | 5 | 6; showRefresh?: boolean }) {
  const list: readonly (typeof steps)[number][] = steps;
  const before = list[step - 2];
  const after = list[step];
  return (
    <nav aria-label="Academic setup steps"
      className="flex min-w-0 flex-col items-stretch gap-3 border-b border-border pb-4 sm:flex-row sm:items-center sm:justify-between print:hidden">
      <div>
        <StepIndicator current={step} total={steps.length} className="m-0 block" />
        <p className="mt-1 text-xs text-muted-foreground leading-5">{steps[step - 1]?.label ?? "Academic Setup"}</p>
      </div>
      <div className="grid min-w-0 grid-cols-1 gap-2 text-sm sm:flex sm:flex-wrap sm:items-center">
        {showRefresh ? <AcademicDirectoryRefresh/> : null}
        <ButtonLink variant="secondary" href="/admin/academics">Academic Setup overview →</ButtonLink>
        {before ? <ButtonLink variant="secondary" href={before.href}>
          ← Previous: {before.label}
        </ButtonLink> : <span aria-disabled="true" className="inline-flex min-h-11 md:min-h-9 items-center px-4 text-muted-foreground">Previous</span>}
        {after ? <ButtonLink variant="secondary" href={after.href}>
          Next: {after.label} →
        </ButtonLink> : <span aria-disabled="true" className="inline-flex min-h-11 md:min-h-9 items-center px-4 text-muted-foreground">Next</span>}
      </div>
    </nav>
  );
}
