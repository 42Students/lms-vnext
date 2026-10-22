"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

export type RecruiterRelationshipChoice = {
  relationshipId: string;
  name: string;
};

export type PlacementRecruiterGrantItem = {
  grantId: string;
  recruiterUserId: string;
  companyRelationshipId: string;
  companyId: string;
  companyName: string;
  displayName: string | null;
  email: string | null;
  title: string | null;
};

function humanize(value: string) {
  return value
    .toLowerCase()
    .split("_")
    .map(
      (part) =>
        part.charAt(0).toUpperCase() +
        part.slice(1),
    )
    .join(" ");
}

export function PlacementRecruiterAccess({
  relationships,
  grants,
}: {
  relationships: readonly RecruiterRelationshipChoice[];
  grants: readonly PlacementRecruiterGrantItem[];
}) {
  const router = useRouter();
  const { showToast } = useToast();
  const [relationshipId, setRelationshipId] =
    useState(
      relationships[0]?.relationshipId ?? "",
    );
  const [email, setEmail] = useState("");
  const [title, setTitle] = useState("");
  const inFlightRef = useRef(false);
  const [revokeTarget, setRevokeTarget] = useState<string | null>(null);
  const [pending, setPending] = useState<
    string | null
  >(null);

  async function grantAccess() {
    if (inFlightRef.current) return;
    if (!relationshipId || !email.trim()) {
      showToast({
        tone: "error",
        title: "Recruiter access incomplete",
        description:
          "Choose an employer relationship and enter the recruiter's canonical account email.",
      });
      return;
    }

    inFlightRef.current = true;
    setPending("grant");
    try {
      const response = await fetch(
        "/api/placements/recruiters",
        {
          method: "POST",
          headers: {
            "content-type":
              "application/json",
          },
          body: JSON.stringify({
            companyRelationshipId:
              relationshipId,
            email: email.trim(),
            title: title.trim() || null,
          }),
        },
      );
      const payload = (await response
        .json()
        .catch(() => null)) as
        | { error?: string }
        | null;
      if (!response.ok) {
        throw new Error(
          payload?.error ??
            "PLACEMENT_RECRUITER_GRANT_FAILED",
        );
      }

      setEmail("");
      setTitle("");
      showToast({
        tone: "success",
        title: "Recruiter access granted",
        description:
          "The canonical recruiter account can now open only this employer relationship for this college.",
      });
      router.refresh();
    } catch (error) {
      showToast({
        tone: "error",
        title: "Could not grant access",
        description:
          error instanceof Error
            ? humanize(error.message)
            : "Please try again.",
      });
    } finally {
      inFlightRef.current = false;
      setPending(null);
    }
  }

  async function revokeAccess(
    grantId: string,
  ) {
    if (inFlightRef.current) return;
    inFlightRef.current = true;
    setPending(grantId);
    try {
      const response = await fetch(
        "/api/placements/recruiters/" +
          grantId,
        { method: "DELETE" },
      );
      const payload = (await response
        .json()
        .catch(() => null)) as
        | { error?: string }
        | null;
      if (!response.ok) {
        throw new Error(
          payload?.error ??
            "PLACEMENT_RECRUITER_REVOKE_FAILED",
        );
      }

      showToast({
        tone: "success",
        title: "Recruiter access revoked",
        description:
          "This college-employer grant is no longer active.",
      });
      router.refresh();
    } catch (error) {
      showToast({
        tone: "error",
        title: "Could not revoke access",
        description:
          error instanceof Error
            ? humanize(error.message)
            : "Please try again.",
      });
    } finally {
      inFlightRef.current = false;
      setPending(null);
      setRevokeTarget(null);
    }
  }

  return (
    <section className="min-w-0 border-b border-border pb-4">
      <div className="border-b border-border pb-3">
        <h2 className="m-0 font-semibold text-[var(--lms-heading)] text-[16px] leading-[26px] min-[768px]:text-[18px] min-[768px]:leading-7 min-[992px]:text-[20px] min-[992px]:leading-[30px]">
          Recruiter access
        </h2>
        <p className="mt-1 break-words text-sm text-body leading-[22px]">
          Grant an existing canonical account access to one exact employer relationship. Recruiters never become college members.
        </p>
      </div>

      <div className="grid min-w-0 gap-3 border-b border-border py-4 sm:grid-cols-2 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,0.7fr)_auto]">
        <label className="min-w-0">
          <span className="mb-1 block text-xs font-semibold text-body">
            Employer relationship
          </span>
          <Select
            aria-label="Employer relationship"
            className="min-h-11 w-full min-w-0 md:min-h-9"
            value={relationshipId}
            onChange={(event) =>
              setRelationshipId(
                event.target.value,
              )
            }
            disabled={
              relationships.length === 0 ||
              pending !== null
            }
          >
            {relationships.length === 0 ? (
              <option value="">
                No employers available
              </option>
            ) : (
              relationships.map((item) => (
                <option
                  key={item.relationshipId}
                  value={item.relationshipId}
                >
                  {item.name}
                </option>
              ))
            )}
          </Select>
        </label>

        <label className="min-w-0">
          <span className="mb-1 block text-xs font-semibold text-body">
            Recruiter email
          </span>
          <Input
            aria-label="Recruiter email"
            type="email"
            className="min-h-11 w-full min-w-0 md:min-h-9"
            value={email}
            onChange={(event) =>
              setEmail(event.target.value)
            }
            placeholder="recruiter@company.com"
            disabled={pending !== null}
          />
        </label>

        <label className="min-w-0">
          <span className="mb-1 block text-xs font-semibold text-body">
            Title
          </span>
          <Input
            aria-label="Recruiter title"
            className="min-h-11 w-full md:min-h-9"
            value={title}
            onChange={(event) =>
              setTitle(event.target.value)
            }
            placeholder="Talent Partner"
            disabled={pending !== null}
          />
        </label>

        <div className="flex min-w-0 items-end sm:col-span-2 xl:col-span-1">
          <Button
            size="sm"
            className="min-h-11 w-full px-4 sm:w-auto md:min-h-9"
            disabled={
              pending !== null ||
              relationships.length === 0
            }
            onClick={grantAccess}
          >
            {pending === "grant"
              ? "Granting…"
              : "Grant access"}
          </Button>
        </div>
      </div>

      {grants.length === 0 ? (
        <p className="m-0 py-6 text-sm text-muted-foreground leading-[22px]">
          No active recruiter grants in this college.
        </p>
      ) : (
        <div className="min-w-0 divide-y divide-border border-y border-border">
          {grants.map((grant) => (
            <div
              key={grant.grantId}
              className="flex min-w-0 flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="min-w-0">
                <p className="m-0 break-words text-base font-semibold text-foreground">
                  {grant.displayName ??
                    grant.email ??
                    "Recruiter"}
                </p>
                <p className="mt-1 text-sm text-body leading-[22px]">
                  {grant.companyName}
                  {grant.title
                    ? " · " + grant.title
                    : ""}
                </p>
                {grant.email ? (
                  <p className="mt-1 break-all text-xs text-muted-foreground leading-5">
                    {grant.email}
                  </p>
                ) : null}
              </div>
              <Button
                size="sm"
                variant="danger"
                className="min-h-11 w-full shrink-0 px-4 sm:w-auto md:min-h-9"
                disabled={pending !== null}
                onClick={() => setRevokeTarget(grant.grantId)}
              >
                {pending === grant.grantId
                  ? "Revoking…"
                  : "Revoke"}
              </Button>
            </div>
          ))}
        </div>
      )}
      <ConfirmDialog open={revokeTarget !== null}
        onOpenChange={(next) => { if (!next && pending === null) setRevokeTarget(null); }}
        pending={pending !== null}
        title="Revoke this recruiter access?"
        description="This college-employer grant will no longer be active. The recruiter will lose access to this relationship."
        confirmLabel="Revoke access" confirmVariant="danger"
        onConfirm={() => { if (revokeTarget) void revokeAccess(revokeTarget); }}/>
    </section>
  );
}
