"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { StatusBadge } from "@/components/ui/status-badge";
import { useToast } from "@/components/ui/toast";

type PlacementRoleOptionItem = {
  id: string;
  title: string;
  employmentType: string;
  workMode: string;
  locations: string[];
  openings: number | null;
  minimumAnnualCtcInr: number | null;
  maximumAnnualCtcInr: number | null;
  isPrimary: boolean;
  status: string;
};

type RoleDraft = {
  title: string;
  employmentType:
    | "FULL_TIME"
    | "INTERNSHIP"
    | "CONTRACT";
  workMode: "ONSITE" | "HYBRID" | "REMOTE";
  locations: string;
  openings: string;
  minimumAnnualCtcInr: string;
  maximumAnnualCtcInr: string;
};

const emptyDraft: RoleDraft = {
  title: "",
  employmentType: "FULL_TIME",
  workMode: "ONSITE",
  locations: "",
  openings: "",
  minimumAnnualCtcInr: "",
  maximumAnnualCtcInr: "",
};

const inputClass = "min-h-11 w-full max-[767px]:min-h-11";

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

function money(value: number | null) {
  if (value == null) return null;
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);
}

function toDraft(
  role: PlacementRoleOptionItem,
): RoleDraft {
  return {
    title: role.title,
    employmentType:
      role.employmentType as RoleDraft["employmentType"],
    workMode:
      role.workMode as RoleDraft["workMode"],
    locations: role.locations.join(", "),
    openings: role.openings?.toString() ?? "",
    minimumAnnualCtcInr:
      role.minimumAnnualCtcInr?.toString() ?? "",
    maximumAnnualCtcInr:
      role.maximumAnnualCtcInr?.toString() ?? "",
  };
}

