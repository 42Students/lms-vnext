"use client";

import { formatDateTimeIst } from "@/lib/format-date";
import {
  useRef,
  useState,
  useTransition,
} from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Input } from "@/components/ui/input";
import { StatusBadge } from "@/components/ui/status-badge";
import { EmptyState } from "@/components/ui/empty-state";
import { Disclosure } from "@/components/ui/disclosure";
import { Dropdown } from "@/components/ui/dropdown";
import { useToast } from "@/components/ui/toast";
import { describePrimaryDomainSwitch, canConfirmPrimaryDomainDelete } from "@/modules/tenant-domains/admin-confirmation-model";

export type TenantDomainClientRow = {
  id: string;
  host: string;
  isPrimary: boolean;
  isVerified: boolean;
  verificationToken: string | null;
  verifiedAt: string | null;
  lastCheckedAt: string | null;
  lastCheckResult: string | null;
};

function dnsName(host: string) {
  return `_lms-vnext.${host}`;
}

function dnsValue(token: string) {
  return `lms-vnext-verification=${token}`;
}

function formatCheckedAt(value: string | null) {
  if (!value) return "Never checked";
  return formatDateTimeIst(value);
}

export function TenantDomainManager({
  collegeId,
  domains,
}: {
  collegeId: string;
  domains: readonly TenantDomainClientRow[];
}) {
  const router = useRouter();
  const { showToast } = useToast();
  const createInFlightRef = useRef(false);
  const actionInFlightRef = useRef(false);
  const [modalError, setModalError] = useState("");
  const [host, setHost] = useState("");
  const [deleteHostConfirmation, setDeleteHostConfirmation] = useState("");
  const [primaryTarget, setPrimaryTarget] = useState<TenantDomainClientRow | null>(null);
  const [editTarget,setEditTarget]=useState<TenantDomainClientRow|null>(null);
  const [editedHost,setEditedHost]=useState("");
  const [deleteTarget, setDeleteTarget] =
    useState<TenantDomainClientRow | null>(null);
  const [pendingAction, setPendingAction] =
    useState<string | null>(null);
  const [creating, startCreate] = useTransition();

  function createDomain() {
    if (createInFlightRef.current || !host.trim()) return;
    createInFlightRef.current = true;
    startCreate(async () => {
      try {
      const response = await fetch("/api/tenant-domains", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          collegeId,
          host,
        }),
      });
      const payload = await response.json().catch(() => null);

      if (!response.ok) {
        showToast({
          tone: "error",
          title: "Domain could not be added",
          description:
            payload?.error === "HOST_CONFLICT"
              ? "That hostname is already assigned to another college."
              : "Enter a valid fully-qualified hostname and try again.",
        });
        return;
      }

      setHost("");
      showToast({
        tone: "success",
        title: "Domain added",
        description:
          "Publish the displayed TXT record, then verify the domain.",
      });
      router.refresh();
      } catch {
        showToast({
          tone: "error",
          title: "Domain could not be added",
          description: "The domain action could not be completed.",
        });
      } finally {
        createInFlightRef.current = false;
      }
    });
  }

  async function runAction(
    domain: TenantDomainClientRow,
    action: "verify" | "primary" | "delete" | "edit",
  ) {
    if (actionInFlightRef.current) return;
    actionInFlightRef.current = true;
    const key = `${domain.id}:${action}`;
    setModalError("");
    setPendingAction(key);

    try {
      const request =
        action === "verify"
          ? fetch(
              `/api/tenant-domains/${domain.id}/verify`,
              { method: "POST" },
            )
          : action === "primary"
            ? fetch(
                `/api/tenant-domains/${domain.id}`,
                {
                  method: "PATCH",
                  headers: {"content-type": "application/json"},
                  body: JSON.stringify({action:"SET_PRIMARY"}),
                },
              )
            : action==="edit"
              ? fetch(`/api/tenant-domains/${domain.id}`,{
                  method:"PATCH",headers:{"content-type":"application/json"},
                  body:JSON.stringify({
                    action:"EDIT_HOST",expectedHost:domain.host,host:editedHost.trim(),
                  }),
                })
              : fetch(
                `/api/tenant-domains/${domain.id}`,
                { method: "DELETE", headers: { "content-type": "application/json" },
                  body: JSON.stringify({ ...(domain.isPrimary ? { confirmationHost: deleteHostConfirmation } : {}) }) },
              );

      const response = await request;
      const payload = await response.json().catch(() => null);

      if (!response.ok) {
        const failure = payload?.error === "DOMAIN_NOT_VERIFIED"
          ? "Only a verified domain can become primary."
          : payload?.error === "PRIMARY_HOST_CONFIRMATION_REQUIRED"
            ? "The primary hostname confirmation is missing or stale. Reload and confirm the current primary address."
            : payload?.error==="DOMAIN_HOST_STALE"
              ? "This domain changed in another session. Refresh its hostname before editing."
              : payload?.error==="HOST_CONFLICT"
                ? "This hostname is already claimed by another active college."
                : payload?.error==="MANAGED_HOST_EDIT_UNSUPPORTED"
                  ? "Manage wildcard college addresses in the dedicated managed subdomain section."
                  : "The domain action could not be completed.";
        if (action !== "verify") setModalError(failure);
        showToast({
          tone: "error",
          title: action === "verify" ? "Verification failed"
            : action === "primary" ? "Primary domain not changed"
            : action === "edit" ? "Domain not changed" : "Domain not deleted",
          description: failure,
        });
        return;
      }

      if (action === "delete") {
        setDeleteTarget(null);
        setDeleteHostConfirmation("");
      }
      if (action === "primary") {
        setPrimaryTarget(null);
      }
      if(action==="edit"){
        setEditTarget(null);
        setEditedHost("");
      }

      showToast({
        tone: "success",
        title:
          action === "verify"
            ? payload?.domain?.isVerified
              ? "Domain verified"
              : "DNS record not found yet"
            : action === "primary"
              ? "Primary domain updated"
              : action === "edit"
                ? "Domain changed · verify DNS"
                : "Domain deleted",
        description:
          action === "verify" &&
          !payload?.domain?.isVerified
            ? "The latest DNS check was recorded. Confirm the TXT record and try again."
            : undefined,
      });

      router.refresh();
    } catch {
      if (action !== "verify") setModalError("The domain action could not be completed.");
      showToast({
        tone: "error",
        title: action === "verify" ? "Verification failed" :
          action === "primary" ? "Primary domain not changed" :
          action === "edit" ? "Domain not changed" : "Domain not deleted",
        description: "The domain action could not be completed.",
      });
    } finally {
      actionInFlightRef.current = false;
      setPendingAction(null);
    }
  }

  return (
    <div className="min-w-0 space-y-[var(--lms-space-4)]">
      <section className="min-w-0 print:hidden">
        <form onSubmit={(event) => { event.preventDefault(); if (!creating && host.trim()) createDomain(); }}
          className="grid min-w-0 max-w-[920px] gap-[var(--lms-space-3)] md:grid-cols-[minmax(0,1fr)_auto] md:items-end">
          <div>
            <label
              htmlFor="tenant-domain-host"
              className="mb-[6px] block text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]"
            >
              College hostname
            </label>
            <Input
              id="tenant-domain-host"
              className="min-h-11 w-full md:min-h-9"
              value={host}
              onChange={(event) => setHost(event.target.value)}
              placeholder="lms.college.edu"
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
            />
            <p className="mt-[var(--lms-space-2)] max-w-[65ch] text-xs leading-5 text-muted-foreground">
              Enter only the hostname. Do not include
              https://, paths, ports, or credentials.
            </p>
          </div>
          <Button
            type="submit"
            className="min-h-11 w-full justify-center md:min-h-9 md:w-auto"
            loading={creating}
            disabled={creating || !host.trim()}
          >
            {creating ? "Adding…" : "Add domain"}
          </Button>
        </form>
      </section>

      {domains.length === 0 ? (
        <div className="border-t border-border pt-4">
          <EmptyState title="No tenant domains configured"
           description="Add a college hostname above. It will not route tenant traffic until DNS ownership is verified."/>
        </div>
      ) : (
        <div className="space-y-4">
          {domains.map((domain) => {
            const verificationKey =
              `${domain.id}:verify`;
            const primaryKey =
              `${domain.id}:primary`;
            const deleteKey =
              `${domain.id}:delete`;
            const busy = Boolean(pendingAction);

            return (
              <section
                key={domain.id}
                className="min-w-0 border-t border-[var(--lms-canvas-border)] pt-[var(--lms-space-4)]"
              >
                <div className="flex min-w-0 flex-col items-start gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="m-0 min-w-0 break-words text-base font-semibold text-foreground [overflow-wrap:anywhere]">
                        {domain.host}
                      </h2>
                      <StatusBadge
                        tone={
                          domain.isVerified
                            ? "success"
                            : "warning"
                        }
                      >
                        {domain.isVerified
                          ? "Verified"
                          : "Unverified"}
                      </StatusBadge>
                      {domain.isPrimary ? (
                        <StatusBadge tone="info">
                          Primary
                        </StatusBadge>
                      ) : null}
                    </div>
                    <p className="mt-2 text-xs text-muted-foreground">
                      Last DNS check:{" "}
                      {formatCheckedAt(domain.lastCheckedAt)}
                      {domain.lastCheckResult
                        ? ` · ${domain.lastCheckResult}`
                        : ""}
                    </p>
                    {domain.lastCheckResult==="TXT_RECORD_MISSING"?<p className="mt-1 text-xs text-warning-text">
                      Required ownership TXT was not found. Check the record name and value below, then verify again.
                    </p>:domain.lastCheckResult==="DNS_LOOKUP_FAILED"?<p className="mt-1 text-xs text-warning-text">
                      DNS lookup failed. Check propagation and try another verification. Raw TXT values and challenge secrets are never shown in diagnostics.
                    </p>:null}
                  </div>

                  <div className="flex min-w-0 w-full flex-col items-stretch gap-[var(--lms-space-2)] print:hidden sm:w-auto sm:flex-row sm:flex-wrap md:justify-end">
                    {!domain.isVerified ? (
                      <Button
                        variant="secondary"
                        size="sm"
                        className="min-h-11 w-full sm:w-auto md:min-h-9"
                        disabled={busy}
                        onClick={() =>
                          void runAction(
                            domain,
                            "verify",
                          )
                        }
                      >
                        {pendingAction === verificationKey
                          ? "Checking…"
                          : "Verify DNS"}
                      </Button>
                    ) : null}
                    {domain.isVerified &&
                    !domain.isPrimary ? (
                      <Button
                        variant="secondary"
                        size="sm"
                        className="min-h-11 w-full sm:w-auto md:min-h-9"
                        disabled={busy}
                        onClick={() => { setModalError(""); setPrimaryTarget(domain); }}
                      >
                        {pendingAction === primaryKey
                          ? "Updating…"
                          : "Make primary"}
                      </Button>
                    ) : null}
                    <Dropdown trigger="More" label="Domain actions" align="end" mobileSheet triggerClassName="md:!min-h-9">
                    <Button role="menuitem" variant="secondary" size="sm"
                      className="min-h-11 w-full sm:w-auto md:min-h-9"
                      disabled={busy}
                      onClick={()=>{setModalError("");setEditedHost(domain.host);setEditTarget(domain);}}>
                      {pendingAction===`${domain.id}:edit`?"Updating…":"Edit hostname"}
                    </Button>
                    <Button role="menuitem"
                      variant="danger"
                      size="sm"
                      className="min-h-11 w-full sm:w-auto md:min-h-9"
                      disabled={busy}
                      onClick={() => { setModalError(""); setDeleteTarget(domain); }}
                    >
                      {pendingAction === deleteKey
                        ? "Deleting…"
                        : "Delete"}
                    </Button>
                    </Dropdown>
                  </div>
                </div>

                {!domain.isVerified &&
                domain.verificationToken ? (
                  <Disclosure ariaLabel="DNS ownership record" defaultOpen={domains.length === 1} title={<h3 className="m-0 text-sm font-semibold text-foreground">DNS ownership record</h3>} className="mt-[var(--lms-space-4)] print:hidden" contentClassName="pt-[var(--lms-space-2)] pb-[var(--lms-space-4)]">
                    <p className="text-xs leading-5 text-body">
                      Publish this TXT record with your DNS
                      provider. Verification requires an exact
                      match. If upgrading from the old LMS, keep the old DNS TXT
                      record until this new challenge verifies; the old root
                      record cannot validate the vNext host.
                    </p>
                    <dl className="mt-4 grid gap-3">
                      <div>
                        <dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                          Type
                        </dt>
                        <dd className="mt-1 font-mono text-sm text-foreground">
                          TXT
                        </dd>
                      </div>
                      <div>
                        <dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                          Name
                        </dt>
                        <dd className="mt-1 break-words [overflow-wrap:anywhere] rounded-[var(--lms-control-radius)] border border-border bg-surface px-3 py-2 font-mono text-sm text-foreground">
                          {dnsName(domain.host)}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                          Value
                        </dt>
                        <dd className="mt-1 break-words [overflow-wrap:anywhere] rounded-[var(--lms-control-radius)] border border-border bg-surface px-3 py-2 font-mono text-sm text-foreground">
                          {dnsValue(
                            domain.verificationToken,
                          )}
                        </dd>
                      </div>
                    </dl>
                  </Disclosure>
                ) : null}
              </section>
            );
          })}
        </div>
      )}

      <ConfirmDialog
        open={Boolean(primaryTarget)}
        onOpenChange={(open) => { if (!open && !pendingAction) { setPrimaryTarget(null); setModalError(""); } }}
        title={primaryTarget ? `Make ${primaryTarget.host} the primary address?` : "Change primary address?"}
        description={primaryTarget ? describePrimaryDomainSwitch(
          domains.find(domain => domain.isPrimary)?.host ?? null,
          primaryTarget.host,
        ) : undefined}
        confirmLabel="Confirm primary address"
        confirmVariant="primary"
        pending={Boolean(pendingAction)}
        onConfirm={() => { if (primaryTarget) void runAction(primaryTarget, "primary"); }}
      >
        {modalError ? <p role="alert" className="break-words rounded-[8px] border border-[rgba(239,68,68,0.25)] bg-[var(--lms-error-subtle)] px-[var(--lms-space-4)] py-[var(--lms-space-3)] text-[14px] leading-5 text-[var(--lms-error-text)]">{modalError}</p> : null}
      </ConfirmDialog>

      <ConfirmDialog
        open={Boolean(editTarget)}
        onOpenChange={next=>{if(!next&&!pendingAction){setEditTarget(null);setEditedHost("");setModalError("");}}}
        title={editTarget?`Change ${editTarget.host}?`:"Edit college hostname"}
        description="Changing a hostname immediately removes its verified and primary states. It will not route college logins again until the new DNS ownership TXT record is published and verified. Use the separate managed-subdomain workflow for wildcard addresses."
        confirmLabel="Change hostname"
        confirmVariant="danger"
        confirmDisabled={!editedHost.trim()||editedHost.trim().toLowerCase()===editTarget?.host.toLowerCase()}
        pending={Boolean(pendingAction)}
        onConfirm={()=>{if(editTarget)void runAction(editTarget,"edit");}}
      >
        <label className="grid min-w-0 gap-2 text-[13px] font-semibold text-body">
          Replacement hostname
          <Input value={editedHost} autoComplete="off" autoCapitalize="none"
            autoCorrect="off" spellCheck={false} maxLength={255}
            disabled={Boolean(pendingAction)}
            onChange={event=>{setEditedHost(event.target.value);setModalError("");}}
            className="min-h-11 w-full md:min-h-9" />
        </label>
        {modalError?<p role="alert" className="mt-2 text-sm text-error">{modalError}</p>:null}
      </ConfirmDialog>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => {
          if (!open && !pendingAction) { setDeleteTarget(null); setDeleteHostConfirmation(""); setModalError(""); }
        }}
        title={
          deleteTarget
            ? `Delete ${deleteTarget.host}?`
            : "Delete domain?"
        }
        description={deleteTarget?.isPrimary ? "Deleting the PRIMARY tenant host can make college login unreachable. Enter its exact hostname to confirm. DNS is not edited." : "Deleting a tenant-domain mapping stops it from resolving this college. DNS records are not changed automatically."}
        confirmDisabled={Boolean(deleteTarget?.isPrimary && !canConfirmPrimaryDomainDelete(deleteTarget.host, deleteHostConfirmation))}
        confirmLabel="Delete domain"
        pending={
          deleteTarget
            ? pendingAction ===
              `${deleteTarget.id}:delete`
            : false
        }
        onConfirm={() => {
          if (deleteTarget && (!deleteTarget.isPrimary || canConfirmPrimaryDomainDelete(deleteTarget.host, deleteHostConfirmation))) {
            void runAction(deleteTarget, "delete");
          }
        }}
      >
        {deleteTarget?.isPrimary ? <label className="grid min-w-0 gap-2 text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Type the full primary hostname
          <Input type="text" autoComplete="off" spellCheck={false} value={deleteHostConfirmation}
            disabled={Boolean(pendingAction)} onChange={event => setDeleteHostConfirmation(event.target.value)}
            className="min-h-11 w-full md:min-h-9" />
        </label> : null}
        {modalError ? <p role="alert" className="mt-[var(--lms-space-2)] break-words rounded-[8px] border border-[rgba(239,68,68,0.25)] bg-[var(--lms-error-subtle)] px-[var(--lms-space-4)] py-[var(--lms-space-3)] text-[14px] leading-5 text-[var(--lms-error-text)]">{modalError}</p> : null}
      </ConfirmDialog>
    </div>
  );
}
