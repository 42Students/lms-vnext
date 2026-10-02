import { redirect } from "next/navigation";
import { getCurrentRequestContext } from "@/auth/request-context";
import {
  SessionAuthenticationError,
} from "@/auth/session";
import {
  ContextResolutionError,
  listMembershipChoices,
} from "@/modules/identity/context-service";
import { AppShell } from "@/components/shell/app-shell";
import { MembershipRecovery } from "@/components/auth/membership-recovery";
import { isSuperAdmin } from "@/modules/identity/context";
import { listAdminScopeChoices } from "@/modules/admin-scope/service";

type ShellLoadResult =
  | {
      ok: true;
      context: Awaited<
        ReturnType<typeof getCurrentRequestContext>
      >;
      memberships: Awaited<
        ReturnType<typeof listMembershipChoices>
      >;
      adminScopeChoices: Awaited<
        ReturnType<typeof listAdminScopeChoices>
      > | null;
    }
  | {
      ok: false;
      kind: "session";
      code: SessionAuthenticationError["code"];
    }
  | {
      ok: false;
      kind: "membership";
      code:
        | "MEMBERSHIP_NOT_FOUND"
        | "MEMBERSHIP_NOT_ACTIVE";
    }
  | {
      ok: false;
      kind: "identity";
    };

async function loadShellData(): Promise<ShellLoadResult> {
  try {
    const context = await getCurrentRequestContext();
    const [memberships, adminScopeChoices] =
      await Promise.all([
        listMembershipChoices(context.user.identityUid),
        isSuperAdmin(context)
          ? listAdminScopeChoices(context)
          : Promise.resolve(null),
      ]);

    return {
      ok: true,
      context,
      memberships,
      adminScopeChoices,
    };
  } catch (error) {
    if (error instanceof SessionAuthenticationError) {
      return {
        ok: false,
        kind: "session",
        code: error.code,
      };
    }

    if (error instanceof ContextResolutionError) {
      if (
        error.code === "MEMBERSHIP_NOT_FOUND" ||
        error.code === "MEMBERSHIP_NOT_ACTIVE"
      ) {
        return {
          ok: false,
          kind: "membership",
          code: error.code,
        };
      }

      return {
        ok: false,
        kind: "identity",
      };
    }

    throw error;
  }
}

function sessionRedirect(
  code: SessionAuthenticationError["code"],
) {
  switch (code) {
    case "SESSION_MISSING":
      return "/";
    case "SESSION_EXPIRED":
      return "/?auth=expired";
    case "SESSION_REVOKED":
      return "/?auth=revoked";
    case "RECENT_SIGN_IN_REQUIRED":
      return "/?auth=recent";
    case "SESSION_INVALID":
      return "/?auth=invalid";
  }
}

export default async function AuthenticatedLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const shellData = await loadShellData();

  if (!shellData.ok) {
    if (shellData.kind === "membership") {
      return <MembershipRecovery reason={shellData.code} />;
    }

    if (shellData.kind === "session") {
      redirect(sessionRedirect(shellData.code));
    }

    redirect("/?auth=access");
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
