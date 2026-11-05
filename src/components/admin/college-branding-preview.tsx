"use client";
import {useState} from "react";
import type { CSSProperties } from "react";
import { StatusBadge } from "@/components/ui/status-badge";
import { Card } from "@/components/ui/card";
import type { AdminCollegeBrandingPreview } from "@/modules/colleges/admin-branding-preview-model";
import { Button } from "@/components/ui/button";
import { Heading } from "@/components/ui/heading";
import { Img } from "@/components/ui/img";
import { TextLink } from "@/components/ui/text-link";

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
    backgroundColor: "var(--lms-primary-subtle)",
    backgroundImage: "radial-gradient(circle at 14% 18%,color-mix(in srgb, var(--lms-button-primary) 20%, transparent),transparent 50%),radial-gradient(circle at 82% 84%,color-mix(in srgb, var(--lms-primary) 18%, transparent),transparent 55%)",
    ...(backgroundUrl
      ? {
          backgroundImage:
            "linear-gradient(color-mix(in srgb, var(--lms-white) 8%, transparent),color-mix(in srgb, var(--lms-white) 8%, transparent)),url(" +
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
      className="relative mx-auto flex max-w-full shrink-0 items-center justify-center overflow-hidden rounded-xl border border-border"
      style={{...canvasStyle,width:mobile?170:340,height:mobile?302:191,
        paddingTop:mobile?28:0,alignItems:mobile?"flex-start":"center"}}
    >
      <div className="shrink-0 rounded-lg border border-[color:var(--lms-border)] bg-surface p-[12px] shadow-md"
        style={{width:mobile?138:128}}>
        <div className="mb-[8px] flex items-center gap-[6px] border-b border-[color:var(--lms-border)] pb-[6px]">
        {branding.logoUrl ? (
          // An existing pure helper has verified the public HTTPS logo URL.
          <Img
            src={branding.logoUrl}
            alt={branding.college.name + " logo"}
            className="h-4 w-4 shrink-0 object-contain"
            referrerPolicy="no-referrer"
          />
        ) : (
          <span aria-hidden="true" className="h-4 w-4 shrink-0 rounded-[4px] border border-[color:color-mix(in_srgb,var(--lms-button-primary)_33%,transparent)] bg-[color:color-mix(in_srgb,var(--lms-button-primary)_13%,transparent)]" />
        )}
          <span aria-hidden="true" className="h-[5px] w-[50px] rounded-sm bg-[color:var(--lms-heading)]"/>
        </div>
        <div aria-hidden="true" className="mb-2 h-[6px] w-[34px] rounded-sm bg-[color:var(--lms-heading)]"/>
        <div aria-hidden="true" className="mb-[6px] h-3 rounded-[4px] border border-[color:var(--lms-neutral-300)]"/>
        <div aria-hidden="true" className="h-3 rounded-[4px] bg-[color:var(--lms-button-primary)]"/>
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
    <div className="min-w-0 flex items-center gap-3 rounded-[var(--lms-control-radius)] border border-border p-3">
      <span
        className="h-11 w-11 shrink-0 rounded-[var(--lms-control-radius)] border border-border"
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
  const [previewMode,setPreviewMode]=useState<"desktop"|"mobile">("desktop");

  return (
    <div className="min-w-0 space-y-6">
      <section aria-label="Stored branding preview" className="flex min-w-0 flex-wrap items-start justify-between gap-3 border-b border-border pb-4">
        <div className="min-w-0 flex-1">
          <Heading level={2} size="lg" className="m-0 leading-6 text-foreground">{branding.college.name} · Branding preview</Heading>
          <p className="mt-1 text-sm text-body">Read-only college sign-in appearance for {branding.college.code}. No settings are modified.</p>
        </div>
        <StatusBadge tone={branding.brandingStored ? "success" : "neutral"}>
          {branding.brandingStored ? "Stored branding" : "LMS defaults"}
        </StatusBadge>
      </section>

      <section className="border-t border-border pt-6">
        <Heading level={2} size="base" className="m-0 text-foreground">
          College branding settings
        </Heading>
        <p className="mt-2 text-sm text-body">
          {branding.brandingStored
            ? "A college branding record exists. Individual unset or unsafe overrides use safe LMS defaults."
            : "No branding record is stored. The illustration uses LMS colour and background defaults."}
        </p>

        <div className="mt-4 grid min-w-0 gap-3 md:grid-cols-2">
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

        <dl className="mt-5 grid min-w-0 gap-4 text-sm md:grid-cols-2">
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
                <TextLink href={"mailto:" + branding.supportEmail} className="lms-inline-link inline-flex min-h-11 items-center md:min-h-9">
                  {branding.supportEmail}
                </TextLink>
              ) : "Not configured"}
            </dd>
          </div>
          <div>
            <dt className="font-semibold text-foreground">Support phone</dt>
            <dd className="mt-1 text-body">
              {branding.supportPhone ? (
                <TextLink
                  href={"tel:" + branding.supportPhone.replaceAll(/[ ()-]/g, "")}
                  className="inline-flex min-h-11 items-center md:min-h-9"
                >
                  {branding.supportPhone}
                </TextLink>
              ) : "Not configured"}
            </dd>
          </div>
          <div>
            <dt className="font-semibold text-foreground">Terms</dt>
            <dd className="mt-1 text-body">
              {branding.termsUrl ? (
                <TextLink href={branding.termsUrl}
                   className="inline-flex min-h-11 items-center md:min-h-9">Open terms link</TextLink>
              ) : "Not configured"}
            </dd>
          </div>
          <div>
            <dt className="font-semibold text-foreground">Privacy</dt>
            <dd className="mt-1 text-body">
              {branding.privacyUrl ? (
                <TextLink href={branding.privacyUrl}
                   className="inline-flex min-h-11 items-center md:min-h-9">Open privacy link</TextLink>
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
        <Heading level={2} size="base" id="branding-preview-title" className="mb-2 text-foreground">
          Desktop and mobile sign-in style
        </Heading>
        <p className="mb-4 text-sm text-body">
          A compact approximation of the classic 42LMS sign-in layout. The real login page may use the selected college's saved public background and logo.
        </p>
        <div className="space-y-3">
          <div role="group" aria-label="Sign-in preview size" className="inline-flex rounded-lg border border-border bg-surface p-1">
            {(["desktop","mobile"] as const).map(mode=><Button variant="bare" type="button" key={mode}
              aria-pressed={previewMode===mode}
              onClick={()=>setPreviewMode(mode)}
              className={"min-h-11 md:min-h-9 rounded-md px-4 text-sm font-semibold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary "+
                (previewMode===mode?"bg-primary text-[var(--lms-on-primary)]":"bg-transparent text-body hover:bg-primary-subtle")}>
              {mode==="desktop"?"Desktop":"Mobile"}
            </Button>)}
          </div>
          <Card as="article" className="max-w-[380px] p-4 md:p-4">
            <SignInStylePreview branding={branding} mobile={previewMode==="mobile"}/>
            <p className="mt-2 text-center text-xs text-muted-foreground">
              Approximation — the real page also shows the floating symbols and the full sign-in form.
            </p>
          </Card>
        </div>
      </section>
    </div>
  );
}
