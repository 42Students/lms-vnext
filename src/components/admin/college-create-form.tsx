"use client";

import { useState } from "react";
import {useGuardedAction} from "@/hooks/use-guarded-action";
import {useFormDraft} from "@/hooks/use-form-draft";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
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
      className="grid gap-3 lg:grid-cols-[1fr_1fr_12rem_auto] lg:items-end border-t border-border pt-4"
    >
      <div>
        <label
          htmlFor="college-organization"
          className="mb-1.5 block text-xs font-semibold text-body"
        >
          Organization
        </label>
        <Select
          id="college-organization"
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
          className="mb-1.5 block text-xs font-semibold text-body"
        >
          College Name
        </label>
        <Input
          id="college-name"
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
          className="mb-1.5 block text-xs font-semibold text-body"
        >
          Unique ID / Code
        </label>
        <Input
          id="college-code"
          value={code}
          onChange={(event) => setCode(event.target.value.toLowerCase())}
          required minLength={3} maxLength={63} pattern="[a-z0-9-]{3,63}"
          placeholder="e.g., nsrit or eng-college"
          title="Unique ID must be 3-63 chars, lowercase letters/numbers/hyphen only."
        />
      </div>
      <div className="space-y-3 lg:col-span-4">
       <details className="rounded-[var(--lms-canvas-radius,12px)] border border-border p-3">
        <summary className="cursor-pointer text-sm font-semibold">Address details (optional)</summary>
        <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
         {([
          ["City",city,setCity,128],["State",state,setState,128],
          ["Address",addressLine1,setAddressLine1,255],["Address line 2",addressLine2,setAddressLine2,255],
          ["Landmark",landmark,setLandmark,255],["Pin Code",postalCode,setPostalCode,32],
          ["Country",country,setCountry,128],
         ] as const).map(([label,value,setter,maxLength])=><label key={label} className="grid gap-1 text-xs font-semibold">
          {label}<Input value={value} onChange={e=>setter(e.target.value)} maxLength={maxLength}
           className="min-h-11 sm:min-h-9 w-full"/>
         </label>)}
        </div>
       </details>
       <p className="text-xs text-muted-foreground">Unique ID / Code identifies this college across links and integrations. Choose it carefully; it is not editable after creation.</p>
      </div>
      <Button
        type="submit"
        disabled={
          pending ||
          !organizationId ||
          !name.trim() ||
          !code.trim()
        }
      >
        {pending ? "Creating…" : "Create College"}
      </Button>
      {restored?<p role="status" className="text-xs text-body">Draft restored</p>:null}
      {error ? (
        <p role="alert" className="m-0 text-xs font-semibold text-error lg:col-span-4">
          {error}
        </p>
      ) : null}
    </form>
  );
}
