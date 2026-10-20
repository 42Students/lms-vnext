"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { DataTable } from "@/components/ui/data-table";
import { Dialog } from "@/components/ui/dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { Banner } from "@/components/ui/banner";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { StatusBadge } from "@/components/ui/status-badge";
import { useToast } from "@/components/ui/toast";
import { LECTURE_HALL_COPY, ROOM_TYPE_LABELS } from "@/modules/academics/lecture-hall-copy";

export type HallRow = {
  id: string;
  name: string;
  capacity: number;
  roomType: string;
  description: string | null;
  status: string;
  departmentId: string | null;
  departmentName: string | null;
  upcomingClasses: number;
};

type Draft = {
  name: string;
  capacity: string;
  roomType: string;
  departmentId: string;
  description: string;
};

const EMPTY: Draft = {
  name: "",
  capacity: "50",
  roomType: "LECTURE_HALL",
  departmentId: "",
  description: "",
};

function toDraft(hall: HallRow): Draft {
  return {
    name: hall.name,
    capacity: String(hall.capacity),
    roomType: hall.roomType,
    departmentId: hall.departmentId ?? "",
    description: hall.description ?? "",
  };
}

function errorText(payload: {
  error?: string;
  upcomingClasses?: number;
  issues?: { message?: string }[];
} | null) {
  switch (payload?.error) {
    case "HALL_NAME_TAKEN":
      return "Another active hall in this college already has that name.";
    case "HALL_IN_USE":
      return `It has ${payload.upcomingClasses ?? "some"} upcoming class(es). Move or cancel them first.`;
    case "HALL_CAPACITY_CONFLICT":
      return "The new capacity is below the configured capacity of an upcoming scheduled class.";
    case "DEPARTMENT_NOT_FOUND":
      return "That department isn't an active department of this college.";
    case "INVALID_REQUEST":
      return payload.issues?.[0]?.message ?? "Check the fields and try again.";
    default:
      return "Something went wrong. Please try again.";
  }
}

