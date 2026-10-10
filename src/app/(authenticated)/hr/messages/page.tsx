import { redirect } from "next/navigation";
import { getCurrentRequestContext } from "@/auth/request-context";
import { TpoMessageWorkspace } from "@/components/tpo/tpo-message-workspace";
import { hasActiveRecruiter } from "@/modules/identity/context";

type PageProps = {
  searchParams: Promise<{
    collegeId?: string | string[];
    threadId?: string | string[];
  }>;
};

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function HrMessagesPage({ searchParams }: PageProps) {
  const context = await getCurrentRequestContext();
  if (!hasActiveRecruiter(context) || !context.recruiter) {
    redirect("/dashboard");
  }

  const params = await searchParams;
  const requestedCollegeId = first(params.collegeId);
  const grant =
    context.recruiter.grants.find(
      item => item.collegeId === requestedCollegeId,
    ) ?? context.recruiter.grants[0];

  if (!grant) {
    return (
      <section className="rounded-lg border border-border bg-surface p-6">
        <h1 className="text-xl font-semibold">Messages</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          No active college recruiter access is available.
        </p>
      </section>
    );
  }

  return (
    <TpoMessageWorkspace
      mode="recruiter"
      collegeId={grant.collegeId}
      collegeName={grant.collegeName}
      initialThreadId={first(params.threadId) ?? ""}
    />
  );
}
