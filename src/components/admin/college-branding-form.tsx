"use client";

import { useMemo, useRef, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";
import { brandStyleVariables } from "@/modules/colleges/branding";
import {safeTpoBrandLogoUrl} from "@/modules/placements/tpo-branding-model";

export type BrandingFormValues = {
  logoUrl: string | null;
  faviconUrl: string | null;
  loginBackgroundUrl: string | null;
  loginBackgroundUrlMobile: string | null;
  primaryColor: string | null;
  secondaryColor: string | null;
  supportEmail: string | null;
  supportPhone: string | null;
  termsUrl: string | null;
  privacyUrl: string | null;
};

const FIELDS: {
  key: keyof BrandingFormValues;
  label: string;
  hint?: string;
  type?: string;
  placeholder?: string;
}[] = [
  { key: "logoUrl", label: "Logo URL", hint: "https:// image, shown on the sign-in page", placeholder: "https://cdn.example.edu/logo.png" },
  { key: "faviconUrl", label: "Favicon URL", placeholder: "https://cdn.example.edu/favicon.ico" },
  { key: "loginBackgroundUrl", label: "Sign-in background (desktop)", placeholder: "https://cdn.example.edu/bg.jpg" },
  { key: "loginBackgroundUrlMobile", label: "Sign-in background (mobile)", placeholder: "https://cdn.example.edu/bg-mobile.jpg" },
  { key: "supportEmail", label: "Support email", type: "email", placeholder: "help@example.edu" },
  { key: "supportPhone", label: "Support phone", type: "tel", placeholder: "+91 98765 43210" },
  { key: "termsUrl", label: "Terms of use URL", placeholder: "https://example.edu/terms" },
  { key: "privacyUrl", label: "Privacy policy URL", placeholder: "https://example.edu/privacy" },
];

function clean(values: BrandingFormValues) {
  return Object.fromEntries(
    Object.entries(values).map(([key, value]) => [
      key,
      value && value.trim() ? value.trim() : null,
    ]),
  );
}

export function CollegeBrandingForm({
  collegeId,
  collegeName,
  initial,
  initialVersion,
  canEdit,
  uploadedLogoUrl,
}: {
  collegeId: string;
  collegeName: string;
  initial: BrandingFormValues;
  initialVersion: number;
  canEdit: boolean;
  uploadedLogoUrl?:string|null;
}) {
  const { showToast } = useToast();
  const [values, setValues] = useState<BrandingFormValues>(initial);
  const [version,setVersion]=useState(initialVersion);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, startSave] = useTransition();
  // A transition is not a synchronous double-click guard.
  const savingRef = useRef(false);

  const validColor = (value: string | null) =>
    value && /^#[0-9a-fA-F]{6}$/.test(value) ? value : null;
  const previewStyle = useMemo(
    () =>
      brandStyleVariables(validColor(values.primaryColor)) as React.CSSProperties,
    [values.primaryColor],
  );
  const previewLogoUrl=uploadedLogoUrl||safeTpoBrandLogoUrl(values.logoUrl);

  function set(key: keyof BrandingFormValues, value: string) {
    setValues((current) => ({ ...current, [key]: value }));
    setErrors((current) => ({ ...current, [key]: "" }));
  }

  function save(event: React.FormEvent) {
    event.preventDefault();
    if (!canEdit || savingRef.current) return;
    savingRef.current = true;
    startSave(async () => {
      try {
      const response = await fetch(`/api/colleges/${collegeId}/branding`, {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({...clean(values),expectedVersion:version}),
      });
      const data = (await response.json().catch(() => ({}))) as {
        error?: string;
        branding?: {version:number};
        issues?: { path?: (string | number)[]; message?: string }[];
      };

      if (response.ok) {
        if(data.branding && Number.isInteger(data.branding.version))
          setVersion(data.branding.version);
        setErrors({});
        showToast({ title: "Branding saved", tone: "success" });
        return;
      }

      if (data.issues?.length) {
        const next: Record<string, string> = {};
        for (const issue of data.issues) {
          const key = String(issue.path?.[0] ?? "");
          if (key) next[key] = issue.message ?? "Invalid value";
        }
        setErrors(next);
      }
      showToast({
        title:
          response.status === 403
            ? "You can't change this college's branding"
            : response.status === 409
              ? "Branding changed in another tab. Your edits are preserved. Refresh before saving again."
              : response.status === 413
                ? "Branding settings are too large. Shorten the URLs and try again."
                : "Check the highlighted fields",
        tone: "error",
      });
      } catch {
        showToast({title:"Could not save branding. Check your connection and try again.",tone:"error"});
      } finally {
        savingRef.current = false;
      }
    });
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
      <form
        onSubmit={save}
        className="space-y-5 border-t border-border pt-6"
      >
        <div className="grid gap-4 sm:grid-cols-2">
          {(["primaryColor", "secondaryColor"] as const).map((key) => (
            <label key={key} className="block">
              <span className="mb-1 block text-sm font-medium text-foreground">
                {key === "primaryColor" ? "Primary colour" : "Secondary colour"}
              </span>
              <div className="flex items-center gap-2">
                <Input
                  type="color"
                  aria-label={`${key} picker`}
                  value={validColor(values[key]) ?? "#26BAC7"}
                  onChange={(event) => set(key, event.target.value.toUpperCase())}
                  disabled={!canEdit}
                  className="h-11 !w-12 !min-w-12 shrink-0 cursor-pointer p-1"
                />
                <Input
                  value={values[key] ?? ""}
                  onChange={(event) => set(key, event.target.value)}
                  placeholder="#1A95A1"
                  disabled={!canEdit}
                  maxLength={7}
                  aria-invalid={Boolean(errors[key])}
                />
              </div>
              {errors[key] ? (
                <span role="alert" className="mt-1 block text-xs text-error">
                  {errors[key]}
                </span>
              ) : null}
            </label>
          ))}
        </div>
        <p className="m-0 text-xs text-muted-foreground">
          Leave blank to use the standard LMS colours. Text on your colour is
          chosen automatically so it always stays readable.
        </p>

        {FIELDS.map((field) => (
          <label key={field.key} className="block">
            <span className="mb-1 block text-sm font-medium text-foreground">
              {field.label}
            </span>
            <Input
              type={field.type ?? "url"}
              value={values[field.key] ?? ""}
              onChange={(event) => set(field.key, event.target.value)}
              placeholder={field.placeholder}
              disabled={!canEdit}
              aria-invalid={Boolean(errors[field.key])}
            />
            {field.hint ? (
              <span className="mt-1 block text-xs text-muted-foreground">
                {field.hint}
              </span>
            ) : null}
            {errors[field.key] ? (
              <span role="alert" className="mt-1 block text-xs text-error">
                {errors[field.key]}
              </span>
            ) : null}
          </label>
        ))}

        {canEdit ? (
          <Button type="submit" disabled={saving}>
            {saving ? "Saving…" : "Save branding"}
          </Button>
        ) : (
          <p className="m-0 text-sm text-muted-foreground">
            You can view this branding but not change it.
          </p>
        )}
      </form>

      <aside
        aria-label="Sign-in preview"
        style={previewStyle}
        className="h-fit rounded-[var(--lms-canvas-radius)] border border-border bg-muted p-4"
      >
        <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Sign-in preview
        </p>
        <div className="rounded-[var(--lms-canvas-radius)] border border-border bg-surface p-5 shadow-none">
          {previewLogoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={previewLogoUrl}
              alt=""
              referrerPolicy="no-referrer"
              className="h-10 w-auto max-w-[180px] object-contain"
            />
          ) : (
            <p className="m-0 text-xs font-medium text-muted-foreground">
              42Students
            </p>
          )}
          <p className="mb-0 mt-2 text-xl font-semibold text-foreground">
            {collegeName}
          </p>
          <div className="mt-4 grid grid-cols-2 gap-1 rounded-[var(--lms-control-radius)] bg-muted p-1 text-xs">
            <span className="rounded-[var(--lms-control-radius)] bg-surface py-2 text-center font-semibold text-link shadow-none">
              Phone
            </span>
            <span className="py-2 text-center text-body">Email</span>
          </div>
          <div className="mt-3 h-11 rounded-[var(--lms-control-radius)] border border-border bg-surface" />
          <div className="mt-3 flex min-h-11 items-center justify-center rounded-[var(--lms-control-radius)] bg-primary text-sm font-semibold text-on-primary">
            Send code
          </div>
          <p className="mb-0 mt-3 text-xs text-link">Resend code</p>
        </div>
      </aside>
    </div>
  );
}
