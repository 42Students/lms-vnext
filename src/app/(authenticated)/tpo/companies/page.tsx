import { redirect } from "next/navigation";
import { getCurrentRequestContext } from "@/auth/request-context";
import { hasMembershipRole } from "@/modules/identity/context";
import { TpoCompanyMemoryWorkspace } from "@/components/tpo/tpo-company-memory-workspace";

type PageProps = {
  searchParams: Promise<{ name?: string | string[] }>;
};

export default async function TpoCompanyMemoryPage({ searchParams }: PageProps) {
  const context = await getCurrentRequestContext();
  if (!context.membership || !hasMembershipRole(context, "TPO")) {
    redirect("/dashboard");
  }
  const query = await searchParams;
  const value = Array.isArray(query.name) ? query.name[0] : query.name;
  const name = value?.trim() ?? "";
  if (!name) {
    redirect("/tpo/recruiters?view=companies");
  }

  return (
    <TpoCompanyMemoryWorkspace
      collegeId={context.membership.collegeId}
      companyName={name}
    />
  );
}
