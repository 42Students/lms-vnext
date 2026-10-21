import { headers } from "next/headers";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { safeReturnTo } from "@/lib/return-to";
import { getCurrentRequestContext } from "@/auth/request-context";
import { LoginForm } from "@/components/auth/login-form";
import { PageHeader } from "@/components/ui/page-header";
import styles from "./login-shell.module.css";
import { resolveRequestTenant } from "@/modules/auth/request-tenant";
import { brandStyleVariables, deriveBrandTokens } from "@/modules/colleges/branding";
import { getPublicCollegeBranding } from "@/modules/colleges/branding-service";
import {effectiveCollegeSignInCapabilities} from "@/modules/colleges/public-signin-policy-service";

/** Branding is optional presentation data. A transient media/config failure
 * must not disable otherwise verified and policy-authorized college sign-in. */
async function optionalPublicBranding(collegeId: string) {
  try {
    return await getPublicCollegeBranding(collegeId);
  } catch {
    return null;
  }
}

export async function generateMetadata():Promise<Metadata> {
 const tenant=await resolveRequestTenant((await headers()).get("host"));
 const brand=tenant.kind==="college"?await optionalPublicBranding(tenant.collegeId):null;
 return {title:"Sign in · "+(brand?.collegeName??"42LMS")};
}

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
    title: "Your session expired. Please log in again.",
    description:
      "Your session has expired. Please log in again.",
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
    recruiter?: string | string[];
    returnTo?: string | string[];
  }>;
}) {
  const params = await searchParams;
  const recruiterValue=Array.isArray(params.recruiter)?params.recruiter[0]:params.recruiter;
  const authValue = Array.isArray(params.auth)
    ? params.auth[0]
    : params.auth;
  const message = authValue
    ? messages[authValue] ?? null
    : null;

  const requested = Array.isArray(params.returnTo) ? params.returnTo[0] : params.returnTo;
  const requestHeaders = await headers();
  const tenant = await resolveRequestTenant(requestHeaders.get("host"));
  // Canonicalize only to an independently verified PRIMARY for the exact
  // resolved college. Do not trust X-Forwarded-Host or raw destination strings.
  // The router serves only root or its /login rewrite here; these are the only
  // paths allowed to cross hosts. Browsers carry the current fragment forward
  // on redirects that omit a replacement fragment.
  if (tenant.kind === "college" && tenant.shouldRedirectToCanonicalHost && tenant.canonicalHost) {
    const pagePath = requestHeaders.get("x-lms-path")?.split("?")[0] === "/login" ? "/login" : "/";
    const destination = new URL(pagePath, "https://" + tenant.canonicalHost);
    if (authValue) destination.searchParams.set("auth", authValue);
    if (recruiterValue) destination.searchParams.set("recruiter", recruiterValue);
    if (requested) destination.searchParams.set("returnTo", requested);
    redirect(destination.toString());
  }
  if (await isSignedIn()) redirect(safeReturnTo(requested) ?? "/dashboard");
  // PUB-auth-public-39: platform visitors see the minimal public landing,
  // while college hosts and explicit sign-in links keep the OTP entry screen.
  // The proxy supplies the canonical path; do not use untrusted forwarded hosts.
  const requestPath = (await headers()).get("x-lms-path")?.split("?")[0];
  if (tenant.kind === "platform" && requestPath !== "/login" &&
      !authValue && !recruiterValue && !requested) redirect("/home");
  const branding =
    tenant.kind === "college"
      ? await optionalPublicBranding(tenant.collegeId)
      : null;
  const signin = await effectiveCollegeSignInCapabilities(tenant.kind==="college"?tenant.collegeId:null);
  const themeStyle = brandStyleVariables(
    branding?.primaryColor,
  ) as React.CSSProperties;
  const authPrimary = branding?.primaryColor ? deriveBrandTokens(branding.primaryColor).text : "var(--lms-primary)";
  const desktopBackground = branding?.loginBackgroundUrl ?? null;
  const mobileBackground =
    branding?.loginBackgroundUrlMobile ?? desktopBackground;

  return (
    <main
      style={{ ...themeStyle, "--auth-primary": authPrimary } as React.CSSProperties}
      className={styles.viewport}
    >
      {desktopBackground ? (
        <div aria-hidden="true" className={styles.desktopBackdrop}
          style={{ backgroundImage: cssUrl(desktopBackground) }} />
      ) : null}
      {mobileBackground ? (
        <div aria-hidden="true" className={styles.mobileBackdrop}
          style={{ backgroundImage: cssUrl(mobileBackground) }} />
      ) : null}

      <header className={styles.brandHeader}>
        <div className={styles.brandRow}>
          {/* The mark and letterforms are the original LMS SVG, not a CSS approximation. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/assets/images/legacy-42lms-logo.svg" alt="42LMS" className={styles.legacyLogo} />
        </div>
        {branding?.collegeName ? (
          <div className={styles.collegeBrand}>
            {branding.logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={branding.logoUrl} alt="" referrerPolicy="no-referrer" className={styles.collegeLogo} />
            ) : null}
            <p className={styles.collegeName}>{branding.collegeName}</p>
          </div>
        ) : null}
      </header>

      <a href="#sign-in-content" className={styles.skipLink}>Skip to sign in</a>
      <div className={styles.center}>
        <section id="sign-in-content" tabIndex={-1} className={styles.card} aria-label="Sign in">
          {message ? (
            <div role="alert" className={`${styles.status} ${message.tone === "error" ? styles.statusError : styles.statusWarning}`}>
              <p className={styles.statusTitle}>{message.title}</p>
              <p className={styles.statusMessage}>{message.description}</p>
            </div>
          ) : null}
          {tenant.kind === "college" && recruiterValue === "email" && !signin.email ? (
            <div role="status" className={`${styles.status} ${styles.statusWarning}`}>
              <p className={styles.statusTitle}>Email sign-in is unavailable for this college</p>
              <p className={styles.statusMessage}>
                Use the sign-in method your college has enabled, or ask the placement cell for a new invitation link.
              </p>
            </div>
          ) : null}
          {tenant.kind === "unavailable" ? (
            <div role="alert" className={`${styles.status} ${styles.statusWarning}`}>
              <PageHeader title="We couldn’t confirm this college right now" />
              <p className={styles.statusMessage}>
                This address may be correct, but its settings didn&apos;t load. Try again in a moment, or use the main sign-in page.
              </p>
              <a className={styles.statusLink} href="https://42lms.com/login">Use the main sign-in page (42lms.com)</a>
            </div>
          ) : tenant.kind === "unknown" ? (
            <div role="alert" className={`${styles.status} ${styles.statusWarning}`}>
              <PageHeader title="This address isn’t set up yet" />
              <p className={styles.statusMessage}>
                Ask your administrator to add this college&apos;s address in 42LMS, or use the main sign-in page.
              </p>
              <a className={styles.statusLink} href="https://42lms.com/login">Use the main sign-in page (42lms.com)</a>
            </div>
          ) : (
            <LoginForm collegeName={branding?.collegeName ?? null}
              defaultChannel={recruiterValue === "email" && signin.email ? "EMAIL" : signin.primary}
              allowedChannels={signin.email && signin.phone ? ["EMAIL", "PHONE"] :
                signin.email ? ["EMAIL"] : ["PHONE"]} />
          )}
        </section>
      </div>

      <footer className={styles.footer}>
        <span>© {new Date().getFullYear()} 42LMS · JRSPF Technologies Pvt. Ltd.{tenant.kind === "college" ? " · Powered by 42LMS" : ""}</span>
        <nav className={styles.footerLinks} aria-label="Sign-in footer">
          {branding?.supportEmail ? <a href={`mailto:${branding.supportEmail}`}>{branding.supportEmail}</a> : null}
          {branding?.supportPhone ? <a href={`tel:${branding.supportPhone.replace(/[^+0-9]/g, "")}`}>{branding.supportPhone}</a> : null}
          <a href={branding?.privacyUrl ?? "/privacy-policy"} rel="noopener noreferrer">Privacy</a>
          <a href={branding?.termsUrl ?? "/assets/static/terms-and-conditions-view.html"} rel="noopener noreferrer">Terms</a>
        </nav>
      </footer>
    </main>
  );
}

/** Escapes a validated https URL for use inside CSS url("..."). */
function cssUrl(value: string) {
  return `url("${value.replace(/["\\()\s]/g, (c) => encodeURIComponent(c))}")`;
}
