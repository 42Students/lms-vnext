"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

type ResumeList = {
  selected: string | null;
  hasUnlistedSelection: boolean;
  items: { id: string; uploadedAt: string }[];
};
type UploadGrant = {
  objectKey: string;
  uploadUrl: string;
  requiredHeaders: Record<string, string>;
};
const endpoint = "/api/profile/learner/default-resume";

export function LearnerDefaultResumePicker({ initial }: { initial: ResumeList }) {
  const router = useRouter();
  const [list, setList] = useState(initial);
  const [file, setFile] = useState<File | null>(null);
  const [pendingKey, setPendingKey] = useState<string | null>(null);
  const [working, setWorking] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState(false);

  async function command(body: object) {
    const response = await fetch(endpoint, {
      method: "POST",
      cache: "no-store",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const result = await response.json() as Record<string, unknown>;
    if (!response.ok) {
      throw new Error(typeof result.message === "string"
        ? result.message : "Resume update could not be completed.");
    }
    return result;
  }
  async function reload() {
    const response = await fetch(endpoint, { cache: "no-store", credentials: "same-origin" });
    if (!response.ok) throw new Error("Could not refresh your saved resume choices.");
    setList(await response.json() as ResumeList);
    router.refresh();
  }
  async function select(id: string) {
    if (working) return;
    setWorking(true);setError(false);setMessage("");
    try {
      await command({ action: "SELECT", receiptId: id });
      await reload();
      setMessage("Default resume saved for placement applications.");
    } catch (cause) {
      setError(true);
      setMessage(cause instanceof Error ? cause.message : "Resume selection failed.");
    } finally {
      setWorking(false);
    }
  }
  async function confirm(key: string) {
    await command({ action: "CONFIRM", objectKey: key });
    setPendingKey(null);
    await reload();
    setMessage("Scanned resume selected as your default.");
  }
  async function upload() {
    if (!file || working) return;
    if (file.type !== "application/pdf" || file.size < 1 ||
        file.size > 10 * 1024 * 1024) {
      setError(true);setMessage("Choose a PDF smaller than 10 MB.");return;
    }
    setWorking(true);setError(false);setMessage("");
    try {
      const grant = await command({
        action: "INITIATE", contentType: "application/pdf", sizeBytes: file.size,
      }) as UploadGrant;
      if (!grant.uploadUrl.startsWith("https://")) {
        throw new Error("Secure upload is unavailable.");
      }
      const uploaded = await fetch(grant.uploadUrl, {
        method: "PUT", headers: grant.requiredHeaders, body: file,
      });
      if (!uploaded.ok) throw new Error("Upload failed. Choose the file and retry.");
      setPendingKey(grant.objectKey);
      setFile(null);
      try {
        await confirm(grant.objectKey);
      } catch {
        // Upload is not a successful selection until the privileged scan passes.
        setMessage("Resume uploaded. Scanning is pending; use Check scan & select.");
      }
    } catch (cause) {
      setError(true);
      setMessage(cause instanceof Error ? cause.message : "Upload failed.");
    } finally {
      setWorking(false);
    }
  }
  async function retryScan() {
    if (!pendingKey || working) return;
    setWorking(true);setError(false);setMessage("");
    try {
      await confirm(pendingKey);
    } catch (cause) {
      setError(true);
      setMessage(cause instanceof Error ? cause.message : "Scanning is not complete.");
    } finally {
      setWorking(false);
    }
  }

  return <section aria-label="Default resume for placements"
    className="min-w-0 space-y-3 border-b border-[var(--lms-canvas-border)] pb-4">
    <h2 className="text-base font-semibold text-[var(--lms-heading)]">Default resume</h2>
    <p className="text-sm text-body">
      Choose a scanned private PDF for placements. Only you can choose it; the
      placement team can share it only through its verified permissions.
      Individual application resumes can still be updated separately.
    </p>
    {list.items.length ? <ul className="divide-y divide-border" aria-label="Available scanned resumes">
      {list.items.map((item, index) => <li key={item.id}
        className="flex min-w-0 flex-wrap items-center justify-between gap-2 py-2">
        <span className="min-w-0 text-sm text-body">
          Resume {index + 1} · {new Intl.DateTimeFormat("en-IN", {
            dateStyle: "medium", timeZone: "Asia/Kolkata",
          }).format(new Date(item.uploadedAt))}
          {list.selected === item.id ? " · Default" : ""}
        </span>
        <Button type="button" variant="secondary" size="sm"
          disabled={working || list.selected === item.id}
          onClick={() => void select(item.id)}>
          {list.selected === item.id ? "Selected" : "Set as default"}
        </Button>
      </li>)}
    </ul> : <p className="text-sm text-muted-foreground">
      No clean, active resume receipts yet. Upload a PDF below.
    </p>}
    {list.hasUnlistedSelection ? <p role="alert" className="text-sm text-body">
      The previously selected resume is no longer among active scanned receipts.
      Select a valid resume before relying on it for placements.
    </p> : null}
    <div className="flex min-w-0 flex-wrap items-end gap-3">
      <label className="min-w-0 text-sm font-semibold text-body">
        Upload resume (PDF, up to 10 MB)
        <input type="file" accept="application/pdf,.pdf"
          className="mt-2 block max-w-full text-sm"
          disabled={working || Boolean(pendingKey)}
          onChange={event => setFile(event.currentTarget.files?.[0] ?? null)} />
      </label>
      <Button type="button" disabled={!file || working || Boolean(pendingKey)}
        onClick={() => void upload()}>
        {working ? "Working…" : "Upload resume"}
      </Button>
      {pendingKey ? <Button type="button" variant="secondary" disabled={working}
        onClick={() => void retryScan()}>
        Check scan &amp; select
      </Button> : null}
    </div>
    {message ? <p role={error ? "alert" : "status"}
      className={error ? "text-sm text-error" : "text-sm text-body"}>{message}</p> : null}
  </section>;
}
