"use client";

import {
  useState,
  useTransition,
} from "react";
import type { MembershipRole } from "@/modules/identity/constants";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Alert } from "@/components/ui/alert";
import { LoadingState } from "@/components/ui/loading-state";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { useToast } from "@/components/ui/toast";

type DepartmentOption = {
  id: string;
  name: string;
};

export function PersonProfileDialog({
  membershipId,
  collegeId,
  displayName,
  roles,
  disabled = false,
}: {
  membershipId: string;
  collegeId: string;
  displayName: string;
  roles: readonly MembershipRole[];
  disabled?: boolean;
}) {
  const { showToast } = useToast();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [pending, startTransition] = useTransition();
  const [loadError, setLoadError] = useState<string | null>(null);
  const [departments, setDepartments] = useState<DepartmentOption[]>([]);
  const [rollNumber, setRollNumber] = useState("");
  const [registrationNumber, setRegistrationNumber] = useState("");
  const [primaryDepartmentId, setPrimaryDepartmentId] = useState("");
  const [employmentType, setEmploymentType] = useState("");
  const [academicTitle, setAcademicTitle] = useState("");

  const hasLearner = roles.includes("LEARNER");
  const hasFaculty = roles.includes("FACULTY");

  async function load() {
    setLoading(true);
    setLoadError(null);

    try {
      const requests: Promise<Response>[] = [];
      const kinds: Array<"learner" | "faculty" | "departments"> = [];

      if (hasLearner) {
        requests.push(
          fetch(`/api/people/${membershipId}/learner-profile`),
        );
        kinds.push("learner");
      }

      if (hasFaculty) {
        requests.push(
          fetch(`/api/people/${membershipId}/faculty-profile`),
        );
        kinds.push("faculty");
        requests.push(
          fetch(
            `/api/departments?collegeId=${encodeURIComponent(collegeId)}`,
          ),
        );
        kinds.push("departments");
      }

      const responses = await Promise.all(requests);

      for (let index = 0; index < responses.length; index += 1) {
        const response = responses[index]!;
        const payload = await response.json().catch(() => null);

        if (!response.ok) {
          throw new Error(payload?.error ?? "PROFILE_LOAD_FAILED");
        }

        switch (kinds[index]) {
          case "learner":
            setRollNumber(payload?.profile?.rollNumber ?? "");
            setRegistrationNumber(
              payload?.profile?.registrationNumber ?? "",
            );
            break;
          case "faculty":
            setPrimaryDepartmentId(
              payload?.profile?.primaryDepartmentId ?? "",
            );
            setEmploymentType(
              payload?.profile?.employmentType ?? "",
            );
            setAcademicTitle(
              payload?.profile?.academicTitle ?? "",
            );
            break;
          case "departments":
            setDepartments(payload?.departments ?? []);
            break;
        }
      }
    } catch {
      setLoadError(
        "Profile data could not be loaded. Close and try again.",
      );
    } finally {
      setLoading(false);
    }
  }

  function openDialog() {
    setOpen(true);
    void load();
  }

  function nullable(value: string) {
    const trimmed = value.trim();
    return trimmed ? trimmed : null;
  }

  function save() {
    if (pending || loading || loadError) return;
    startTransition(async () => {
      const requests: Promise<Response>[] = [];

      if (hasLearner) {
        requests.push(
          fetch(`/api/people/${membershipId}/learner-profile`, {
            method: "PUT",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({
              rollNumber: nullable(rollNumber),
              registrationNumber: nullable(registrationNumber),
            }),
          }),
        );
      }

      if (hasFaculty) {
        requests.push(
          fetch(`/api/people/${membershipId}/faculty-profile`, {
            method: "PUT",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({
              primaryDepartmentId:
                primaryDepartmentId || null,
              employmentType: nullable(employmentType),
              academicTitle: nullable(academicTitle),
            }),
          }),
        );
      }

      let responses: Response[];
      try {
        responses = await Promise.all(requests);
      } catch {
        showToast({ tone: "error", title: "Profile update could not be confirmed",
          description: "The connection was interrupted. Reload the profile before retrying." });
        return;
      }
      const failed = responses.find((response) => !response.ok);

      if (failed) {
        const payload = await failed.json().catch(() => null);
        showToast({
          tone: "error",
          title: "Profile update failed",
          description:
            payload?.error === "DEPARTMENT_NOT_FOUND"
              ? "The selected department is not active in this college."
              : "The profile could not be saved.",
        });
        return;
      }

      setOpen(false);
      showToast({
        tone: "success",
        title: "Profile updated",
        description: `${displayName}'s membership profile was saved.`,
      });
    });
  }

  if (!hasLearner && !hasFaculty) {
    return null;
  }

  return (
    <>
      <Button
        variant="secondary"
        size="sm"
        className="min-h-11 md:min-h-9"
        disabled={disabled}
        onClick={openDialog}
      >
        Profile
      </Button>

      <Dialog
        open={open}
        onOpenChange={next => { if (!pending) setOpen(next); }}
        dismissible={!pending}
        title={`Profile · ${displayName}`}
        description="Profile fields are membership-scoped and do not change authorization roles."
        footer={
          <>
            <Button
              variant="secondary"
              className="min-h-11 md:min-h-9"
              disabled={pending}
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button
              className="min-h-11 md:min-h-9"
              loading={pending}
              disabled={
                loading ||
                pending ||
                Boolean(loadError)
              }
              onClick={save}
            >
              {pending ? "Saving…" : "Save profile"}
            </Button>
          </>
        }
      >
        {loading ? (
          <LoadingState label="Loading profile…" />
        ) : loadError ? (
          <Alert tone="error">{loadError}</Alert>
        ) : (
          <div className="min-w-0 space-y-[var(--lms-space-5)]">
            {hasLearner ? (
              <fieldset className="grid min-w-0 gap-[var(--lms-space-4)] md:grid-cols-2">
                <legend className="mb-3 text-sm font-semibold text-[var(--lms-heading)]">
                  Learner profile
                </legend>
                <div>
                  <label
                    htmlFor={`roll-${membershipId}`}
                    className="mb-1.5 block text-[13px] font-semibold text-body"
                  >
                    Roll number
                  </label>
                  <Input className="min-h-11 md:min-h-9"
                    id={`roll-${membershipId}`}
                    value={rollNumber}
                    onChange={(event) =>
                      setRollNumber(event.target.value)
                    }
                    maxLength={128}
                  />
                </div>
                <div>
                  <label
                    htmlFor={`registration-${membershipId}`}
                    className="mb-1.5 block text-[13px] font-semibold text-body"
                  >
                    Registration number
                  </label>
                  <Input className="min-h-11 md:min-h-9"
                    id={`registration-${membershipId}`}
                    value={registrationNumber}
                    onChange={(event) =>
                      setRegistrationNumber(event.target.value)
                    }
                    maxLength={128}
                  />
                </div>
              </fieldset>
            ) : null}

            {hasFaculty ? (
              <fieldset className="grid min-w-0 gap-[var(--lms-space-4)] md:grid-cols-2">
                <legend className="mb-3 text-sm font-semibold text-[var(--lms-heading)]">
                  Faculty profile
                </legend>
                <div className="md:col-span-2">
                  <label
                    htmlFor={`department-${membershipId}`}
                    className="mb-1.5 block text-[13px] font-semibold text-body"
                  >
                    Primary department
                  </label>
                  <Select className="min-h-11 md:min-h-9"
                    id={`department-${membershipId}`}
                    value={primaryDepartmentId}
                    onChange={(event) =>
                      setPrimaryDepartmentId(event.target.value)
                    }
                  >
                    <option value="">No primary department</option>
                    {departments.map((department) => (
                      <option
                        key={department.id}
                        value={department.id}
                      >
                        {department.name}
                      </option>
                    ))}
                  </Select>
                </div>
                <div>
                  <label
                    htmlFor={`employment-${membershipId}`}
                    className="mb-1.5 block text-[13px] font-semibold text-body"
                  >
                    Employment type
                  </label>
                  <Input className="min-h-11 md:min-h-9"
                    id={`employment-${membershipId}`}
                    value={employmentType}
                    onChange={(event) =>
                      setEmploymentType(event.target.value)
                    }
                    maxLength={128}
                    placeholder="e.g. Full-time"
                  />
                </div>
                <div>
                  <label
                    htmlFor={`title-${membershipId}`}
                    className="mb-1.5 block text-[13px] font-semibold text-body"
                  >
                    Academic title
                  </label>
                  <Input className="min-h-11 md:min-h-9"
                    id={`title-${membershipId}`}
                    value={academicTitle}
                    onChange={(event) =>
                      setAcademicTitle(event.target.value)
                    }
                    maxLength={128}
                    placeholder="e.g. Assistant Professor"
                  />
                </div>
              </fieldset>
            ) : null}
          </div>
        )}
      </Dialog>
    </>
  );
}
