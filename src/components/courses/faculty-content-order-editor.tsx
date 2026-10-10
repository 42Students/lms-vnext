"use client";

import { useEffect, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import { useToast } from "@/components/ui/toast";
import { courseApiError } from "./learner-course-api";

type Item = {
  id: string;
  title: string;
};

export function FacultyContentOrderEditor({
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
  const [order, setOrder] = useState(
    () => items.map((item) => item.id),
  );
  const [pending, startTransition] =
    useTransition();

  useEffect(() => {
    setOrder(items.map((item) => item.id));
  }, [items]);

  if (items.length <= 1) return null;

  const byId = new Map(
    items.map((item) => [item.id, item]),
  );

  function move(index: number, delta: number) {
    setOrder((current) => {
      const nextIndex = index + delta;
      if (
        nextIndex < 0 ||
        nextIndex >= current.length
      ) {
        return current;
      }
      const next = [...current];
      [next[index], next[nextIndex]] = [
        next[nextIndex]!,
        next[index]!,
      ];
      return next;
    });
  }

  function save() {
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
    <section className="mt-3 rounded-lg border border-border bg-surface p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <p className="m-0 text-sm font-semibold text-foreground">
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
        <Button
          type="button"
          size="sm"
          disabled={!enabled || pending}
          onClick={save}
        >
          {pending ? "Saving…" : "Save order"}
        </Button>
      </div>

      <ol className="mt-3 space-y-2">
        {order.map((id, index) => {
          const item = byId.get(id);
          if (!item) return null;
          return (
            <li
              key={id}
              className="flex items-center gap-3 rounded-md bg-surface-subtle px-3 py-2"
            >
              <span className="w-6 text-xs font-semibold text-muted-foreground">
                {index + 1}.
              </span>
              <span className="min-w-0 flex-1 truncate text-sm text-body">
                {item.title}
              </span>
              <Button
                type="button"
                size="sm"
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
                size="sm"
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
