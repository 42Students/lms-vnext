import type { CSSProperties } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/ui/page-header";
import { StatusBadge } from "@/components/ui/status-badge";
import type { AdminCollegeBrandingPreview } from "@/modules/colleges/admin-branding-preview-model";

function SignInStylePreview({
  branding,
  mobile,
}: {
  branding: AdminCollegeBrandingPreview;
  mobile: boolean;
}) {
  const backgroundUrl = mobile
    ? branding.mobileBackgroundUrl
    : branding.desktopBackgroundUrl;

  const canvasStyle: CSSProperties = {
    backgroundColor: branding.tokens.subtle,
    ...(backgroundUrl
      ? {
          backgroundImage:
            "linear-gradient(rgba(0,0,0,.12),rgba(0,0,0,.12)),url(" +
            JSON.stringify(backgroundUrl) +
            ")",
          backgroundSize: "cover",
          backgroundPosition: "center",
        }
      : {}),
  };

  return (
    <div
      aria-label={mobile ? "Mobile sign-in illustration" : "Desktop sign-in illustration"}
      className={
        mobile
          ? "mx-auto flex h-[360px] w-[235px] max-w-full items-center justify-center overflow-hidden rounded-[2rem] border-[7px] border-border p-3 shadow-none"
          : "flex min-h-[360px] items-center justify-center overflow-hidden rounded-[var(--college-card-radius,8px)] border border-border p-5"
      }
      style={canvasStyle}
    >
      <div
        className={
          mobile
            ? "w-full rounded-[var(--lms-canvas-radius)] bg-surface p-4 shadow-lg"
            : "w-full max-w-[320px] rounded-[var(--lms-canvas-radius)] bg-surface p-7 shadow-lg"
        }
        style={{ borderTop: "4px solid " + branding.secondary }}
      >
        {branding.logoUrl ? (
          // An existing pure helper has verified the public HTTPS logo URL.
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={branding.logoUrl}
            alt={branding.college.name + " logo"}
            className="mb-3 h-10 max-w-full object-contain object-left"
            referrerPolicy="no-referrer"
          />
        ) : (
          <div
            className="mb-3 flex h-10 w-10 items-center justify-center rounded-[var(--lms-control-radius,9px)] text-lg font-bold"
            style={{
              color: branding.tokens.text,
              backgroundColor: branding.tokens.subtle,
            }}
            aria-hidden="true"
          >
            {branding.college.name.slice(0, 1).toUpperCase()}
          </div>
        )}
        <h3 className="m-0 text-sm font-semibold text-foreground">
          {branding.college.name}
        </h3>
        <p className="mt-1 text-xs text-muted-foreground">
          Sign in to your college
        </p>
        <div className="mt-5 rounded-[var(--lms-control-radius,9px)] border border-border bg-surface-subtle px-3 py-2 text-xs text-muted-foreground">
          Email or mobile number
        </div>
        <div
          className="mt-3 rounded-[var(--lms-control-radius,9px)] px-3 py-2 text-center text-xs font-semibold"
          style={{
            backgroundColor: branding.tokens.primary,
            color: branding.tokens.onPrimary,
          }}
        >
          Continue
        </div>
        <p className="mt-3 text-center text-[10px] text-muted-foreground">
          Illustration only · No live sign-in
        </p>
      </div>
    </div>
  );
}

function ColorSwatch({
  label,
  color,
  overridden,
}: {
  label: string;
  color: string;
  overridden: boolean;
}) {
  return (
    <div className="flex items-center gap-3 rounded-[var(--lms-control-radius,9px)] border border-border p-3">
      <span
        className="h-11 w-11 shrink-0 rounded-[var(--lms-control-radius,9px)] border border-border"
        style={{ backgroundColor: color }}
        aria-hidden="true"
      />
      <div>
        <p className="m-0 text-sm font-semibold text-foreground">{label}</p>
        <p className="mt-1 text-xs text-body">
          <span className="font-mono">{color}</span>
          {" · "}
          {overridden ? "Stored override" : "LMS default"}
        </p>
      </div>
    </div>
  );
}

