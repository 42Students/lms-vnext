"use client";

import {
  useState,
  useTransition,
} from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";

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


  function save() {
    startTransition(async () => {
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
          title: "College update failed",
          description:
            payload?.error === "COLLEGE_NOT_FOUND"
              ? "The college is no longer active or accessible."
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
    });
  }

  return (
    <>
      <Button
        variant="secondary"
        size="sm"
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
        onOpenChange={setOpen}
        title={`Edit ${college.name}`}
        description={`College code ${college.code} and organization ownership are intentionally immutable here.`}
        footer={
          <>
            <Button
              variant="secondary"
              disabled={pending}
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button
              disabled={pending || !name.trim()}
              loading={pending}
              onClick={save}
            >
              {pending ? "Saving…" : "Save changes"}
            </Button>
          </>
        }
      >
        <div aria-busy={pending} className="grid gap-4 sm:grid-cols-2">
          {([
           ["Address",addressLine1,setAddressLine1,255],
           ["Address line 2",addressLine2,setAddressLine2,255],
           ["Landmark",landmark,setLandmark,255],
           ["Pin Code",postalCode,setPostalCode,32],
          ] as const).map(([field,value,setter,maxLength])=><label key={field}
           className="grid gap-1 text-xs font-semibold text-body">{field}
           <Input value={value} disabled={pending} onChange={event=>setter(event.target.value)} maxLength={maxLength}/>
          </label>)}

          <div className="sm:col-span-2">
            <label
              htmlFor={`college-name-${college.id}`}
              className="mb-1.5 block text-xs font-semibold text-body"
            >
              College name
            </label>
            <Input
              id={`college-name-${college.id}`}
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
              className="mb-1.5 block text-xs font-semibold text-body"
            >
              City
            </label>
            <Input
              id={`college-city-${college.id}`}
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
              className="mb-1.5 block text-xs font-semibold text-body"
            >
              State
            </label>
            <Input
              id={`college-state-${college.id}`}
              disabled={pending}
              value={state}
              onChange={(event) =>
                setState(event.target.value)
              }
              maxLength={128}
            />
          </div>
          <div className="sm:col-span-2">
            <label
              htmlFor={`college-country-${college.id}`}
              className="mb-1.5 block text-xs font-semibold text-body"
            >
              Country
            </label>
            <Input
              id={`college-country-${college.id}`}
              disabled={pending}
              value={country}
              onChange={(event) =>
                setCountry(event.target.value)
              }
              maxLength={128}
            />
          </div>
        </div>
      </Dialog>
    </>
  );
}
