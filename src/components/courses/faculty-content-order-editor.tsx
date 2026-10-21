"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import { useToast } from "@/components/ui/toast";
import { courseApiError } from "./learner-course-api";
import { facultyMoveContentId, facultyContentOrderDirty, facultyResetContentOrder, facultyContentOrderValid, facultyContentOrderReceiptMatches } from "@/modules/courses/faculty-content-order-ui-model";

type Item = {
  id: string;
  title: string;
};

function FacultyContentOrderEditorInner({
  lessonId,
  deliveryId,
  items,
  enabled,
}: {
  lessonId: string;
  deliveryId: string;
  items: readonly Item[];
  enabled: boolean;
}) {
  const { showToast } = useToast();
  const router = useRouter();
  const [order, setOrder] = useState(
    () => items.map((item) => item.id),
  );
  const [pending, startTransition] =
    useTransition();

  // The parent keys this editor by the persisted source order. A new
  // lesson/delivery/content list remounts it, resetting unsaved local order.

  const dirty = facultyContentOrderDirty(items.map(item=>item.id),order);
  if (items.length <= 1) return null;

  const byId = new Map(
    items.map((item) => [item.id, item]),
  );

  function move(index: number, delta: number) {
    setOrder(current => facultyMoveContentId(current,index,delta));
  }

  function save() {
    if (!facultyContentOrderValid(items.map(item=>item.id),order)) {
      showToast({tone:"error",title:"Section content changed",description:"Reload this Section before saving its new order."});
      return;
    }
    startTransition(async () => {
      try {
        const response = await fetch(
          "/api/courses/lesson-contents/order",
          {
            method: "PUT",
            headers: {
              "Content-Type":
                "application/json",
            },
            body: JSON.stringify({
              lessonId,
              deliveryId,
              orderedContentIds: order,
            }),
          },
        );
        if (!response.ok) {
          throw new Error(
            await courseApiError(response),
          );
        }
        const receipt:unknown = await response.json().catch(() => null);
        if (!facultyContentOrderReceiptMatches(deliveryId,order,receipt)) {
          throw new Error("Order save status could not be verified. Reload the Section before trying again.");
        }
        router.refresh();
        showToast({
          tone: "success",
          title: "Order updated",
          description:
            "Learners in this Section will use this content order.",
        });
      } catch (error) {
        showToast({
          tone: "error",
          title:
            "Could not update order",
          description:
            error instanceof Error
              ? error.message
              : "The order could not be saved.",
        });
      }
    });
  }

  return (
    <section className="mt-3 min-w-0 border-t border-border pt-4">
      <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="m-0 text-sm font-semibold text-[var(--lms-heading)]">
              Content order
            </p>
            {!enabled ? (
              <StatusBadge tone="warning">
                Migration pending
              </StatusBadge>
            ) : null}
          </div>
          <p className="mt-1 max-w-[65ch] break-words text-xs leading-5 text-muted-foreground">
            Reorder shared and Section-specific lesson content for this
            class only. Use the arrow buttons to move an item; drag sorting is
            not required for keyboard users. Assessments keep their own sequence.
          </p>
        </div>
        <div className="flex w-full flex-col-reverse gap-2 sm:w-auto sm:flex-row sm:items-center">
        {dirty ? <Button className="min-h-11 w-full sm:w-auto md:min-h-9" type="button" size="md" variant="secondary"
          disabled={pending} onClick={()=>setOrder(facultyResetContentOrder(items))}>
          Reset order
        </Button> : null}
        <Button
          className="min-h-11 w-full sm:w-auto md:min-h-9"
          type="button"
          size="md"
          loading={pending}
          disabled={!enabled || pending || !dirty}
          onClick={save}
        >
          {pending ? "Saving…" : dirty ? "Update order" : "Order updated"}
        </Button>
        </div>
      </div>

      <ol className="mt-3 min-w-0 divide-y divide-[var(--lms-canvas-border)] border-y border-[var(--lms-canvas-border)]">
        {order.map((id, index) => {
          const item = byId.get(id);
          if (!item) return null;
          return (
            <li
              key={id}
              className="flex min-w-0 items-center gap-2 py-2 sm:gap-3"
            >
              <span aria-hidden="true" className="w-6 shrink-0 text-xs font-semibold text-muted-foreground">
                {index + 1}.
              </span>
              <span className="min-w-0 flex-1 break-words text-sm text-body">
                {item.title}
              </span>
              <Button
                type="button"
                size="icon"
                variant="secondary"
                aria-label={`Move ${item.title} up in class content order`}
                disabled={
                  !enabled ||
                  pending ||
                  index === 0
                }
                onClick={() =>
                  move(index, -1)
                }
              >
                ↑
              </Button>
              <Button
                type="button"
                size="icon"
                variant="secondary"
                aria-label={`Move ${item.title} down in class content order`}
                disabled={
                  !enabled ||
                  pending ||
                  index === order.length - 1
                }
                onClick={() =>
                  move(index, 1)
                }
              >
                ↓
              </Button>
            </li>
          );
        })}
      </ol>
    </section>
  );
}

/**
 * Separate editor identity by course delivery, lesson and persisted items.
 * This resets local unsaved order on server refresh or lesson switches
 * without a cascading setState inside an effect.
 */
export function FacultyContentOrderEditor(
  props: Parameters<typeof FacultyContentOrderEditorInner>[0],
) {
  const identity = [
    props.deliveryId,
    props.lessonId,
    ...props.items.map((item) => item.id),
  ].join(":");
  return <FacultyContentOrderEditorInner key={identity} {...props} />;
}
