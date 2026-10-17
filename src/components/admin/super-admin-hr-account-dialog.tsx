"use client";

import { useId, useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import type {
  HrAccount,
  HrAccountFormValues,
  HrRelationshipOption,
} from "./super-admin-hr-types";

export function SuperAdminHrAccountDialog({
  account,
  relationships,
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

  const [companyRelationshipId, setRelationshipId] =
    useState("");
  const [additionalRelationshipIds,setAdditionalRelationshipIds]=useState<string[]>([]);
  const [displayName, setDisplayName] = useState(
    account?.displayName ?? "",
  );
  const [phoneE164, setPhoneE164] = useState(
    account?.phoneE164 ?? "",
  );
  const [email, setEmail] = useState(
    account?.email ?? "",
  );
  const [title, setTitle] = useState(
    account?.title ?? "",
  );
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
    (!creating || Boolean(companyRelationshipId));

  function submit(
    event: React.FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    if (pending || !eligible) {
      return;
    }

    onSubmit({
      companyRelationshipId,
      companyRelationshipIds:[companyRelationshipId,...additionalRelationshipIds],
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
        <>
          <Button
            variant="secondary"
            disabled={pending}
            onClick={onClose}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            form={formId}
            disabled={pending || !eligible}
          >
            {pending
              ? "Saving…"
              : creating
                ? "Add recruiter"
                : "Save changes"}
          </Button>
        </>
      }
    >
      <form
        id={formId}
        onSubmit={submit}
        className="space-y-4"
      >
        {creating ? (
          <div>
            <label
              htmlFor={`${id}-relationship`}
              className="mb-1.5 block text-xs font-semibold text-body"
            >
              Company and first college
            </label>

            <Select
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
                Select an active relationship
              </option>
              {relationships.map((relationship) => (
                <option
                  key={relationship.companyRelationshipId}
                  value={relationship.companyRelationshipId}
                >
                  {relationship.collegeName} ·{" "}
                  {relationship.companyName}
                </option>
              ))}
            </Select>

            {companyRelationshipId ? (
              <fieldset className="mt-3 space-y-2 rounded border border-border p-3">
                <legend className="text-xs font-semibold">Colleges · optional additional access</legend>
                <p className="text-xs text-muted-foreground">
                  You can add or remove colleges later. Only colleges connected to this same company are shown.
                </p>
                {relationships.filter(option =>
                  option.companyRelationshipId!==companyRelationshipId &&
                  option.companyId===relationships.find(item=>item.companyRelationshipId===companyRelationshipId)?.companyId
                ).map(option=><label key={option.companyRelationshipId} className="flex min-h-10 items-center gap-2 text-sm">
                  <input type="checkbox" disabled={pending}
                    checked={additionalRelationshipIds.includes(option.companyRelationshipId)}
                    onChange={event=>setAdditionalRelationshipIds(old=>
                      event.target.checked?[...old,option.companyRelationshipId]:old.filter(x=>x!==option.companyRelationshipId))}
                  />{option.collegeName}
                </label>)}
              </fieldset>
            ):null}
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
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={onReloadOptions}
                >
                  Retry loading relationships
                </Button>
              </div>
            ) : null}

            {!optionsLoading &&
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
          <div className="rounded-lg border border-border bg-muted px-3 py-3">
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
            htmlFor={`${id}-name`}
            className="mb-1.5 block text-xs font-semibold text-body"
          >
            Full name
          </label>
          <Input
            id={`${id}-name`}
            autoComplete="name"
            value={displayName}
            required
            maxLength={255}
            disabled={pending}
            onChange={(event) =>
              setDisplayName(event.target.value)
            }
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label
              htmlFor={`${id}-phone`}
              className="mb-1.5 block text-xs font-semibold text-body"
            >
              Mobile number
            </label>
            <Input
              id={`${id}-phone`}
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              value={phoneE164}
              required={creating || Boolean(account?.phoneE164)}
              maxLength={32}
              placeholder="+919876543210"
              disabled={pending}
              onChange={(event) =>
                setPhoneE164(event.target.value)
              }
            />
          </div>

          <div>
            <label
              htmlFor={`${id}-email`}
              className="mb-1.5 block text-xs font-semibold text-body"
            >
              Email · optional
            </label>
            <Input
              id={`${id}-email`}
              type="email"
              autoComplete="email"
              value={email}
              maxLength={320}
              placeholder="name@company.com"
              disabled={pending}
              onChange={(event) =>
                setEmail(event.target.value)
              }
            />
          </div>
        </div>

        <div>
          <label
            htmlFor={`${id}-title`}
            className="mb-1.5 block text-xs font-semibold text-body"
          >
            Job title · optional
          </label>
          <Input
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
              className="mb-1.5 block text-xs font-semibold text-body"
            >
              Recruiter status
            </label>
            <Select
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
                Archiving revokes every active college
                grant. Reopening the profile later does
                not restore those grants automatically.
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
            className="rounded-lg border border-error bg-[var(--lms-error-subtle)] p-3 text-sm text-error"
          >
            {error}
          </p>
        ) : null}
      </form>
    </Dialog>
  );
}
