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
        <LoadingState label="Loading recruiter details…" />
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
            Use Retry in Add a college to reload the options.
          </p>:null}
          {actionError?<ErrorState title="Action failed" description={actionError}/>:null}
          <section className="min-w-0 border-b border-border pb-[var(--lms-space-4)]">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                
                <p className="mt-1 text-sm text-muted-foreground">
                  {account.title || "No job title"}
                </p>
              </div>
              <StatusBadge
                tone={hrStatusTone(account.status)}
              >
                {account.status === "ARCHIVED" ? "Suspended" : account.status === "ACTIVE" ? "Active" : "Disabled"}
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
                  {account.grants.length} active grant
                  {account.grants.length === 1 ? "" : "s"}{" "}
                  visible in the current admin scope.
                </p>
              </div>
            </div>

            {account.grants.length === 0 ? (
              <p className="mt-4 border-l-2 border-border bg-muted px-4 py-3 text-sm text-muted-foreground">
                No colleges yet.
              </p>
            ) : (
              <ul className="mt-4 space-y-3">
                {account.grants.map((grant) => (
                  <li
                    key={grant.id}
                    className="flex min-w-0 flex-col items-start gap-3 border-b border-border py-3 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="min-w-0">
                      <p className="m-0 min-w-0 break-words [overflow-wrap:anywhere] font-semibold text-foreground">
                        {grant.collegeName}
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {grant.validUntil ? `Until ${new Date(grant.validUntil).toLocaleDateString("en-IN",{timeZone:"Asia/Kolkata"})}`:"Expiry not recorded"}
                        {" · "}{grant.validUntil && Date.parse(grant.validUntil)<=renderNow?"Expired":grant.verificationStatus}
                      </p>
                    </div>
                    <Button className="min-h-11 w-full justify-center sm:w-auto md:min-h-9"
                      variant="secondary"
                      size="sm"
                      disabled={pending}
                      onClick={() =>
                        onRevokeRequest(grant)
                      }
                    >
                      Revoke
                    </Button>
                  </li>
                ))}
              </ul>
            )}

            {account.status === "ACTIVE" ? (
              <details open className="group mt-[var(--lms-space-4)] border-t border-border pt-[var(--lms-space-4)]">
                <summary className="min-h-11 cursor-pointer text-sm font-semibold text-foreground focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)]">Add a college</summary>
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
                  {pending ? "Working…" : validUntil ? "Grant until selected date" : "Grant 3-month access"}
                </Button>
              </details>
            ) : (
              <p className="mt-4 text-xs leading-5 text-muted-foreground">
                This recruiter is not active. Restore
                the account where permitted before
                granting additional access.
              </p>
            )}
          </section>

          {account.grantHistory?.length ? <section aria-label="College grant history" className="border-b border-border pb-5">
            <h3 className="font-semibold">College access history</h3>
            <ul className="mt-3 space-y-2 text-sm">{account.grantHistory.map(grant=><li key={grant.id} className="flex flex-wrap justify-between gap-2 border-b border-border pb-2">
              <span>{grant.collegeName}</span>
              <span>{grant.status==="REVOKED"?"Revoked":grant.validUntil&&Date.parse(grant.validUntil)<=renderNow?"Expired":"Active"}
               {" · "}{grant.validUntil?"Until "+grant.validUntil.slice(0,10):"No recorded expiry"}</span>
            </li>)}</ul>
          </section>:null}
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
