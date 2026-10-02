import { redirect } from "next/navigation";
import { getCurrentRequestContext } from "@/auth/request-context";
import { SessionAuthenticationError } from "@/auth/session";
import {
  ContextResolutionError,
  listMembershipChoices,
} from "@/modules/identity/context-service";
import { AppShell } from "@/components/shell/app-shell";

async function loadShellData() {
  try {
    const context = await getCurrentRequestContext();
    const memberships = await listMembershipChoices(
      context.user.identityUid,
    );

    return { context, memberships };
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
    >
      {children}
    </AppShell>
  );
}
