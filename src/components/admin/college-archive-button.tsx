"use client";

import {
  useRef,
  useState,
  useTransition,
} from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Alert } from "@/components/ui/alert";
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
  const [archiveError,setArchiveError]=useState("");
  const [pending, startTransition] =
    useTransition();
  const inFlightRef=useRef(false);

  function archive() {
    if(inFlightRef.current||pending)return;
    inFlightRef.current=true;
    startTransition(async () => {
      try {
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

        const message=payload?.error==="COLLEGE_HAS_DEPENDENCIES"
          ? `Resolve linked records before archiving${dependencies?`: ${dependencies}`:"."}`
          : payload?.error==="FORBIDDEN"
            ? "Only a Super Admin can archive this college."
            : payload?.error==="COLLEGE_NOT_FOUND"
              ? "This college is no longer active. Refresh the directory."
              : "The college could not be archived. Refresh and retry.";
        setArchiveError(message);
        showToast({tone:"error",title:"Failed to archive college",description:message});
        return;
      }

      setArchiveError("");
      setOpen(false);
      showToast({
        tone: "success",
        title: "College archived",
        description:
          `${name} is no longer active.`,
      });
      router.refresh();
      } catch {
        setArchiveError("The college could not be archived. Check your connection and try again.");
        showToast({tone:"error",title:"Failed to archive college",description:"The college could not be archived."});
      } finally {
        inFlightRef.current=false;
      }
    });
  }

  return (
    <>
      <Button
        variant="danger"
        size="sm"
        className="min-h-11 w-full sm:w-auto md:min-h-9 print:hidden"
        disabled={pending}
        onClick={() => {setArchiveError("");setOpen(true);}}
      >
        Archive
      </Button>
      <Dialog
        open={open}
        onOpenChange={next=>{if(!pending)setOpen(next);}}
        dismissible={!pending}
        title="Archive college"
        description={`Archive ${name}? This deactivates the tenant without deleting historical records and requires all linked dependencies to be resolved.`}
        footer={
          <div className="flex w-full flex-col-reverse gap-[var(--lms-space-2)] md:flex-row md:justify-end [&>button]:w-full md:[&>button]:w-auto">
            <Button
              variant="secondary"
              className="min-h-11 w-full md:min-h-9 print:hidden"
              disabled={pending}
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              className="min-h-11 md:min-h-9 print:hidden"
              disabled={pending}
              loading={pending}
              onClick={archive}
            >
              {pending
                ? "Archiving…"
                : "Archive college"}
            </Button>
          </div>
        }
      >
        {archiveError?<Alert tone="error">
          <p>{archiveError}</p>
          <Button type="button" variant="ghost" disabled={pending} onClick={archive}>Retry archive</Button>
        </Alert>:null}
        <p className="m-0 max-w-prose text-sm text-body">
          The server rechecks memberships, departments, academic periods,
          Projects, Placements and tenant domains before archiving.
          Archived colleges remain available for authorized restoration. If this
          college is your selected scope, that selection is cleared. Restoration
          does not automatically reactivate child memberships or domains.
        </p>
      </Dialog>
    </>
  );
}
