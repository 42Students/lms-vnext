"use client";

import { formatDateTimeIst } from "@/lib/format-date";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import { useToast } from "@/components/ui/toast";

export type DeviceRow = {
  id: string;
  label: string;
  createdAt: string;
  lastSeenAt: string;
  current: boolean;
};

function when(value: string) {
  return formatDateTimeIst(value);
}

export function DeviceList({ devices }: { devices: readonly DeviceRow[] }) {
  const router = useRouter();
  const { showToast } = useToast();
  const [busy, setBusy] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function run(key: string, url: string, success: string) {
    setBusy(key);
    startTransition(async () => {
      const response = await fetch(url, { method: "DELETE" });
      setBusy(null);
      if (response.ok) {
        showToast({ title: success, tone: "success" });
        router.refresh();
      } else {
        showToast({ title: "That didn't work. Try again.", tone: "error" });
      }
    });
  }

  const others = devices.filter((device) => !device.current).length;

  return (
    <section className="rounded-xl border border-border bg-surface">
      <ul className="m-0 list-none divide-y divide-border p-0">
        {devices.map((device) => (
          <li
            key={device.id}
            className="flex flex-wrap items-center justify-between gap-3 p-4"
          >
            <div>
              <p className="m-0 flex items-center gap-2 text-sm font-semibold text-foreground">
                {device.label}
                {device.current ? (
                  <StatusBadge tone="success">This device</StatusBadge>
                ) : null}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Signed in {when(device.createdAt)} · last active{" "}
                {when(device.lastSeenAt)}
              </p>
            </div>
            {device.current ? null : (
              <Button
                variant="secondary"
                size="sm"
                disabled={pending}
                onClick={() =>
                  run(
                    device.id,
                    `/api/auth/devices/${device.id}`,
                    "Device signed out",
                  )
                }
              >
                {busy === device.id ? "Signing out…" : "Sign out"}
              </Button>
            )}
          </li>
        ))}
      </ul>

      {others > 0 ? (
        <div className="border-t border-border p-4">
          <Button
            variant="danger"
            size="sm"
            disabled={pending}
            onClick={() =>
              run(
                "all",
                "/api/auth/devices",
                "Signed out everywhere else",
              )
            }
          >
            {busy === "all" ? "Signing out…" : "Sign out everywhere else"}
          </Button>
        </div>
      ) : null}
    </section>
  );
}
