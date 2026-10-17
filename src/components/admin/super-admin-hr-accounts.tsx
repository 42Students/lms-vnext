"use client";

import {
  useRef,
  useState,
} from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import {
  DataTable,
  type DataTableColumn,
} from "@/components/ui/data-table";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/ui/page-header";
import { Select } from "@/components/ui/select";
import { StatusBadge } from "@/components/ui/status-badge";
import { useToast } from "@/components/ui/toast";
import { SuperAdminHrAccountDialog } from "./super-admin-hr-account-dialog";
import { SuperAdminHrDetailDrawer } from "./super-admin-hr-detail-drawer";
import type {
  HrAccount,
  HrAccountFormValues,
  HrCollegeOption,
  HrAccountsPageData,
  HrGrant,
  HrListFilters,
  HrRelationshipOption,
} from "./super-admin-hr-types";
import {
  hrApiErrorMessage,
  hrDisplayName,
  hrStatusTone,
} from "./super-admin-hr-types";

type DialogState =
  | { kind: "create" }
  | { kind: "edit"; account: HrAccount }
  | null;

type Confirmation =
  | {
      kind: "revoke";
      userId: string;
      grant: HrGrant;
    }
  | {
      kind: "terminate";
      userId: string;
      name: string;
    }
  | null;

async function requestJson<T>(
  url: string,
  method: "GET" | "POST" | "PATCH" | "DELETE" = "GET",
  body?: unknown,
): Promise<T> {
  let response: Response;

  try {
    response = await fetch(url, {
      method,
      cache: "no-store",
      ...(body === undefined
        ? {}
        : {
            headers: {
              "content-type": "application/json",
            },
            body: JSON.stringify(body),
          }),
    });
  } catch {
    throw new Error(
      "Could not connect to the server. Check your connection and retry.",
    );
  }

  const payload: unknown = await response
    .json()
    .catch(() => null);

  if (!response.ok) {
    throw new Error(
      hrApiErrorMessage(
        payload,
        response.status,
      ),
    );
  }

  return payload as T;
}

function errorText(error: unknown) {
  return error instanceof Error
    ? error.message
    : "The operation failed. Please retry.";
}

function pageHref(
  filters: HrListFilters,
  page: number,
) {
  const params = new URLSearchParams();

  if (filters.q) {
    params.set("q", filters.q);
  }
  if (filters.status) {
    params.set("status", filters.status);
  }
  if (filters.pageSize !== 25) {
    params.set(
      "pageSize",
      String(filters.pageSize),
    );
  }
  if (page > 1) {
    params.set("page", String(page));
  }

  const query = params.toString();

  return query
    ? `/admin/recruiters?${query}`
    : "/admin/recruiters";
}

