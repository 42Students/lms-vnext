"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Input } from "@/components/ui/input";
import { Alert } from "@/components/ui/alert";
import { Disclosure } from "@/components/ui/disclosure";
import { LMS_BRANDING_DEFAULT_HEX, LMS_BRANDING_PLACEHOLDER_HEX } from "@/components/ui/branding-color-tokens";
import { useToast } from "@/components/ui/toast";
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
  { key: "logoUrl", label: "Logo", hint: "Shown at the top of the sign-in card, next to the college name. Without a logo, the college’s initials are shown in the brand colour. Square image works best.", placeholder: "https://cdn.example.edu/logo.png" },
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
  const [loadError,setLoadError]=useState<string|null>(null);
  const [fetching,setFetching]=useState(false);
  const [previewMode,setPreviewMode]=useState<"desktop"|"mobile">("desktop");
  const [latestLogoUrl,setLatestLogoUrl]=useState<string|null>(uploadedLogoUrl??null);
  useEffect(()=>{setLatestLogoUrl(uploadedLogoUrl??null);},[uploadedLogoUrl]);
  const lastCollegeRef=useRef(collegeId);
  const requestSequence=useRef(0);
  const [leaveHref,setLeaveHref]=useState<string|null>(null);
  useEffect(()=>{
    if(lastCollegeRef.current!==collegeId){
      // The owning route keys this editor by college; still guard its
      // standalone use so one tenant never inherits another tenant's draft.
      if(JSON.stringify(clean(values))!==JSON.stringify(clean(savedValues.current)))
        showToast({title:"Unsaved branding changes were discarded because the selected college changed.",tone:"warning"});
      lastCollegeRef.current=collegeId;
      requestSequence.current++;
      savedValues.current=initial;
      setValues(initial);
      setVersion(initialVersion);
      setLatestLogoUrl(uploadedLogoUrl??null);
      setErrors({});
      setLoadError(null);
      setPreviewMode("desktop");
    }
  },[collegeId,initial,initialVersion,uploadedLogoUrl,showToast,values]);
  const allowConfirmedExit=useRef(false);
  const dirty = canEdit &&
    JSON.stringify(clean(values)) !== JSON.stringify(clean(savedValues.current));
  useEffect(() => {
    if (!dirty) return;
    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      if (allowConfirmedExit.current) return;
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [dirty]);
  // Next's in-app Link navigation skips beforeunload. Intercept only an
  // ordinary same-tab route change; allow section anchors and modified clicks.
  useEffect(() => {
    if (!dirty) return;
    const onLinkClick = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0 || event.metaKey ||
          event.ctrlKey || event.shiftKey || event.altKey) return;
      if (!(event.target instanceof Element)) return;
      const anchor = event.target.closest("a[href]");
      if (!(anchor instanceof HTMLAnchorElement) || anchor.hasAttribute("download") ||
          (anchor.target && anchor.target !== "_self")) return;
      const target = new URL(anchor.href, window.location.href);
      if (target.origin !== window.location.origin ||
          (target.pathname === window.location.pathname &&
           target.search === window.location.search)) return;
      event.preventDefault();
      event.stopPropagation();
      if (savingRef.current) {
        showToast({title:"Wait for the current college setup action to finish.",tone:"info"});
      } else {
        setLeaveHref(target.href);
      }
    };
    document.addEventListener("click", onLinkClick, true);
    return () => document.removeEventListener("click", onLinkClick, true);
  }, [dirty, showToast]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, startSave] = useTransition();
  // A transition is not a synchronous double-click guard.
  const savingRef = useRef(false);

  const validColor = (value: string | null) =>
    value && /^#[0-9a-fA-F]{6}$/.test(value) ? value : null;
  const previewLogoUrl=latestLogoUrl||safeTpoBrandLogoUrl(values.logoUrl);
  const previewDesktop=previewMode==="desktop";
  const previewWidth=previewDesktop?340:170;
  const previewHeight=previewDesktop?191:302;

  async function reloadBranding(force=false){
    if(!collegeId||(savingRef.current&&!force)||fetching)return;
    if(dirty&&!force){
      setLeaveHref("__reload__");
      return;
    }
    const sequence=++requestSequence.current;
    setFetching(true);setLoadError(null);
    try{
      const response=await fetch("/api/colleges/"+encodeURIComponent(collegeId)+"/branding",{
       method:"GET",credentials:"same-origin",cache:"no-store",
      });
      if(!response.ok)throw Error("Couldn't load branding for this college.");
      const data=await response.json() as {branding?:BrandingFormValues&{
        version:number;uploadedLogoUrl?:string|null;collegeName?:string;
      }};
      if(sequence!==requestSequence.current||lastCollegeRef.current!==collegeId)return;
      if(!data.branding||!Number.isInteger(data.branding.version))
        throw Error("Couldn't load branding for this college.");
      const {version:loadedVersion,uploadedLogoUrl:loadedLogoUrl,...rest}=data.branding;
      const loaded:BrandingFormValues={
       logoUrl:rest.logoUrl??null,faviconUrl:rest.faviconUrl??null,
       loginBackgroundUrl:rest.loginBackgroundUrl??null,
       loginBackgroundUrlMobile:rest.loginBackgroundUrlMobile??null,
       primaryColor:rest.primaryColor??null,secondaryColor:rest.secondaryColor??null,
       supportEmail:rest.supportEmail??null,supportPhone:rest.supportPhone??null,
       termsUrl:rest.termsUrl??null,privacyUrl:rest.privacyUrl??null,
      };
      savedValues.current=loaded;setValues(loaded);setVersion(loadedVersion);
      setLatestLogoUrl(loadedLogoUrl??null);setErrors({});
    }catch(error){
      if(sequence!==requestSequence.current)return;
      setLoadError(error instanceof Error?error.message:"Couldn't load branding for this college.");
    }finally{
      if(sequence===requestSequence.current)setFetching(false);
    }
  }

  function set(key: keyof BrandingFormValues, value: string) {
    setValues((current) => ({ ...current, [key]: value }));
    setErrors((current) => ({ ...current, [key]: "" }));
  }

  function save(event: React.FormEvent) {
    event.preventDefault();
    if (!canEdit || !collegeId || fetching || loadError || savingRef.current) return;
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
        savedValues.current = {...values};
        if(data.branding && Number.isInteger(data.branding.version))
          setVersion(data.branding.version);
        // Do not discard freshly persisted values before the authoritative
        // version and uploaded image are returned by GET.
        void reloadBranding(true);
        setErrors({});
        showToast({ title: "Branding saved", tone: "success" });
        // Publish an edited logo only after a successful branding save.
        window.dispatchEvent(new CustomEvent("college-branding-saved",{detail:{collegeId}}));
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
    <>
    <ConfirmDialog open={leaveHref !== null}
      title="Discard unsaved branding changes?"
      description="You have unsaved branding changes. Reloading, leaving or switching colleges discards them."
      confirmLabel={leaveHref==="__reload__"?"Discard changes and reload":"Leave without saving"} confirmVariant="danger"
      onOpenChange={next => {if (!next) setLeaveHref(null);}}
      onConfirm={() => {
        if (!leaveHref || savingRef.current) return;
        if(leaveHref==="__reload__"){
          setLeaveHref(null);
          void reloadBranding(true);
        }else{
          allowConfirmedExit.current = true;
          window.location.assign(leaveHref);
        }
      }} />
    <section aria-label="Look and feel" className="min-w-0 rounded-[var(--lms-canvas-radius)] border border-[var(--lms-canvas-border)] bg-surface p-4">
      <form
        onSubmit={save}
        className="min-w-0 space-y-[var(--lms-space-4)] print:hidden"
      >
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-3">
          <h2 className="m-0 text-lg font-semibold text-[var(--lms-heading)]">Look and feel</h2>
          <Button type="button" variant="secondary" size="sm" disabled={!collegeId||saving||fetching}
            onClick={()=>void reloadBranding()} aria-label="Reload branding">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}
              strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M20 7v5h-5M4 17v-5h5"/>
              <path d="M5.5 9a7 7 0 0 1 12.2-2L20 12M4 12l2.3 5a7 7 0 0 0 12.2-2"/>
            </svg> Reload
          </Button>
        </div>
        {fetching?<p role="status" className="text-sm text-body">Loading branding…</p>:null}
        {loadError?<Alert tone="error" title="Branding could not be loaded">
          {loadError}
          <Button variant="secondary" size="sm" type="button" disabled={fetching}
           onClick={()=>void reloadBranding(true)} className="mt-2">Retry</Button>
        </Alert>:null}
        <p className="max-w-[75ch] text-[13px] leading-5 text-body">
          What students and staff see the moment they open this college’s web address — the login page.
          This is purely cosmetic (it doesn’t affect who can log in or how), so there’s no wrong order to fill these in,
          and nothing here is required: a college with every field blank still logs in fine on the default 42LMS look.
          Fill in as much as the college has given you.
        </p>
        {!canEdit ? <Alert tone="info">You can view this branding but not change it.</Alert> : null}
        {dirty ? <p role="status" className="text-xs text-warning-text">
          Unsaved branding changes. Leaving or switching pages may discard your edits.
        </p> : null}
        <section aria-label="Logo" className="min-w-0 space-y-2">
          <h3 className="text-sm font-semibold text-[var(--lms-heading)]">Logo</h3>
          <p className="max-w-[75ch] text-xs leading-5 text-muted-foreground">
            Shown at the top of the sign-in card, next to the college name. Without a logo, the college’s initials are shown in the brand colour. Square image works best.
            Choose a square image at least 200 × 200 pixels in the college logo cropper above; the cropped upload is staged until Save succeeds.
          </p>
          <label className="grid max-w-[620px] gap-1 text-xs font-semibold text-body">
            Public logo URL (optional fallback)
            <Input type="url" value={values.logoUrl??""} onChange={event=>set("logoUrl",event.target.value)}
              placeholder="https://cdn.example.edu/logo.png" disabled={!canEdit||fetching||Boolean(loadError)}
              aria-invalid={Boolean(errors.logoUrl)} />
          </label>
          {errors.logoUrl?<Alert tone="error">{errors.logoUrl}</Alert>:null}
        </section>
        <div className="space-y-3" aria-label="Login preview">
          <h3 className="text-sm font-semibold text-[var(--lms-heading)]">Preview</h3>
          <div role="group" aria-label="Preview device" className="inline-flex rounded-md border border-border bg-surface p-1">
            {(["desktop","mobile"] as const).map(mode=>
              <Button key={mode} type="button" size="sm"
                variant={previewMode===mode?"primary":"ghost"}
                aria-pressed={previewMode===mode} onClick={()=>setPreviewMode(mode)}
                className="min-h-9 px-3">
                {mode==="desktop"?"Desktop":"Mobile"}
              </Button>)}
          </div>
          <div role="img" aria-label={previewDesktop?"Desktop 42LMS sign-in preview":"Mobile 42LMS sign-in preview"}
            style={{width:previewWidth,height:previewHeight,borderRadius:12,
             border:"1px solid #d9d9d9",position:"relative",overflow:"hidden",
             display:"flex",alignItems:previewDesktop?"center":"flex-start",justifyContent:"center",
             paddingTop:previewDesktop?0:28,background:
             "radial-gradient(ellipse 45% 40% at 52% 50%, #0a7c8822, transparent 70%), radial-gradient(ellipse 75% 70% at 50% 48%, #26bac740, #7dd3e01a 45%, transparent 75%), #f6f8fb",
             maxWidth:"100%"}}
            className="mx-auto sm:mx-0">
            <div style={{width:previewDesktop?128:138,padding:10,borderRadius:8,
              background:"#fff",border:"1px solid #e7ecf2",
              boxShadow:"0 6px 16px -8px rgba(16,24,40,.25)"}}>
              <div className="flex items-center gap-[5px] border-b border-[#e7ecf2] pb-[6px] mb-[7px]">
                {previewLogoUrl?<img src={previewLogoUrl} width={16} height={16}
                  alt="Logo preview" className="h-4 w-4 object-contain" referrerPolicy="no-referrer"/>:
                  <span className="inline-block h-4 w-4 rounded bg-[#0a7c8822] shadow-[inset_0_0_0_1px_#0a7c8855]"
                    aria-label={collegeName.slice(0,2).toUpperCase()+" initials fallback"}/>}
                <span className="h-[5px] w-[50px] rounded-sm bg-[#172033]"/>
              </div>
              <div className="mb-2 h-[6px] w-[34px] rounded-sm bg-[#172033]"/>
              <div className="mb-[6px] h-3 rounded-sm border border-[#d6e1ee]"/>
              <div className="h-3 rounded-sm bg-[#0a7c88]"/>
            </div>
          </div>
          <p className="text-xs text-[#8c8c8c]">
            Approximation — the real page also shows the floating symbols and the full sign-in form.
          </p>
        </div>
        {canEdit?<Button type="submit" loading={saving} disabled={saving||fetching||Boolean(loadError)||!collegeId}
           className="min-h-11 w-full justify-center sm:w-auto md:min-h-9">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor"
           strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
           <path d="M4 3h14l3 3v15H3V3h1zm2 0v7h12V3M7 21v-8h10v8"/>
          </svg>
          Save
        </Button>:null}
        <h3 className="text-base font-semibold text-[var(--lms-heading)]">Additional appearance settings</h3>
        <p className="text-xs text-muted-foreground">These optional values are stored for tenant presentation but do not change the fixed 42LMS teal login preview.</p>

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
          { title: "Sign-in images", fields: FIELDS.slice(1, 4) },
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

        {canEdit?<Button type="submit" loading={saving} disabled={saving||fetching||Boolean(loadError)||!collegeId}
           variant="secondary" className="min-h-11 w-full sm:w-auto md:min-h-9">Save</Button>:null}
      </form>

    </section>
    </>
  );
}
