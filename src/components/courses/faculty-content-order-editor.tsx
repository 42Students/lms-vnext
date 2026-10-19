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
          title: "Section order saved",
          description:
            "Learners in this Section will use this content order.",
        });
      } catch (error) {
        showToast({
          tone: "error",
          title:
            "Could not save Section order",
          description:
            error instanceof Error
              ? error.message
              : "The order could not be saved.",
        });
      }
    });
  }

  return (
    <section className="mt-3 border-t border-border pt-4 max-[767px]:[&_button]:min-h-11">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <p className="m-0 text-sm font-semibold text-[var(--lms-heading)]">
              Section content order
            </p>
            {!enabled ? (
              <StatusBadge tone="warning">
                Migration pending
              </StatusBadge>
            ) : null}
          </div>
          <p className="mt-1 text-xs leading-5 text-muted-foreground">
            Reorder shared and Section-specific lesson content for this
            Section only. Assessments keep their own sequence.
          </p>
        </div>
        {dirty ? <Button type="button" size="md" variant="secondary"
          disabled={pending} onClick={()=>setOrder(facultyResetContentOrder(items))}>
          Reset order
        </Button> : null}
        <Button
          type="button"
          size="md"
          loading={pending}
          disabled={!enabled || pending || !dirty}
          onClick={save}
        >
          {pending ? "Saving…" : dirty ? "Save order" : "Order saved"}
        </Button>
      </div>

      <ol className="mt-3 space-y-2">
        {order.map((id, index) => {
          const item = byId.get(id);
          if (!item) return null;
          return (
            <li
              key={id}
              className="flex min-w-0 items-center gap-2 rounded-[var(--lms-canvas-radius)] border border-border bg-surface-subtle px-3 py-2 md:gap-3"
            >
              <span className="w-6 shrink-0 text-xs font-semibold text-muted-foreground">
                {index + 1}.
              </span>
              <span className="min-w-0 flex-1 break-words text-sm text-body">
                {item.title}
              </span>
              <Button
                type="button"
                size="md"
                variant="secondary"
                aria-label={`Move ${item.title} up`}
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
                size="md"
                variant="secondary"
                aria-label={`Move ${item.title} down`}
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
