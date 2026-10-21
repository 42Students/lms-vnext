"use client";

import { useCallback, useEffect, useState } from "react";

type Image = { id: string; imageId: string | number; displayOrder: number; isActive: boolean };
export function LearnerImageGallery({ membershipId }: { membershipId?: string }) {
  const [images, setImages] = useState<Image[]>([]);
  const [loading, setLoading] = useState(true);
  const [canEdit, setCanEdit] = useState(false);
  const [receipt, setReceipt] = useState("");
  const [preview, setPreview] = useState<{ id: string; url: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const suffix = membershipId ? "?membershipId=" + encodeURIComponent(membershipId) : "";
  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    setPreview(null);
    try {
      const result = await fetch("/api/profile/learner-gallery" + suffix, { cache: "no-store" });
      if (!result.ok) throw new Error(result.status === 503 ?
        "This gallery is awaiting verified storage setup." : "Could not load gallery.");
      const value: { images: Image[]; canEdit: boolean } = await result.json();
      setImages(value.images);
      setCanEdit(value.canEdit);
    } catch (cause) {
      setImages([]);
      setError(cause instanceof Error ? cause.message : "Could not load gallery.");
    } finally { setLoading(false); }
  }, [suffix]);
  useEffect(() => { void load(); }, [load]);
  async function open(imageId: string) {
    setError(null);
    setPreview(null);
    try {
      const response = await fetch(
        "/api/profile/learner-gallery/" + encodeURIComponent(imageId) + suffix,
        { cache: "no-store" });
      if (!response.ok) throw new Error("Image is unavailable.");
      const result: { url: string } = await response.json();
      setPreview({ id: imageId, url: result.url });
    } catch { setError("Image is unavailable."); }
  }
  async function add() {
    if (!receipt.trim() || busy) return;
    setBusy(true); setError(null);
    try {
      const response = await fetch("/api/profile/learner-gallery" + suffix, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ receiptId: receipt.trim(),
          idempotencyKey: crypto.randomUUID() }),
      });
      if (!response.ok) throw new Error("Could not add image.");
      setReceipt("");
      await load();
    } catch { setError("This must be a verified private profile-image upload for your account."); }
    finally { setBusy(false); }
  }
  async function deactivate(imageId: string) {
    if (busy || !confirm("Remove this image from your gallery?")) return;
    setBusy(true); setError(null);
    try {
      const response = await fetch(
        "/api/profile/learner-gallery/" + encodeURIComponent(imageId) + suffix, { method: "PATCH" });
      if (!response.ok) throw new Error("Could not remove image.");
      await load();
    } catch { setError("Could not remove the image."); }
    finally { setBusy(false); }
  }
  return <section className="space-y-3" aria-label="Profile pictures">
    <p className="text-sm text-muted-foreground">
      Private photos are available only to you and authorized college staff.
      Uploaded images must be verified before they appear.
    </p>
    {loading ? <p role="status">Loading images…</p> : images.length === 0 ?
      <p role="status">No profile images yet.</p> :
      <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {images.map(image => <li key={image.id} className="rounded-xl border border-border bg-surface p-3">
          <p className="mb-2 text-xs text-muted-foreground">Image {image.displayOrder + 1}</p>
          <div className="flex flex-wrap gap-2">
            <button type="button" disabled={busy} onClick={() => void open(image.id)}
              className="min-h-9 rounded border border-border px-3 text-sm">View</button>
            {canEdit ? <button type="button" disabled={busy} onClick={() => void deactivate(image.id)}
              className="min-h-9 rounded border border-border px-3 text-sm">Remove</button> : null}
          </div>
          {preview?.id === image.id ?
            <img className="mt-2 max-h-56 w-full rounded object-contain" src={preview.url}
              alt={"Profile image " + (image.displayOrder + 1)} referrerPolicy="no-referrer" /> : null}
        </li>)}
      </ul>}
    {canEdit ? <div className="max-w-lg space-y-2 rounded-xl border border-border bg-surface p-3">
      <label htmlFor="gallery-receipt" className="block text-sm font-medium">
        Verified profile image receipt ID
      </label>
      <input id="gallery-receipt" value={receipt} onChange={event => setReceipt(event.target.value)}
        placeholder="Private image receipt UUID"
        className="w-full rounded border border-border bg-surface px-3 py-2 text-sm" />
      <button type="button" disabled={busy || !receipt.trim()} onClick={() => void add()}
        className="min-h-9 rounded bg-[var(--lms-primary)] px-3 text-sm font-semibold text-white disabled:opacity-50">
        {busy ? "Saving…" : "Add image"}
      </button>
      <p className="text-xs text-muted-foreground">At most ten images. No public image links are accepted.</p>
    </div> : null}
    {error ? <p role="alert" className="text-sm text-error">{error}</p> : null}
  </section>;
}
