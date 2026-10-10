import { redirect } from "next/navigation";
import { getCurrentRequestContext } from "@/auth/request-context";
import { TpoMessageWorkspace } from "@/components/tpo/tpo-message-workspace";
import { hasMembershipRole } from "@/modules/identity/context";

type PageProps = {
  searchParams: Promise<{ threadId?: string | string[] }>;
};

export default async function TpoMessagesPage({ searchParams }: PageProps) {
  const context = await getCurrentRequestContext();
  if (!context.membership || !hasMembershipRole(context, "TPO")) {
    redirect("/dashboard");
  }
  const params = await searchParams;
  const requested = Array.isArray(params.threadId)
    ? params.threadId[0]
    : params.threadId;

  return (
    <TpoMessageWorkspace
      mode="tpo"
      collegeId={context.membership.collegeId}
      collegeName="your college"
      initialThreadId={requested ?? ""}
    />
  );
}
