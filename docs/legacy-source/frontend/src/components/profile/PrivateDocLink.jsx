import { useState } from "react";
import { message } from "antd";
import { fetchWithErrorHandling } from "@/api/Services/AdminService";
import { getDocumentUrl } from "@/api/Services/VerificationService";

/** Identity documents and marksheets are stored as "private-doc:<key>" in a private bucket (no public link exists). */
export const isPrivateDoc = (value) => typeof value === "string" && value.trim().startsWith("private-doc:");

const safeHref = (url) => {
  try { const u = new URL(url); return u.protocol === "http:" || u.protocol === "https:" ? url : null; } catch { return null; }
};

/**
 * Opens a document. A private one is fetched as a short-lived signed link after the backend checks access; an older public link
 * opens as before. Renders children as the clickable content.
 */
export default function PrivateDocLink({ value, userId, children, className }) {
  const [busy, setBusy] = useState(false);
  if (!value) return null;
  if (!isPrivateDoc(value)) {
    const href = safeHref(value);
    return href
      ? <a href={href} target="_blank" rel="noopener noreferrer" className={className}>{children}</a>
      : <span className={className}>{children}</span>;
  }
  const open = async (e) => {
    e.preventDefault();
    if (busy) return;
    // Open the tab now (inside the click) so pop-up blockers allow it, then send it to the signed link.
    const tab = typeof window !== "undefined" ? window.open("", "_blank") : null;
    if (tab) tab.opener = null;
    setBusy(true);
    const r = await fetchWithErrorHandling(getDocumentUrl(value, userId));
    setBusy(false);
    if (!r.success || !r.data) {
      tab?.close();
      message.error(r?.data?.message || r?.message || "Could not open the document");
      return;
    }
    if (tab) tab.location.href = String(r.data); else window.location.assign(String(r.data));
  };
  return (
    <a href="#" onClick={open} className={className} aria-busy={busy} data-testid="private-doc-link">{children}</a>
  );
}
