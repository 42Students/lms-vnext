"use client";

import { formatDateTimeIst } from "@/lib/format-date";
import {
  useState,
  useTransition,
} from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Input } from "@/components/ui/input";
import { StatusBadge } from "@/components/ui/status-badge";
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
  const [host, setHost] = useState("");
  const [deleteHostConfirmation, setDeleteHostConfirmation] = useState("");
  const [primaryTarget, setPrimaryTarget] = useState<TenantDomainClientRow | null>(null);
  const [deleteTarget, setDeleteTarget] =
    useState<TenantDomainClientRow | null>(null);
  const [pendingAction, setPendingAction] =
    useState<string | null>(null);
  const [creating, startCreate] = useTransition();

  function createDomain() {
    startCreate(async () => {
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
    });
  }

  async function runAction(
    domain: TenantDomainClientRow,
    action: "verify" | "primary" | "delete",
  ) {
    const key = `${domain.id}:${action}`;
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
                  headers: {
                    "content-type": "application/json",
                  },
                  body: JSON.stringify({
                    action: "SET_PRIMARY",
                  }),
                },
              )
            : fetch(
                `/api/tenant-domains/${domain.id}`,
                { method: "DELETE", headers: { "content-type": "application/json" },
                  body: JSON.stringify({ ...(domain.isPrimary ? { confirmationHost: deleteHostConfirmation } : {}) }) },
              );

      const response = await request;
      const payload = await response.json().catch(() => null);

      if (!response.ok) {
        showToast({
          tone: "error",
          title:
            action === "verify"
              ? "Verification failed"
              : action === "primary"
                ? "Primary domain not changed"
                : "Domain not deleted",
          description:
            payload?.error === "DOMAIN_NOT_VERIFIED"
              ? "Only a verified domain can become primary."
              : payload?.error === "PRIMARY_HOST_CONFIRMATION_REQUIRED"
                ? "The primary hostname confirmation is missing or stale. Reload and confirm the current primary address."
              : "The domain action could not be completed.",
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

      showToast({
        tone: "success",
        title:
          action === "verify"
            ? payload?.domain?.isVerified
              ? "Domain verified"
              : "DNS record not found yet"
            : action === "primary"
              ? "Primary domain updated"
              : "Domain deleted",
        description:
          action === "verify" &&
          !payload?.domain?.isVerified
            ? "The latest DNS check was recorded. Confirm the TXT record and try again."
            : undefined,
      });

      router.refresh();
    } finally {
      setPendingAction(null);
    }
  }

  return (
    <div className="space-y-5">
      <section className="border-t border-border pt-5">
        <div className="grid gap-3 md:grid-cols-[1fr_auto] md:items-end">
          <div>
            <label
              htmlFor="tenant-domain-host"
              className="mb-1.5 block text-xs font-semibold text-body"
            >
              College hostname
            </label>
            <Input
              id="tenant-domain-host"
              value={host}
              onChange={(event) => setHost(event.target.value)}
              placeholder="lms.college.edu"
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
            />
            <p className="mt-2 text-xs leading-5 text-muted-foreground">
              Enter only the hostname. Do not include
              https://, paths, ports, or credentials.
            </p>
          </div>
          <Button
            disabled={creating || !host.trim()}
            onClick={createDomain}
          >
            {creating ? "Adding…" : "Add domain"}
          </Button>
        </div>
      </section>

      {domains.length === 0 ? (
        <section className="border-t border-border pt-6">
          <p className="m-0 text-sm font-semibold text-foreground">
            No tenant domains configured
          </p>
          <p className="mt-2 text-sm leading-6 text-body">
            Add a college hostname above. It will not route
            tenant traffic until DNS ownership is verified.
          </p>
        </section>
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
                className="border-t border-border pt-5"
              >
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="m-0 break-all text-base font-semibold text-foreground">
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
                  </div>

                  <div className="flex flex-wrap justify-end gap-2">
                    {!domain.isVerified ? (
                      <Button
                        variant="secondary"
                        size="sm"
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
                        disabled={busy}
                        onClick={() => setPrimaryTarget(domain)}
                      >
                        {pendingAction === primaryKey
                          ? "Updating…"
                          : "Make primary"}
                      </Button>
                    ) : null}
                    <Button
                      variant="ghost"
                      size="sm"
                      disabled={busy}
                      onClick={() =>
                        setDeleteTarget(domain)
                      }
                    >
                      {pendingAction === deleteKey
                        ? "Deleting…"
                        : "Delete"}
                    </Button>
                  </div>
                </div>

                {!domain.isVerified &&
                domain.verificationToken ? (
                  <div className="mt-5 rounded-[var(--lms-canvas-radius,12px)] border border-border bg-muted p-4">
                    <p className="m-0 text-sm font-semibold text-foreground">
                      DNS ownership record
                    </p>
                    <p className="mt-2 text-xs leading-5 text-body">
                      Publish this TXT record with your DNS
                      provider. Verification requires an exact
                      match.
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
                        <dd className="mt-1 break-all rounded-[var(--lms-control-radius,9px)] border border-border bg-surface px-3 py-2 font-mono text-sm text-foreground">
                          {dnsName(domain.host)}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                          Value
                        </dt>
                        <dd className="mt-1 break-all rounded-[var(--lms-control-radius,9px)] border border-border bg-surface px-3 py-2 font-mono text-sm text-foreground">
                          {dnsValue(
                            domain.verificationToken,
                          )}
                        </dd>
                      </div>
                    </dl>
                  </div>
                ) : null}
              </section>
            );
          })}
        </div>
      )}

      <ConfirmDialog
        open={Boolean(primaryTarget)}
        onOpenChange={(open) => { if (!open) setPrimaryTarget(null); }}
        title={primaryTarget ? `Make ${primaryTarget.host} the primary address?` : "Change primary address?"}
        description={primaryTarget ? describePrimaryDomainSwitch(
          domains.find(domain => domain.isPrimary)?.host ?? null,
          primaryTarget.host,
        ) : undefined}
        confirmLabel="Confirm primary address"
        confirmVariant="primary"
        pending={Boolean(pendingAction)}
        onConfirm={() => { if (primaryTarget) void runAction(primaryTarget, "primary"); }}
      />

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => {
          if (!open) { setDeleteTarget(null); setDeleteHostConfirmation(""); }
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
        {deleteTarget?.isPrimary ? <label className="grid gap-2 text-sm font-semibold text-body">Type the full primary hostname
          <Input type="text" autoComplete="off" spellCheck={false} value={deleteHostConfirmation}
            onChange={event => setDeleteHostConfirmation(event.target.value)}
            className="w-full" />
        </label> : null}
      </ConfirmDialog>
    </div>
  );
}
