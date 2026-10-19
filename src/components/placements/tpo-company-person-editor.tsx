"use client";
import { Select } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { useRouter } from "next/navigation";

type Person = {
  id: string;
  name: string;
  email: string | null;
  designation: string | null;
  updatedAt: string;
  editable: boolean;
};

export function TpoCompanyPersonEditor({
  companyId,
  contacts,
}: {
  companyId: string;
  contacts: readonly Person[];
}) {
  const router = useRouter();
  const [selected, setSelected] = useState("NEW");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [designation, setDesignation] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [reviewing,setReviewing]=useState(false);
  const current = contacts.find((item) => item.id === selected && item.editable);

  function select(value: string) {
    setSelected(value);setReviewing(false);
    const item = contacts.find((candidate) => candidate.id === value && candidate.editable);
    setName(item?.name ?? "");
    setEmail(item?.email ?? "");
    setDesignation(item?.designation ?? "");
    setMessage(null);
  }

  async function save() {
    if (busy || !name.trim() || !email.trim()) return;
    if(!reviewing){setReviewing(true);setMessage(null);return;}
    setBusy(true); setMessage(null);
    try {
      const body = current
        ? { action: "EDIT", confirmed: true, leadId: current.id,
            expectedUpdatedAt: current.updatedAt, name: name.trim(),
            email: email.trim(), designation: designation.trim() }
        : { action: "CREATE", confirmed: true, name: name.trim(),
            email: email.trim(), designation: designation.trim() };
      const response = await fetch(
        "/api/placements/tpo/companies/" + encodeURIComponent(companyId) + "/people",
        { method: "POST", headers: { "Content-Type": "application/json" },
          credentials: "same-origin", body: JSON.stringify(body) },
      );
      if (!response.ok) {
        setMessage(response.status === 409
          ? "Duplicate contact or stale changes. Reload before trying again."
          : "Contact was not saved; verify access and details before retrying.");
        return;
      }
      select("NEW");setReviewing(false);
      setMessage("Contact saved. Refreshing current records.");
      router.refresh();
    } catch {
      setMessage("Network error: refresh before retrying to avoid duplicate changes.");
    } finally { setBusy(false); }
  }

  return (
    <section className="space-y-4 border-b border-border pb-6">
      <h2 className="text-base font-semibold text-foreground">Add or edit contact person</h2>
      <p className="text-sm text-body">
        Only contacts explicitly linked to this company appear. Email is required and
        must be unique in this college; only non-joined, non-unsubscribed contacts are editable.
        Existing phone-only contacts can still be edited
        once an email is provided. No messages are sent.
      </p>
      <label className="block text-sm font-medium">Contact
        <Select value={selected} onChange={event => select(event.target.value)}
          className="mt-1 block min-h-9 w-full rounded-[var(--lms-control-radius)] border border-border bg-surface p-2">
          <option value="NEW">Add new person</option>
          {contacts.filter(item => item.editable).map(item => (
            <option key={item.id} value={item.id}>{item.name}</option>
          ))}
        </Select>
      </label>
      <div className="grid gap-3 md:grid-cols-2">
        <label className="text-sm font-medium">Name
          <Input value={name} maxLength={150} onChange={event => {setReviewing(false);setName(event.target.value);}}
            className="mt-1 block min-h-9 w-full rounded-[var(--lms-control-radius)] border border-border bg-surface px-3" />
        </label>
        <label className="text-sm font-medium">Email
          <Input type="email" value={email} maxLength={150}
            onChange={event => {setReviewing(false);setEmail(event.target.value);}}
            className="mt-1 block min-h-9 w-full rounded-[var(--lms-control-radius)] border border-border bg-surface px-3" />
        </label>
        <label className="text-sm font-medium">Designation (optional)
          <Input value={designation} maxLength={100}
            onChange={event => {setReviewing(false);setDesignation(event.target.value);}}
            className="mt-1 block min-h-9 w-full rounded-[var(--lms-control-radius)] border border-border bg-surface px-3" />
        </label>
      </div>
      {reviewing?<p role="status" className="rounded-[var(--lms-canvas-radius)] border border-border p-3 text-sm text-body">
        {current?"Save edits to this linked company contact?":"Add this contact person to the selected company?"}
        An immutable audit note will be recorded.
        <Button variant="ghost" type="button" className="ml-3" onClick={()=>setReviewing(false)}>Cancel review</Button>
      </p>:null}
      <Button variant="primary" type="button" onClick={() => void save()}
        disabled={busy || !name.trim() || !email.trim()}
        className="min-h-9 px-4">
        {busy ? "Saving..." : reviewing?"Confirm contact save":current ? "Review and save changes" : "Review and add contact"}
      </Button>
      {message ? <p role="status" className="text-sm text-body">{message}</p> : null}
    </section>
  );
}
