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
 // On the public root, the historic browser tab reads simply 42 LMS.
 // Scoped college sign-in retains its own college label, without doubling
 // the root title template.
 const title = brand?.collegeName ? "Sign in · " + brand.collegeName : "42 LMS";
 return {
   title: { absolute: title },
   description: "Sign in securely to 42 LMS with the verification method enabled for your college.",
   openGraph: {
     title,
     description: "42 LMS · Secure college learning and placement portal",
     images: [{ url: "/assets/images/legacy-42lms-logo.svg", alt: "42 LMS" }],
   },
 };
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
    description: "For your security, this account-switching link has expired or is no longer supported. Sign in again with a fresh one-time code on the intended college’s LMS address. Your old link cannot be reused.",
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
  const message = authValue ? messages[authValue] ?? {
    title: "This sign-in link could not be verified",
    description: "This link is not a supported secure sign-in request. Start a fresh sign-in from this page; never share old sign-in links.",
    tone: "error" as const,
  } : null;

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
    if (authValue && messages[authValue]) destination.searchParams.set("auth", authValue);
    if (recruiterValue === "email") destination.searchParams.set("recruiter", recruiterValue);
    const safeNext = safeReturnTo(requested);
    if (safeNext) destination.searchParams.set("returnTo", safeNext);
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
  // Sign-in policy must fail closed on unexpected read failures.
  const signin = await effectiveCollegeSignInCapabilities(
    tenant.kind === "college" ? tenant.collegeId : null
  ).catch(() => null);
  const returnTo = safeReturnTo(requested);
  const restartHref = returnTo
    ? "/login?returnTo=" + encodeURIComponent(returnTo)
    : "/login";
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
          <a href="/" aria-label="42 LMS home">
            <img src="/assets/images/legacy-42lms-logo.svg" alt="42LMS" className={styles.legacyLogo} />
          </a>
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
        <div className="relative w-full max-w-[468px]">
          {!desktopBackground ? <LegacyLoginMascot /> : null}
          <section id="sign-in-content" tabIndex={-1} className={styles.card} aria-label="Sign in">
          {message ? (
            <div role="alert" className={`${styles.status} ${message.tone === "error" ? styles.statusError : styles.statusWarning}`}>
              <p className={styles.statusTitle}>{message.title}</p>
              <p className={styles.statusMessage}>{message.description}</p>
              <div className="mt-3 flex flex-wrap items-center gap-3">
                <a className={styles.statusLink} href={restartHref}>Start a fresh sign-in</a>
                <a className={styles.statusLink} href="/home">Back to home</a>
              </div>
            </div>
          ) : null}
          {tenant.kind === "college" && recruiterValue === "email" && signin && !signin.email ? (
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
              <div className="flex flex-wrap items-center gap-3">
                <a className={styles.statusLink} href="/login">Retry college lookup</a>
                <a className={styles.statusLink} href="https://42lms.com/login">Use the main sign-in page (42lms.com)</a>
              </div>
            </div>
          ) : tenant.kind === "unknown" ? (
            <div role="alert" className={`${styles.status} ${styles.statusWarning}`}>
              <PageHeader title="This address isn’t set up yet" />
              <p className={styles.statusMessage}>
                Ask your administrator to add this college&apos;s address in 42LMS, or use the main sign-in page.
              </p>
              <div className="flex flex-wrap items-center gap-3">
                <a className={styles.statusLink} href="/login">Try again</a>
                <a className={styles.statusLink} href="https://42lms.com/login">Use the main sign-in page (42lms.com)</a>
              </div>
            </div>
          ) : !signin ? (
            <div role="alert" className={`${styles.status} ${styles.statusWarning}`}>
              <p className={styles.statusTitle}>Sign-in is temporarily unavailable</p>
              <p className={styles.statusMessage}>
                We could not confirm the sign-in methods for this college. Try again to reload the current policy.
              </p>
              <a className={styles.statusLink} href={restartHref}>Retry sign-in</a>
            </div>
          ) : (
            <LoginForm collegeName={branding?.collegeName ?? null}
              defaultChannel={recruiterValue === "email" && signin.email ? "EMAIL" : signin.primary}
              allowedChannels={signin.email && signin.phone ? ["EMAIL", "PHONE"] :
                signin.email ? ["EMAIL"] : ["PHONE"]} />
          )}
          </section>
        </div>
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

/** Decorative 42LMS robot, using the geometric proportions of the legacy
 * LoginRobot. No authentication state or pointer events are attached here;
 * this server-side fallback stays visible even if the OTP client has not hydrated. */
function LegacyLoginMascot() {
  return <div aria-hidden="true"
    className="pointer-events-none absolute -right-[142px] top-[8px] z-0 hidden h-[262px] w-[232px] xl:block">
    <svg viewBox="0 0 232 262" className="h-full w-full" focusable="false">
      <defs>
        <linearGradient id="authRobotShell" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ffffff" />
          <stop offset="1" stopColor="#eef3f8" />
        </linearGradient>
        <radialGradient id="authRobotGlow"><stop offset="0" stopColor="#7af0f2" />
          <stop offset="1" stopColor="#14a3b0" /></radialGradient>
      </defs>
      <ellipse cx="142" cy="254" rx="42" ry="6" fill="#d1dce5" opacity=".55" />
      <rect x="120" y="204" width="15" height="38" rx="7.5" fill="#c4d7e3" />
      <rect x="147" y="204" width="15" height="38" rx="7.5" fill="#c4d7e3" />
      <rect x="113" y="236" width="26" height="12" rx="6" fill="#40586c" />
      <rect x="143" y="236" width="26" height="12" rx="6" fill="#40586c" />
      <path d="M114 150 Q78 170 34 152" fill="none" stroke="#829daf" strokeWidth="17" strokeLinecap="round" />
      <circle cx="30" cy="151" r="10" fill="#f4f9fc" stroke="#adc3d2" strokeWidth="2" />
      <rect x="108" y="128" width="66" height="84" rx="24" fill="url(#authRobotShell)" stroke="#8da8bd" strokeWidth="2" />
      <rect x="125" y="150" width="32" height="22" rx="8" fill="#37566f" />
      <circle cx="141" cy="161" r="4.5" fill="url(#authRobotGlow)" />
      <rect x="132" y="116" width="18" height="14" rx="4" fill="#40586c" />
      <path d="M141 54V38" stroke="#58768d" strokeWidth="4" strokeLinecap="round" />
      <circle cx="141" cy="33" r="5.5" fill="#14a3b0" />
      <circle cx="95" cy="88" r="6.5" fill="#829daf" />
      <circle cx="187" cy="88" r="6.5" fill="#829daf" />
      <rect x="97" y="52" width="88" height="70" rx="28" fill="url(#authRobotShell)" stroke="#8da8bd" strokeWidth="2" />
      <rect x="107" y="66" width="68" height="42" rx="18" fill="#314e68" />
      <rect x="124" y="79" width="11" height="16" rx="5.5" fill="#7af0f2" />
      <rect x="148" y="79" width="11" height="16" rx="5.5" fill="#7af0f2" />
      <ellipse cx="117" cy="101" rx="5" ry="2.5" fill="#f7b8c1" opacity=".7" />
      <ellipse cx="165" cy="101" rx="5" ry="2.5" fill="#f7b8c1" opacity=".7" />
      <path d="M168 146 Q180 172 182 196" fill="none" stroke="#829daf" strokeWidth="17" strokeLinecap="round" />
      <circle cx="182" cy="200" r="10.5" fill="#f4f9fc" stroke="#adc3d2" strokeWidth="2" />
    </svg>
  </div>;
}
