"use client";

import {
  useEffect,
  useRef,
  useState,
  useTransition,
} from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";
import { useConfirmFlow } from "@/components/ui/use-confirm-flow";

export type EditableCollege = {
  id: string;
  name: string;
  code: string;
  city: string | null;
  state: string | null;
  country: string | null;
  addressLine1?:string|null;addressLine2?:string|null;landmark?:string|null;postalCode?:string|null;
};

export function CollegeEditDialog({
  college,
  triggerLabel = "Edit",
}: {
  college: EditableCollege;
  triggerLabel?: string;
}) {
  const router = useRouter();
  const { showToast } = useToast();
  const { askConfirm, dialog } = useConfirmFlow();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(college.name);
  const [city, setCity] = useState(college.city ?? "");
  const [state, setState] = useState(college.state ?? "");
  const [country, setCountry] = useState(
    college.country ?? "",
  );
  const [addressLine1,setAddressLine1]=useState(college.addressLine1??"");
  const [addressLine2,setAddressLine2]=useState(college.addressLine2??"");
  const [landmark,setLandmark]=useState(college.landmark??"");
  const [postalCode,setPostalCode]=useState(college.postalCode??"");
  const [pending, startTransition] = useTransition();
  const inFlightRef=useRef(false);
  const dirty = name !== college.name || city !== (college.city ?? "") ||
    state !== (college.state ?? "") || country !== (college.country ?? "") ||
    addressLine1 !== (college.addressLine1 ?? "") ||
    addressLine2 !== (college.addressLine2 ?? "") ||
    landmark !== (college.landmark ?? "") || postalCode !== (college.postalCode ?? "");
  useEffect(() => {
    if (!open || !dirty) return;
    const guard = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", guard);
    return () => window.removeEventListener("beforeunload", guard);
  }, [dirty, open]);
  function requestClose() {
    if (pending || inFlightRef.current) {
      showToast({ tone: "info", title: "Wait for the current college setup action to finish." });
      return;
    }
    if (!dirty) {
      setOpen(false);
      return;
    }
    void askConfirm("Discard college changes? Keep editing to preserve your unsaved changes.")
      .then(confirmed => { if (confirmed && !inFlightRef.current) setOpen(false); });
  }

  function save() {
    if(inFlightRef.current||pending||!name.trim())return;
    inFlightRef.current=true;
    startTransition(async () => {
      try {
      const response = await fetch(
        `/api/colleges/${college.id}`,
        {
          method: "PATCH",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            name,
            city: city.trim() || null,
            state: state.trim() || null,
            country: country.trim() || null,
            addressLine1:addressLine1.trim()||null,
            addressLine2:addressLine2.trim()||null,
            landmark:landmark.trim()||null,postalCode:postalCode.trim()||null,
          }),
        },
      );
      const payload = await response.json().catch(() => null);

      if (!response.ok) {
        showToast({
          tone: "error",
          title: "Failed to update college",
          description:
            payload?.error === "COLLEGE_NOT_FOUND"
              ? "The college is no longer active or accessible."
              : response.status === 409
                ? "Another administrator changed this college. Reload before editing."
                : response.status === 400
                  ? "Please check the entered college values."
                  : "The college could not be updated.",
        });
        return;
      }

      setOpen(false);
      showToast({
        tone: "success",
        title: "College updated",
      });
      router.refresh();
      } catch {
        showToast({tone:"error",title:"Failed to update college",description:"The college could not be updated."});
      } finally {
        inFlightRef.current=false;
      }
    });
  }

  return (
    <>
      {dialog}
      <Button
        variant="secondary"
        size="sm"
        className="min-h-11 w-full sm:w-auto md:min-h-9 print:hidden"
        onClick={() => {
          setName(college.name);
          setCity(college.city ?? "");
          setState(college.state ?? "");
          setCountry(college.country ?? "");
          setAddressLine1(college.addressLine1??"");setAddressLine2(college.addressLine2??"");
          setLandmark(college.landmark??"");setPostalCode(college.postalCode??"");
          setOpen(true);
        }}
      >
        {triggerLabel}
      </Button>

      <Dialog
        open={open}
        onOpenChange={next=>{if(next)setOpen(true);else requestClose();}}
        dismissible={!pending}
        title={`Edit ${college.name}`}
        description={`College code ${college.code} and organization ownership cannot be changed after creation. For a different legal owner or identifier, create a new college and plan an authorized migration.`}
        footer={
          <div className="flex w-full flex-col-reverse gap-[var(--lms-space-2)] md:flex-row md:justify-end [&>button]:w-full md:[&>button]:w-auto">
            <Button
              variant="secondary"
              className="min-h-11 md:min-h-9"
              disabled={pending}
              onClick={requestClose}
            >
              Cancel
            </Button>
            <Button
              disabled={pending || !name.trim()}
              loading={pending}
              className="min-h-11 md:min-h-9"
              onClick={save}
            >
              {pending ? "Saving…" : "Save changes"}
            </Button>
          </div>
        }
      >
        <div aria-busy={pending} className="grid min-w-0 items-start gap-[var(--lms-space-4)] md:grid-cols-2">
          {dirty ? <p role="status" className="md:col-span-2 text-sm text-warning-text">
            You have unsaved college changes. Closing will ask whether to discard them.
          </p> : null}


          <div className="md:col-span-2">
            <label
              htmlFor={`college-name-${college.id}`}
              className="mb-[var(--lms-space-2)] block text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]"
            >
              College name
            </label>
            <Input
              className="min-h-11 md:min-h-9" id={`college-name-${college.id}`}
              autoComplete="organization"
              disabled={pending}
              value={name}
              onChange={(event) =>
                setName(event.target.value)
              }
              maxLength={255}
            />
          </div>
          <div>
            <label
              htmlFor={`college-city-${college.id}`}
              className="mb-[var(--lms-space-2)] block text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]"
            >
              City
            </label>
            <Input
              className="min-h-11 md:min-h-9" id={`college-city-${college.id}`}
              autoComplete="address-level2"
              disabled={pending}
              value={city}
              onChange={(event) =>
                setCity(event.target.value)
              }
              maxLength={128}
            />
          </div>
          <div>
            <label
              htmlFor={`college-state-${college.id}`}
              className="mb-[var(--lms-space-2)] block text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]"
            >
              State
            </label>
            <Input
              className="min-h-11 md:min-h-9" id={`college-state-${college.id}`}
              autoComplete="address-level1"
              disabled={pending}
              value={state}
              onChange={(event) =>
                setState(event.target.value)
              }
              maxLength={128}
            />
          </div>
          <div className="md:col-span-2">
            <label
              htmlFor={`college-country-${college.id}`}
              className="mb-[var(--lms-space-2)] block text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]"
            >
              Country
            </label>
            <Input
              className="min-h-11 md:min-h-9" id={`college-country-${college.id}`}
              disabled={pending}
              value={country}
              onChange={(event) =>
                setCountry(event.target.value)
              }
              maxLength={128}
            />
          </div>
          {([
           ["Address",addressLine1,setAddressLine1,255],
           ["Address line 2",addressLine2,setAddressLine2,255],
           ["Landmark",landmark,setLandmark,255],
           ["Pin Code",postalCode,setPostalCode,32],
          ] as const).map(([field,value,setter,maxLength])=><label key={field}
           className="grid gap-[6px] text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">{field}
           <Input className="min-h-11 md:min-h-9" value={value} disabled={pending} onChange={event=>setter(event.target.value)} maxLength={maxLength}/>
          </label>)}
        </div>
      </Dialog>
    </>
  );
}
