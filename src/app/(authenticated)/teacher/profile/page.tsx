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
    <div className="min-w-0 max-w-full space-y-6">
      <PageHeader
        title="Profile"
      />
      <nav aria-label="Profile shortcuts" className="flex flex-wrap items-center gap-3">
        <Link href="/teacher/profile/details" className="inline-flex min-h-11 sm:min-h-9 items-center rounded-[var(--lms-control-radius)] border border-border bg-surface px-4 text-sm font-semibold text-primary-text focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">Edit About &amp; profile sections →</Link>
        <Link href="/teacher/profile/teaching"
        className="inline-flex min-h-11 sm:min-h-9 items-center rounded-[var(--lms-control-radius)] border border-border bg-surface px-4 text-sm font-semibold text-primary-text hover:underline">
        Current teaching assignments →
        </Link>
        <Link href="/teacher/profile/contacts"
        className="inline-flex min-h-11 sm:min-h-9 items-center rounded-[var(--lms-control-radius)] border border-border bg-surface px-4 text-sm font-semibold text-primary-text">
        Contact details and editing availability
        </Link>
      </nav>
      <section aria-label="Faculty profile details" className="border-t border-border pt-6">
        <h2 className="text-base font-semibold text-foreground">About</h2>
        <dl className="mt-5 grid gap-5 sm:grid-cols-2">
          {fields.map(({ label, value }) => (
            <div key={label}>
              <dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                {label}
              </dt>
              <dd className="mt-1 break-words text-sm text-foreground">
                {value || "Not provided"}
              </dd>
            </div>
          ))}
        </dl>
        <p className="mt-6 text-xs text-muted-foreground">
          Identity and college-managed employment records are maintained by your college administrator.
        </p>
      </section>
    </div>
  );
}
