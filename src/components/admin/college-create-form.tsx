"use client";

import { useState } from "react";
import {useGuardedAction} from "@/hooks/use-guarded-action";
import {useFormDraft} from "@/hooks/use-form-draft";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Alert } from "@/components/ui/alert";
import { Disclosure } from "@/components/ui/disclosure";
import {apiFetch,FriendlyFetchError} from "@/lib/api-fetch";
import {tenantCreationScopeRequest} from "@/modules/colleges/admin-tenant-create-handoff";

export type OrganizationOption = {
  id: string;
  name: string;
};

export function CollegeCreateForm({
  organizations,
  advanceToSetup = false,
  preferredOrganizationId,
  onCreated,
}: {
  organizations: readonly OrganizationOption[];
  advanceToSetup?: boolean;
  preferredOrganizationId?: string;
  onCreated?: (collegeId: string) => void;
}) {
  const router = useRouter();
  const initialOrganizationId=preferredOrganizationId??organizations[0]?.id??"";
  const initialForm={organizationId:initialOrganizationId,name:"",code:"",
    city:"",state:"",addressLine1:"",addressLine2:"",landmark:"",
    postalCode:"",country:"India"};
  const {draft,setDraft,restored,clearDraft}=useFormDraft("admin-create-college:"+initialOrganizationId,initialForm);
  const {organizationId,name,code,city,state,addressLine1,addressLine2,
    landmark,postalCode,country}=draft;
  const setOrganizationId=(value:string)=>setDraft(current=>({...current,organizationId:value}));
  const setName=(value:string)=>setDraft(current=>({...current,name:value}));
  const setCode=(value:string)=>setDraft(current=>({...current,code:value}));
  const setCity=(value:string)=>setDraft(current=>({...current,city:value}));
  const setState=(value:string)=>setDraft(current=>({...current,state:value}));
  const setAddressLine1=(value:string)=>setDraft(current=>({...current,addressLine1:value}));
  const setAddressLine2=(value:string)=>setDraft(current=>({...current,addressLine2:value}));
  const setLandmark=(value:string)=>setDraft(current=>({...current,landmark:value}));
  const setPostalCode=(value:string)=>setDraft(current=>({...current,postalCode:value}));
  const setCountry=(value:string)=>setDraft(current=>({...current,country:value}));
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<
    "organizationId" | "name" | "code", string
  >>>({});
  const {pending,run:guardedRun}=useGuardedAction({busyLabel:"Creating..."});

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSuccess("");
    const errors: typeof fieldErrors = {};
    if (!organizationId) errors.organizationId = "Please select organization";
    if (!name.trim()) errors.name = "Please enter college name";
    if (!code.trim()) errors.code = "Please enter unique ID";
    else if (!/^[a-z0-9-]{3,63}$/.test(code.trim()))
      errors.code = "Unique ID must be 3-63 chars, lowercase letters/numbers/hyphen only.";
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;

    void guardedRun(async () => {
      try {
        const payload=await apiFetch<unknown>("/api/colleges",{
          method:"POST",headers:{"content-type":"application/json"},
          body:JSON.stringify({organizationId,name,code,city,state,addressLine1,
            addressLine2,landmark,postalCode,country}),
        });
        clearDraft();
        const request=tenantCreationScopeRequest(payload);
        if (request) onCreated?.(request.collegeId);
        setSuccess("College created");
        if(advanceToSetup){
          if(!request){
            setError("College created, but couldn't auto-select it — pick it from the header. The setup handoff was unavailable.");
            router.refresh();return;
          }
          try{
            await apiFetch<void>("/api/auth/admin-scope",{
              method:"POST",headers:{"content-type":"application/json"},
              body:JSON.stringify(request),
            });
          }catch{
            setError("College created, but couldn't auto-select it — pick it from the header.");
            router.refresh();return;
          }
          router.push("/admin/tenants/setup");router.refresh();return;
        }
        setName("");setCode("");setCity("");setState("");
        setAddressLine1("");setAddressLine2("");setLandmark("");setPostalCode("");
        setCountry("India");clearDraft();router.refresh();
      }catch(cause){
        setError(cause instanceof FriendlyFetchError && cause.status===409
          ? "uniqueId '"+code.trim().toLowerCase()+"' is already used by another college"
          :cause instanceof Error?"Failed to create college: "+cause.message:
          "Could not create college. Please try again.");
      }
    });
  }

  return (
    <form
      onSubmit={submit}
      noValidate
      aria-busy={pending}
      className="grid min-w-0 gap-3 border-t border-border pt-4 min-[992px]:grid-cols-[1fr_1fr_12rem_auto] min-[992px]:items-end print:hidden"
    >
      <div>
        <label
          htmlFor="college-organization"
          className="mb-1.5 block text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]"
        >
          Organization
        </label>
        <Select
          className="min-h-11 md:min-h-9" id="college-organization"
          disabled={pending}
          value={organizationId}
          onChange={(event) => setOrganizationId(event.target.value)}
          required
          aria-invalid={Boolean(fieldErrors.organizationId)}
          aria-describedby={fieldErrors.organizationId ? "college-organization-error" : undefined}
        >
          {organizations.map((organization) => (
            <option key={organization.id} value={organization.id}>
              {organization.name}
            </option>
          ))}
        </Select>
        {fieldErrors.organizationId ? <p id="college-organization-error" role="alert" className="mt-1 text-xs text-error">{fieldErrors.organizationId}</p> : null}
      </div>
      <div>
        <label
          htmlFor="college-name"
          className="mb-1.5 block text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]"
        >
          College Name
        </label>
        <Input
          className="min-h-11 md:min-h-9" id="college-name"
          disabled={pending}
          value={name}
          onChange={(event) => setName(event.target.value)}
          required
          maxLength={255}
          placeholder="e.g., Engineering College"
          aria-invalid={Boolean(fieldErrors.name)}
          aria-describedby={fieldErrors.name ? "college-name-error" : undefined}
        />
        {fieldErrors.name ? <p id="college-name-error" role="alert" className="mt-1 text-xs text-error">{fieldErrors.name}</p> : null}
      </div>
      <div>
        <label
          htmlFor="college-code"
          className="mb-1.5 block text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]"
        >
          Unique ID / Code
        </label>
        <Input
          className="min-h-11 md:min-h-9" id="college-code"
          aria-describedby={fieldErrors.code ? "college-code-help college-code-error" : "college-code-help"}
          aria-invalid={Boolean(fieldErrors.code)}
          autoCapitalize="none"
          spellCheck={false}
          disabled={pending}
          value={code}
          onChange={(event) => setCode(event.target.value.toLowerCase())}
          required minLength={3} maxLength={63} pattern="[a-z0-9-]{3,63}"
          placeholder="e.g., nsrit or eng-college"
          title="Unique ID must be 3-63 chars, lowercase letters/numbers/hyphen only."
        />
        {fieldErrors.code ? <p id="college-code-error" role="alert" className="mt-1 text-xs text-error">{fieldErrors.code}</p> : null}
      </div>
      <div className="space-y-3 min-[992px]:col-span-4">
       <Disclosure title="Address details (optional)" className="border-b border-border pb-4">
        <div className="mt-3 grid min-w-0 gap-3 md:grid-cols-2 min-[992px]:grid-cols-3">
         {([
          ["City",city,setCity,128],["State",state,setState,128],
          ["Address",addressLine1,setAddressLine1,255],["Address line 2",addressLine2,setAddressLine2,255],
          ["Landmark",landmark,setLandmark,255],["Pin Code",postalCode,setPostalCode,32],
          ["Country",country,setCountry,128],
         ] as const).map(([label,value,setter,maxLength])=><label key={label} className="grid gap-[6px] text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">
          {label}<Input value={value} disabled={pending} onChange={e=>setter(e.target.value)} maxLength={maxLength}
           className="min-h-11 w-full md:min-h-9"/>
         </label>)}
        </div>
       </Disclosure>
       <p id="college-code-help" className="text-xs text-muted-foreground leading-5">Unique ID / Code identifies this college across links and integrations. Choose it carefully; it is not editable after creation.</p>
      </div>
      <Button
        type="submit"
        className="min-h-11 w-full md:min-h-9 md:w-auto"
        loading={pending}
        disabled={pending}
      >
        {pending ? "Creating…" : "Create College"}
      </Button>
      {restored?<Alert tone="info" className="min-[992px]:col-span-4">Draft restored</Alert>:null}
      {success ? <Alert tone="success" role="status" className="min-[992px]:col-span-4">{success}</Alert> : null}
      {error ? (
        <Alert tone="error" className="min-[992px]:col-span-4">
          {error}
        </Alert>
      ) : null}
    </form>
  );
}
