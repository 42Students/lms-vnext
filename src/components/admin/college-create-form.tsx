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
}: {
  organizations: readonly OrganizationOption[];
  advanceToSetup?: boolean;
  preferredOrganizationId?: string;
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
  const {pending,run:guardedRun}=useGuardedAction({busyLabel:"Creating..."});

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    void guardedRun(async () => {
      try {
        const payload=await apiFetch<unknown>("/api/colleges",{
          method:"POST",headers:{"content-type":"application/json"},
          body:JSON.stringify({organizationId,name,code,city,state,addressLine1,
            addressLine2,landmark,postalCode,country}),
        });
        clearDraft();
        if(advanceToSetup){
          const request=tenantCreationScopeRequest(payload);
          if(!request){
            setError("College created, but the setup handoff was unavailable. Select it from the scope switcher.");
            router.refresh();return;
          }
          try{
            await apiFetch<void>("/api/auth/admin-scope",{
              method:"POST",headers:{"content-type":"application/json"},
              body:JSON.stringify(request),
            });
          }catch{
            setError("College created, but selecting it failed. Choose the new college in the scope switcher before setup.");
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
          :cause instanceof Error?cause.message:
          "Could not create college. Please try again.");
      }
    });
  }

  return (
    <form
      onSubmit={submit}
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
        >
          {organizations.map((organization) => (
            <option key={organization.id} value={organization.id}>
              {organization.name}
            </option>
          ))}
        </Select>
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
        />
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
          aria-describedby="college-code-help"
          autoCapitalize="none"
          spellCheck={false}
          disabled={pending}
          value={code}
          onChange={(event) => setCode(event.target.value.toLowerCase())}
          required minLength={3} maxLength={63} pattern="[a-z0-9-]{3,63}"
          placeholder="e.g., nsrit or eng-college"
          title="Unique ID must be 3-63 chars, lowercase letters/numbers/hyphen only."
        />
      </div>
      <div className="space-y-3 min-[992px]:col-span-4">
       <Disclosure title="Address details (optional)" className="border-b border-border pb-4">
        <div className="mt-3 grid min-w-0 gap-3 md:grid-cols-2 min-[992px]:grid-cols-3">
         {([
          ["City",city,setCity,128],["State",state,setState,128],
          ["Address",addressLine1,setAddressLine1,255],["Address line 2",addressLine2,setAddressLine2,255],
          ["Landmark",landmark,setLandmark,255],["Pin Code",postalCode,setPostalCode,32],
          ["Country",country,setCountry,128],
         ] as const).map(([label,value,setter,maxLength])=><label key={label} className="grid gap-1 text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">
          {label}<Input value={value} disabled={pending} onChange={e=>setter(e.target.value)} maxLength={maxLength}
           className="min-h-11 w-full md:min-h-9"/>
         </label>)}
        </div>
       </Disclosure>
       <p id="college-code-help" className="text-xs text-muted-foreground">Unique ID / Code identifies this college across links and integrations. Choose it carefully; it is not editable after creation.</p>
      </div>
      <Button
        type="submit"
        className="min-h-11 md:min-h-9"
        loading={pending}
        disabled={
          pending ||
          !organizationId ||
          !name.trim() ||
          !code.trim()
        }
      >
        {pending ? "Creating…" : "Create College"}
      </Button>
      {restored?<Alert tone="info" className="min-[992px]:col-span-4">Draft restored</Alert>:null}
      {error ? (
        <Alert tone="error" className="min-[992px]:col-span-4">
          {error}
        </Alert>
      ) : null}
    </form>
  );
}