export function PlacementRoleOptions({
  jobId,
  jobStatus,
  roles,
}: {
  jobId: string;
  jobStatus: string;
  roles: readonly PlacementRoleOptionItem[];
}) {
  const router = useRouter();
  const { showToast } = useToast();
  const [editingId, setEditingId] =
    useState<string | null>(null);
  const [draft, setDraft] =
    useState<RoleDraft>(emptyDraft);
  const [pending, setPending] =
    useState(false);

  const activeRoles = useMemo(
    () =>
      roles.filter(
        (role) => role.status === "ACTIVE",
      ),
    [roles],
  );
  const editable = jobStatus === "DRAFT";

  function reset() {
    setEditingId(null);
    setDraft(emptyDraft);
  }

  function startEdit(
    role: PlacementRoleOptionItem,
  ) {
    if (role.isPrimary) return;
    setEditingId(role.id);
    setDraft(toDraft(role));
  }

  async function mutation(
    url: string,
    method: "POST" | "PATCH" | "DELETE",
    body?: unknown,
  ) {
    const response = await fetch(url, {
      method,
      headers:
        body === undefined
          ? undefined
          : {
              "content-type":
                "application/json",
            },
      body:
        body === undefined
          ? undefined
          : JSON.stringify(body),
    });
    const payload = (await response
      .json()
      .catch(() => null)) as
      | { error?: string }
      | null;
    if (!response.ok) {
      throw new Error(
        payload?.error ??
          "PLACEMENT_ROLE_ACTION_FAILED",
      );
    }
  }

  async function save() {
    if (!draft.title.trim()) {
      showToast({
        tone: "error",
        title: "Role title required",
        description:
          "Add a role title before saving.",
      });
      return;
    }

    setPending(true);
    try {
      const body = {
        title: draft.title.trim(),
        employmentType:
          draft.employmentType,
        workMode: draft.workMode,
        locations: draft.locations
          .split(",")
          .map((value) => value.trim())
          .filter(Boolean),
        openings: draft.openings
          ? Number(draft.openings)
          : null,
        minimumAnnualCtcInr:
          draft.minimumAnnualCtcInr
            ? Number(
                draft.minimumAnnualCtcInr,
              )
            : null,
        maximumAnnualCtcInr:
          draft.maximumAnnualCtcInr
            ? Number(
                draft.maximumAnnualCtcInr,
              )
            : null,
      };

      await mutation(
        editingId
          ? "/api/placements/jobs/" +
              jobId +
              "/roles/" +
              editingId
          : "/api/placements/jobs/" +
              jobId +
              "/roles",
        editingId ? "PATCH" : "POST",
        body,
      );
      showToast({
        tone: "success",
        title: editingId
          ? "Role updated"
          : "Role added",
        description:
          "The drive now uses the updated role options.",
      });
      reset();
      router.refresh();
    } catch (error) {
      showToast({
        tone: "error",
        title: "Could not save role",
        description:
          error instanceof Error
            ? humanize(error.message)
            : "Please try again.",
      });
    } finally {
      setPending(false);
    }
  }

  async function archive(
    role: PlacementRoleOptionItem,
  ) {
    setPending(true);
    try {
      await mutation(
        "/api/placements/jobs/" +
          jobId +
          "/roles/" +
          role.id,
        "DELETE",
      );
      showToast({
        tone: "success",
        title: "Role archived",
        description:
          "The role is no longer available in this draft drive.",
      });
      if (editingId === role.id) {
        reset();
      }
      router.refresh();
    } catch (error) {
      showToast({
        tone: "error",
        title: "Could not archive role",
        description:
          error instanceof Error
            ? humanize(error.message)
            : "Please try again.",
      });
    } finally {
      setPending(false);
    }
  }

  return (
    <section className="border-b border-border pb-6">
      <div className="border-b border-border pb-3">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="m-0 text-base font-semibold text-foreground">
              Drive roles
            </h2>
            <p className="mt-1 text-sm text-body">
              One employer drive can expose multiple exact role options. The primary role stays synchronized with the main drive details.
            </p>
          </div>
          <StatusBadge tone="info">
            {activeRoles.length} active
          </StatusBadge>
        </div>
      </div>

      <div className="grid gap-3 pt-4 lg:grid-cols-2">
        {activeRoles.map((role) => (
          <article
            key={role.id}
            className="border-b border-border py-4"
          >
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <p className="m-0 font-semibold text-foreground">
                    {role.title}
                  </p>
                  {role.isPrimary ? (
                    <StatusBadge tone="success">
                      Primary
                    </StatusBadge>
                  ) : null}
                </div>
                <p className="mt-1 text-sm text-body">
                  {humanize(
                    role.employmentType,
                  )}{" "}
                  · {humanize(role.workMode)}
                </p>
              </div>
              {editable &&
              !role.isPrimary ? (
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="secondary"
                    disabled={pending}
                    onClick={() =>
                      startEdit(role)
                    }
                  >
                    Edit
                  </Button>
                  <Button
                    size="sm"
                    variant="secondary"
                    disabled={pending}
                    onClick={() =>
                      archive(role)
                    }
                  >
                    Archive
                  </Button>
                </div>
              ) : null}
            </div>
            <p className="mt-3 text-sm text-body">
              {role.locations.length
                ? role.locations.join(", ")
                : "Location not specified"}
              {" · "}
              {role.openings == null
                ? "Openings not specified"
                : role.openings +
                  (role.openings === 1
                    ? " opening"
                    : " openings")}
            </p>
            <p className="mt-1 text-sm text-body">
              {money(
                role.minimumAnnualCtcInr,
              ) ??
                "No minimum CTC"}
              {" – "}
              {money(
                role.maximumAnnualCtcInr,
              ) ??
                "No maximum CTC"}
            </p>
            {role.isPrimary && editable ? (
              <p className="mt-2 text-xs text-muted-foreground">
                Edit this role through the main draft details above so the compatibility job projection stays identical.
              </p>
            ) : null}
          </article>
        ))}
      </div>

      {editable ? (
        <div className="border-t border-border py-5">
          <div className="mb-4">
            <h3 className="m-0 text-sm font-semibold text-foreground">
              {editingId
                ? "Edit additional role"
                : "Add another role"}
            </h3>
            <p className="mt-1 text-xs text-muted-foreground">
              Eligibility and drive rounds remain shared; the application itself is bound to this exact role.
            </p>
          </div>
          <div className="grid gap-3 lg:grid-cols-3">
            <label>
              <span className="mb-1 block text-xs font-semibold text-body">
                Role title
              </span>
              <Input
                className={inputClass}
                value={draft.title}
                onChange={(event) =>
                  setDraft((current) => ({
                    ...current,
                    title:
                      event.target.value,
                  }))
                }
              />
            </label>
            <label>
              <span className="mb-1 block text-xs font-semibold text-body">
                Employment
              </span>
              <Select
                className={inputClass}
                value={
                  draft.employmentType
                }
                onChange={(event) =>
                  setDraft((current) => ({
                    ...current,
                    employmentType:
                      event.target
                        .value as RoleDraft["employmentType"],
                  }))
                }
              >
                <option value="FULL_TIME">
                  Full time
                </option>
                <option value="INTERNSHIP">
                  Internship
                </option>
                <option value="CONTRACT">
                  Contract
                </option>
              </Select>
            </label>
            <label>
              <span className="mb-1 block text-xs font-semibold text-body">
                Work mode
              </span>
              <Select
                className={inputClass}
                value={draft.workMode}
                onChange={(event) =>
                  setDraft((current) => ({
                    ...current,
                    workMode:
                      event.target
                        .value as RoleDraft["workMode"],
                  }))
                }
              >
                <option value="ONSITE">
                  Onsite
                </option>
                <option value="HYBRID">
                  Hybrid
                </option>
                <option value="REMOTE">
                  Remote
                </option>
              </Select>
            </label>
            <label className="lg:col-span-2">
              <span className="mb-1 block text-xs font-semibold text-body">
                Locations
              </span>
              <Input
                className={inputClass}
                placeholder="Hyderabad, Bengaluru"
                value={draft.locations}
                onChange={(event) =>
                  setDraft((current) => ({
                    ...current,
                    locations:
                      event.target.value,
                  }))
                }
              />
            </label>
            <label>
              <span className="mb-1 block text-xs font-semibold text-body">
                Openings
              </span>
              <Input
                className={inputClass}
                type="number"
                min="1"
                value={draft.openings}
                onChange={(event) =>
                  setDraft((current) => ({
                    ...current,
                    openings:
                      event.target.value,
                  }))
                }
              />
            </label>
            <label>
              <span className="mb-1 block text-xs font-semibold text-body">
                Minimum CTC (INR)
              </span>
              <Input
                className={inputClass}
                type="number"
                min="0"
                value={
                  draft.minimumAnnualCtcInr
                }
                onChange={(event) =>
                  setDraft((current) => ({
                    ...current,
                    minimumAnnualCtcInr:
                      event.target.value,
                  }))
                }
              />
            </label>
            <label>
              <span className="mb-1 block text-xs font-semibold text-body">
                Maximum CTC (INR)
              </span>
              <Input
                className={inputClass}
                type="number"
                min="0"
                value={
                  draft.maximumAnnualCtcInr
                }
                onChange={(event) =>
                  setDraft((current) => ({
                    ...current,
                    maximumAnnualCtcInr:
                      event.target.value,
                  }))
                }
              />
            </label>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button
              size="sm"
              disabled={pending}
              onClick={save}
            >
              {pending
                ? "Saving…"
                : editingId
                  ? "Save role"
                  : "Add role"}
            </Button>
            {editingId ? (
              <Button
                size="sm"
                variant="secondary"
                disabled={pending}
                onClick={reset}
              >
                Cancel
              </Button>
            ) : null}
          </div>
        </div>
      ) : null}
    </section>
  );
}
