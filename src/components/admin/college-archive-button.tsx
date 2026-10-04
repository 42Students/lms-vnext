"use client";

import {
  useState,
  useTransition,
} from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { useToast } from "@/components/ui/toast";

type CollegeUsage = {
  memberships?: number;
  departments?: number;
  academicPeriods?: number;
  projectTemplateAssignments?: number;
  projects?: number;
  placementRelationships?: number;
  placementSeasons?: number;
  placementJobs?: number;
  tenantDomains?: number;
};

function dependencySummary(
  usage: CollegeUsage | undefined,
) {
  if (!usage) return "";

  const labels: Array<
    [keyof CollegeUsage, string]
  > = [
    ["memberships", "membership(s)"],
    ["departments", "department(s)"],
    ["academicPeriods", "academic period(s)"],
    [
      "projectTemplateAssignments",
      "project template assignment(s)",
    ],
    ["projects", "project(s)"],
    [
      "placementRelationships",
      "placement relationship(s)",
    ],
    ["placementSeasons", "placement season(s)"],
    ["placementJobs", "placement job(s)"],
    ["tenantDomains", "tenant domain(s)"],
  ];

  return labels
    .map(([key, label]) =>
      usage[key]
        ? `${usage[key]} ${label}`
        : null,
    )
    .filter(Boolean)
    .join(", ");
}

export function CollegeArchiveButton({
  collegeId,
  name,
}: {
  collegeId: string;
  name: string;
}) {
  const router = useRouter();
  const { showToast } = useToast();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] =
    useTransition();

  function archive() {
    startTransition(async () => {
      const response = await fetch(
        `/api/colleges/${collegeId}`,
        { method: "DELETE" },
      );
      const payload =
        await response.json().catch(() => null);

      if (!response.ok) {
        const dependencies =
          dependencySummary(
            payload?.usage as
              | CollegeUsage
              | undefined,
          );

        showToast({
          tone: "error",
          title: "Archive blocked",
          description:
            payload?.error ===
            "COLLEGE_HAS_DEPENDENCIES"
              ? `Clear or close live dependencies first${dependencies ? `: ${dependencies}` : "."}`
              : payload?.error === "FORBIDDEN"
                ? "Only a Super Admin can archive a college."
                : "The college could not be archived.",
        });
        return;
      }

      setOpen(false);
      showToast({
        tone: "success",
        title: "College archived",
        description:
          `${name} is no longer active.`,
      });
      router.refresh();
    });
  }

  return (
    <>
      <Button
        variant="danger"
        size="sm"
        onClick={() => setOpen(true)}
      >
        Archive
      </Button>
      <Dialog
        open={open}
        onOpenChange={setOpen}
        title="Archive college"
        description={`Archive ${name}? This disables the tenant boundary and is allowed only after all live dependencies are cleared.`}
        footer={
          <>
            <Button
              variant="secondary"
              disabled={pending}
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              disabled={pending}
              onClick={archive}
            >
              {pending
                ? "Archiving…"
                : "Archive college"}
            </Button>
          </>
        }
      >
        <p className="m-0 text-sm text-body">
          The server checks memberships,
          departments, academic periods,
          Projects, Placements and tenant
          domains immediately before archive.
        </p>
      </Dialog>
    </>
  );
}
