"use client";

import { useId, useState } from "react";
import { Button } from "@/components/ui/button";
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


/** Wall-clock read kept out of render bodies (React purity rule). */
function currentTimeMs(){return Date.now();}

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
        <>
          {account ? (
            <Button
              variant="secondary"
              disabled={pending||!account.accountManageable}
              onClick={() => onEdit(account)}
            >
              Edit account
            </Button>
          ) : null}
          <Button
            variant="secondary"
            disabled={pending}
            onClick={onClose}
          >
            Close
          </Button>
        </>
      }
    >
      {loading ? (
        <LoadingState label="Loading recruiter details…" />
      ) : error ? (
        <ErrorState
          title="Could not load recruiter"
          description={error}
          action={
            <Button
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
        <div className="space-y-6">
          <section className="rounded-xl border border-border bg-surface p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h3 className="m-0 text-base font-semibold text-foreground">
                  {hrDisplayName(account)}
                </h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  {account.title || "No job title"}
                </p>
              </div>
              <StatusBadge
                tone={hrStatusTone(account.status)}
              >
                {account.status}
              </StatusBadge>
            </div>

            <dl className="mt-4 grid gap-4 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-xs font-semibold text-muted-foreground">
                  Mobile
                </dt>
                <dd className="mt-1 break-all text-body">
                  {account.phoneE164 || "Not provided"}
                </dd>
              </div>

              <div>
                <dt className="text-xs font-semibold text-muted-foreground">
                  Email
                </dt>
                <dd className="mt-1 break-all text-body">
                  {account.email || "Not provided"}
                </dd>
              </div>

              <div className="sm:col-span-2">
                <dt className="text-xs font-semibold text-muted-foreground">
                  Company
                </dt>
                <dd className="mt-1 text-body">
                  {account.companyName}
                </dd>
              </div>
            </dl>
          </section>

          <section className="rounded-xl border border-border bg-surface p-5">
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
              <p className="mt-4 rounded-lg bg-muted p-4 text-sm text-muted-foreground">
                No colleges yet.
              </p>
            ) : (
              <ul className="mt-4 space-y-3">
                {account.grants.map((grant) => (
                  <li
                    key={grant.id}
                    className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border px-3 py-3"
                  >
                    <div className="min-w-0">
                      <p className="m-0 font-semibold text-foreground">
                        {grant.collegeName}
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {grant.validUntil ? `Until ${new Date(grant.validUntil).toLocaleDateString("en-IN",{timeZone:"Asia/Kolkata"})}`:"Expiry not recorded"}
                        {" · "}{grant.validUntil && Date.parse(grant.validUntil)<=currentTimeMs()?"Expired":grant.verificationStatus}
                      </p>
                    </div>
                    <Button
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
              <div className="mt-5 border-t border-border pt-4">
                <h4 className="m-0 text-sm font-semibold text-foreground">
                  Add a college
                </h4>
                <p className="mt-1 text-xs leading-5 text-muted-foreground">
                  Only active relationships for{" "}
                  {account.companyName} are eligible.
                </p>

                <label
                  htmlFor={`${id}-grant`}
                  className="mb-1.5 mt-3 block text-xs font-semibold text-body"
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

                <label className="mb-1.5 mt-3 block text-xs font-semibold text-body">
                 Until (optional)
                 <input type="date" value={validUntil} onChange={event=>{setValidUntil(event.target.value);setExpiryError("");}}
                  className="mt-1 block min-h-11 w-full rounded-md border border-border bg-surface px-3 text-foreground"/>
                 {expiryError?<span role="alert" className="mt-1 block text-error">{expiryError}</span>:null}
                 <span className="mt-1 block font-normal text-muted-foreground">If blank, access expires in three months. An expired or unverified grant cannot authorize recruiter actions.</span>
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
                  <div className="mt-2 space-y-2">
                    <p
                      role="alert"
                      className="text-sm text-error"
                    >
                      {optionsError}
                    </p>
                    <Button
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
                  className="mt-3"
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
                  {pending ? "Working…" : "Grant access"}
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

          {account.grantHistory?.length ? <section aria-label="College grant history" className="rounded-xl border border-border bg-surface p-5">
            <h3 className="font-semibold">College access history</h3>
            <ul className="mt-3 space-y-2 text-sm">{account.grantHistory.map(grant=><li key={grant.id} className="flex flex-wrap justify-between gap-2 border-b border-border pb-2">
              <span>{grant.collegeName}</span>
              <span>{grant.status==="REVOKED"?"Revoked":grant.validUntil&&Date.parse(grant.validUntil)<=currentTimeMs()?"Expired":"Active"}
               {" · "}{grant.validUntil?"Until "+grant.validUntil.slice(0,10):"No recorded expiry"}</span>
            </li>)}</ul>
          </section>:null}
          <section className="rounded-xl border border-border bg-surface p-5">
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
              className="mt-4"
              variant="danger"
              disabled={pending||!account.accountManageable}
              onClick={() =>
                onTerminateRequest(account)
              }
            >
              Terminate all sessions
            </Button>
          </section>

          {actionError ? (
            <ErrorState
              title="Action failed"
              description={actionError}
            />
          ) : null}
        </div>
      )}
    </Drawer>
  );
}
