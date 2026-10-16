import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getCurrentRequestContext } from "@/auth/request-context";
import { LoginForm } from "@/components/auth/login-form";
import { resolveRequestTenant } from "@/modules/auth/request-tenant";
import { brandStyleVariables } from "@/modules/colleges/branding";
import { getPublicCollegeBranding } from "@/modules/colleges/branding-service";
import {effectiveCollegeSignInCapabilities} from "@/modules/colleges/public-signin-policy-service";

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
  "handoff-retired": {
    title: "This old sign-in link has changed",
    description: "For your security, legacy cross-college handoff links no longer work. Sign in with a fresh one-time code on this college’s LMS address.",
    tone: "warning",
  },
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
  const branding =
    tenant.kind === "college"
      ? await getPublicCollegeBranding(tenant.collegeId)
      : null;
  const signin = await effectiveCollegeSignInCapabilities(tenant.kind==="college"?tenant.collegeId:null);
  const themeStyle = brandStyleVariables(
    branding?.primaryColor,
  ) as React.CSSProperties;
  const desktopBackground = branding?.loginBackgroundUrl ?? null;
  const mobileBackground =
    branding?.loginBackgroundUrlMobile ?? desktopBackground;
  const collegeMonogram = branding?.collegeName
    ?.trim().split(/\s+/).slice(0, 2).map((word) => word.charAt(0))
    .join("").toUpperCase() ?? null;

  return (
    <main
      style={themeStyle}
      className="relative isolate mx-auto flex min-h-screen max-w-5xl items-center px-6 py-16"
    >
      {desktopBackground ? (
        <div
          aria-hidden
          className="fixed inset-0 -z-10 hidden bg-cover bg-center sm:block"
          style={{ backgroundImage: cssUrl(desktopBackground) }}
        />
      ) : null}
      {mobileBackground ? (
        <div
          aria-hidden
          className="fixed inset-0 -z-10 bg-cover bg-center sm:hidden"
          style={{ backgroundImage: cssUrl(mobileBackground) }}
        />
      ) : null}

      <section className="w-full rounded-2xl border border-border bg-surface p-8 shadow-sm">
        {branding?.logoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={branding.logoUrl}
            alt={branding.collegeName}
            referrerPolicy="no-referrer"
            className="h-14 w-auto max-w-[240px] object-contain"
          />
        ) : collegeMonogram ? (
          <div className="flex items-center gap-3">
            <span aria-hidden="true"
              className="flex size-14 shrink-0 items-center justify-center rounded-xl border border-primary bg-primary-subtle text-xl font-bold text-primary-text">
              {collegeMonogram}
            </span>
            <span className="text-sm font-semibold text-foreground">{branding?.collegeName}</span>
          </div>
        ) : (
          <p className="text-sm font-medium text-muted-foreground">
            42Students
          </p>
        )}
        <h1 className="mt-2 text-4xl font-semibold tracking-tight text-foreground">
          {branding?.collegeName ?? "LMS vNext"}
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
            <LoginForm collegeName={branding?.collegeName ?? null} defaultChannel={signin.primary}
             allowedChannels={signin.email&&signin.phone?["EMAIL","PHONE"]:signin.email?["EMAIL"]:["PHONE"]}/>
          )}
        </div>

        <footer className="mt-8 flex flex-wrap gap-x-5 gap-y-1 border-t border-border pt-4 text-xs text-muted-foreground">
            {branding?.supportEmail ? (
              <a
                className="hover:text-primary-text"
                href={`mailto:${branding.supportEmail}`}
              >
                {branding.supportEmail}
              </a>
            ) : null}
            {branding?.supportPhone ? (
              <a
                className="hover:text-primary-text"
                href={`tel:${branding.supportPhone.replace(/[^+0-9]/g, "")}`}
              >
                {branding.supportPhone}
              </a>
            ) : null}
            <a
              className="hover:text-primary-text"
              href={branding?.termsUrl ?? "/assets/static/terms-and-conditions-view.html"}
              rel="noopener noreferrer"
            >
              Terms
            </a>
            <a
              className="hover:text-primary-text"
              href={branding?.privacyUrl ?? "/assets/static/privacy-policy-view.html"}
              rel="noopener noreferrer"
            >
              Privacy
            </a>
          </footer>
      </section>
    </main>
  );
}

/** Escapes a validated https URL for use inside CSS url("..."). */
function cssUrl(value: string) {
  return `url("${value.replace(/["\\()\s]/g, (c) => encodeURIComponent(c))}")`;
}
