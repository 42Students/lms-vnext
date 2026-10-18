"use client";

import { formatDateTimeIst } from "@/lib/format-date";
import { useRouter } from "next/navigation";
import { useRef, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { StatusBadge } from "@/components/ui/status-badge";
import { useToast } from "@/components/ui/toast";

export type DeviceRow = {
  id: string;
  label: string;
  createdAt: string | null;
  lastSeenAt: string | null;
  current: boolean;
};

function when(value: string | null) {
  return value ? formatDateTimeIst(value) : "Time unavailable";
}

export function DeviceList({ devices }: { devices: readonly DeviceRow[] }) {
  const router = useRouter();
  const { showToast } = useToast();
  const [busy, setBusy] = useState<string | null>(null);
  const busyRef = useRef<string | null>(null);
  const [confirmation, setConfirmation] = useState<{key:string;url:string;success:string;label:string}|null>(null);
  const [pending, startTransition] = useTransition();

  function run(key: string, url: string, success: string) {
    if (busyRef.current || pending) return;
    busyRef.current = key;
    setBusy(key);
    startTransition(async () => {
      try {
        const response = await fetch(url, { method: "DELETE" });
        if (response.ok) {
          showToast({ title: success, tone: "success" });
          setConfirmation(null);
          router.refresh();
        } else {
          showToast({ title: "That didn't work. Try again.", tone: "error" });
        }
      } catch {
        showToast({ title: "That didn't work. Try again.", tone: "error" });
      } finally {
        busyRef.current = null;
        setBusy(null);
      }
    });
  }
  function ask(key: string, url: string, success: string, label: string) {
    if (!busyRef.current && !pending) setConfirmation({key,url,success,label});
  }

  const others = devices.filter((device) => !device.current).length;

  return (
    <section className="rounded-xl border border-border bg-surface">
      <ul className="m-0 list-none divide-y divide-border p-0">
        {devices.map((device) => (
          <li
            key={device.id}
            className="flex min-w-0 flex-wrap items-center justify-between gap-3 p-4 sm:p-5"
          >
            <div className="min-w-0 flex-1">
              <p className="m-0 flex flex-wrap items-center gap-2 break-words text-sm font-semibold text-foreground">
                {device.label}
                {device.current ? (
                  <StatusBadge tone="success">This device</StatusBadge>
                ) : null}
              </p>
              <p className="mt-1 break-words text-xs leading-5 text-muted-foreground">
                Signed in {when(device.createdAt)} · last active{" "}
                {when(device.lastSeenAt)}
              </p>
            </div>
            {device.current ? null : (
              <Button
                variant="secondary"
                size="sm"
                disabled={pending || busy!==null}
                onClick={() =>
                  ask(
                    device.id,
                    `/api/auth/devices/${device.id}`,
                    "Device signed out",
                    "Sign out",
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
            disabled={pending || busy!==null}
            onClick={() =>
              ask(
                "all",
                "/api/auth/devices",
                "Signed out everywhere else",
                "Sign out everywhere else",
              )
            }
          >
            {busy === "all" ? "Signing out…" : "Sign out everywhere else"}
          </Button>
        </div>
      ) : null}
      <ConfirmDialog
        open={confirmation!==null}
        onOpenChange={open=>{if(!open&&!pending&&!busy)setConfirmation(null);}}
        title={confirmation?.label??"Sign out"}
        description={confirmation?.key==="all"
          ? "Sign out everywhere else. This device stays signed in."
          : "Sign out this device. You can sign in again later."}
        confirmLabel={confirmation?.label??"Sign out"}
        pending={pending||busy!==null}
        onConfirm={()=>{if(confirmation)run(confirmation.key,confirmation.url,confirmation.success);}}
      />
    </section>
  );
}
