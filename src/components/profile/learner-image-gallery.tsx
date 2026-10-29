"use client";

import { useCallback, useEffect, useState } from "react";
import {Button} from "@/components/ui/button";
import {Input} from "@/components/ui/input";
import {learnerGalleryConfirmationError} from "@/modules/profile-verification/learner-image-gallery-parity-model";

type Image = { id: string; imageId: string | number; displayOrder: number; isActive: boolean };
export function LearnerImageGallery({ membershipId }: { membershipId?: string }) {
  const [images, setImages] = useState<Image[]>([]);
  const [loading, setLoading] = useState(true);
  const [canEdit, setCanEdit] = useState(false);
  const [canUpload, setCanUpload] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [pendingObjectKey, setPendingObjectKey] = useState<string | null>(null);
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
      const value: { images: Image[]; canEdit: boolean; canUpload: boolean } = await result.json();
      setImages(value.images);
      setCanEdit(value.canEdit);
      setCanUpload(value.canUpload === true);
    } catch (cause) {
      setImages([]);
      setCanEdit(false);
      setCanUpload(false);
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
  async function confirmUpload(objectKey: string) {
    const response = await fetch("/api/profile/learner-gallery/upload", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "CONFIRM", objectKey }),
    });
    if (!response.ok) {
      const body: unknown = await response.json().catch(() => null);
      const code = body && typeof body === "object" && "error" in body &&
        typeof body.error === "string" ? body.error : undefined;
      throw new Error(learnerGalleryConfirmationError(response.status, code));
    }
    setPendingObjectKey(null);
    setSelectedFile(null);
    await load();
  }
  async function verifyUpload() {
    if (!pendingObjectKey || busy) return;
    setBusy(true); setError(null);
    try { await confirmUpload(pendingObjectKey); }
    catch (cause) {
      setError(cause instanceof Error ? cause.message : "Image verification is pending.");
    } finally { setBusy(false); }
  }
  async function add() {
    if (!selectedFile || busy) return;
    const file = selectedFile;
    if (!["image/jpeg", "image/png"].includes(file.type) ||
        file.size < 1 || file.size > 5 * 1024 * 1024 ||
        !/\.(?:jpe?g|png)$/i.test(file.name)) {
      setError("Choose a JPEG or PNG image no larger than 5 MB.");
      return;
    }
    setBusy(true); setError(null);
    try {
      const response = await fetch("/api/profile/learner-gallery/upload", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "INITIATE", originalName: file.name,
          contentType: file.type, sizeBytes: file.size }),
      });
      if (!response.ok) throw new Error("Private photo upload is unavailable.");
      const grant: { objectKey: string; uploadUrl: string;
        requiredHeaders: Record<string, string> } = await response.json();
      const upload = await fetch(grant.uploadUrl, {
        method: "PUT", credentials: "omit", redirect: "error", body: file,
        headers: grant.requiredHeaders,
      });
      if (!upload.ok) throw new Error("The image transfer failed.");
      setPendingObjectKey(grant.objectKey);
      await confirmUpload(grant.objectKey);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not upload image.");
    } finally { setBusy(false); }
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
            <Button variant="secondary" type="button" disabled={busy} onClick={() => void open(image.id)}
              >View</Button>
            {canEdit ? <Button variant="secondary" type="button" disabled={busy} onClick={() => void deactivate(image.id)}
              >Remove</Button> : null}
          </div>
          {preview?.id === image.id ?
            <img className="mt-2 max-h-56 w-full rounded object-contain" src={preview.url}
              alt={"Profile image " + (image.displayOrder + 1)} referrerPolicy="no-referrer" /> : null}
        </li>)}
      </ul>}
    {canUpload ? <div className="max-w-lg space-y-2 rounded-xl border border-border bg-surface p-3">
      <label htmlFor="gallery-upload" className="block text-sm font-medium">
        Add a profile photo
      </label>
      <Input id="gallery-upload" type="file" accept="image/jpeg,image/png"
        disabled={busy} onChange={event => {
          setSelectedFile(event.currentTarget.files?.[0] ?? null);
          setPendingObjectKey(null); setError(null);
        }} className="w-full" />
      <Button type="button" disabled={busy || !selectedFile || Boolean(pendingObjectKey)}
        onClick={() => void add()}>
        {busy ? "Uploading…" : "Upload photo"}
      </Button>
      {pendingObjectKey ? <div className="space-y-2">
        <p role="status" className="text-xs text-muted-foreground">
          Transfer complete. The image is awaiting its private security scan.
        </p>
        <Button type="button" variant="secondary" disabled={busy}
          onClick={() => void verifyUpload()}>Retry verification</Button>
      </div> : null}
      <p className="text-xs text-muted-foreground">
        Up to ten images. JPEG or PNG, maximum 5 MB each. No public image links.
      </p>
    </div> : null}
    {error ? <p role="alert" className="text-sm text-error">{error}</p> : null}
  </section>;
}
