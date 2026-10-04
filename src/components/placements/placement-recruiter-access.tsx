"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";

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
  const [pending, setPending] = useState<
    string | null
  >(null);

  async function grantAccess() {
    if (!relationshipId || !email.trim()) {
      showToast({
        tone: "error",
        title: "Recruiter access incomplete",
        description:
          "Choose an employer relationship and enter the recruiter's canonical account email.",
      });
      return;
    }

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
      setPending(null);
    }
  }

  async function revokeAccess(
    grantId: string,
  ) {
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
      setPending(null);
    }
  }

  return (
    <section className="rounded-xl border border-border bg-surface">
      <div className="border-b border-border px-5 py-4">
        <h2 className="m-0 text-base font-semibold text-foreground">
          Recruiter access
        </h2>
        <p className="mt-1 text-sm text-body">
          Grant an existing canonical account access to one exact employer relationship. Recruiters never become college members.
        </p>
      </div>

      <div className="grid gap-3 border-b border-border p-5 lg:grid-cols-[minmax(12rem,1fr)_minmax(14rem,1fr)_minmax(10rem,0.7fr)_auto]">
        <label>
          <span className="mb-1 block text-xs font-semibold text-body">
            Employer relationship
          </span>
          <select
            aria-label="Employer relationship"
            className="min-h-10 w-full rounded-md border border-border bg-surface px-3 text-sm text-foreground outline-none transition focus:border-primary focus:ring-4 focus:ring-[var(--lms-focus-ring)]"
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
          </select>
        </label>

        <label>
          <span className="mb-1 block text-xs font-semibold text-body">
            Recruiter email
          </span>
          <input
            aria-label="Recruiter email"
            type="email"
            className="min-h-10 w-full rounded-md border border-border bg-surface px-3 text-sm text-foreground outline-none transition focus:border-primary focus:ring-4 focus:ring-[var(--lms-focus-ring)]"
            value={email}
            onChange={(event) =>
              setEmail(event.target.value)
            }
            placeholder="recruiter@company.com"
            disabled={pending !== null}
          />
        </label>

        <label>
          <span className="mb-1 block text-xs font-semibold text-body">
            Title
          </span>
          <input
            aria-label="Recruiter title"
            className="min-h-10 w-full rounded-md border border-border bg-surface px-3 text-sm text-foreground outline-none transition focus:border-primary focus:ring-4 focus:ring-[var(--lms-focus-ring)]"
            value={title}
            onChange={(event) =>
              setTitle(event.target.value)
            }
            placeholder="Talent Partner"
            disabled={pending !== null}
          />
        </label>

        <div className="flex items-end">
          <Button
            size="sm"
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
        <p className="m-0 px-5 py-6 text-sm text-muted-foreground">
          No active recruiter grants in this college.
        </p>
      ) : (
        <div className="divide-y divide-border">
          {grants.map((grant) => (
            <div
              key={grant.grantId}
              className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="min-w-0">
                <p className="m-0 font-semibold text-foreground">
                  {grant.displayName ??
                    grant.email ??
                    "Recruiter"}
                </p>
                <p className="mt-1 text-sm text-body">
                  {grant.companyName}
                  {grant.title
                    ? " · " + grant.title
                    : ""}
                </p>
                {grant.email ? (
                  <p className="mt-1 text-xs text-muted-foreground">
                    {grant.email}
                  </p>
                ) : null}
              </div>
              <Button
                size="sm"
                variant="ghost"
                disabled={pending !== null}
                onClick={() =>
                  revokeAccess(
                    grant.grantId,
                  )
                }
              >
                {pending === grant.grantId
                  ? "Revoking…"
                  : "Revoke"}
              </Button>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
