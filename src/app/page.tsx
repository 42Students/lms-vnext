import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getCurrentRequestContext } from "@/auth/request-context";
import { LoginForm } from "@/components/auth/login-form";
import { resolveRequestTenant } from "@/modules/auth/request-tenant";
import { getCollegeSignInName } from "@/modules/auth/tenant-branding";

async function isSignedIn() {
  try {
    await getCurrentRequestContext();
    return true;
  } catch {
    return false;
  }
}

type AuthMessage = {
  title: string;
  description: string;
  tone: "warning" | "error";
};

const messages: Record<string, AuthMessage> = {
  expired: {
    title: "Your session expired",
    description:
      "Sign in again to continue. Your college memberships and data are unchanged.",
    tone: "warning",
  },
  revoked: {
    title: "Your session was ended",
    description:
      "Your authentication session was revoked. Sign in again before continuing.",
    tone: "error",
  },
  invalid: {
    title: "Your session is no longer valid",
    description:
      "Sign in again to establish a fresh secure session.",
    tone: "error",
  },
  recent: {
    title: "A recent sign-in is required",
    description:
      "Authenticate again before creating a new server session.",
    tone: "warning",
  },
  access: {
    title: "Account access changed",
    description:
      "This account no longer resolves to an active LMS identity. Contact an administrator if this is unexpected.",
    tone: "error",
  },
};

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{
    auth?: string | string[];
  }>;
}) {
  const params = await searchParams;
  const authValue = Array.isArray(params.auth)
    ? params.auth[0]
    : params.auth;
  const message = authValue
    ? messages[authValue] ?? null
    : null;

  if (await isSignedIn()) redirect("/dashboard");

  const tenant = await resolveRequestTenant(
    (await headers()).get("host"),
  );
  const collegeName =
    tenant.kind === "college"
      ? await getCollegeSignInName(tenant.collegeId)
      : null;

  return (
    <main className="mx-auto flex min-h-screen max-w-5xl items-center px-6 py-16">
      <section className="w-full rounded-2xl border border-border bg-surface p-8 shadow-sm">
        <p className="text-sm font-medium text-muted-foreground">
          42Students
        </p>
        <h1 className="mt-2 text-4xl font-semibold tracking-tight text-foreground">
          LMS vNext
        </h1>
        <p className="mt-4 max-w-2xl text-base leading-7 text-body">
          Sign in with the phone number or email registered with your
          college. One account works across every college you belong to.
        </p>

        {message ? (
          <div
            role="alert"
            className={
              message.tone === "error"
                ? "mt-6 rounded-xl border border-error bg-[var(--lms-error-subtle)] p-4"
                : "mt-6 rounded-xl border border-warning bg-[var(--lms-warning-subtle)] p-4"
            }
          >
            <p
              className={
                message.tone === "error"
                  ? "m-0 text-sm font-semibold text-error"
                  : "m-0 text-sm font-semibold text-warning"
              }
            >
              {message.title}
            </p>
            <p className="mt-1 text-sm leading-6 text-body">
              {message.description}
            </p>
          </div>
        ) : null}

        <div className="mt-8">
          {tenant.kind === "unknown" ? (
            <div className="rounded-xl bg-primary-subtle p-4 text-sm text-body">
              This address is not set up for sign-in. Use your
              college&apos;s LMS address.
            </div>
          ) : (
            <LoginForm collegeName={collegeName} />
          )}
        </div>
      </section>
    </main>
  );
}
