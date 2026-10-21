"use client";

import {
  useRef,
  useState,
} from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Dropdown } from "@/components/ui/dropdown";
import { Disclosure } from "@/components/ui/disclosure";
import { Menu, MenuItem } from "@/components/ui/menu";
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
  hrAccountStatusLabel,
  hrAccountStatusTone,
} from "./super-admin-hr-types";

type DialogState =
  | { kind: "create" }
  | { kind: "edit"; account: HrAccount }
  | null;

type Confirmation =
  | { kind:"quick"; userId:string; name:string; status:"ACTIVE"|"ARCHIVED" }
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
  selectedCollegeId,
}: {
  list: HrAccountsPageData | null;
  statusSummary: {accounts:number;active:number;archived:number;disabled:number}|null;
  scopeDescription:string;
  selectedCollegeId?:string|null;
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

  const savingRef=useRef(false);
  const actionRef=useRef(false);
  const detailRequestVersion = useRef(0);
  const optionsRequestVersion = useRef(0);

  async function loadRelationships(): Promise<boolean> {
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
        return false;
      }

      if (!Array.isArray(payload.relationships)) {
        throw new Error(
          "The server returned an invalid relationship list.",
        );
      }
      if(!Array.isArray(payload.colleges)||!payload.colleges.length){
        throw new Error("College options could not be loaded. Retry before adding a recruiter.");
      }

      setRelationships(payload.relationships);
      setColleges(payload.colleges);
      return true;
    } catch (error) {
      if (
        version !== optionsRequestVersion.current
      ) {
        return false;
      }

      setOptionsError(errorText(error));
      return false;
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

  async function openCreate() {
    if(saving||pending||optionsLoading)return;
    setFormError(null);
    // Do not show a create form until college options are validated.
    if(await loadRelationships())setDialog({kind:"create"});
  }

  function openEdit(account: HrAccount) {
    if(saving||pending)return;
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
    if (!dialog || saving || savingRef.current) {
      return;
    }

    savingRef.current=true;
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
            tone: "info",
            title: "Recruiter account already exists",
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
      savingRef.current=false;
      setSaving(false);
    }
  }

  function quickStatus(account:HrAccount){
    if(!account.accountManageable||pending||account.status==="DISABLED"||account.legacyStatus==="DELETED")return;
    const next=account.status==="ACTIVE"?"ARCHIVED":"ACTIVE";
    setActionError(null);
    setConfirmation({kind:"quick",userId:account.userId,name:hrDisplayName(account),status:next});
  }

  async function grantAccess(
    companyRelationshipId: string,validUntil?:string,
  ): Promise<boolean> {
    if (
      !selectedUserId ||
      pending || actionRef.current ||
      !companyRelationshipId
    ) {
      return false;
    }

    actionRef.current=true;
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
      actionRef.current=false;
      setPending(false);
    }
  }

  async function confirmAction() {
    if (!confirmation || pending || actionRef.current) {
      return;
    }

    const target = confirmation;
    actionRef.current=true;
    setPending(true);
    setActionError(null);

    try {
      if (target.kind === "quick") {
        await requestJson("/api/admin/hr/"+encodeURIComponent(target.userId),"PATCH",{status:target.status});
        showToast({tone:"success",title:target.status==="ARCHIVED"?"Recruiter suspended":"Recruiter reactivated"});
        setConfirmation(null);router.refresh();
      } else if (target.kind === "revoke") {
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
          title: "College access removed",
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
          title: "All sessions ended",
          description:
            "Existing device sessions for this canonical user have been revoked.",
        });

        setConfirmation(null);
      }
    } catch (error) {
      setActionError(errorText(error));
    } finally {
      actionRef.current=false;
      setPending(false);
    }
  }

  const accountActions = (account: HrAccount, mobile = false) => (
    <div className="flex min-w-0 flex-wrap items-center justify-start gap-[var(--lms-space-2)] print:hidden lg:justify-end">
      <Button variant="secondary" size="sm" className="min-h-11 w-full md:w-auto md:min-h-9" disabled={pending||saving} onClick={() => openDetail(account)}>View</Button>
      <Dropdown label="Recruiter actions" trigger="Actions" align="end" mobileSheet triggerClassName="md:!min-h-9">
        <Menu className="w-full min-w-0">
          <MenuItem disabled={pending || saving || !account.accountManageable}
            title={!account.accountManageable ? mobile
              ? "Active grants exist outside the selected administrative scope"
              : "This recruiter has grants outside the selected administrative scope"
              : undefined}
            onClick={() => openEdit(account)}>Edit</MenuItem>
          {account.status !== "DISABLED" && account.legacyStatus!=="DELETED" ? (
            <MenuItem disabled={pending || !account.accountManageable}
              onClick={() => quickStatus(account)}>{account.status === "ACTIVE" ? "Suspend" : "Reactivate"}</MenuItem>
          ) : null}
          <MenuItem disabled={pending || !account.accountManageable}
            onClick={() => setConfirmation({kind:"terminate",userId:account.userId,name:hrDisplayName(account)})}>Sign out</MenuItem>
        </Menu>
      </Dropdown>
    </div>
  );

  const columns: DataTableColumn<HrAccount>[] = [
    {
      key: "name",
      header: "Name",
      cell: (account) => (
        <div>
          <p className="m-0 break-words font-semibold text-foreground">
            {hrDisplayName(account)}
          </p>
          <p className="mt-1 break-words text-xs text-muted-foreground">
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
          <div className="min-w-0">
            <p className="m-0 text-sm font-semibold text-body">
              {account.grants.length} active
            </p>
            <p className="m-0 max-w-64 break-words text-xs leading-5 text-muted-foreground">
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
          tone={hrAccountStatusTone(account)}
        >
          {hrAccountStatusLabel(account)}
        </StatusBadge>
      ),
    },
    {
      key: "actions",
      header: <span className="sr-only">Actions</span>,
      className: "text-right",
      cell: (account) => accountActions(account),
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
    <div className="min-w-0 space-y-4 md:space-y-6">
      <PageHeader
        title="Recruiter accounts"
        description="Recruiter accounts: manage company links and college access. Account actions follow the current administrative scope."
        actions={
          <Button className="min-h-11 w-full md:min-h-9 md:w-auto print:hidden" disabled={saving||pending||optionsLoading} onClick={()=>void openCreate()}>
            Add recruiter
          </Button>
        }
      />

      <p role="status" className="border-l-2 border-border bg-surface-subtle px-4 py-3 text-sm text-body">{scopeDescription} Account-wide actions are restricted by the current administrative scope.</p>
      {optionsError?<p role="alert" className="border-l-2 border-warning bg-warning-subtle px-4 py-3 text-sm text-body">
        College options could not be loaded. Create and grant changes require verified college relationships.{" "}
        <Button type="button" variant="secondary" size="sm" disabled={optionsLoading}
          onClick={()=>void loadRelationships()} className="ml-2 min-h-11 md:min-h-9">Retry colleges</Button>
      </p>:null}
      <p className="text-xs text-muted-foreground">
        Suspended represents an archived recruiter account and can be reactivated. Disabled is a separate platform identity state, not the legacy Deleted state.
        Permanent deletion is not offered by this workspace; suspension preserves historical grants and audit records.
      </p>
      <section aria-label="Recruiter account lifecycle" className="min-w-0 space-y-1 border-b border-border pb-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-[var(--lms-teal-deep)]">Industry access</p>
        <h2 className="text-base font-semibold text-foreground">Recruiter account lifecycle</h2>
        <p className="text-sm text-body">Manage recruiter access, suspension and signed-in devices.</p>
      </section>
      {!statusSummary&&<p role="status" className="border-l-2 border-warning bg-warning-subtle px-4 py-3 text-sm text-body">
        Account totals are temporarily unavailable. The directory is still usable.
        <Button type="button" variant="secondary" size="sm" onClick={()=>router.refresh()} className="ml-2 min-h-11 md:min-h-9">Retry totals</Button>
      </p>}
      {statusSummary ? <dl className="grid min-w-0 grid-cols-2 gap-[var(--lms-space-3)] md:grid-cols-4">{([
        ["Accounts",statusSummary?.accounts],["Active",statusSummary?.active],["Suspended",statusSummary?.archived],["Disabled (not deleted)",statusSummary?.disabled],
      ] as const).map(([label,value])=><div key={label} className="min-w-0 border-r border-border pr-[var(--lms-space-4)] even:border-r-0 md:even:border-r md:last:border-r-0"><dt className="text-sm text-muted-foreground">{label}</dt><dd className="mt-2 text-2xl font-semibold tabular-nums">{value??"Unavailable"}</dd></div>)}</dl> : null}
      <form
        key={[
          filters.q,
          filters.status,
          filters.pageSize,
        ].join("|")}
        method="get"
        action="/admin/recruiters"
        className="grid min-w-0 grid-cols-2 items-end gap-[var(--lms-space-3)] border-b border-border pb-[var(--lms-space-4)] print:hidden lg:grid-cols-[minmax(0,1fr)_minmax(0,12rem)_auto_auto_auto]"
      >
        <label className="col-span-2 grid min-w-0 gap-2 text-[var(--lms-font-sm)] font-semibold lg:col-span-1 text-[13px] leading-4 text-[var(--lms-neutral-400)]">
          Search
          <Input
            className="min-h-11 md:min-h-9" name="q"
            type="search"
            defaultValue={filters.q}
            maxLength={120}
            placeholder="Name, mobile or email"
          />
        </label>

        <label className="grid min-w-0 gap-2 text-[var(--lms-font-sm)] font-semibold text-[13px] leading-4 text-[var(--lms-neutral-400)]">
          Status
          <Select
            className="min-h-11 md:min-h-9" name="status"
            defaultValue={filters.status}
          >
            <option value="">All statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="ARCHIVED">Suspended</option>
            <option value="DISABLED">Disabled</option>
          </Select>
        </label>

        <Disclosure title="Rows per page" className="min-w-0"
          contentClassName="pb-2 pt-2">
        <label className="grid min-w-0 gap-2 text-[var(--lms-font-sm)] font-semibold text-[13px] leading-4 text-[var(--lms-neutral-400)]">
          Rows per page
          <Select
            className="min-h-11 md:min-h-9" name="pageSize"
            defaultValue={String(filters.pageSize)}
          >
            <option value="25">25</option>
            <option value="50">50</option>
            <option value="100">100</option>
          </Select>
        </label>

        </Disclosure>

        <Button type="submit" className="min-h-11 w-full lg:min-h-9 lg:w-auto">Apply filters</Button>

        <Link
          href="/admin/recruiters"
          className="inline-flex min-h-11 w-full items-center justify-center rounded-[var(--lms-control-radius)] border border-border bg-surface px-4 text-sm font-[650] text-primary-text hover:bg-primary-subtle focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)] lg:min-h-9 lg:w-auto md:min-h-9"
        >
          Clear
        </Link>
      </form>

      {loadError ? (
        <ErrorState
          title="Recruiter accounts could not be loaded"
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
                    className="inline-flex min-h-11 items-center rounded-[var(--lms-control-radius)] border border-border bg-surface px-4 text-sm font-[650] text-primary-text hover:bg-primary-subtle focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)] md:min-h-9"
                  >
                    Clear filters
                  </Link>
                ) : (
                  <Button className="min-h-11 w-full md:w-auto md:min-h-9 print:hidden" disabled={saving||pending||optionsLoading} onClick={()=>void openCreate()}>
                    Add recruiter
                  </Button>
                )
              }
            />
          ) : (
            <>
              <div className="min-w-0 divide-y divide-border border-y border-border lg:hidden print:hidden" aria-label="Recruiter account cards">
                {list.items.map((account) => (
                  <article key={account.userId} className="min-w-0 py-4">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <h2 className="m-0 break-words text-base font-semibold text-foreground">{hrDisplayName(account)}</h2>
                        <p className="mt-1 break-words text-xs text-muted-foreground">{account.email || account.phoneE164 || "No contact listed"}</p>
                      </div>
                      <StatusBadge tone={hrStatusTone(account.status)}>{account.status==="ARCHIVED"?"Suspended":account.status==="ACTIVE"?"Active":"Disabled"}</StatusBadge>
                    </div>
                    <dl className="mt-3 grid min-w-0 gap-2 text-sm">
                      <div><dt className="text-xs text-muted-foreground">Company</dt><dd className="m-0 break-words">{account.companyName}</dd></div>
                      <div><dt className="text-xs text-muted-foreground">Colleges</dt>
                        <dd className="m-0">{account.grants.length ? <Disclosure title={account.grants.length+" active"}
                          contentClassName="break-words pb-2 pt-1">
                          {account.grants.map((grant) => grant.collegeName).join(", ")}
                        </Disclosure> : "No visible grants"}</dd></div>
                    </dl>
                    {accountActions(account, true)}
                  </article>
                ))}
              </div>
              <div className="hidden min-w-0 lg:block print:block">
                <DataTable empty={<p className="m-0 text-sm text-muted-foreground">No records to show.</p>} rows={list.items} columns={columns} getRowKey={(account) => account.userId} />
              </div>
            </>
          )}

          {list.total > 0 ? (
            <nav
              aria-label="Recruiter account pages"
              className="flex min-w-0 flex-col items-stretch gap-3 text-sm text-body print:hidden md:flex-row md:items-center md:justify-between"
            >
              <p className="m-0">
                Showing {firstResult}–{lastResult}{" "}
                of {list.total} · Page {list.page}{" "}
                of {list.totalPages}
              </p>

              <div className="flex min-w-0 flex-wrap gap-2">
                {list.page > 1 ? (
                  <Link
                    href={pageHref(
                      filters,
                      list.page - 1,
                    )}
                    className="inline-flex min-h-11 items-center rounded-[8px] md:rounded-[var(--lms-control-radius)] border border-border bg-surface px-3 font-[650] text-primary-text hover:border-primary hover:bg-primary-subtle focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)] min-[768px]:min-h-9 md:min-h-9 text-sm"
                  >
                    Previous
                  </Link>
                ) : (
                  <span className="inline-flex min-h-11 items-center rounded-[var(--lms-control-radius)] border border-border px-3 opacity-50 min-[768px]:min-h-9">
                    Previous
                  </span>
                )}

                {list.page < list.totalPages ? (
                  <Link
                    href={pageHref(
                      filters,
                      list.page + 1,
                    )}
                    className="inline-flex min-h-11 items-center rounded-[8px] md:rounded-[var(--lms-control-radius)] border border-border bg-surface px-3 font-[650] text-primary-text hover:border-primary hover:bg-primary-subtle focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)] min-[768px]:min-h-9 md:min-h-9 text-sm"
                  >
                    Next
                  </Link>
                ) : (
                  <span className="inline-flex min-h-11 items-center rounded-[var(--lms-control-radius)] border border-border px-3 opacity-50 min-[768px]:min-h-9">
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
          selectedCollegeId={selectedCollegeId}
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
        title={confirmation?.kind==="quick"
          ? (confirmation.status==="ARCHIVED"?"Suspend ":"Reactivate ")+confirmation.name+"?"
          :confirmation?.kind==="revoke" ? "Revoke "+confirmation.grant.collegeName+" access?"
          :confirmation?.kind==="terminate" ? "Terminate all sessions for "+confirmation.name+"?"
          :"Confirm recruiter account action"}
        description={confirmation?.kind==="quick"
          ? confirmation.status==="ARCHIVED"
            ?"They are signed out everywhere and cannot sign in until reactivated. College access is kept."
            :"Their existing college access is kept."
          :confirmation?.kind==="revoke"
            ?"The recruiter will lose this college grant. Other college grants are not revoked."
            :"Every live device session belonging to this canonical user will be revoked, including sessions used for other memberships."}
        confirmLabel={confirmation?.kind==="quick"
          ?confirmation.status==="ARCHIVED"?"Suspend":"Reactivate"
          :confirmation?.kind==="revoke"?"Revoke access":"Terminate all sessions"}
        pending={pending}
        confirmVariant={confirmation?.kind==="quick" && confirmation.status!=="ARCHIVED"?"primary":"danger"}
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
              className="border-l-2 border-error bg-error-subtle px-4 py-3 text-error"
            >
              {actionError}
            </p>
          ) : null}
        </div>
      </ConfirmDialog>
    </div>
  );
}
