"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Heading } from "@/components/ui/heading";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { StatusBadge } from "@/components/ui/status-badge";
import { useToast } from "@/components/ui/toast";
import { useGuardedAction } from "@/hooks/use-guarded-action";
import { apiFetch, FriendlyFetchError } from "@/lib/api-fetch";
import { formatDateIst } from "@/lib/format-date";
import { Disclosure } from "@/components/ui/disclosure";
import { coordinatorErrorMessage } from "@/modules/courses/coordinator-copy";

export type CoordinatorPanelData = {
  coordinator: {
    membershipId: string;
    displayName: string;
    email: string | null;
    grantedAt: string;
    counts: boolean;
  } | null;
  eligible: readonly { membershipId: string; displayName: string; email: string | null }[];
  history: readonly { action: string; occurredAt: string; coordinatorName: string | null }[];
};

const ACTION_LABEL: Record<string, string> = {
  GRANTED: "Made coordinator",
  REGRANTED: "Made coordinator again",
  REVOKED: "Removed as coordinator",
};

const when = (iso: string) => formatDateIst(iso);

/** College admin: pick, change or remove the one teacher who coordinates this course. */
export function AdminOfferingCoordinatorPanel({
  offeringId,
  data,
}: {
  offeringId: string;
  data: CoordinatorPanelData;
}) {
  const router = useRouter();
  const { showToast } = useToast();
  const { pending, run } = useGuardedAction();
  const [choice, setChoice] = useState("");
  const [removeOpen, setRemoveOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const endpoint = "/api/courses/offerings/" + encodeURIComponent(offeringId) + "/coordinator";
  const { coordinator, eligible, history } = data;

  function change(task: () => Promise<unknown>, success: string) {
    setError(null);
    void run(async () => {
      try {
        await task();
        showToast({ tone: "success", title: success });
        setChoice("");
        router.refresh();
      } catch (reason) {
        const code = reason instanceof FriendlyFetchError ? reason.code : null;
        setError(coordinatorErrorMessage(code));
      }
    });
  }

  return (
    <section id="course-coordinator" aria-label="Course coordinator" className="scroll-mt-24 space-y-3 border-b border-border pb-5">
      <Heading level={2} size="lg" className="text-foreground">Course coordinator</Heading>
      <p className="text-sm text-body">
        One of the teachers of this course can look after the lessons, lesson items, assignments and quizzes shared by
        every class. They cannot change other teachers&apos; class-only content, and the role pauses while they do not
        teach this course.
      </p>
      {error ? <Alert tone="error" role="alert">{error}</Alert> : null}

      {coordinator ? (
        <div className="flex min-w-0 flex-wrap items-center justify-between gap-3 border-y border-border py-3">
          <div className="min-w-0">
            <p className="break-words font-semibold text-foreground">{coordinator.displayName}</p>
            <p className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              {coordinator.email ? <span className="break-all">{coordinator.email}</span> : null}
              <span>Since {when(coordinator.grantedAt)}</span>
              {coordinator.counts ? (
                <StatusBadge tone="success">Active</StatusBadge>
              ) : (
                <StatusBadge tone="warning">Paused: not teaching this course</StatusBadge>
              )}
            </p>
          </div>
          <Button type="button" variant="secondary" disabled={pending} onClick={() => setRemoveOpen(true)}>
            Remove coordinator
          </Button>
        </div>
      ) : eligible.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No teacher is assigned to this course yet. Assign a teacher to one of its classes first.
        </p>
      ) : (
        <form
          className="flex min-w-0 flex-wrap items-end gap-3"
          onSubmit={(event) => {
            event.preventDefault();
            if (!choice) return;
            change(
              () =>
                apiFetch<unknown>(endpoint, {
                  method: "PUT",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ membershipId: choice }),
                }),
              "Coordinator added",
            );
          }}
        >
          <div className="min-w-[14rem] flex-1">
            <Label htmlFor="course-coordinator-choice">Teacher</Label>
            <Select id="course-coordinator-choice" value={choice} onChange={(event) => setChoice(event.target.value)}>
              <option value="">Choose a teacher of this course</option>
              {eligible.map((person) => (
                <option key={person.membershipId} value={person.membershipId}>
                  {person.displayName || person.email || "Unnamed teacher"}
                </option>
              ))}
            </Select>
          </div>
          <Button type="submit" disabled={pending || !choice}>Make coordinator</Button>
        </form>
      )}

      {history.length ? (
        <Disclosure title="History" className="text-sm text-body">
          <ul className="mt-2 space-y-1">
            {history.map((item, index) => (
              <li key={index} className="break-words">
                {when(item.occurredAt)} · {ACTION_LABEL[item.action] ?? item.action}
                {item.coordinatorName ? ": " + item.coordinatorName : ""}
              </li>
            ))}
          </ul>
        </Disclosure>
      ) : null}

      <ConfirmDialog
        open={removeOpen}
        onOpenChange={setRemoveOpen}
        title="Remove the course coordinator?"
        description={
          (coordinator?.displayName ?? "This teacher") +
          " will no longer be able to change the shared lessons, assignments and quizzes of this course. They keep teaching their own classes."
        }
        confirmLabel="Remove coordinator"
        confirmVariant="danger"
        pending={pending}
        onConfirm={() => {
          setRemoveOpen(false);
          change(() => apiFetch<unknown>(endpoint, { method: "DELETE" }), "Coordinator removed");
        }}
      />
    </section>
  );
}
