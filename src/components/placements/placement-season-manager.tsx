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
    if (
      !window.confirm(
        "Close this placement season? Draft or published drives must be closed or archived first.",
      )
    ) {
      return;
    }

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
        <div className="grid gap-4 py-5 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
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
            disabled={pending}
            onClick={close}
          >
            {pending
              ? "Closing…"
              : "Close season"}
          </Button>
        </div>
      ) : (
        <form
          onSubmit={create}
          className="grid gap-4 py-5 lg:grid-cols-4"
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
          <div className="lg:col-span-4">
            <Button
              type="submit"
              size="sm"
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
        <div className="border-t border-border py-4">
          <p className="m-0 text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">
            Historical seasons
          </p>
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
        </div>
      ) : null}
    </section>
  );
}
