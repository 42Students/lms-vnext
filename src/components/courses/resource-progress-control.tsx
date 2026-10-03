"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { courseApiError } from "./learner-course-api";

export function ResourceProgressControl({
  contentId,
  deliveryId,
}: {
  contentId: string;
  deliveryId: string;
}) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] =
    useState<string | null>(null);
  const [complete, setComplete] =
    useState(false);

  async function markComplete() {
    setError(null);
    setSaving(true);

    try {
      const response = await fetch(
        `/api/courses/progress/${contentId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            deliveryId,
            completed: true,
          }),
        },
      );

      if (!response.ok) {
        setError(
          await courseApiError(response),
        );
        return;
      }

      setComplete(true);
      router.refresh();
    } catch {
      setError(
        "Could not save progress. Check your connection and try again.",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mt-3">
      <Button
        size="sm"
        variant={
          complete ? "secondary" : "primary"
        }
        disabled={saving || complete}
        onClick={markComplete}
      >
        {complete
          ? "Completed"
          : saving
            ? "Saving…"
            : "Mark as complete"}
      </Button>
      {error ? (
        <p
          role="alert"
          className="mt-2 text-sm font-semibold text-error"
        >
          {error}
        </p>
      ) : null}
    </div>
  );
}
