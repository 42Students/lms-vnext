"use client";

import { type FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { useToast } from "@/components/ui/toast";
import {
  projectApiError,
  projectMutation,
} from "./project-api";

type ProjectMemberRole = "LEARNER" | "MENTOR";

type Candidate = {
  membershipId: string;
  displayName: string | null;
  email: string | null;
};

async function loadCandidates(
  projectId: string,
  role: ProjectMemberRole,
  q: string,
) {
  const params = new URLSearchParams({
    role,
    q: q.trim(),
    limit: "20",
  });
  const response = await fetch(
    `/api/projects/${projectId}/member-candidates?${params.toString()}`,
  );
  if (!response.ok) {
    throw new Error(await projectApiError(response));
  }

  const body = (await response.json()) as {
    candidates: Candidate[];
  };
  return body.candidates;
}

export function AddProjectMemberControl({
  projectId,
}: {
  projectId: string;
}) {
  const router = useRouter();
  const { showToast } = useToast();
  const [open, setOpen] = useState(false);
  const [role, setRole] =
    useState<ProjectMemberRole>("LEARNER");
  const [query, setQuery] = useState("");
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [membershipId, setMembershipId] = useState("");
  const [roleLabel, setRoleLabel] = useState("");
  const [isPrimary, setIsPrimary] = useState(false);
  const [searching, setSearching] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function search(
    nextRole: ProjectMemberRole = role,
    nextQuery: string = query,
  ) {
    setSearching(true);
    setError(null);
    try {
      const rows = await loadCandidates(
        projectId,
        nextRole,
        nextQuery,
      );
      setCandidates(rows);
      setMembershipId((current) =>
        rows.some((row) => row.membershipId === current)
          ? current
          : rows[0]?.membershipId ?? "",
      );
    } catch (caught) {
      setCandidates([]);
      setMembershipId("");
      setError(
        caught instanceof Error
          ? caught.message
          : "Could not load eligible college members.",
      );
    } finally {
      setSearching(false);
    }
  }

  function openDialog() {
    setRole("LEARNER");
    setQuery("");
    setCandidates([]);
    setMembershipId("");
    setRoleLabel("");
    setIsPrimary(false);
    setError(null);
    setOpen(true);
    void search("LEARNER", "");
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!membershipId) {
      setError("Choose an eligible college member.");
      return;
    }

    setPending(true);
    setError(null);
    try {
      await projectMutation(
        `/api/projects/${projectId}/members`,
        "POST",
        {
          membershipId,
          role,
          isPrimary:
            role === "MENTOR" ? isPrimary : false,
          roleLabel: roleLabel.trim() || undefined,
        },
      );
      setOpen(false);
      showToast({
        tone: "success",
        title:
          role === "MENTOR"
            ? "Mentor added"
            : "Learner added",
      });
      router.refresh();
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Could not add the Project member.",
      );
    } finally {
      setPending(false);
    }
  }

  return (
    <>
      <Button
        size="sm"
        variant="secondary"
        onClick={openDialog}
      >
        Add teammate
      </Button>
      <Dialog
        open={open}
        onOpenChange={setOpen}
        title="Add Project teammate"
        description="Only active memberships from this college with the selected Learner or Mentor role are eligible."
      >
        <form onSubmit={submit} className="grid gap-4">
          <label>
            <span className="mb-1.5 block text-xs font-semibold text-body">
              Project role
            </span>
            <Select
              value={role}
              onChange={(event) => {
                const next =
                  event.target.value as ProjectMemberRole;
                setRole(next);
                setIsPrimary(false);
                setCandidates([]);
                setMembershipId("");
                void search(next, query);
              }}
            >
              <option value="LEARNER">Learner</option>
              <option value="MENTOR">Mentor</option>
            </Select>
          </label>
          <div>
            <span className="mb-1.5 block text-xs font-semibold text-body">
              Find eligible member
            </span>
            <div className="flex gap-2">
              <Input
                value={query}
                maxLength={120}
                onChange={(event) =>
                  setQuery(event.target.value)
                }
                placeholder="Name or email"
                aria-label="Find eligible member"
              />
              <Button
                type="button"
                size="sm"
                variant="secondary"
                disabled={searching}
                onClick={() => void search()}
              >
                {searching ? "Searching…" : "Search"}
              </Button>
            </div>
          </div>
          <label>
            <span className="mb-1.5 block text-xs font-semibold text-body">
              Member
            </span>
            <Select
              aria-label="Project member"
              value={membershipId}
              disabled={searching || candidates.length === 0}
              onChange={(event) =>
                setMembershipId(event.target.value)
              }
            >
              {candidates.length === 0 ? (
                <option value="">
                  {searching
                    ? "Loading eligible members…"
                    : "No eligible members found"}
                </option>
              ) : (
                candidates.map((candidate) => (
                  <option
                    key={candidate.membershipId}
                    value={candidate.membershipId}
                  >
                    {candidate.displayName ?? "Unnamed member"}
                    {candidate.email
                      ? ` · ${candidate.email}`
                      : ""}
                  </option>
                ))
              )}
            </Select>
          </label>
          <label>
            <span className="mb-1.5 block text-xs font-semibold text-body">
              Responsibility label
            </span>
            <Input
              value={roleLabel}
              maxLength={120}
              onChange={(event) =>
                setRoleLabel(event.target.value)
              }
              placeholder={
                role === "MENTOR"
                  ? "e.g. Technical mentor"
                  : "e.g. Team lead"
              }
            />
          </label>
          {role === "MENTOR" ? (
            <label className="flex items-center gap-2 text-sm font-semibold text-body">
              <input
                type="checkbox"
                checked={isPrimary}
                onChange={(event) =>
                  setIsPrimary(event.target.checked)
                }
              />
              Primary mentor
            </label>
          ) : null}
          {error ? (
            <p role="alert" className="m-0 text-sm font-semibold text-error">
              {error}
            </p>
          ) : null}
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="secondary"
              disabled={pending}
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={pending || !membershipId}
            >
              {pending ? "Adding…" : "Add teammate"}
            </Button>
          </div>
        </form>
      </Dialog>
    </>
  );
}