export function LectureHallManager({
  collegeId,
  halls,
  departments,
  emptyState,
  availabilityBase = "/college/lecture-halls",
}: {
  collegeId: string;
  halls: readonly HallRow[];
  departments: readonly { id: string; name: string }[];
  emptyState?: { title: string; description: string };
  availabilityBase?: "/college/lecture-halls" | "/admin/lecture-halls";
}) {
  const router = useRouter();
  const { showToast } = useToast();
  const [pending, startTransition] = useTransition();
  const [editing, setEditing] = useState<HallRow | "new" | null>(null);
  const [draft, setDraft] = useState<Draft>(EMPTY);
  const [formError, setFormError] = useState<string | null>(null);
  const [archiving, setArchiving] = useState<HallRow | null>(null);

  function open(target: HallRow | "new") {
    setDraft(target === "new" ? EMPTY : toDraft(target));
    setFormError(null);
    setEditing(target);
  }

  function save() {
    const capacity = Number(draft.capacity);
    if (!draft.name.trim()) return setFormError("Enter a name.");
    if (!Number.isInteger(capacity) || capacity < 1 || capacity > 5000) {
      return setFormError("Capacity must be between 1 and 5000.");
    }

    startTransition(async () => {
      try {
      const body = {
        name: draft.name,
        capacity,
        roomType: draft.roomType,
        description: draft.description || null,
        departmentId: draft.departmentId || null,
      };
      const isNew = editing === "new";
      const response = await fetch(
        isNew ? "/api/lecture-halls" : `/api/lecture-halls/${(editing as HallRow).id}`,
        {
          method: isNew ? "POST" : "PATCH",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(isNew ? { collegeId, ...body } : body),
        },
      );

      if (!response.ok) {
        setFormError(errorText(await response.json().catch(() => null)));
        return;
      }

      setEditing(null);
      showToast({
        tone: "success",
        title: isNew ? LECTURE_HALL_COPY.createdMessage : LECTURE_HALL_COPY.updatedMessage,
      });
      router.refresh();
      } catch {
        setFormError("Could not save the hall. Check your connection and retry.");
      }
    });
  }

  function setStatus(hall: HallRow, status: "ARCHIVED" | "ACTIVE") {
    startTransition(async () => {
      try {
      const response = await fetch(`/api/lecture-halls/${hall.id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ status }),
      });

      if (!response.ok) {
        showToast({
          tone: "error",
          title: status === "ARCHIVED" ? "Archive blocked" : "Restore failed",
          description: errorText(await response.json().catch(() => null)),
        });
        setArchiving(null);
        return;
      }

      setArchiving(null);
      showToast({
        tone: "success",
        title: status === "ARCHIVED" ? "Hall archived" : "Hall restored",
      });
      router.refresh();
      } catch {
        setArchiving(null);
        showToast({tone:"error",title:"Could not update hall status",description:"Check your connection and retry."});
      }
    });
  }

  const field = "mb-1.5 block text-[13px] font-semibold text-body";

  return (
    <div className="space-y-4">
      <div className="flex justify-end print:hidden">
        <Button className="min-h-11 md:min-h-9" onClick={() => open("new")}>{LECTURE_HALL_COPY.createTitle}</Button>
      </div>

      {halls.length === 0 ? (
        <EmptyState
          title={emptyState?.title ?? "No lecture halls found."}
          description={emptyState?.description ?? "Add the rooms your college teaches in, so classes can be scheduled into them."}
        />
      ) : (
        <DataTable empty={<EmptyState title="No lecture halls" description="No records to show."/>}
          columns={[
            { key: "name", header: LECTURE_HALL_COPY.columns.name, mobilePriority: "primary", cell: (hall: HallRow) => <span className="font-semibold text-foreground">{hall.name}</span> },
            { key: "type", header: LECTURE_HALL_COPY.columns.type, cell: (hall) => ROOM_TYPE_LABELS[hall.roomType] ?? hall.roomType },
            { key: "capacity", header: "Capacity", cell: (hall) => hall.capacity },
            { key: "dept", header: LECTURE_HALL_COPY.columns.department, cell: (hall) => hall.departmentName ?? "—" },
            { key: "description", header: LECTURE_HALL_COPY.columns.description, cell: (hall) => hall.description || "—" },
            {
              key: "upcoming",
              header: "Upcoming classes",
              cell: (hall) => (hall.upcomingClasses ? hall.upcomingClasses : "—"),
            },
            {
              key: "status",
              header: "Status",
              cell: (hall) => (
                <StatusBadge tone={hall.status === "ACTIVE" ? "success" : "neutral"}>
                  {hall.status === "ACTIVE" ? "Active" : "Archived"}
                </StatusBadge>
              ),
            },
            {
              key: "actions",
              header: "",
              mobilePriority: "action",
              className: "text-right",
              cell: (hall) => (
                <div className="flex flex-wrap justify-end gap-2 print:hidden">
                  <Link href={`${availabilityBase}/${hall.id}`}
                    className="inline-flex min-h-11 items-center rounded-[var(--lms-control-radius)] border border-border bg-surface px-3 text-sm font-semibold text-primary-text hover:border-primary hover:bg-primary-subtle focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)] md:min-h-9">
                    Availability
                  </Link>
                  <Button className="min-h-11 md:min-h-9" variant="secondary" size="sm" onClick={() => open(hall)}>
                    Edit
                  </Button>
                  {hall.status === "ACTIVE" ? (
                    <Button className="min-h-11 md:min-h-9" variant="danger" size="sm" onClick={() => setArchiving(hall)}>
                      Archive
                    </Button>
                  ) : (
                    <Button
                      variant="secondary"
                      size="sm"
                      disabled={pending}
                      onClick={() => setStatus(hall, "ACTIVE")}
                    >
                      Restore
                    </Button>
                  )}
                </div>
              ),
            },
          ]}
          rows={halls}
          getRowKey={(hall) => hall.id}
        />
      )}

      <Dialog
        open={editing !== null}
        onOpenChange={(value) => !value && !pending && setEditing(null)}
        title={editing === "new" ? LECTURE_HALL_COPY.createTitle : "Edit lecture hall"}
        description="Hall names stay unique among the college's active halls."
        footer={
          <>
            <Button className="min-h-11 md:min-h-9" variant="secondary" disabled={pending} onClick={() => setEditing(null)}>
              Cancel
            </Button>
            <Button className="min-h-11 md:min-h-9" disabled={pending} onClick={save}>
              {pending ? "Saving…" : editing === "new" ? LECTURE_HALL_COPY.createButton : "Save hall"}
            </Button>
          </>
        }
      >
        <div className="space-y-3">
          {formError ? (
            <Banner tone="error">
              {formError}
            </Banner>
          ) : null}
          <div>
            <label className={field} htmlFor="hall-name">{LECTURE_HALL_COPY.nameLabel}</label>
            <Input className="min-h-11 md:min-h-9" id="hall-name" value={draft.name} maxLength={255} placeholder={LECTURE_HALL_COPY.namePlaceholder}
              onChange={(e) => setDraft({ ...draft, name: e.target.value })} />
          </div>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <div>
              <label className={field} htmlFor="hall-capacity">{LECTURE_HALL_COPY.capacityLabel}</label>
              <Input className="min-h-11 md:min-h-9" id="hall-capacity" type="number" min={1} max={5000} value={draft.capacity}
                onChange={(e) => setDraft({ ...draft, capacity: e.target.value })} />
            </div>
            <div>
              <label className={field} htmlFor="hall-type">{LECTURE_HALL_COPY.typeLabel}</label>
              <Select className="min-h-11 md:min-h-9" id="hall-type" value={draft.roomType}
                onChange={(e) => setDraft({ ...draft, roomType: e.target.value })}>
                {Object.entries(ROOM_TYPE_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </Select>
            </div>
          </div>
          <div>
            <label className={field} htmlFor="hall-dept">{LECTURE_HALL_COPY.departmentLabel}</label>
            <Select className="min-h-11 md:min-h-9" id="hall-dept" value={draft.departmentId}
              onChange={(e) => setDraft({ ...draft, departmentId: e.target.value })}>
              <option value="">Shared by all departments</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </Select>
          </div>
          <div>
            <label className={field} htmlFor="hall-desc">{LECTURE_HALL_COPY.descriptionLabel}</label>
            <Input className="min-h-11 md:min-h-9" id="hall-desc" value={draft.description} maxLength={255} placeholder={LECTURE_HALL_COPY.descriptionPlaceholder}
              onChange={(e) => setDraft({ ...draft, description: e.target.value })} />
          </div>
        </div>
      </Dialog>

      <ConfirmDialog
        open={archiving !== null}
        onOpenChange={(value) => !value && setArchiving(null)}
        title="Archive lecture hall"
        description={`Archive ${archiving?.name ?? "this hall"}? It can't be archived while it has upcoming classes.`}
        confirmLabel="Archive hall"
        pending={pending}
        onConfirm={() => archiving && setStatus(archiving, "ARCHIVED")}
      />
    </div>
  );
}
