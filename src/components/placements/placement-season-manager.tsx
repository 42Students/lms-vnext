"use client";

import {
  useMemo,
  useState,
  type FormEvent,
} from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { StatusBadge } from "@/components/ui/status-badge";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Disclosure } from "@/components/ui/disclosure";
import { useToast } from "@/components/ui/toast";

export type PlacementSeasonItem = {
  id: string;
  name: string;
  code: string;
  startDate: string;
  endDate: string;
  status: "ACTIVE" | "CLOSED";
};

function humanizeError(value: string) {
  return value
    .toLowerCase()
    .split("_")
    .map(
      (part) =>
        part.charAt(0).toUpperCase() +
        part.slice(1),
    )
    .join(" ");
}

export function PlacementSeasonManager({
  collegeId,
  seasons,
}: {
  collegeId: string;
  seasons: readonly PlacementSeasonItem[];
}) {
  const router = useRouter();
  const { showToast } = useToast();
  const [pending, setPending] =
    useState(false);
  const [confirmClose, setConfirmClose] = useState(false);
  const active = useMemo(
    () =>
      seasons.find(
        (season) =>
          season.status === "ACTIVE",
      ) ?? null,
    [seasons],
  );

  async function request(
    url: string,
    body: unknown,
  ) {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "content-type":
          "application/json",
      },
      body: JSON.stringify(body),
    });
    const payload = (await response
      .json()
      .catch(() => null)) as
      | { error?: string }
      | null;
    if (!response.ok) {
      throw new Error(
        payload?.error ??
          "PLACEMENT_SEASON_ACTION_FAILED",
      );
    }
  }

  async function create(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();
    const data = new FormData(
      event.currentTarget,
    );
    setPending(true);
    try {
      await request(
        "/api/placements/seasons",
        {
          collegeId,
          name: String(
            data.get("name") ?? "",
          ).trim(),
          code: String(
            data.get("code") ?? "",
          ).trim(),
          startDate: String(
            data.get("startDate") ?? "",
          ),
          endDate: String(
            data.get("endDate") ?? "",
          ),
        },
      );
      showToast({
        tone: "success",
        title: "Placement season started",
        description:
          "New placement drives will now bind to this active season.",
      });
      event.currentTarget.reset();
      router.refresh();
    } catch (error) {
      showToast({
        tone: "error",
        title:
          "Could not start placement season",
        description:
          error instanceof Error
            ? humanizeError(
                error.message,
              )
            : "Please try again.",
      });
    } finally {
      setPending(false);
    }
  }

  async function close() {
    if (!active) return;
    setPending(true);
    try {
      await request(
        "/api/placements/seasons/" +
          active.id +
          "/actions",
        { action: "CLOSE" },
      );
      showToast({
        tone: "success",
        title: "Placement season closed",
        description:
          "The season is now historical and its operational drives are read-only.",
      });
      setConfirmClose(false);
      router.refresh();
    } catch (error) {
      showToast({
        tone: "error",
        title:
          "Could not close placement season",
        description:
          error instanceof Error
            ? humanizeError(
                error.message,
              )
            : "Please try again.",
      });
    } finally {
      setPending(false);
    }
  }

  return (
    <section className="border-t border-border pt-5">
      <div className="border-b border-border pb-3">
        <h2 className="m-0 text-base font-semibold text-foreground">
          Placement season
        </h2>
        <p className="mt-1 text-sm text-body">
          Seasons define the operating boundary for drives and reporting. Employer relationship memory remains available across seasons.
        </p>
      </div>

      {active ? (
        <div className="grid min-w-0 gap-3 py-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <p className="m-0 font-semibold text-foreground">
                {active.name}
              </p>
              <StatusBadge tone="success">
                Active
              </StatusBadge>
            </div>
            <p className="mt-1 text-sm text-body">
              {active.code} ·{" "}
              {active.startDate} to{" "}
              {active.endDate}
            </p>
          </div>
          <Button
            size="sm"
            variant="secondary"
            className="min-h-11 w-full sm:w-auto md:min-h-9"
            disabled={pending}
            onClick={() => setConfirmClose(true)}
          >
            {pending
              ? "Closing…"
              : "Close season"}
          </Button>
        </div>
      ) : (
        <form
          onSubmit={create}
          className="grid min-w-0 gap-3 py-4 sm:grid-cols-2"
        >
          <label>
            <span className="mb-1 block text-xs font-semibold text-body">
              Season name
            </span>
            <Input
                            name="name"
              required
              maxLength={160}
              placeholder="2026-27 Placements"
            />
          </label>
          <label>
            <span className="mb-1 block text-xs font-semibold text-body">
              Code
            </span>
            <Input
                            name="code"
              required
              maxLength={64}
              placeholder="2026-27"
            />
          </label>
          <label>
            <span className="mb-1 block text-xs font-semibold text-body">
              Starts
            </span>
            <Input
                            name="startDate"
              type="date"
              required
            />
          </label>
          <label>
            <span className="mb-1 block text-xs font-semibold text-body">
              Ends
            </span>
            <Input
                            name="endDate"
              type="date"
              required
            />
          </label>
          <div className="sm:col-span-2">
            <Button
              type="submit"
              size="sm"
              className="min-h-11 w-full sm:w-auto md:min-h-9"
              disabled={pending}
            >
              {pending
                ? "Starting…"
                : "Start season"}
            </Button>
          </div>
        </form>
      )}

      {seasons.some(
        (season) =>
          season.status === "CLOSED",
      ) ? (
        <Disclosure title={"Historical seasons (" + seasons.filter(season => season.status === "CLOSED").length + ")"}
          className="border-t border-border py-2" contentClassName="pb-3">
          <div className="mt-3 flex flex-wrap gap-2">
            {seasons
              .filter(
                (season) =>
                  season.status ===
                  "CLOSED",
              )
              .slice()
              .reverse()
              .map((season) => (
                <StatusBadge
                  key={season.id}
                >
                  {season.code}
                </StatusBadge>
              ))}
          </div>
        </Disclosure>
      ) : null}
      <ConfirmDialog open={confirmClose}
        onOpenChange={open => { if (!open && !pending) setConfirmClose(false); }}
        title="Close this placement season?"
        description="Draft or published drives must be closed or archived first."
        confirmLabel="Close season" cancelLabel="Keep active" confirmVariant="danger"
        pending={pending} onConfirm={() => void close()}
      />
    </section>
  );
}
