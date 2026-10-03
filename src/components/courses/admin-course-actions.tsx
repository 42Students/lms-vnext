"use client";

import {
  useState,
  useTransition,
} from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/toast";
import { courseApiError } from "./learner-course-api";

async function mutate(
  path: string,
  method: "PATCH" | "DELETE",
  body?: unknown,
) {
  const response = await fetch(path, {
    method,
    headers: body
      ? { "Content-Type": "application/json" }
      : undefined,
    body: body
      ? JSON.stringify(body)
      : undefined,
  });

  if (!response.ok) {
    throw new Error(
      await courseApiError(response),
    );
  }

  return response.json();
}

function useCourseMutation() {
  const router = useRouter();
  const { showToast } = useToast();
  const [pending, startTransition] =
    useTransition();

  function run(
    task: () => Promise<unknown>,
    successTitle: string,
    onSuccess?: () => void,
  ) {
    startTransition(async () => {
      try {
        await task();
        onSuccess?.();
        showToast({
          tone: "success",
          title: successTitle,
        });
        router.refresh();
      } catch (error) {
        showToast({
          tone: "error",
          title: "Course update failed",
          description:
            error instanceof Error
              ? error.message
              : "The request could not be completed.",
        });
      }
    });
  }

  return { pending, run };
}

export function CourseActions({
  course,
}: {
  course: {
    id: string;
    name: string;
    code: string;
    description: string | null;
  };
}) {
  const [editOpen, setEditOpen] =
    useState(false);
  const [archiveOpen, setArchiveOpen] =
    useState(false);
  const [name, setName] =
    useState(course.name);
  const [code, setCode] =
    useState(course.code);
  const [description, setDescription] =
    useState(course.description ?? "");
  const { pending, run } =
    useCourseMutation();

  function openEdit() {
    setName(course.name);
    setCode(course.code);
    setDescription(
      course.description ?? "",
    );
    setEditOpen(true);
  }

  return (
    <>
      <div className="flex justify-end gap-2">
        <Button
          size="sm"
          variant="secondary"
          onClick={openEdit}
        >
          Edit
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={() =>
            setArchiveOpen(true)
          }
        >
          Archive
        </Button>
      </div>

      <Dialog
        open={editOpen}
        onOpenChange={setEditOpen}
        title="Edit Course"
        description="Department ownership is immutable after Course creation."
        footer={
          <>
            <Button
              variant="secondary"
              disabled={pending}
              onClick={() =>
                setEditOpen(false)
              }
            >
              Cancel
            </Button>
            <Button
              disabled={
                pending ||
                !name.trim() ||
                !code.trim()
              }
              onClick={() =>
                run(
                  () =>
                    mutate(
                      "/api/courses/" +
                        course.id,
                      "PATCH",
                      {
                        name,
                        code,
                        description:
                          description.trim() ||
                          null,
                      },
                    ),
                  "Course updated",
                  () => setEditOpen(false),
                )
              }
            >
              {pending
                ? "Saving…"
                : "Save"}
            </Button>
          </>
        }
      >
        <div className="grid gap-4">
          <label>
            <span className="mb-1.5 block text-xs font-semibold text-body">
              Name
            </span>
            <Input
              value={name}
              onChange={(event) =>
                setName(event.target.value)
              }
              maxLength={255}
            />
          </label>
          <label>
            <span className="mb-1.5 block text-xs font-semibold text-body">
              Code
            </span>
            <Input
              value={code}
              onChange={(event) =>
                setCode(event.target.value)
              }
              maxLength={64}
            />
          </label>
          <label>
            <span className="mb-1.5 block text-xs font-semibold text-body">
              Description
            </span>
            <Textarea
              value={description}
              onChange={(event) =>
                setDescription(
                  event.target.value,
                )
              }
              maxLength={5000}
            />
          </label>
        </div>
      </Dialog>

      <ConfirmDialog
        open={archiveOpen}
        onOpenChange={setArchiveOpen}
        title={"Archive " + course.name + "?"}
        description="A Course with active Offerings cannot be archived. Historical records remain preserved."
        confirmLabel="Archive Course"
        pending={pending}
        onConfirm={() =>
          run(
            () =>
              mutate(
                "/api/courses/" +
                  course.id,
                "DELETE",
              ),
            "Course archived",
            () => setArchiveOpen(false),
          )
        }
      />
    </>
  );
}

