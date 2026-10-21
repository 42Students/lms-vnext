"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert } from "@/components/ui/alert";
import { Disclosure } from "@/components/ui/disclosure";
import { Card } from "@/components/ui/card";
import { LMS_BRANDING_DEFAULT_HEX, LMS_BRANDING_PLACEHOLDER_HEX } from "@/components/ui/branding-color-tokens";
import { useToast } from "@/components/ui/toast";
import { brandStyleVariables } from "@/modules/colleges/branding";
import { safeTpoBrandLogoUrl } from "@/modules/placements/tpo-branding-model";

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
  const savedValues = useRef<BrandingFormValues>(initial);
  const [version,setVersion]=useState(initialVersion);
  const dirty = canEdit &&
    JSON.stringify(clean(values)) !== JSON.stringify(clean(savedValues.current));
  useEffect(() => {
    if (!dirty) return;
    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [dirty]);
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
        savedValues.current = values;
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
        title: "Couldn't save branding",
        description:
          response.status === 403
            ? "You can't change this college's branding."
            : response.status === 409
              ? "Branding changed in another tab. Your edits are preserved. Refresh before saving again."
              : response.status === 413
                ? "Branding settings are too large. Shorten the URLs and try again."
                : data.issues?.length ? "Check the highlighted fields." : "Please try again.",
        tone: "error",
      });
      } catch {
        showToast({title:"Couldn't save branding",description:"Check your connection and try again.",tone:"error"});
      } finally {
        savingRef.current = false;
      }
    });
  }

  return (
    <div className="grid min-w-0 grid-cols-1 items-start gap-[var(--lms-space-4)] min-[992px]:grid-cols-[minmax(0,1fr)_340px]">
      <form
        onSubmit={save}
        className="order-first min-w-0 space-y-[var(--lms-space-4)] print:hidden"
      >
        {!canEdit ? <Alert tone="info">You can view this branding but not change it.</Alert> : null}
        {dirty ? <p role="status" className="text-xs text-warning-text">
          Unsaved branding changes. Leaving or switching pages may discard your edits.
        </p> : null}
        <h2 className="m-0 font-semibold text-[16px] leading-[26px] min-[768px]:text-[18px] min-[768px]:leading-[28px] min-[992px]:text-[20px] min-[992px]:leading-[30px] text-[var(--lms-heading)]">Colours</h2>
        <div className="grid min-w-0 gap-[var(--lms-space-4)] md:grid-cols-2">
          {(["primaryColor", "secondaryColor"] as const).map((key) => (
            <label key={key} className="block min-w-0 text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">
              <span className="mb-[6px] block text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">
                {key === "primaryColor" ? "Primary colour" : "Secondary colour"}
              </span>
              <div className="flex min-w-0 items-center gap-2">
                <Input
                  type="color"
                  aria-label={`${key} picker`}
                  value={validColor(values[key]) ?? LMS_BRANDING_DEFAULT_HEX}
                  onChange={(event) => set(key, event.target.value.toUpperCase())}
                  disabled={!canEdit}
                  className="h-11 !w-12 !min-w-12 shrink-0 cursor-pointer p-1"
                />
                <Input
                  value={values[key] ?? ""}
                  onChange={(event) => set(key, event.target.value)}
                  placeholder={LMS_BRANDING_PLACEHOLDER_HEX}
                  disabled={!canEdit}
                  maxLength={7}
                  aria-invalid={Boolean(errors[key])}
                  className="min-h-11 min-w-0 flex-1 md:min-h-9"
                />
              </div>
              {errors[key] ? (
                <Alert tone="error" className="mt-2">{errors[key]}</Alert>
              ) : null}
            </label>
          ))}
        </div>
        <p className="m-0 text-xs text-muted-foreground leading-[20px]">
          Leave blank to use the standard LMS colours. Text on your colour is
          chosen automatically so it always stays readable.
        </p>

        {Object.values(errors).some(Boolean) ? <Alert tone="error">Review the highlighted fields before saving. Sections with errors are expanded.</Alert> : null}
        {[
          { title: "Sign-in images", fields: FIELDS.slice(0, 4) },
          { title: "Support details and policies", fields: FIELDS.slice(4) },
        ].map(group => {
          const hasErrors=group.fields.some(field=>Boolean(errors[field.key]));
          return <Disclosure key={group.title + (hasErrors ? "-invalid" : "-ready")}
            title={hasErrors ? group.title + " · Check fields" : group.title}
            defaultOpen={hasErrors}
            className="min-w-0 border-b border-[var(--lms-canvas-border)] pb-3"
            contentClassName="min-w-0 pt-[var(--lms-space-3)]">
            <div className="grid min-w-0 gap-[var(--lms-space-4)] md:grid-cols-2">
              {group.fields.map(field => (
                <label key={field.key} className="block min-w-0 text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">
                  <span className="mb-[6px] block text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">
                    {field.label}
                  </span>
                  <Input type={field.type ?? "url"}
                    value={values[field.key] ?? ""}
                    onChange={(event) => set(field.key, event.target.value)}
                    placeholder={field.placeholder} disabled={!canEdit}
                    aria-invalid={Boolean(errors[field.key])}
                    className="min-h-11 md:min-h-9" />
                  {field.hint ? <span className="mt-[var(--lms-space-2)] block text-xs leading-5 text-muted-foreground">{field.hint}</span> : null}
                  {errors[field.key] ? <Alert tone="error" className="mt-[var(--lms-space-2)]">{errors[field.key]}</Alert> : null}
                </label>
              ))}
            </div>
          </Disclosure>;
        })}

        {canEdit ? (
          <Button type="submit" loading={saving} disabled={saving} className="min-h-11 w-full justify-center sm:w-auto md:min-h-9">
            Save
          </Button>
        ) : null}
      </form>

      <aside
        aria-label="Sign-in preview"
        style={previewStyle}
        className="order-last min-w-0 h-fit space-y-[var(--lms-space-3)] border-t border-[var(--lms-canvas-border)] pt-[var(--lms-space-4)] min-[992px]:border-t-0 min-[992px]:border-l min-[992px]:pl-[var(--lms-space-4)] min-[992px]:pt-0"
      >
        <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground leading-[20px]">
          Sign-in preview
        </p>
        <Card as="div" className="min-w-0">
          {previewLogoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={previewLogoUrl}
              alt=""
              referrerPolicy="no-referrer"
              className="h-10 w-auto max-w-[180px] object-contain"
            />
          ) : (
            <p className="m-0 text-xs font-medium text-muted-foreground leading-[20px]">
              42Students
            </p>
          )}
          <p className="mb-0 mt-2 text-xl font-semibold text-foreground">
            {collegeName}
          </p>
          <div className="mt-4 grid grid-cols-2 gap-1 rounded-[var(--lms-control-radius)] border border-border bg-muted p-1 text-xs">
            <span className="rounded-[var(--lms-control-radius)] bg-surface py-2 text-center font-semibold text-link shadow-none">
              Phone
            </span>
            <span className="py-2 text-center text-body">Email</span>
          </div>
          <div className="mt-3 h-11 rounded-[var(--lms-control-radius)] border border-border bg-surface" />
          <div className="mt-3 flex min-h-11 items-center justify-center rounded-[var(--lms-control-radius)] bg-primary md:min-h-9 text-sm font-semibold text-on-primary">
            Send code
          </div>
          <p className="mb-0 mt-3 text-xs text-link leading-[20px]">Resend code</p>
        </Card>
      </aside>
    </div>
  );
}