export function ProjectMemberActions({
  projectId,
  member,
}: {
  projectId: string;
  member: {
    id: string;
    role: string;
    isPrimary: boolean;
    displayName: string | null;
  };
}) {
  const router = useRouter();
  const { showToast } = useToast();
  const [removeOpen, setRemoveOpen] = useState(false);
  const [pending, setPending] = useState(false);

  async function setPrimary(isPrimary: boolean) {
    setPending(true);
    try {
      await projectMutation(
        `/api/projects/${projectId}/members/${member.id}`,
        "PATCH",
        { isPrimary },
      );
      showToast({
        tone: "success",
        title: isPrimary
          ? "Primary mentor updated"
          : "Primary mentor cleared",
      });
      router.refresh();
    } catch (caught) {
      showToast({
        tone: "error",
        title: "Could not update mentor",
        description:
          caught instanceof Error
            ? caught.message
            : undefined,
      });
    } finally {
      setPending(false);
    }
  }

  async function remove() {
    setPending(true);
    try {
      await projectMutation(
        `/api/projects/${projectId}/members/${member.id}`,
        "DELETE",
      );
      setRemoveOpen(false);
      showToast({
        tone: "success",
        title: "Teammate removed",
        description:
          "Participation history is retained while active Project access ends.",
      });
      router.refresh();
    } catch (caught) {
      showToast({
        tone: "error",
        title: "Could not remove teammate",
        description:
          caught instanceof Error
            ? caught.message
            : undefined,
      });
    } finally {
      setPending(false);
    }
  }

  return (
    <>
      <div className="mt-3 flex flex-wrap gap-2">
        {member.role === "MENTOR" ? (
          <Button
            size="sm"
            variant="secondary"
            disabled={pending}
            onClick={() =>
              void setPrimary(!member.isPrimary)
            }
          >
            {member.isPrimary
              ? "Remove primary"
              : "Make primary"}
          </Button>
        ) : null}
        <Button
          size="sm"
          variant="ghost"
          disabled={pending}
          onClick={() => setRemoveOpen(true)}
        >
          Remove
        </Button>
      </div>
      <ConfirmDialog
        open={removeOpen}
        onOpenChange={setRemoveOpen}
        title={`Remove ${member.displayName ?? "this teammate"}?`}
        description="Their active Project access ends now. Historical membership and work records remain available."
        confirmLabel="Remove teammate"
        pending={pending}
        onConfirm={remove}
      />
    </>
  );
}
