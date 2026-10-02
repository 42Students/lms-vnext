import { redirect } from "next/navigation";
import { getCurrentRequestContext } from "@/auth/request-context";
import { SessionAuthenticationError } from "@/auth/session";
import {
  ContextResolutionError,
  listMembershipChoices,
} from "@/modules/identity/context-service";
import { AppShell } from "@/components/shell/app-shell";
import { isSuperAdmin } from "@/modules/identity/context";
import { listAdminScopeChoices } from "@/modules/admin-scope/service";

async function loadShellData() {
  try {
    const context = await getCurrentRequestContext();
    const [memberships, adminScopeChoices] = await Promise.all([
      listMembershipChoices(context.user.identityUid),
      isSuperAdmin(context)
        ? listAdminScopeChoices(context)
        : Promise.resolve(null),
    ]);

    return {
      context,
      memberships,
      adminScopeChoices,
    };
  } catch (error) {
    if (
      error instanceof SessionAuthenticationError ||
      error instanceof ContextResolutionError
    ) {
      return null;
    }

    throw error;
  }
}

export default async function AuthenticatedLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const shellData = await loadShellData();

  if (!shellData) {
    redirect("/");
  }

  return (
    <AppShell
      context={shellData.context}
      memberships={shellData.memberships}
      adminScopeChoices={shellData.adminScopeChoices}
    >
      {children}
    </AppShell>
  );
}
