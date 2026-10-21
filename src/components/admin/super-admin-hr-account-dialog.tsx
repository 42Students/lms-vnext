"use client";

import { useId, useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import type {
  HrAccount,
  HrAccountFormValues,
  HrRelationshipOption,
  HrCollegeOption,
} from "./super-admin-hr-types";

export function SuperAdminHrAccountDialog({
  account,
  relationships,
  colleges,
  selectedCollegeId,
  optionsLoading,
  optionsError,
  pending,
  error,
  onClose,
  onReloadOptions,
  onSubmit,
}: {
  account: HrAccount | null;
  relationships: readonly HrRelationshipOption[];
  colleges:readonly HrCollegeOption[];
  selectedCollegeId?:string|null;
  optionsLoading: boolean;
  optionsError: string | null;
  pending: boolean;
  error: string | null;
  onClose: () => void;
  onReloadOptions: () => void;
  onSubmit: (values: HrAccountFormValues) => void;
}) {
  const id = useId();
  const formId = `${id}-form`;
  const creating = account === null;

  const scopedRelationships=selectedCollegeId
    ? relationships.filter(option=>option.collegeId===selectedCollegeId)
    : [];
  const [companyRelationshipId, setRelationshipId] =
    useState(()=>creating&&scopedRelationships.length===1
      ? scopedRelationships[0]!.companyRelationshipId:"");
  const [additionalRelationshipIds,setAdditionalRelationshipIds]=useState<string[]>([]);
  const [createCompany,setCreateCompany]=useState(false);
  const [newCompanyName,setNewCompanyName]=useState("");
  const [newCompanyCollegeId,setNewCompanyCollegeId]=useState(()=>
    selectedCollegeId&&colleges.some(item=>item.collegeId===selectedCollegeId)
      ? selectedCollegeId:"");
  const [newCompanyDomain,setNewCompanyDomain]=useState("");
  const [firstName,setFirstName] = useState(()=>account?.displayName?.trim().split(/\s+/)[0]??"");
  const [lastName,setLastName] = useState(()=>account?.displayName?.trim().split(/\s+/).slice(1).join(" ")??"");
  const displayName=[firstName.trim(),lastName.trim()].filter(Boolean).join(" ");
  const [phoneE164, setPhoneE164] = useState(
    account?.phoneE164 ?? "",
  );
  const [email, setEmail] = useState(
    account?.email ?? "",
  );
  const [title, setTitle] = useState(
    account?.title ?? "",
  );
  const [fieldError,setFieldError]=useState<{field:"firstName"|"phone"|"email";message:string}|null>(null);
  const [status, setStatus] = useState<
    "ACTIVE" | "ARCHIVED"
  >(
    account?.status === "ARCHIVED"
      ? "ARCHIVED"
      : "ACTIVE",
  );

  const eligible =
    displayName.trim().length > 0 &&
    (!creating || phoneE164.trim().length > 0) &&
    (!creating || (createCompany ? newCompanyName.trim().length>=2&&Boolean(newCompanyCollegeId) : Boolean(companyRelationshipId)));

  function submit(
    event: React.FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    if(pending||optionsLoading&&creating||Boolean(optionsError)&&creating)return;
    if(!firstName.trim()){setFieldError({field:"firstName",message:"First name is required"});return;}
    if(creating&&!phoneE164.trim()){setFieldError({field:"phone",message:"Mobile is required"});return;}
    if(email.trim()&&!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())){
      setFieldError({field:"email",message:"Enter a valid email"});return;
    }
    if(!eligible)return;
    setFieldError(null);
    onSubmit({
      companyRelationshipId,
      companyRelationshipIds:createCompany?[]:[companyRelationshipId,...additionalRelationshipIds],
      ...(createCompany?{newCompany:{name:newCompanyName.trim(),collegeId:newCompanyCollegeId,
        ...(newCompanyDomain.trim()?{primaryDomain:newCompanyDomain.trim()}:{}),
      }}:{}),
      displayName,
      phoneE164,
      email,
      title,
      status,
    });
  }

  return (
    <Dialog
      open
      dismissible={!pending}
      onOpenChange={(open) => {
        if (!open && !pending) {
          onClose();
        }
      }}
      title={
        creating
          ? "Add recruiter"
          : `Edit ${account.displayName ?? "recruiter account"}`
      }
      description={
        creating
          ? "Create a recruiter identity and grant access to its first company–college relationship."
          : "Update recruiter contact information, title and account status. Company ownership cannot be changed here."
      }
      footer={
        <div className="flex w-full flex-col-reverse gap-[var(--lms-space-2)] md:flex-row md:justify-end [&>button]:w-full md:[&>button]:w-auto">
          <Button className="min-h-11 md:min-h-9"
            variant="secondary"
            disabled={pending}
            onClick={onClose}
          >
            Cancel
          </Button>
          <Button className="min-h-11 md:min-h-9"
            loading={pending}
            type="submit"
            form={formId}
            disabled={pending || !eligible || (creating && (optionsLoading || Boolean(optionsError)))}
          >
            {pending
              ? "Saving…"
              : creating
                ? "Add recruiter"
                : "Save changes"}
          </Button>
        </div>
      }
    >
      <form
        id={formId}
        noValidate
        onSubmit={submit}
        className="space-y-4"
      >
        <div className="grid min-w-0 gap-[var(--lms-space-4)] md:grid-cols-2">
          <label className="grid gap-[6px] text-[var(--lms-font-sm)] font-semibold text-[13px] leading-4 text-[var(--lms-neutral-400)]">First Name
            <Input className="min-h-11 md:min-h-9" id={`${id}-first-name`} autoComplete="given-name" value={firstName}
              minLength={1} maxLength={100} required disabled={pending}
              aria-invalid={fieldError?.field==="firstName"}
              onChange={event=>{setFirstName(event.target.value);setFieldError(null);}}
              onBlur={()=>{if(!firstName.trim())setFieldError({field:"firstName",message:"First name is required"});}}/>
            {fieldError?.field==="firstName"?<span role="alert" className="text-xs text-error">{fieldError.message}</span>:null}
          </label>
          <label className="grid gap-[6px] text-[var(--lms-font-sm)] font-semibold text-[13px] leading-4 text-[var(--lms-neutral-400)]">Last Name
            <Input className="min-h-11 md:min-h-9" id={`${id}-last-name`} autoComplete="family-name" value={lastName}
              maxLength={100} disabled={pending}
              onChange={event=>setLastName(event.target.value)}/>
          </label>
        </div>

        <div className="grid min-w-0 gap-[var(--lms-space-4)] md:grid-cols-2">
          <div>
            <label
              htmlFor={`${id}-phone`}
              className="mb-[var(--lms-space-2)] block text-[var(--lms-font-sm)] font-semibold text-[13px] leading-4 text-[var(--lms-neutral-400)]"
            >
              Mobile number
            </label>
            <Input className="min-h-11 md:min-h-9"
              id={`${id}-phone`}
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              value={phoneE164}
              required={creating || Boolean(account?.phoneE164)}
              maxLength={32}
              placeholder="+919876543210"
              disabled={pending}
              aria-invalid={fieldError?.field==="phone"}
              onChange={(event) => {setPhoneE164(event.target.value);setFieldError(null);}}
              onBlur={()=>{if(creating&&!phoneE164.trim())setFieldError({field:"phone",message:"Mobile is required"});}}
            />
            {fieldError?.field==="phone"?<p role="alert" className="mt-1 text-xs text-error">{fieldError.message}</p>:null}
          </div>

          <div>
            <label
              htmlFor={`${id}-email`}
              className="mb-[var(--lms-space-2)] block text-[var(--lms-font-sm)] font-semibold text-[13px] leading-4 text-[var(--lms-neutral-400)]"
            >
              Email · optional
            </label>
            <Input className="min-h-11 md:min-h-9"
              id={`${id}-email`}
              type="email"
              autoComplete="email"
              value={email}
              maxLength={320}
              placeholder="name@company.com"
              disabled={pending}
              aria-invalid={fieldError?.field==="email"}
              onChange={(event) => {setEmail(event.target.value);setFieldError(null);}}
            />
            {fieldError?.field==="email"?<p role="alert" className="mt-1 text-xs text-error">{fieldError.message}</p>:null}
          </div>
        </div>

        {creating ? (
          <div>
            <label className="mb-3 flex min-h-11 items-center gap-2 text-sm text-body">
              <Checkbox checked={createCompany} disabled={pending}
                onChange={event=>{setCreateCompany(event.target.checked);setRelationshipId("");
                  setAdditionalRelationshipIds([]);}}/>
              Company not listed? Create a company by name
            </label>
            {createCompany?<div className="mb-[var(--lms-space-4)] space-y-[var(--lms-space-4)] border-b border-border pb-[var(--lms-space-4)]">
              <label className="grid gap-[6px] text-[var(--lms-font-sm)] font-semibold text-[13px] leading-4 text-[var(--lms-neutral-400)]">Company name
                <Input className="min-h-11 md:min-h-9" value={newCompanyName} minLength={2} maxLength={150} required
                  onChange={event=>setNewCompanyName(event.target.value)} disabled={pending}/>
              </label>
              <label className="grid gap-[6px] text-[var(--lms-font-sm)] font-semibold text-[13px] leading-4 text-[var(--lms-neutral-400)]">First college
                <Select className="min-h-11 md:min-h-9" required value={newCompanyCollegeId} disabled={pending||optionsLoading}
                  onChange={event=>setNewCompanyCollegeId(event.target.value)}>
                  <option value="">Select a college</option>
                  {colleges.map(c=><option key={c.collegeId} value={c.collegeId}>{c.collegeName}</option>)}
                </Select>
              </label>
              <label className="grid gap-[6px] text-[var(--lms-font-sm)] font-semibold text-[13px] leading-4 text-[var(--lms-neutral-400)]">Company domain (optional)
                <Input className="min-h-11 md:min-h-9" value={newCompanyDomain} placeholder="company.com" maxLength={253}
                  disabled={pending} onChange={event=>setNewCompanyDomain(event.target.value)}/>
              </label>
              <p className="text-xs text-muted-foreground">
                A new company will be linked to this college before the recruiter is created.
                If recruiter creation fails, this company stays available for retry.
              </p>
            </div>:null}
            {!createCompany?<><label
              htmlFor={`${id}-relationship`}
              className="mb-[var(--lms-space-2)] block text-[var(--lms-font-sm)] font-semibold text-[13px] leading-4 text-[var(--lms-neutral-400)]"
            >
              Company and first college
            </label>

            <Select className="min-h-11 md:min-h-9"
              id={`${id}-relationship`}
              value={companyRelationshipId}
              required
              disabled={pending || optionsLoading}
              onChange={(event) => {
                setRelationshipId(event.target.value);
                setAdditionalRelationshipIds([]);
              }}
            >
              <option value="">
                {selectedCollegeId?"Select a company relationship in this college":"Select an active relationship"}
              </option>
              {[...relationships].sort((a,b)=>Number(b.collegeId===selectedCollegeId)-Number(a.collegeId===selectedCollegeId)).map((relationship) => (
                <option
                  key={relationship.companyRelationshipId}
                  value={relationship.companyRelationshipId}
                >
                  {relationship.collegeName} ·{" "}
                  {relationship.companyName}
                </option>
              ))}
            </Select>

            {companyRelationshipId&&!createCompany ? (
              <fieldset className="mt-[var(--lms-space-3)] border-b border-border pb-[var(--lms-space-4)]">
                <legend className="sr-only">Colleges · optional additional access</legend>
                <details className="group min-w-0">
                  <summary className="min-h-11 cursor-pointer py-[var(--lms-space-2)] text-[var(--lms-font-sm)] font-semibold text-foreground focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)]">Colleges · optional additional access</summary>
                  <div className="space-y-[var(--lms-space-2)]">
                <p className="text-xs text-muted-foreground">
                  You can add or remove colleges later. Only colleges connected to this same company are shown.
                </p>
                {relationships.filter(option =>
                  option.companyRelationshipId!==companyRelationshipId &&
                  option.companyId===relationships.find(item=>item.companyRelationshipId===companyRelationshipId)?.companyId
                ).map(option=><label key={option.companyRelationshipId} className="flex min-h-11 items-center gap-2 text-sm text-body">
                  <Checkbox disabled={pending}
                    checked={additionalRelationshipIds.includes(option.companyRelationshipId)}
                    onChange={event=>setAdditionalRelationshipIds(old=>
                      event.target.checked?[...old,option.companyRelationshipId]:old.filter(x=>x!==option.companyRelationshipId))}
                  />{option.collegeName}
                </label>)}
                  </div>
                </details>
              </fieldset>
            ):null}
            </>:null}
            {optionsLoading ? (
              <p
                role="status"
                className="mt-2 text-xs text-muted-foreground"
              >
                Loading available company relationships…
              </p>
            ) : null}

            {optionsError ? (
              <div className="mt-2 space-y-2">
                <p
                  role="alert"
                  className="text-sm text-error"
                >
                  {optionsError}
                </p>
                <Button className="min-h-11 md:min-h-9"
                  variant="secondary"
                  size="sm"
                  onClick={onReloadOptions}
                >
                  Retry loading relationships
                </Button>
              </div>
            ) : null}

            {!createCompany && !optionsLoading &&
            !optionsError &&
            relationships.length === 0 ? (
              <p className="mt-2 text-xs leading-5 text-muted-foreground">
                No active company–college relationships
                are available in this scope. Establish a
                relationship in Placements before creating
                the recruiter.
              </p>
            ) : null}
          </div>
        ) : (
          <div className="border-y border-border bg-muted px-3 py-3">
            <p className="m-0 text-xs font-semibold text-muted-foreground">
              Company
            </p>
            <p className="mt-1 text-sm font-semibold text-foreground">
              {account.companyName}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Company ownership is fixed. College grants
              are managed from the account detail drawer.
            </p>
          </div>
        )}

        <div>
          <label
            htmlFor={`${id}-title`}
            className="mb-[var(--lms-space-2)] block text-[var(--lms-font-sm)] font-semibold text-[13px] leading-4 text-[var(--lms-neutral-400)]"
          >
            Designation · optional
          </label>
          <Input className="min-h-11 md:min-h-9"
            id={`${id}-title`}
            value={title}
            maxLength={160}
            placeholder="Talent Acquisition Manager"
            disabled={pending}
            onChange={(event) =>
              setTitle(event.target.value)
            }
          />
        </div>

        {!creating ? (
          <div>
            <label
              htmlFor={`${id}-status`}
              className="mb-[var(--lms-space-2)] block text-[var(--lms-font-sm)] font-semibold text-[13px] leading-4 text-[var(--lms-neutral-400)]"
            >
              Recruiter status
            </label>
            <Select className="min-h-11 md:min-h-9"
              id={`${id}-status`}
              value={status}
              disabled={
                pending || account.status === "DISABLED"
              }
              onChange={(event) =>
                setStatus(
                  event.target.value as
                    | "ACTIVE"
                    | "ARCHIVED",
                )
              }
            >
              <option value="ACTIVE">Active</option>
              <option value="ARCHIVED">Suspended</option>
            </Select>

            {account.status === "DISABLED" ? (
              <p className="mt-2 text-xs leading-5 text-muted-foreground">
                This canonical user is disabled. Changing
                the recruiter status here cannot reactivate
                the platform identity.
              </p>
            ) : null}

            {status === "ARCHIVED" &&
            account.status !== "ARCHIVED" ? (
              <p className="mt-2 text-xs leading-5 text-warning">
                Suspending signs the recruiter out everywhere
                and blocks sign-in. Existing college grants
                remain linked for reactivation.
              </p>
            ) : null}

            <p className="mt-2 text-xs leading-5 text-muted-foreground">
              Existing email and mobile contact values
              cannot be cleared from this form. Session
              termination is a separate operation.
            </p>
          </div>
        ) : null}

        {error ? (
          <p
            role="alert"
            className="border-l-2 border-error bg-error-subtle px-4 py-3 text-sm text-error"
          >
            {error}
          </p>
        ) : null}
      </form>
    </Dialog>
  );
}
