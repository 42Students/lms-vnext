"use client";

import {
  useState,
  useTransition,
} from "react";
import { useRouter } from "next/navigation";
import {
  MEMBERSHIP_ROLES,
  type MembershipRole,
} from "@/modules/identity/constants";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { onboardingRoleSelection } from "@/modules/people/college-faculty-onboarding-model";
import {legacyPersonName,indianMobileToE164} from "@/modules/people/college-onboard-mobile-model";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/components/ui/toast";

function roleLabel(role: MembershipRole) {
  return role
    .toLowerCase()
    .split("_")
    .map(
      (part) =>
        part.charAt(0).toUpperCase() + part.slice(1),
    )
    .join(" ");
}

export function PersonOnboardDialog({
  collegeId,
  forcedRole,
}: {
  collegeId: string;
  forcedRole?: MembershipRole;
}) {
  const router = useRouter();
  const { showToast } = useToast();
  const [open, setOpen] = useState(false);
  const [displayName, setDisplayName] = useState("");
  const [firstName,setFirstName]=useState("");
  const [lastName,setLastName]=useState("");
  const [phoneE164, setPhoneE164] = useState("");
  const [email, setEmail] = useState("");
  const [registerAsMentor,setRegisterAsMentor]=useState(false);
  const [roles, setRoles] = useState<MembershipRole[]>(
    onboardingRoleSelection(forcedRole),
  );
  const [pending, startTransition] = useTransition();

  function reset() {
    setDisplayName("");setFirstName("");setLastName("");
    setPhoneE164("");
    setEmail("");setRegisterAsMentor(false);
    setRoles(onboardingRoleSelection(forcedRole));
  }

  function toggleRole(role: MembershipRole) {
    setRoles((current) =>
      current.includes(role)
        ? current.filter((item) => item !== role)
        : [...current, role],
    );
  }

  function submit() {
    if(forcedRole&&!indianMobileToE164(phoneE164)){showToast({tone:"error",title:"Check mobile number",description:"Mobile number must be 10 digits"});return;}
    startTransition(async () => {
      const response = await fetch("/api/people/onboard", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          collegeId,
          displayName:forcedRole?legacyPersonName(firstName,lastName):displayName,
          phoneE164:forcedRole?indianMobileToE164(phoneE164):phoneE164,
          ...(email.trim() ? { email } : {}),
          roles:forcedRole==="FACULTY"&&registerAsMentor?["FACULTY","MENTOR"]:onboardingRoleSelection(forcedRole,roles),
        }),
      });
      const payload = await response.json().catch(() => null);

      if (!response.ok) {
        showToast({
          tone: "error",
          title: "Onboarding failed",
          description:
            payload?.error === "IDENTITY_COLLISION"
              ? "Mobile number already exists. Check the linked account before creating a duplicate."
              : payload?.error === "EMAIL_ALREADY_EXISTS"
              ? "Email already exists. Please use a different email address."
              : payload?.error === "PHONE_ALREADY_EXISTS"
              ? "Mobile number already exists. Please use a different mobile number."
              : "The person could not be onboarded. Check the fields and try again.",
        });
        return;
      }

      setOpen(false);
      reset();
      showToast({
        tone: "success",
        title: forcedRole === "FACULTY" ? "Faculty registered successfully! They can now login with their mobile number." : "Person onboarded",
        description:
          "The canonical user and college membership are ready. No invitation or message was sent.",
      });
      router.refresh();
    });
  }

  return (
    <>
      <Button onClick={() => setOpen(true)}>
        {forcedRole === "FACULTY" ? "Register New Faculty" : "Onboard person"}
      </Button>
      <Dialog
        open={open}
        onOpenChange={setOpen}
        title={forcedRole === "FACULTY" ? "Register New Faculty" : "Onboard person"}
        description="Create or reuse a canonical identity and an active college membership. No external invitation is sent."
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
              disabled={
                pending ||
                !(forcedRole?firstName.trim()&&lastName.trim():displayName.trim()) ||
                !phoneE164.trim() ||
                roles.length === 0
              }
              onClick={submit}
            >
              {pending ? "Onboarding…" : forcedRole === "FACULTY" ? "Add faculty" : "Onboard person"}
            </Button>
          </>
        }
      >
        <div className="grid gap-4 sm:grid-cols-2">
          {forcedRole?<div className="grid gap-3 sm:col-span-2 sm:grid-cols-2">
            <label className="grid gap-1 text-xs font-semibold text-body">First Name
              <Input value={firstName} maxLength={120} required onChange={e=>setFirstName(e.target.value)} placeholder="First name"/>
            </label>
            <label className="grid gap-1 text-xs font-semibold text-body">Last Name
              <Input value={lastName} maxLength={120} required onChange={e=>setLastName(e.target.value)} placeholder="Last name"/>
            </label>
          </div>:<div className="sm:col-span-2">
            <label
              htmlFor={`onboard-name-${collegeId}`}
              className="mb-1.5 block text-xs font-semibold text-body"
            >
              Display name
            </label>
            <Input
              id={`onboard-name-${collegeId}`}
              value={displayName}
              onChange={(event) =>
                setDisplayName(event.target.value)
              }
              maxLength={255}
              placeholder="Full name"
            />
          </div>
}
          <div>
            <label
              htmlFor={`onboard-phone-${collegeId}`}
              className="mb-1.5 block text-xs font-semibold text-body"
            >
              Phone
            </label>
            <Input
              id={`onboard-phone-${collegeId}`}
              value={phoneE164}
              onChange={(event) =>
                setPhoneE164(event.target.value)
              }
              placeholder={forcedRole?"9876543210":"+919876543210"}
              inputMode="tel"
            />
            {forcedRole?<p className="mt-1 text-xs text-muted-foreground">Mobile number must be 10 digits</p>:null}
          </div>
          <div>
            <label
              htmlFor={`onboard-email-${collegeId}`}
              className="mb-1.5 block text-xs font-semibold text-body"
            >
              Email · optional
            </label>
            <Input
              id={`onboard-email-${collegeId}`}
              type="email"
              value={email}
              onChange={(event) =>
                setEmail(event.target.value)
              }
              maxLength={320}
              placeholder="name@example.com"
            />
          </div>
          {forcedRole==="FACULTY" ? <fieldset className="sm:col-span-2 space-y-2 border-b border-border py-3">
            <legend className="text-xs font-semibold text-body">Faculty Type</legend>
            <label className="flex min-h-11 items-center gap-2 text-sm font-semibold text-body">
              <Checkbox checked={registerAsMentor} disabled={pending}
                onChange={event=>setRegisterAsMentor(event.target.checked)}/>
              Mentor
            </label>
            <p className="text-xs text-muted-foreground">A mentor receives the Mentor membership role in addition to Faculty.</p>
          </fieldset> : null}
          {forcedRole && forcedRole!=="FACULTY" ? <p className="sm:col-span-2 text-sm text-body">
            Membership role: <strong>{roleLabel(forcedRole)}</strong>.
          </p> : !forcedRole ? <fieldset className="sm:col-span-2">
            <legend className="mb-2 text-xs font-semibold text-body">
              Membership roles
            </legend>
            <div className="divide-y divide-border border-y border-border">
              {MEMBERSHIP_ROLES.map((role) => (
                <label
                  key={role}
                  className="flex min-h-11 cursor-pointer items-center justify-between gap-3 px-3 py-2 hover:bg-primary-subtle"
                >
                  <span className="text-sm font-semibold text-body">
                    {roleLabel(role)}
                  </span>
                  <Checkbox
                    checked={roles.includes(role)}
                    onChange={() => toggleRole(role)}
                    className="size-5"
                  />
                </label>
              ))}
            </div>
            {roles.length === 0 ? (
              <p className="mt-2 text-xs font-semibold text-error">
                Select at least one membership role.
              </p>
            ) : null}
          </fieldset> : null}
        </div>
      </Dialog>
    </>
  );
}
