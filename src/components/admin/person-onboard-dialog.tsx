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
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
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
}: {
  collegeId: string;
}) {
  const router = useRouter();
  const { showToast } = useToast();
  const [open, setOpen] = useState(false);
  const [displayName, setDisplayName] = useState("");
  const [phoneE164, setPhoneE164] = useState("");
  const [email, setEmail] = useState("");
  const [roles, setRoles] = useState<MembershipRole[]>([
    "LEARNER",
  ]);
  const [pending, startTransition] = useTransition();

  function reset() {
    setDisplayName("");
    setPhoneE164("");
    setEmail("");
    setRoles(["LEARNER"]);
  }

  function toggleRole(role: MembershipRole) {
    setRoles((current) =>
      current.includes(role)
        ? current.filter((item) => item !== role)
        : [...current, role],
    );
  }

  function submit() {
    startTransition(async () => {
      const response = await fetch("/api/people/onboard", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          collegeId,
          displayName,
          phoneE164,
          ...(email.trim() ? { email } : {}),
          roles,
        }),
      });
      const payload = await response.json().catch(() => null);

      if (!response.ok) {
        showToast({
          tone: "error",
          title: "Onboarding failed",
          description:
            payload?.error === "IDENTITY_COLLISION"
              ? "Phone/email identity data conflicts with an existing canonical user."
              : "The person could not be onboarded. Check the fields and try again.",
        });
        return;
      }

      setOpen(false);
      reset();
      showToast({
        tone: "success",
        title: "Person onboarded",
        description:
          "The canonical user and college membership are ready.",
      });
      router.refresh();
    });
  }

  return (
    <>
      <Button onClick={() => setOpen(true)}>
        Onboard person
      </Button>
      <Dialog
        open={open}
        onOpenChange={setOpen}
        title="Onboard person"
        description="Create or reuse one canonical identity, then add a membership for this college."
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
                !displayName.trim() ||
                !phoneE164.trim() ||
                roles.length === 0
              }
              onClick={submit}
            >
              {pending ? "Onboarding…" : "Onboard person"}
            </Button>
          </>
        }
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
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
              placeholder="+919876543210"
              inputMode="tel"
            />
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
          <fieldset className="sm:col-span-2">
            <legend className="mb-2 text-xs font-semibold text-body">
              Membership roles
            </legend>
            <div className="grid gap-2 sm:grid-cols-2">
              {MEMBERSHIP_ROLES.map((role) => (
                <label
                  key={role}
                  className="flex min-h-11 cursor-pointer items-center justify-between gap-3 rounded-lg border border-border px-3 py-2 hover:bg-primary-subtle"
                >
                  <span className="text-sm font-semibold text-body">
                    {roleLabel(role)}
                  </span>
                  <input
                    type="checkbox"
                    checked={roles.includes(role)}
                    onChange={() => toggleRole(role)}
                    className="h-4 w-4 accent-[var(--lms-primary)]"
                  />
                </label>
              ))}
            </div>
            {roles.length === 0 ? (
              <p className="mt-2 text-xs font-semibold text-error">
                Select at least one membership role.
              </p>
            ) : null}
          </fieldset>
        </div>
      </Dialog>
    </>
  );
}
