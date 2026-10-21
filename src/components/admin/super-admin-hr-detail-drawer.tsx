"use client";

import { useId, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Drawer } from "@/components/ui/drawer";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { LoadingState } from "@/components/ui/loading-state";
import { Select } from "@/components/ui/select";
import { StatusBadge } from "@/components/ui/status-badge";
import type {
  HrAccount,
  HrGrant,
  HrRelationshipOption,
} from "./super-admin-hr-types";
import {
  hrDisplayName,
  hrStatusTone,
} from "./super-admin-hr-types";


export function SuperAdminHrDetailDrawer({
  account,
  loading,
  error,
  actionError,
  relationships,
  optionsLoading,
  optionsError,
  pending,
  onClose,
  onReload,
  onReloadOptions,
  onEdit,
  onGrant,
  onRevokeRequest,
  onTerminateRequest,
}: {
  account: HrAccount | null;
  loading: boolean;
  error: string | null;
  actionError: string | null;
  relationships: readonly HrRelationshipOption[];
  optionsLoading: boolean;
  optionsError: string | null;
  pending: boolean;
  onClose: () => void;
  onReload: () => void;
  onReloadOptions: () => void;
  onEdit: (account: HrAccount) => void;
  onGrant: (
    companyRelationshipId: string,validUntil:string|undefined,
  ) => Promise<boolean>;
  onRevokeRequest: (grant: HrGrant) => void;
  onTerminateRequest: (account: HrAccount) => void;
}) {
  const id = useId();
  const [renderNow] = useState(() => Date.now());
  const [validUntil,setValidUntil] = useState("");
  const [expiryError,setExpiryError] = useState("");
  const [
    selectedRelationshipId,
    setSelectedRelationshipId,
  ] = useState("");

  // Include historical, revoked and expired rows without duplicating active IDs.
  const allGrants=account
    ?[...account.grants,...(account.grantHistory??[]).filter(history=>
       !account.grants.some(active=>active.id===history.id))]
    :[];
  const eligibleRelationships = account
    ? relationships.filter(
        (relationship) =>
          relationship.companyId ===
            account.companyId &&
          !account.grants.some(
            (grant) =>
              grant.companyRelationshipId ===
              relationship.companyRelationshipId,
          ),
      )
    : [];

  async function grant() {
    if (!selectedRelationshipId || pending) {
      return;
    }

    if(validUntil && Date.parse(validUntil+"T23:59:59+05:30") <= Date.now()){
      setExpiryError("Choose a future access expiration date.");return;
    }
    setExpiryError("");
    const completed = await onGrant(
      selectedRelationshipId,
      validUntil ? new Date(validUntil+"T23:59:59+05:30").toISOString() : undefined,
    );

    if (completed) {
      setSelectedRelationshipId("");
      setValidUntil("");
    }
  }

  return (
    <Drawer
      open
      className="md:!w-[min(640px,100vw)]"
      dismissible={!pending}
      onOpenChange={(open) => {
        if (!open && !pending) {
          onClose();
        }
      }}
      title={
        account
          ? hrDisplayName(account)
          : "Recruiter account details"
      }
      description="Recruiter identity, company, college access and account security."
      footer={
        <div className="flex w-full flex-col-reverse gap-[var(--lms-space-2)] md:flex-row md:justify-end [&>button]:w-full md:[&>button]:w-auto">
          {account ? (
            <Button className="min-h-11 md:min-h-9"
              variant="secondary"
              disabled={pending||!account.accountManageable}
              onClick={() => onEdit(account)}
            >
              Edit account
            </Button>
          ) : null}
          <Button className="min-h-11 md:min-h-9"
            variant="secondary"
            disabled={pending}
            onClick={onClose}
          >
            Close
          </Button>
        </div>
      }
    >
      {loading ? (
        <div className="flex min-h-48 items-center justify-center"><LoadingState label="Loading recruiter details…" /></div>
      ) : error ? (
        <ErrorState
          title="Could not load recruiter"
          description={error}
          action={
            <Button className="min-h-11 md:min-h-9"
              variant="secondary"
              onClick={onReload}
            >
              Retry
            </Button>
          }
        />
      ) : !account ? (
        <EmptyState
          title="No recruiter selected"
          description="Select a recruiter from the accounts table."
        />
      ) : (
        <div className="min-w-0 space-y-[var(--lms-space-4)]">
          {optionsError?<p role="alert" className="border-l-2 border-warning bg-warning-subtle px-4 py-3 text-sm text-body">
            College options could not be loaded. Grant actions are disabled until relationships are verified.
            <Button type="button" variant="link" size="sm" onClick={onReloadOptions}>Retry college options</Button>
          </p>:null}
          {actionError?<ErrorState title="Action failed" description={actionError}/>:null}
          <section className="min-w-0 border-b border-border pb-[var(--lms-space-4)]">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                
                <p className="mt-1 text-sm text-muted-foreground">{account.companyName} · {account.title||"No designation"} · {account.phoneE164||"No mobile"}</p>
              </div>
              <StatusBadge
                tone={hrStatusTone(account.status)}
              >
                {"Account: "+(account.status === "ARCHIVED" ? "Suspended" : account.status === "ACTIVE" ? "Active" : "Disabled")}
              </StatusBadge>
            </div>

            <dl className="mt-4 grid gap-4 text-sm md:grid-cols-2">
              <div>
                <dt className="text-xs font-semibold text-muted-foreground">
                  Mobile
                </dt>
                <dd className="mt-1 break-words [overflow-wrap:anywhere] text-body">
                  {account.phoneE164 || "Not provided"}
                </dd>
              </div>

              <div>
                <dt className="text-xs font-semibold text-muted-foreground">
                  Email
                </dt>
                <dd className="mt-1 break-words [overflow-wrap:anywhere] text-body">
                  {account.email || "Not provided"}
                </dd>
              </div>

              <div className="md:col-span-2">
                <dt className="text-xs font-semibold text-muted-foreground">
                  Company
                </dt>
                <dd className="mt-1 min-w-0 break-words [overflow-wrap:anywhere] text-body">
                  {account.companyName}
                </dd>
              </div>
            </dl>
          </section>

          <section className="border-b border-border pb-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h3 className="m-0 text-base font-semibold text-foreground">
                  College access
                </h3>
                <p className="mt-1 text-xs leading-5 text-muted-foreground">
                  {account.grants.length} current access grant{account.grants.length===1?"":"s"} and {Math.max(0,allGrants.length-account.grants.length)} historical records visible in this admin scope.
                </p>
              </div>
            </div>

            <div className="mt-4 min-w-0 overflow-x-auto" role="region" aria-label="College access and history" tabIndex={0}>
             <table className="w-full min-w-[590px] border-collapse text-left text-sm">
              <thead><tr className="border-b border-border bg-surface-subtle">
               <th scope="col" className="px-3 py-2 font-semibold">College</th>
               <th scope="col" className="px-3 py-2 font-semibold">Access</th>
               <th scope="col" className="px-3 py-2 font-semibold">Until</th>
               <th scope="col" className="px-3 py-2 font-semibold"><span className="sr-only">Actions</span></th>
              </tr></thead>
              <tbody>
               {allGrants.length===0?<tr><td colSpan={4} className="px-3 py-5 text-center text-muted-foreground">No colleges yet.</td></tr>:
               allGrants.map(grant=>{
                const expired=Boolean(grant.validUntil&&Date.parse(grant.validUntil)<=renderNow);
                const status=grant.status==="REVOKED"?"Revoked":
                  expired?"Expired":grant.status==="ACTIVE"&&grant.verificationStatus==="VERIFIED"?"Active":
                  grant.verificationStatus==="VERIFIED"?"Inactive":"Unverified";
                const current=account.grants.some(item=>item.id===grant.id);
                return <tr key={grant.id} className="border-b border-border align-middle">
                 <td className="max-w-[230px] break-words px-3 py-3 font-semibold">{grant.collegeName}</td>
                 <td className="px-3 py-3"><StatusBadge tone={status==="Active"?"success":status==="Unverified"?"warning":"neutral"}>{status}</StatusBadge></td>
                 <td className="px-3 py-3 text-xs text-body">
                  {grant.validUntil?<span className="rounded-md border border-border px-2 py-1">{grant.validUntil.slice(0,10)}</span>:"No recorded expiry"}
                 </td>
                 <td className="px-3 py-3">
                  {current&&grant.status==="ACTIVE"?<Button type="button" variant="secondary" size="sm"
                    disabled={pending} aria-label={"Remove access for "+grant.collegeName} onClick={()=>onRevokeRequest(grant)}>Remove</Button>:
                   <span className="text-xs text-muted-foreground">—</span>}
                 </td>
                </tr>;
               })}
              </tbody>
             </table>
            </div>

            {account.status === "ACTIVE" ? (
              <div className="mt-[var(--lms-space-4)] border-t border-border pt-[var(--lms-space-4)]">
                <h4 className="text-sm font-semibold text-foreground">Add a college</h4>
                <p className="mt-1 text-xs leading-5 text-muted-foreground">
                  Only active company–college relationships for{" "}
                  {account.companyName} are eligible. Choose the college to grant access.
                </p>

                <label
                  htmlFor={`${id}-grant`}
                  className="mb-[6px] mt-[var(--lms-space-3)] block text-[var(--lms-font-sm)] font-semibold text-[var(--lms-neutral-400)] leading-4"
                >
                  College
                </label>
                <Select
                  id={`${id}-grant`}
                  value={selectedRelationshipId}
                  disabled={pending || optionsLoading}
                  onChange={(event) =>
                    setSelectedRelationshipId(
                      event.target.value,
                    )
                  }
                >
                  <option value="">
                    Select a college relationship
                  </option>
                  {eligibleRelationships.map(
                    (relationship) => (
                      <option
                        key={
                          relationship.companyRelationshipId
                        }
                        value={
                          relationship.companyRelationshipId
                        }
                      >
                        {relationship.collegeName}
                      </option>
                    ),
                  )}
                </Select>

                <label className="mb-[6px] mt-[var(--lms-space-3)] block text-[var(--lms-font-sm)] font-semibold text-[var(--lms-neutral-400)] leading-4">
                 Until (optional)
                 <Input type="date" value={validUntil} onChange={event=>{setValidUntil(event.target.value);setExpiryError("");}}
                  className="mt-1 min-h-11 w-full md:min-h-9"/>
                 {expiryError?<span role="alert" className="mt-[var(--lms-space-2)] block text-[12px] leading-5 text-[var(--lms-error)]">{expiryError}</span>:null}
                 <span className="mt-[var(--lms-space-2)] block text-[13px] font-normal leading-5 text-[var(--lms-muted-text)]">If blank, access expires in three months by current vNext policy, unlike the legacy unlimited grant. A chosen date expires at 11:59:59 PM IST. Expired or unverified grants cannot authorize recruiter actions.</span>
                </label>
                {optionsLoading ? (
                  <p
                    role="status"
                    className="mt-2 text-xs text-muted-foreground"
                  >
                    Loading available relationships…
                  </p>
                ) : null}

                {optionsError ? (
                  <div className="mt-2 space-y-2" role="alert">
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
                      Retry
                    </Button>
                  </div>
                ) : null}

                {!optionsLoading &&
                !optionsError &&
                eligibleRelationships.length === 0 ? (
                  <p className="mt-2 text-xs text-muted-foreground">
                    No additional eligible college
                    relationships are available.
                  </p>
                ) : null}

                <Button
                  className="mt-[var(--lms-space-3)] min-h-11 w-full md:min-h-9 md:w-auto"
                  disabled={
                    pending ||
                    optionsLoading ||
                    !selectedRelationshipId ||
                    !eligibleRelationships.some(
                      (relationship) =>
                        relationship.companyRelationshipId ===
                        selectedRelationshipId,
                    )
                  }
                  onClick={() => {
                    void grant();
                  }}
                >
                  {pending ? "Working…" : "Give access"}
                </Button>
              </div>
            ) : (
              <p className="mt-4 text-xs leading-5 text-muted-foreground">
                This recruiter is not active. Restore
                the account where permitted before
                granting additional access.
              </p>
            )}
          </section>

          <section className="border-b border-border pb-5">
            <h3 className="m-0 text-base font-semibold text-foreground">
              Account security
            </h3>
            <p className="mt-2 text-sm leading-6 text-body">
              Terminating sessions signs this canonical
              user out from every device. It also affects
              sessions used for other memberships and
              does not delete the recruiter account.
            </p>
            {!account.accountManageable?<p role="status" className="mt-2 text-sm text-warning">Account-wide actions are unavailable: this recruiter has active access grants beyond your selected college or organization.</p>:null}
            <Button
              className="mt-[var(--lms-space-4)] min-h-11 w-full sm:w-auto md:min-h-9"
              variant="danger"
              disabled={pending||!account.accountManageable}
              onClick={() =>
                onTerminateRequest(account)
              }
            >
              Terminate all sessions
            </Button>
          </section>


        </div>
      )}
    </Drawer>
  );
}