export function OfferingActions({
  offering,
}: {
  offering: {
    id: string;
    type: "CORE" | "ELECTIVE";
    credits: number | null;
    displayOrder: number;
    courseName: string;
  };
}) {
  const [editOpen, setEditOpen] =
    useState(false);
  const [archiveOpen, setArchiveOpen] =
    useState(false);
  const [type, setType] = useState<
    "CORE" | "ELECTIVE"
  >(offering.type);
  const [credits, setCredits] =
    useState(
      offering.credits === null
        ? ""
        : String(offering.credits),
    );
  const [displayOrder, setDisplayOrder] =
    useState(
      String(offering.displayOrder),
    );
  const { pending, run } =
    useCourseMutation();

  function openEdit() {
    setType(offering.type);
    setCredits(
      offering.credits === null
        ? ""
        : String(offering.credits),
    );
    setDisplayOrder(
      String(offering.displayOrder),
    );
    setEditOpen(true);
  }

  return (
    <>
      <div className="flex justify-end gap-2">
        <Button
          size="sm"
          variant="secondary"
          onClick={openEdit}
        >
          Edit
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={() =>
            setArchiveOpen(true)
          }
        >
          Archive
        </Button>
      </div>

      <Dialog
        open={editOpen}
        onOpenChange={setEditOpen}
        title="Edit Course Offering"
        description="Course, Cohort and Academic Period ownership are immutable."
        footer={
          <>
            <Button
              variant="secondary"
              disabled={pending}
              onClick={() =>
                setEditOpen(false)
              }
            >
              Cancel
            </Button>
            <Button
              disabled={pending}
              onClick={() =>
                run(
                  () =>
                    mutate(
                      "/api/courses/offerings/" +
                        offering.id,
                      "PATCH",
                      {
                        type,
                        credits: credits
                          ? Number(credits)
                          : null,
                        displayOrder:
                          Number(
                            displayOrder,
                          ),
                      },
                    ),
                  "Course Offering updated",
                  () => setEditOpen(false),
                )
              }
            >
              {pending
                ? "Saving…"
                : "Save"}
            </Button>
          </>
        }
      >
        <div className="grid gap-4">
          <label>
            <span className="mb-1.5 block text-xs font-semibold text-body">
              Type
            </span>
            <Select
              value={type}
              onChange={(event) =>
                setType(
                  event.target.value as
                    | "CORE"
                    | "ELECTIVE",
                )
              }
            >
              <option value="CORE">
                Core
              </option>
              <option value="ELECTIVE">
                Elective
              </option>
            </Select>
          </label>
          <label>
            <span className="mb-1.5 block text-xs font-semibold text-body">
              Credits
            </span>
            <Input
              type="number"
              min={1}
              max={30}
              value={credits}
              onChange={(event) =>
                setCredits(
                  event.target.value,
                )
              }
              placeholder="Optional"
            />
          </label>
          <label>
            <span className="mb-1.5 block text-xs font-semibold text-body">
              Display order
            </span>
            <Input
              type="number"
              min={0}
              max={10000}
              value={displayOrder}
              onChange={(event) =>
                setDisplayOrder(
                  event.target.value,
                )
              }
            />
          </label>
        </div>
      </Dialog>

      <ConfirmDialog
        open={archiveOpen}
        onOpenChange={setArchiveOpen}
        title={
          "Archive " +
          offering.courseName +
          " Offering?"
        }
        description="An Offering with active Section Deliveries cannot be archived."
        confirmLabel="Archive Offering"
        pending={pending}
        onConfirm={() =>
          run(
            () =>
              mutate(
                "/api/courses/offerings/" +
                  offering.id,
                "DELETE",
              ),
            "Course Offering archived",
            () => setArchiveOpen(false),
          )
        }
      />
    </>
  );
}

export function DeliveryActions({
  delivery,
}: {
  delivery: {
    id: string;
    courseName: string;
    sectionName: string;
  };
}) {
  const [open, setOpen] =
    useState(false);
  const { pending, run } =
    useCourseMutation();

  return (
    <>
      <Button
        size="sm"
        variant="ghost"
        onClick={() => setOpen(true)}
      >
        End
      </Button>
      <ConfirmDialog
        open={open}
        onOpenChange={setOpen}
        title={
          "End " +
          delivery.courseName +
          " · " +
          delivery.sectionName +
          "?"
        }
        description="Active Teaching Assignments must be ended first. Historical Course work remains preserved."
        confirmLabel="End Delivery"
        pending={pending}
        onConfirm={() =>
          run(
            () =>
              mutate(
                "/api/courses/deliveries/" +
                  delivery.id,
                "DELETE",
              ),
            "Section Delivery ended",
            () => setOpen(false),
          )
        }
      />
    </>
  );
}

export function TeachingAssignmentActions({
  assignment,
}: {
  assignment: {
    id: string;
    facultyDisplayName: string;
    courseName: string;
    sectionName: string;
  };
}) {
  const [open, setOpen] =
    useState(false);
  const { pending, run } =
    useCourseMutation();

  return (
    <>
      <Button
        size="sm"
        variant="ghost"
        onClick={() => setOpen(true)}
      >
        End
      </Button>
      <ConfirmDialog
        open={open}
        onOpenChange={setOpen}
        title={
          "End " +
          assignment.facultyDisplayName +
          " teaching assignment?"
        }
        description={
          assignment.courseName +
          " · " +
          assignment.sectionName
        }
        confirmLabel="End Assignment"
        pending={pending}
        onConfirm={() =>
          run(
            () =>
              mutate(
                "/api/courses/teaching-assignments/" +
                  assignment.id,
                "DELETE",
              ),
            "Teaching assignment ended",
            () => setOpen(false),
          )
        }
      />
    </>
  );
}