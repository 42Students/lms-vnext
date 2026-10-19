import { redirect } from "next/navigation";
import {TpoEmailSignatureEditor} from "@/components/tpo/tpo-communication-settings-editors";
import {getTpoCommunicationSettings} from "@/modules/placements/tpo-communication-settings-service";

import { getCurrentRequestContext } from "@/auth/request-context";
import { TpoSettingsNav } from "@/components/placements/tpo-settings-nav";
import { PageHeader } from "@/components/ui/page-header";
import { StatusBadge } from "@/components/ui/status-badge";
import { hasMembershipRole } from "@/modules/identity/context";
import {
  getTpoPlacementBranding,
} from "@/modules/placements/tpo-branding-service";
import {
  tpoBrandingOriginLabel,
  type TpoBrandingField,
} from "@/modules/placements/tpo-branding-model";

export const dynamic = "force-dynamic";

function BrandColor({
  label,
  field,
}: {
  label: string;
  field: TpoBrandingField;
}) {
  return (
    <div className="border-b border-border pb-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <h3 className="m-0 text-base font-semibold text-foreground">
          {label}
        </h3>
        <StatusBadge
          tone={
            field.source === "PERSISTED"
              ? "success"
              : "info"
          }
        >
          {tpoBrandingOriginLabel(field.source)}
        </StatusBadge>
      </div>

      <div className="mt-4 flex items-center gap-4">
        <span
          aria-hidden="true"
          className={
            "h-12 w-12 shrink-0 rounded-[var(--lms-control-radius,9px)] border border-border " +
            (field.value ? "" : "bg-primary")
          }
          style={
            field.value
              ? { backgroundColor: field.value }
              : undefined
          }
        />

        <div>
          <p className="font-mono text-sm font-semibold text-foreground">
            {field.value ?? "Standard LMS palette"}
          </p>
          <p className="mt-1 text-xs leading-5 text-muted-foreground">
            {field.value
              ? "Stored college branding colour"
              : "No colour override is stored for this field"}
          </p>
        </div>
      </div>
    </div>
  );
}

export default async function TpoPlacementBrandingPage() {
  const context = await getCurrentRequestContext();

  if (
    !context.membership ||
    !hasMembershipRole(context, "TPO")
  ) {
    redirect("/dashboard");
  }

  const [branding,communication] = await Promise.all([
    getTpoPlacementBranding(context),getTpoCommunicationSettings(context),
  ]);

  const sourceLabel =
    tpoBrandingOriginLabel(
      branding.brandingSource,
    );

  return (
    <div className="space-y-6">
      <TpoSettingsNav active="branding" />

      <PageHeader
        eyebrow="TPO · Settings"
        title="Placement Branding"
        description="Review your college's existing name, public logo and brand colours. Manage your placement email signature."
      />

      <section className="border-t border-border pt-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="m-0 text-lg font-semibold text-foreground">
              Current college branding
            </h2>
            <p className="mt-2 text-sm leading-6 text-body">
              {branding.brandingSource === "PERSISTED"
                ? "A college_branding row exists for your college. Individual blank fields still use their source defaults."
                : "Your college has no college_branding row. Its name comes from the college record; the standard LMS presentation applies to unset branding fields."}
            </p>
          </div>

          <StatusBadge
            tone={
              branding.brandingSource === "PERSISTED"
                ? "success"
                : "info"
            }
          >
            {sourceLabel}
          </StatusBadge>
        </div>

        <dl className="mt-5 border-t border-border pt-4">
          <dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            College name
          </dt>
          <dd className="mt-2 text-xl font-semibold text-foreground">
            {branding.collegeName}
          </dd>
          <dd className="mt-1 text-xs text-muted-foreground">
            Persisted source: colleges.name
          </dd>
        </dl>
      </section>

      <section
        aria-label="College logo"
        className="border-t border-border pt-5"
      >
        <div className="flex flex-wrap items-start justify-between gap-3">
          <h2 className="m-0 text-lg font-semibold text-foreground">
            Public college logo
          </h2>

          <StatusBadge
            tone={
              branding.logo.source === "PERSISTED"
                ? "success"
                : "info"
            }
          >
            {tpoBrandingOriginLabel(
              branding.logo.source,
            )}
          </StatusBadge>
        </div>

        {branding.logoPreviewUrl ? (
          <div className="mt-5 flex min-h-32 items-center justify-center rounded-[var(--lms-canvas-radius)] border border-border bg-surface-subtle p-6">
            {/* Same validated public HTTPS image pattern
                used by the college sign-in page. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={branding.logoPreviewUrl}
              alt={`${branding.collegeName} logo`}
              referrerPolicy="no-referrer"
              className="max-h-24 w-auto max-w-full object-contain"
            />
          </div>
        ) : (
          <div
            role="status"
            className="mt-5 border-t border-border pt-4 text-sm leading-6 text-body"
          >
            {branding.logoPreviewSuppressed
              ? "A logo address is stored, but it cannot be safely previewed as a public image. The address is not exposed here."
              : "No public logo URL is configured. The standard LMS presentation remains the fallback."}
          </div>
        )}

        <p className="mt-3 text-xs leading-5 text-muted-foreground">
          This preview uses only the public HTTPS
          logo URL stored in college_branding.
          Private storage object paths are not
          read or turned into public links.
        </p>
      </section>

      <section
        aria-labelledby="placement-brand-colors"
        className="space-y-3"
      >
        <div>
          <h2
            id="placement-brand-colors"
            className="m-0 text-lg font-semibold text-foreground"
          >
            Brand colours
          </h2>
          <p className="mt-1 text-sm leading-6 text-body">
            Stored colours are displayed exactly
            as configured. Unset fields use the
            standard LMS palette instead of an
            invented college-specific colour.
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <BrandColor
            label="Primary colour"
            field={branding.primaryColor}
          />
          <BrandColor
            label="Secondary colour"
            field={branding.secondaryColor}
          />
        </div>
      </section>

      {communication.ready?<TpoEmailSignatureEditor initial={communication.emailSignature} version={communication.version}/>:
       <p role="status" className="rounded-[var(--lms-canvas-radius)] border border-border p-4 text-sm">Email signature settings are not available in this database.</p>}
      <section className="border-t border-border pt-4 text-sm leading-6 text-body">
        <h2 className="m-0 text-sm font-semibold text-foreground">
          Source and scope
        </h2>

        <p className="mt-2">
          The college name comes from the persisted
          colleges record. Logo and colour overrides
          come from college_branding, scoped to
          your currently selected TPO membership.
        </p>

        <p className="mt-2">
          These are existing college-wide branding
          fields, also used by the college&apos;s
          public sign-in experience. They are not
          evidence of a separate placement-specific
          branding configuration or of branding being
          applied to every recruiter document,
          communication or export.
        </p>
      </section>

      <p className="text-xs leading-5 text-muted-foreground">
        No logo uploading, contact-data disclosure or private asset access is available here. The email signature may be edited. Placement-specific artwork, recruiter
        communications branding and full legacy
        parity require separate verification.
      </p>
    </div>
  );
}
