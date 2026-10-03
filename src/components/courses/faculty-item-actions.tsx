"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { courseApiError } from "./learner-course-api";

type Action = "PUBLISH" | "CLOSE" | "ARCHIVE";

function actionLabel(action: Action) {
  switch (action) {
    case "PUBLISH":
      return "Publish";
    case "CLOSE":
      return "Close quiz";
    case "ARCHIVE":
      return "Archive";
  }
}

export function FacultyItemActions({
  transitionUrl,
  actions,
}: {
  transitionUrl: string;
  actions: readonly Action[];
}) {
  const router = useRouter();
  const [active, setActive] =
    useState<Action | null>(null);
  const [error, setError] =
    useState<string | null>(null);

  async function run(action: Action) {
    if (
      action === "ARCHIVE" &&
      !window.confirm(
        "Archive this item? It will leave active Course surfaces while historical records remain.",
      )
    ) {
      return;
    }

    if (
      action === "CLOSE" &&
      !window.confirm(
        "Close this quiz? Learners will not be able to submit any more attempts.",
      )
    ) {
      return;
    }

    setError(null);
    setActive(action);

    try {
      const response = await fetch(
        transitionUrl,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ action }),
        },
      );

      if (!response.ok) {
        setError(
          await courseApiError(response),
        );
        return;
      }

      router.refresh();
    } catch {
      setError(
        "Could not update this Course item. Check your connection and try again.",
      );
    } finally {
      setActive(null);
    }
  }

  if (actions.length === 0) {
    return null;
  }

  return (
    <div className="mt-3">
      <div className="flex flex-wrap gap-2">
        {actions.map((action) => (
          <Button
            key={action}
            size="sm"
            variant={
              action === "ARCHIVE"
                ? "ghost"
                : "secondary"
            }
            disabled={active !== null}
            onClick={() => run(action)}
          >
            {active === action
              ? "Saving…"
              : actionLabel(action)}
          </Button>
        ))}
      </div>
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
