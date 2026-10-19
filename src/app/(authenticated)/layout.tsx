import "./authenticated-print.css";
import {Suspense} from "react";
import {PortalAccessNotice} from "@/components/auth/portal-access-notice";
import {ConnectionFailureNotice} from "@/components/auth/connection-failure-notice";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { safeReturnTo } from "@/lib/return-to";
import { getCurrentRequestContext } from "@/auth/request-context";
import {
  SessionAuthenticationError,
} from "@/auth/session";
import {
  ContextResolutionError,
  listMembershipChoices,
} from "@/modules/identity/context-service";
import { AppShell } from "@/components/shell/app-shell";
import { PageCanvas } from "@/components/ui/page-canvas";
import { MembershipRecovery } from "@/components/auth/membership-recovery";
import { SessionResponseGuard } from "@/components/auth/session-response-guard";
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
      const destination = sessionRedirect(shellData.code);
      const requested = safeReturnTo((await headers()).get("x-lms-path"));
      redirect(requested
        ? `${destination}${destination.includes("?") ? "&" : "?"}returnTo=${encodeURIComponent(requested)}`
        : destination);
    }

    redirect("/?auth=access");
  }

  return (
    <AppShell
      context={shellData.context}
      memberships={shellData.memberships}
      adminScopeChoices={shellData.adminScopeChoices}
    >
      <SessionResponseGuard />
      {/* One legacy white canvas encloses every authenticated page and notice. */}
      <PageCanvas
        className="lms-authenticated-canvas"
        data-authenticated-canvas="true"
        data-lms-page-surface="legacy-single-canvas"
      >
        <Suspense fallback={null}><PortalAccessNotice /></Suspense>
        <ConnectionFailureNotice />
        {children}
      </PageCanvas>
    </AppShell>
  );
}
