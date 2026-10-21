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
          if(key==="all-including-current"||key==="current")router.replace("/login");
          else router.refresh();
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
    <section className="min-w-0 border-y border-[var(--lms-canvas-border)]">
      {devices.length === 0 ? <p role="status" className="py-5 text-sm leading-6 text-[var(--lms-body-text)]">No device sessions to display.</p> : null}
      <ul className="m-0 list-none divide-y divide-border p-0">
        {devices.map((device) => (
          <li
            key={device.id}
            className="flex min-w-0 flex-col gap-3 py-4 min-[768px]:flex-row min-[768px]:items-center min-[768px]:justify-between"
          >
            <div className="min-w-0 flex-1">
              <p className="m-0 flex min-w-0 flex-wrap items-center gap-2 break-words text-sm font-semibold text-foreground">
                {device.label}
                {device.current ? (
                  <StatusBadge tone="success">This device</StatusBadge>
                ) : null}
              </p>
              <p className="mt-1 min-w-0 break-words text-xs leading-5 text-muted-foreground">
                Signed in {when(device.createdAt)} · last active{" "}
                {when(device.lastSeenAt)}
              </p>
            </div>
            {device.current ? (
              <Button variant="secondary" size="sm" aria-label={"Sign out this device: "+device.label}
                className="min-h-11 w-full min-[768px]:min-h-9 min-[768px]:w-auto"
                disabled={pending||busy!==null}
                onClick={()=>ask("current","/api/auth/session","Logged out","Sign out this device")}>
                Sign out this device
              </Button>
            ) : (
              <Button
                variant="secondary"
                size="sm"
                aria-label={"Sign out device: "+device.label}
                className="min-h-11 w-full justify-center min-[768px]:min-h-9 min-[768px]:w-auto"
                disabled={pending || busy!==null}
                onClick={() =>
                  ask(
                    device.id,
                    `/api/auth/devices/${device.id}`,
                    "Session revoked",
                    "Sign out "+device.label,
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
        <details className="border-t border-[var(--lms-canvas-border)] py-4">
          <summary className="flex min-h-11 cursor-pointer items-center text-sm font-semibold text-primary-text underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lms-primary)] min-[768px]:min-h-9">Sign out everywhere else</summary>
          <div className="mt-3 flex min-w-0 flex-col items-stretch gap-2 min-[768px]:items-start">
          <Button
            variant="danger"
            size="sm"
            className="min-h-11 w-full justify-center min-[768px]:min-h-9 min-[768px]:w-auto"
            disabled={pending || busy!==null}
            onClick={() =>
              ask(
                "all",
                "/api/auth/devices",
                "Other sessions revoked; this device stays signed in.",
                "Sign out everywhere else",
              )
            }
          >
            {busy === "all" ? "Signing out…" : "Sign out everywhere else"}
          </Button>
          <Button variant="danger" size="sm" className="min-h-11 w-full min-[768px]:min-h-9 min-[768px]:w-auto"
            disabled={pending||busy!==null}
            onClick={()=>ask("all-including-current","/api/auth/devices?scope=all",
              "All sessions revoked","Sign out all devices")}>
            Sign out all devices
          </Button>
          </div>
        </details>
      ) : null}
      <ConfirmDialog
        open={confirmation!==null}
        onOpenChange={open=>{if(!open&&!pending&&!busy)setConfirmation(null);}}
        title={confirmation?.label??"Sign out"}
        description={confirmation?.key==="all"
          ? "Revoke all other sessions. This device stays signed in."
          : confirmation?.key==="all-including-current"
          ? "All sessions will be revoked, including this device. You must sign in again."
          : "Revoke this session. You can sign in again later."}
        confirmLabel={confirmation?.label??"Sign out"}
        confirmVariant="danger"
        pending={pending||busy!==null}
        onConfirm={()=>{if(confirmation)run(confirmation.key,confirmation.url,confirmation.success);}}
      />
    </section>
  );
}
