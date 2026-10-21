"use client";

import { useState } from "react";
import {useGuardedAction} from "@/hooks/use-guarded-action";
import {useFormDraft} from "@/hooks/use-form-draft";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {useToast} from "@/components/ui/toast";
import { Input } from "@/components/ui/input";
import { Alert } from "@/components/ui/alert";
import {apiFetch,FriendlyFetchError} from "@/lib/api-fetch";
import {createdOrganizationStepHref} from "@/modules/colleges/admin-tenant-organization-step";

export function OrganizationCreateForm({ advanceToCollege = false }: { advanceToCollege?: boolean } = {}) {
  const router = useRouter();
  const {showToast}=useToast();
  const {draft,setDraft,restored,clearDraft}=useFormDraft("admin-create-organization",{name:""});
  const name=draft.name;
  const setName=(value:string)=>setDraft({...draft,name:value});
  const [error, setError] = useState<string | null>(null);
  const {pending,run:guardedRun}=useGuardedAction({busyLabel:"Creating..."});

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const cleanName=name.trim().replace(/\s+/g," ");
    if(!cleanName){setError("Please enter organization name");return;}
    void guardedRun(async () => {
      try {
        const payload=await apiFetch<unknown>("/api/organizations",{
          method:"POST",
          headers:{"content-type":"application/json"},
          body:JSON.stringify({name:cleanName}),
        });
        const href=createdOrganizationStepHref(payload);
        if(!href){
          setError(advanceToCollege
            ? "Organization created, but the college step could not be selected. Refresh to choose the organization."
            : "Could not verify the organization response. Refresh before trying again.");
          router.refresh();return;
        }
        showToast({title:"Created organization “"+cleanName+"”.",tone:"success"});
        clearDraft();
        if(advanceToCollege){
          router.push(href);router.refresh();return;
        }
        setName("");clearDraft();router.refresh();
      } catch(cause) {
        const message=cause instanceof FriendlyFetchError && cause.code==="ORGANIZATION_NAME_REQUIRED"
          ? "Organization name is required"
          :cause instanceof FriendlyFetchError && cause.status===409
            ? "Organization name already exists"
            :cause instanceof Error?cause.message:"Could not create organization. Please try again.";
        setError(message);
        showToast({tone:"error",title:"Failed to create organization: "+message});
      }
    });
  }

  return (
    <form
      onSubmit={submit}
      noValidate
      className="flex min-w-0 flex-col items-stretch gap-4 pt-4 print:hidden"
    >
      <div className="min-w-0 flex-1">
        <label
          htmlFor="organization-name"
          className="mb-1.5 block text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]"
        >
          Organization name<span aria-hidden="true" className="ml-1 text-[var(--lms-error)]">*</span>
        </label>
        <Input
          id="organization-name"
          value={name}
          onChange={(event) => { setName(event.target.value); setError(null); }}
          required
          aria-invalid={Boolean(error && !name.trim())}
          aria-describedby={error&&!name.trim()?"organization-name-error":undefined}
          maxLength={255}
          placeholder="e.g., ABC University"
        />
        {error&&!name.trim()?<p id="organization-name-error" role="alert" className="mt-1 text-xs text-error">Please enter organization name</p>:null}
      </div>
      <Button type="submit" className="min-h-11 w-full md:min-h-9 md:w-fit" disabled={pending} loading={pending}>
        <span aria-hidden="true" className="mr-2">＋</span>{pending ? "Creating…" : "Create Organization"}
      </Button>
      {restored ? <p role="status" className="text-xs leading-5 text-muted-foreground md:col-span-2">Draft restored</p> : null}
      {error&&name.trim() ? (
        <Alert tone="error" className="md:col-span-2">
          {error}
        </Alert>
      ) : null}
    </form>
  );
}