export function CollegeBrandingPreview({
  branding,
}: {
  branding: AdminCollegeBrandingPreview;
}) {
  const suppressed = Object.values(branding.suppressed).filter(Boolean).length;

  return (
    <div className="space-y-6">
      <Link
        href="/admin/colleges"
        className="inline-flex min-h-11 items-center text-sm font-semibold text-link hover:underline"
      >
        ← Colleges
      </Link>

      <PageHeader
        eyebrow="Super Admin · Tenant Setup"
        title={branding.college.name + " · Branding preview"}
        description={
          "Read-only college sign-in appearance for " +
          branding.college.code +
          ". No settings are modified."
        }
        actions={
          <StatusBadge tone={branding.brandingStored ? "success" : "neutral"}>
            {branding.brandingStored ? "Stored branding" : "LMS defaults"}
          </StatusBadge>
        }
      />

      <section className="border-t border-border pt-5">
        <h2 className="m-0 text-base font-semibold text-foreground">
          College branding settings
        </h2>
        <p className="mt-2 text-sm text-body">
          {branding.brandingStored
            ? "A college branding record exists. Individual unset or unsafe overrides use safe LMS defaults."
            : "No branding record is stored. The illustration uses LMS colour and background defaults."}
        </p>

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <ColorSwatch
            label="Primary colour"
            color={branding.primary}
            overridden={Boolean(branding.primaryOverride)}
          />
          <ColorSwatch
            label="Secondary colour"
            color={branding.secondary}
            overridden={Boolean(branding.secondaryOverride)}
          />
        </div>

        <dl className="mt-5 grid gap-4 text-sm sm:grid-cols-2">
          <div>
            <dt className="font-semibold text-foreground">Public logo</dt>
            <dd className="mt-1 text-body">
              {branding.logoUrl ? "Safe public HTTPS logo" : "No safe logo configured"}
            </dd>
          </div>
          <div>
            <dt className="font-semibold text-foreground">Favicon</dt>
            <dd className="mt-1 text-body">
              {branding.faviconUrl ? "Safe public HTTPS icon" : "Not configured"}
            </dd>
          </div>
          <div>
            <dt className="font-semibold text-foreground">Desktop background</dt>
            <dd className="mt-1 text-body">
              {branding.desktopBackgroundUrl ? "Safe public HTTPS image" : "LMS default"}
            </dd>
          </div>
          <div>
            <dt className="font-semibold text-foreground">Mobile background</dt>
            <dd className="mt-1 text-body">
              {branding.mobileBackgroundFallback
                ? "Uses desktop image fallback"
                : branding.mobileBackgroundUrl
                  ? "Safe public HTTPS image"
                  : "LMS default"}
            </dd>
          </div>
          <div>
            <dt className="font-semibold text-foreground">Support email</dt>
            <dd className="mt-1 text-body">
              {branding.supportEmail ? (
                <a href={"mailto:" + branding.supportEmail} className="text-link underline lms-inline-link">
                  {branding.supportEmail}
                </a>
              ) : "Not configured"}
            </dd>
          </div>
          <div>
            <dt className="font-semibold text-foreground">Support phone</dt>
            <dd className="mt-1 text-body">
              {branding.supportPhone ? (
                <a
                  href={"tel:" + branding.supportPhone.replaceAll(/[ ()-]/g, "")}
                  className="text-link underline"
                >
                  {branding.supportPhone}
                </a>
              ) : "Not configured"}
            </dd>
          </div>
          <div>
            <dt className="font-semibold text-foreground">Terms</dt>
            <dd className="mt-1 text-body">
              {branding.termsUrl ? (
                <a href={branding.termsUrl}
                   className="text-link underline">Open terms link</a>
              ) : "Not configured"}
            </dd>
          </div>
          <div>
            <dt className="font-semibold text-foreground">Privacy</dt>
            <dd className="mt-1 text-body">
              {branding.privacyUrl ? (
                <a href={branding.privacyUrl}
                   className="text-link underline">Open privacy link</a>
              ) : "Not configured"}
            </dd>
          </div>
        </dl>

        {suppressed ? (
          <p className="mt-4 text-sm text-muted-foreground" role="status">
            {suppressed} stored URL field(s) were withheld by the existing strict
            public-HTTPS preview rule. Their values are not exposed here.
          </p>
        ) : null}
      </section>

      <section aria-labelledby="branding-preview-title">
        <h2 id="branding-preview-title" className="mb-2 text-base font-semibold text-foreground">
          Desktop and mobile sign-in style
        </h2>
        <p className="mb-4 text-sm text-body">
          Illustrative layout with persisted public images and existing LMS contrast
          maths. This is not a live tenant-host login or a pixel-perfect legacy preview.
        </p>
        <div className="grid gap-5 lg:grid-cols-2">
          <article className="rounded-[var(--lms-canvas-radius,12px)] border border-border bg-surface p-4">
            <h3 className="mb-3 text-sm font-semibold text-foreground">Desktop</h3>
            <SignInStylePreview branding={branding} mobile={false} />
          </article>
          <article className="rounded-[var(--lms-canvas-radius,12px)] border border-border bg-surface p-4">
            <h3 className="mb-3 text-sm font-semibold text-foreground">Mobile</h3>
            <SignInStylePreview branding={branding} mobile />
          </article>
        </div>
      </section>
    </div>
  );
}
