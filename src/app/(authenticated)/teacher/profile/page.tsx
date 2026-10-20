import Link from "next/link";
import { getCurrentRequestContext } from "@/auth/request-context";
import { PageHeader } from "@/components/ui/page-header";
import { getOwnFacultyProfileWithRuntime } from "@/modules/people/runtime";

export const dynamic = "force-dynamic";

export default async function FacultyProfilePage() {
  const context = await getCurrentRequestContext();
  const { person, profile } = await getOwnFacultyProfileWithRuntime(context);
  const fields: Array<{ label: string; value: string | null }> = [
    { label: "Name", value: person.user.displayName },
    { label: "Email", value: person.user.email },
    { label: "Mobile", value: person.user.phoneE164 },
    { label: "Academic title", value: profile?.academicTitle ?? null },
    { label: "Employment type", value: profile?.employmentType ?? null },
  ];

  return (
    <div className="min-w-0 max-w-full space-y-5">
      <PageHeader title="Profile" actions={<Link href="/teacher/profile/details" className="inline-flex min-h-11 w-full items-center justify-center rounded-[var(--lms-control-radius)] border border-[var(--lms-button-primary)] bg-[var(--lms-button-primary)] px-4 text-sm font-semibold text-[var(--lms-on-primary)] hover:bg-[var(--lms-button-primary-hover)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lms-primary)] sm:w-auto md:min-h-9">Edit About &amp; profile sections →</Link>} />
      <nav aria-label="Profile shortcuts" className="flex min-w-0 flex-col items-stretch gap-1 border-b border-[var(--lms-canvas-border)] pb-3 sm:flex-row sm:flex-wrap sm:items-center sm:gap-4">
        <Link href="/teacher/profile/teaching"
        className="inline-flex min-h-11 min-w-0 items-center justify-center px-2 text-sm font-semibold text-primary-text hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lms-primary)] sm:justify-start md:min-h-9">
        Current teaching assignments →
        </Link>
        <Link href="/teacher/profile/contacts"
        className="inline-flex min-h-11 min-w-0 items-center justify-center px-2 text-sm font-semibold text-primary-text hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lms-primary)] sm:justify-start md:min-h-9">
        Contact details and editing availability
        </Link>
      </nav>
      <section aria-label="Faculty profile details" className="min-w-0 space-y-3 py-4">
        <h2 className="font-semibold text-[18px] leading-[1.4] text-[var(--lms-heading)]">About</h2>
        <dl className="grid min-w-0 gap-x-6 gap-y-4 sm:grid-cols-2 lg:grid-cols-3">
          {fields.map(({ label, value }) => (
            <div key={label}>
              <dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                {label}
              </dt>
              <dd className="mt-1 break-all text-sm leading-6 text-foreground">
                {value || "Not provided"}
              </dd>
            </div>
          ))}
        </dl>
        <p className="max-w-prose text-xs leading-5 text-muted-foreground">
          Identity and college-managed employment records are maintained by your college administrator.
        </p>
      </section>
    </div>
  );
}