export function SuperAdminHrAccounts({
  list,
  filters,
  loadError,
  statusSummary,
  scopeDescription,
}: {
  list: HrAccountsPageData | null;
  statusSummary: {accounts:number;active:number;archived:number;disabled:number};
  scopeDescription:string;
  filters: HrListFilters;
  loadError: string | null;
}) {
  const router = useRouter();
  const { showToast } = useToast();

  const [dialog, setDialog] =
    useState<DialogState>(null);
  const [formError, setFormError] =
    useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [selectedUserId, setSelectedUserId] =
    useState<string | null>(null);
  const [detail, setDetail] =
    useState<HrAccount | null>(null);
  const [detailLoading, setDetailLoading] =
    useState(false);
  const [detailError, setDetailError] =
    useState<string | null>(null);
  const [actionError, setActionError] =
    useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [confirmation, setConfirmation] =
    useState<Confirmation>(null);

  const [relationships, setRelationships] =
    useState<HrRelationshipOption[]>([]);
  const [colleges,setColleges]=useState<HrCollegeOption[]>([]);
  const [optionsLoading, setOptionsLoading] =
    useState(false);
  const [optionsError, setOptionsError] =
    useState<string | null>(null);

  const detailRequestVersion = useRef(0);
  const optionsRequestVersion = useRef(0);

  async function loadRelationships() {
    const version =
      ++optionsRequestVersion.current;

    setOptionsLoading(true);
    setOptionsError(null);
    setRelationships([]);
    setColleges([]);

    try {
      const payload = await requestJson<{
        relationships: HrRelationshipOption[];
        colleges: HrCollegeOption[];
      }>("/api/admin/hr/options");

      if (
        version !== optionsRequestVersion.current
      ) {
        return;
      }

      if (!Array.isArray(payload.relationships)) {
        throw new Error(
          "The server returned an invalid relationship list.",
        );
      }

      setRelationships(payload.relationships);
      setColleges(Array.isArray(payload.colleges)?payload.colleges:[]);
    } catch (error) {
      if (
        version !== optionsRequestVersion.current
      ) {
        return;
      }

      setOptionsError(errorText(error));
    } finally {
      if (
        version === optionsRequestVersion.current
      ) {
        setOptionsLoading(false);
      }
    }
  }

  async function loadDetail(
    userId: string,
  ): Promise<boolean> {
    const version =
      ++detailRequestVersion.current;

    setDetailLoading(true);
    setDetailError(null);
    setDetail(null);

    try {
      const payload = await requestJson<{
        account: HrAccount;
      }>(
        `/api/admin/hr/${encodeURIComponent(userId)}`,
      );

      if (
        version !== detailRequestVersion.current
      ) {
        return false;
      }

      if (
        !payload.account ||
        payload.account.userId !== userId ||
        !Array.isArray(payload.account.grants)
      ) {
        throw new Error(
          "The server returned an invalid recruiter record.",
        );
      }

      setDetail(payload.account);
      return true;
    } catch (error) {
      if (
        version === detailRequestVersion.current
      ) {
        setDetailError(errorText(error));
      }
      return false;
    } finally {
      if (
        version === detailRequestVersion.current
      ) {
        setDetailLoading(false);
      }
    }
  }

  function closeDetail() {
    ++detailRequestVersion.current;
    setSelectedUserId(null);
    setDetail(null);
    setDetailError(null);
    setActionError(null);
  }

  function openDetail(account: HrAccount) {
    setSelectedUserId(account.userId);
    setActionError(null);
    void loadDetail(account.userId);
    void loadRelationships();
  }

  function openCreate() {
    setFormError(null);
    setDialog({ kind: "create" });
    void loadRelationships();
  }

  function openEdit(account: HrAccount) {
    closeDetail();
    setFormError(null);
    setDialog({
      kind: "edit",
      account,
    });
  }

  async function saveAccount(
    values: HrAccountFormValues,
  ) {
    if (!dialog || saving) {
      return;
    }

    setSaving(true);
    setFormError(null);

    try {
      if (dialog.kind === "create") {
        const created = await requestJson<{
          account: HrAccount & {reusedExisting?: boolean};
        }>(
          "/api/admin/hr",
          "POST",
          {
            ...(values.newCompany?{newCompany:values.newCompany}:
              {companyRelationshipId:values.companyRelationshipId,
               companyRelationshipIds:values.companyRelationshipIds}),
            displayName: values.displayName.trim(),
            phoneE164: values.phoneE164.trim(),
            ...(values.email.trim()
              ? {
                  email: values.email.trim(),
                }
              : {}),
            title:
              values.title.trim() || null,
          },
        );

        if (created.account.reusedExisting) {
          openDetail(created.account);
          showToast({
            tone: "success",
            title: "Recruiter account found",
            description: "A recruiter with this mobile already exists. Opening it so you can add colleges.",
          });
        } else {
          showToast({
            tone: "success",
            title: "Recruiter account created",
            description:
              "The recruiter account and first college grant were created.",
          });
        }
      } else {
        const existing = dialog.account;
        const changes: Record<string, unknown> =
          {};

        if (
          values.displayName.trim() !==
          (existing.displayName ?? "")
        ) {
          changes.displayName =
            values.displayName.trim();
        }

        if (
          values.phoneE164.trim() !==
          (existing.phoneE164 ?? "")
        ) {
          if (!values.phoneE164.trim()) {
            throw new Error(
              "Mobile number cannot be cleared here.",
            );
          }
          changes.phoneE164 =
            values.phoneE164.trim();
        }

        if (
          values.email.trim() !==
          (existing.email ?? "")
        ) {
          if (!values.email.trim()) {
            throw new Error(
              "Existing email cannot be cleared here.",
            );
          }
          changes.email = values.email.trim();
        }

        if (
          values.title.trim() !==
          (existing.title ?? "")
        ) {
          changes.title =
            values.title.trim() || null;
        }

        if (
          existing.status !== "DISABLED" &&
          values.status !== existing.status
        ) {
          changes.status = values.status;
        }

        if (Object.keys(changes).length === 0) {
          setDialog(null);
          return;
        }

        await requestJson(
          `/api/admin/hr/${encodeURIComponent(
            existing.userId,
          )}`,
          "PATCH",
          changes,
        );

        showToast({
          tone: "success",
          title: "Recruiter account updated",
          description:
            values.status === "ARCHIVED" &&
            existing.status !== "ARCHIVED"
              ? "The recruiter was suspended, signed out everywhere and retains existing college access."
              : "Account changes were saved.",
        });
      }

      setDialog(null);
      router.refresh();
    } catch (error) {
      setFormError(errorText(error));
    } finally {
      setSaving(false);
    }
  }

  async function quickStatus(account:HrAccount){
    if(!account.accountManageable||pending||account.status==="DISABLED")return;
    const next=account.status==="ACTIVE"?"ARCHIVED":"ACTIVE";
    const question=next==="ARCHIVED"
      ? "Suspend "+hrDisplayName(account)+"? They are signed out everywhere and cannot sign in until reactivated. College access is kept."
      : "Reactivate "+hrDisplayName(account)+"? Their existing college access is kept.";
    if(!window.confirm(question))return;
    setPending(true);setActionError(null);
    try{
      await requestJson("/api/admin/hr/"+encodeURIComponent(account.userId),"PATCH",{status:next});
      showToast({tone:"success",title:next==="ARCHIVED"?"Recruiter suspended":"Recruiter reactivated"});
      router.refresh();
    }catch(error){showToast({tone:"error",title:"Recruiter status update failed",description:errorText(error)});}
    finally{setPending(false);}
  }

  async function grantAccess(
    companyRelationshipId: string,validUntil?:string,
  ): Promise<boolean> {
    if (
      !selectedUserId ||
      pending ||
      !companyRelationshipId
    ) {
      return false;
    }

    setPending(true);
    setActionError(null);

    try {
      await requestJson(
        `/api/admin/hr/${encodeURIComponent(
          selectedUserId,
        )}/grants`,
        "POST",
        { companyRelationshipId,...(validUntil?{validUntil}:{}) },
      );

      showToast({
        tone: "success",
        title: "College access given",
      });

      await loadDetail(selectedUserId);
      router.refresh();
      return true;
    } catch (error) {
      setActionError(errorText(error));
      return false;
    } finally {
      setPending(false);
    }
  }

  async function confirmAction() {
    if (!confirmation || pending) {
      return;
    }

    const target = confirmation;
    setPending(true);
    setActionError(null);

    try {
      if (target.kind === "revoke") {
        await requestJson(
          `/api/admin/hr/${encodeURIComponent(
            target.userId,
          )}/grants/${encodeURIComponent(
            target.grant.id,
          )}`,
          "DELETE",
        );

        showToast({
          tone: "success",
          title: "College access revoked",
          description:
            "The grant was revoked. If this was the last visible grant, the recruiter may disappear from the current scoped list.",
        });

        setConfirmation(null);
        await loadDetail(target.userId);
        router.refresh();
      } else {
        await requestJson(
          `/api/admin/hr/${encodeURIComponent(
            target.userId,
          )}/terminate-sessions`,
          "POST",
        );

        showToast({
          tone: "success",
          title: "All sessions terminated",
          description:
            "Existing device sessions for this canonical user have been revoked.",
        });

        setConfirmation(null);
      }
    } catch (error) {
      setActionError(errorText(error));
    } finally {
      setPending(false);
    }
  }

  const columns: DataTableColumn<HrAccount>[] = [
    {
      key: "name",
      header: "Name",
      cell: (account) => (
        <div>
          <p className="m-0 font-semibold text-foreground">
            {hrDisplayName(account)}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            {account.email || account.title || "—"}
          </p>
        </div>
      ),
    },
    {
      key: "mobile",
      header: "Mobile",
      cell: (account) =>
        account.phoneE164 || "—",
    },
    {
      key: "company",
      header: "Company",
      cell: (account) => account.companyName,
    },
    {
      key: "colleges",
      header: "Colleges",
      cell: (account) =>
        account.grants.length > 0 ? (
          <div className="space-y-1">
            <p className="m-0 text-sm font-semibold text-body">
              {account.grants.length} active
            </p>
            <p className="m-0 max-w-64 text-xs leading-5 text-muted-foreground">
              {account.grants
                .map((grant) => grant.collegeName)
                .join(", ")}
            </p>
          </div>
        ) : (
          <span className="text-muted-foreground">
            No visible grants
          </span>
        ),
    },
    {
      key: "status",
      header: "Status",
      cell: (account) => (
        <StatusBadge
          tone={hrStatusTone(account.status)}
        >
          {account.status==="ARCHIVED"?"Suspended":account.status==="ACTIVE"?"Active":"Disabled"}
        </StatusBadge>
      ),
    },
    {
      key: "actions",
      header: <span className="sr-only">Actions</span>,
      className: "text-right",
      cell: (account) => (
        <div className="flex flex-wrap justify-end gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => openDetail(account)}
          >
            View
          </Button>
          <Button
            variant="ghost"
            size="sm"
            disabled={!account.accountManageable}
            title={!account.accountManageable?"This recruiter has grants outside the selected administrative scope":undefined}
            onClick={() => openEdit(account)}
          >
            Edit
          </Button>
          {account.status!=="DISABLED"?<Button size="sm" variant="secondary" disabled={pending||!account.accountManageable}
            onClick={()=>void quickStatus(account)}>{account.status==="ACTIVE"?"Suspend":"Reactivate"}</Button>:null}
          <Button size="sm" variant="secondary" disabled={pending||!account.accountManageable}
            onClick={()=>setConfirmation({kind:"terminate",userId:account.userId,name:hrDisplayName(account)})}>Sign out</Button>
        </div>
      ),
    },
  ];

  const firstResult =
    list && list.total > 0
      ? (list.page - 1) * list.pageSize + 1
      : 0;

  const lastResult = list
    ? Math.min(
        list.page * list.pageSize,
        list.total,
      )
    : 0;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Industry access"
        title="Recruiter account lifecycle"
        description="Manage recruiter accounts, their company links and college access. Account actions follow the current administrative scope."
        actions={
          <Button onClick={openCreate}>
            Add recruiter
          </Button>
        }
      />

      <p role="status" className="rounded-lg border border-border bg-surface p-3 text-sm text-body">{scopeDescription} Account-wide actions are restricted by the current administrative scope.</p>
      <section aria-label="Recruiter account lifecycle" className="space-y-1">
        <p className="text-xs font-semibold uppercase tracking-wide text-primary-text">Industry access</p>
        <h2 className="text-base font-semibold">Recruiter account lifecycle</h2>
        <p className="text-sm text-body">Manage recruiter access, suspension and signed-in devices.</p>
      </section>
      <h2 className="text-base font-semibold">Recruiter accounts</h2>
      <dl className="grid grid-cols-2 gap-3 md:grid-cols-4">{([
        ["Accounts",statusSummary.accounts],["Active",statusSummary.active],["Suspended",statusSummary.archived],["Disabled",statusSummary.disabled],
      ] as const).map(([label,value])=><div key={label} className="rounded-xl border border-border bg-surface p-4"><dt className="text-sm text-muted-foreground">{label}</dt><dd className="mt-2 text-2xl font-semibold tabular-nums">{value}</dd></div>)}</dl>
      <form
        key={[
          filters.q,
          filters.status,
          filters.pageSize,
        ].join("|")}
        method="get"
        action="/admin/recruiters"
        className="flex flex-wrap items-end gap-3 rounded-xl border border-border bg-surface p-4"
      >
        <label className="grid min-w-52 flex-1 gap-1 text-xs font-semibold text-body">
          Search
          <Input
            name="q"
            type="search"
            defaultValue={filters.q}
            maxLength={120}
            placeholder="Name, mobile or email"
          />
        </label>

        <label className="grid gap-1 text-xs font-semibold text-body">
          Status
          <Select
            name="status"
            defaultValue={filters.status}
          >
            <option value="">All statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="ARCHIVED">Suspended</option>
            <option value="DISABLED">Disabled</option>
          </Select>
        </label>

        <label className="grid gap-1 text-xs font-semibold text-body">
          Rows per page
          <Select
            name="pageSize"
            defaultValue={String(filters.pageSize)}
          >
            <option value="25">25</option>
            <option value="50">50</option>
            <option value="100">100</option>
          </Select>
        </label>

        <Button type="submit">Apply filters</Button>

        <Link
          href="/admin/recruiters"
          className="inline-flex min-h-11 items-center justify-center rounded-md border border-border bg-surface px-4 text-sm font-semibold text-body hover:bg-muted"
        >
          Clear
        </Link>
      </form>

      {loadError ? (
        <ErrorState
          title="Could not load recruiter accounts"
          description={loadError}
          action={
            <Button
              variant="secondary"
              onClick={() => router.refresh()}
            >
              Retry
            </Button>
          }
        />
      ) : !list ? (
        <ErrorState
          description="No valid account listing was returned."
        />
      ) : (
        <>
          <div
            aria-live="polite"
            className="text-sm text-muted-foreground"
          >
            {list.total} recruiter
            {list.total === 1 ? "" : "s"} found
          </div>

          {list.items.length === 0 ? (
            <EmptyState
              title="No recruiter accounts found"
              description={
                filters.q || filters.status
                  ? "No recruiters match the current search or status filters. Clear the filters to see other accounts."
                  : "No recruiter accounts are available in the selected administrative scope."
              }
              action={
                filters.q || filters.status ? (
                  <Link
                    href="/admin/recruiters"
                    className="inline-flex min-h-10 items-center rounded-md border border-border px-4 text-sm font-semibold text-body"
                  >
                    Clear filters
                  </Link>
                ) : (
                  <Button onClick={openCreate}>
                    Add recruiter
                  </Button>
                )
              }
            />
          ) : (
            <>
              <div className="grid min-w-0 gap-3 lg:hidden" aria-label="Recruiter account cards">
                {list.items.map((account) => (
                  <article key={account.userId} className="min-w-0 rounded-xl border border-border bg-surface p-4">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <h2 className="m-0 break-words text-base font-semibold text-foreground">{hrDisplayName(account)}</h2>
                        <p className="mt-1 break-all text-xs text-muted-foreground">{account.email || account.phoneE164 || "No contact listed"}</p>
                      </div>
                      <StatusBadge tone={hrStatusTone(account.status)}>{account.status==="ARCHIVED"?"Suspended":account.status==="ACTIVE"?"Active":"Disabled"}</StatusBadge>
                    </div>
                    <dl className="mt-3 grid min-w-0 gap-2 text-sm">
                      <div><dt className="text-xs text-muted-foreground">Company</dt><dd className="m-0 break-words">{account.companyName}</dd></div>
                      <div><dt className="text-xs text-muted-foreground">Colleges</dt><dd className="m-0 break-words">{account.grants.length ? account.grants.map((grant) => grant.collegeName).join(", ") : "No visible grants"}</dd></div>
                    </dl>
                    <div className="mt-4 flex flex-wrap justify-end gap-2">
                      <Button variant="secondary" size="sm" onClick={() => openDetail(account)}>View</Button>
                      <Button variant="ghost" size="sm" disabled={!account.accountManageable}
           title={!account.accountManageable?"Active grants exist outside the selected administrative scope":undefined}
           onClick={() => openEdit(account)}>Edit</Button>
                      {account.status!=="DISABLED"?<Button variant="secondary" size="sm" disabled={pending||!account.accountManageable}
                        onClick={()=>void quickStatus(account)}>{account.status==="ACTIVE"?"Suspend":"Reactivate"}</Button>:null}
                      <Button variant="secondary" size="sm" disabled={pending||!account.accountManageable}
                        onClick={()=>setConfirmation({kind:"terminate",userId:account.userId,name:hrDisplayName(account)})}>Sign out</Button>
                    </div>
                  </article>
                ))}
              </div>
              <div className="hidden min-w-0 lg:block">
                <DataTable rows={list.items} columns={columns} getRowKey={(account) => account.userId} />
              </div>
            </>
          )}

          {list.total > 0 ? (
            <nav
              aria-label="Recruiter account pages"
              className="flex flex-wrap items-center justify-between gap-3 text-sm text-body"
            >
              <p className="m-0">
                Showing {firstResult}–{lastResult}{" "}
                of {list.total} · Page {list.page}{" "}
                of {list.totalPages}
              </p>

              <div className="flex gap-2">
                {list.page > 1 ? (
                  <Link
                    href={pageHref(
                      filters,
                      list.page - 1,
                    )}
                    className="inline-flex min-h-10 items-center rounded-md border border-border px-3 font-semibold hover:bg-muted"
                  >
                    Previous
                  </Link>
                ) : (
                  <span className="inline-flex min-h-10 items-center rounded-md border border-border px-3 opacity-50">
                    Previous
                  </span>
                )}

                {list.page < list.totalPages ? (
                  <Link
                    href={pageHref(
                      filters,
                      list.page + 1,
                    )}
                    className="inline-flex min-h-10 items-center rounded-md border border-border px-3 font-semibold hover:bg-muted"
                  >
                    Next
                  </Link>
                ) : (
                  <span className="inline-flex min-h-10 items-center rounded-md border border-border px-3 opacity-50">
                    Next
                  </span>
                )}
              </div>
            </nav>
          ) : null}
        </>
      )}

      {dialog ? (
        <SuperAdminHrAccountDialog
          key={
            dialog.kind === "create"
              ? "create"
              : `edit-${dialog.account.userId}`
          }
          account={
            dialog.kind === "edit"
              ? dialog.account
              : null
          }
          relationships={relationships}
          colleges={colleges}
          optionsLoading={optionsLoading}
          optionsError={optionsError}
          pending={saving}
          error={formError}
          onClose={() => {
            if (!saving) {
              setDialog(null);
              setFormError(null);
            }
          }}
          onReloadOptions={() => {
            void loadRelationships();
          }}
          onSubmit={(values) => {
            void saveAccount(values);
          }}
        />
      ) : null}

      {selectedUserId ? (
        <SuperAdminHrDetailDrawer
          key={selectedUserId}
          account={detail}
          loading={detailLoading}
          error={detailError}
          actionError={actionError}
          relationships={relationships}
          optionsLoading={optionsLoading}
          optionsError={optionsError}
          pending={pending}
          onClose={closeDetail}
          onReload={() => {
            void loadDetail(selectedUserId);
          }}
          onReloadOptions={() => {
            void loadRelationships();
          }}
          onEdit={openEdit}
          onGrant={grantAccess}
          onRevokeRequest={(grant) => {
            setActionError(null);
            setConfirmation({
              kind: "revoke",
              userId: selectedUserId,
              grant,
            });
          }}
          onTerminateRequest={(account) => {
            setActionError(null);
            setConfirmation({
              kind: "terminate",
              userId: account.userId,
              name: hrDisplayName(account),
            });
          }}
        />
      ) : null}

      <ConfirmDialog
        open={confirmation !== null}
        onOpenChange={(open) => {
          if (!open && !pending) {
            setConfirmation(null);
            setActionError(null);
          }
        }}
        title={
          confirmation?.kind === "revoke"
            ? `Revoke ${confirmation.grant.collegeName} access?`
            : confirmation?.kind === "terminate"
              ? `Terminate all sessions for ${confirmation.name}?`
              : "Confirm recruiter account action"
        }
        description={
          confirmation?.kind === "revoke"
            ? "The recruiter will lose this college grant. Other college grants are not revoked."
            : "Every live device session belonging to this canonical user will be revoked, including sessions used for other memberships."
        }
        confirmLabel={
          confirmation?.kind === "revoke"
            ? "Revoke access"
            : "Terminate all sessions"
        }
        pending={pending}
        onConfirm={() => {
          void confirmAction();
        }}
      >
        <div className="space-y-3 text-sm leading-6 text-body">
          <p className="m-0">
            This action takes effect immediately and
            requires confirmation.
          </p>
          {actionError ? (
            <p
              role="alert"
              className="rounded-md bg-[var(--lms-error-subtle)] p-3 text-error"
            >
              {actionError}
            </p>
          ) : null}
        </div>
      </ConfirmDialog>
    </div>
  );
}
