"use client";

import {
  useRef,
  useState,
  useTransition,
} from "react";
import { useRouter } from "next/navigation";
import {
  MEMBERSHIP_ROLES,
  type MembershipRole,
  type MembershipStatus,
} from "@/modules/identity/constants";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { PersonProfileDialog } from "@/components/admin/person-profile-dialog";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Dialog } from "@/components/ui/dialog";
import { Dropdown } from "@/components/ui/dropdown";
import { Menu, MenuItem } from "@/components/ui/menu";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/toast";
import {
  verifiedMembershipRoleReceipt,
  verifiedMembershipLifecycleReceipt,
} from "@/modules/people/membership-action-receipt";

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

export function PersonMembershipActions({
  membershipId,
  collegeId,
  displayName,
  roles,
  status,
}: {
  membershipId: string;
  collegeId: string;
  displayName: string;
  roles: readonly MembershipRole[];
  status: MembershipStatus;
}) {
  const router = useRouter();
  const { showToast } = useToast();
  const [currentRoles, setCurrentRoles] = useState([
    ...roles,
  ]);
  const [currentStatus, setCurrentStatus] =
    useState<MembershipStatus>(status);
  const [rolesOpen, setRolesOpen] = useState(false);
  const [suspendOpen, setSuspendOpen] = useState(false);
  const [endOpen, setEndOpen] = useState(false);
  const [suspensionReason, setSuspensionReason] =
    useState("");
  const [rolePending, setRolePending] =
    useState<MembershipRole | null>(null);
  const [lifecyclePending, startLifecycleTransition] =
    useTransition();
  const roleRequestPending = useRef(false);
  const lifecycleRequestPending = useRef(false);


  async function mutateRole(role: MembershipRole) {
    if (currentStatus === "ENDED" || rolePending || roleRequestPending.current || lifecycleRequestPending.current) {
      return;
    }

    const removing = currentRoles.includes(role);
    roleRequestPending.current = true;
    setRolePending(role);

    try {
      const response = await fetch(
        `/api/people/${membershipId}/roles`,
        {
          method: removing ? "DELETE" : "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ role }),
        },
      );
      const payload = await response.json().catch(() => null);

      if (!response.ok) {
        showToast({
          tone: "error",
          title: "Role update failed",
          description:
            payload?.error==="MEMBERSHIP_PROTECTED"
              ? "Only a Super Admin can manage College Admin or TPO accounts."
              : payload?.error==="MEMBERSHIP_SELF_LOCKOUT"
                ? "You cannot remove your own protected access."
                : role==="COLLEGE_ADMIN"&&response.status===403
                  ? "Only a Super Admin can change the College Admin role."
                  : payload?.error==="LAST_MEMBERSHIP_ROLE"
                    ? "A membership must keep at least one role."
                    : "The role could not be changed.",
        });
        return;
      }

      const confirmedRoles = verifiedMembershipRoleReceipt(payload, role, removing);
      if (!confirmedRoles) {
        showToast({
          tone: "error",
          title: "Role update could not be confirmed",
          description: "Reload the membership before retrying this role change.",
        });
        router.refresh();
        return;
      }
      setCurrentRoles(confirmedRoles);
      showToast({
        tone: "success",
        title: removing ? "Role removed" : "Role added",
        description: `${roleLabel(role)} was ${removing ? "removed from" : "added to"} ${displayName}.`,
      });
      router.refresh();
    } catch {
      showToast({
        tone: "error",
        title: "Role update could not be confirmed",
        description: "The connection was interrupted. Reload the membership before retrying.",
      });
      router.refresh();
    } finally {
      roleRequestPending.current = false;
      setRolePending(null);
    }
  }

  function lifecycle(
    body:
      | { action: "SUSPEND"; reason: string }
      | { action: "REACTIVATE" }
      | { action: "END" },
  ) {
    if (lifecycleRequestPending.current || lifecyclePending || roleRequestPending.current) return;
    lifecycleRequestPending.current = true;
    startLifecycleTransition(async () => {
      try {
        const response = await fetch(
          `/api/people/${membershipId}/lifecycle`,
          {
            method: "PATCH",
            headers: { "content-type": "application/json" },
            body: JSON.stringify(body),
          },
        );
        const payload = await response.json().catch(() => null);

        if (!response.ok) {
          showToast({
            tone: "error",
            title: "Membership update failed",
            description:
              payload?.error === "MEMBERSHIP_ENDED"
                ? "Ended memberships cannot be reactivated or suspended."
                : payload?.error==="MEMBERSHIP_PROTECTED"
                  ? "Only a Super Admin can manage College Admin or TPO accounts."
                  : payload?.error==="MEMBERSHIP_SELF_LOCKOUT"
                    ? "You cannot suspend or end your own protected access."
                    : "The membership state could not be changed.",
          });
          return;
        }

        const nextStatus = verifiedMembershipLifecycleReceipt(payload, body.action);
        if (!nextStatus) {
          showToast({
            tone: "error",
            title: "Membership update could not be confirmed",
            description: "Reload the membership before retrying this change.",
          });
          router.refresh();
          return;
        }
        setCurrentStatus(nextStatus);

        setSuspendOpen(false);
        setEndOpen(false);
        setSuspensionReason("");
        const roleName=currentRoles.length===1
          ? currentRoles[0]==="FACULTY"?"Faculty":
            currentRoles[0]==="LEARNER"?"Student":null
          :null;
        const verb=nextStatus==="SUSPENDED"?"suspended":
          nextStatus==="ACTIVE"?"reactivated":"ended";
        showToast({
          tone:"success",
          title:roleName&&nextStatus!=="ENDED"
            ? roleName+" "+verb
            :"Membership updated",
          description:`${displayName} is now ${nextStatus.toLowerCase()} in this college.`,
        });
        router.refresh();
      } catch {
        showToast({
          tone: "error",
          title: "Membership update could not be confirmed",
          description: "The connection was interrupted. Reload the membership before retrying.",
        });
        router.refresh();
      } finally {
        lifecycleRequestPending.current = false;
      }
    });
  }

  return (
    <>
      <div className="flex min-w-0 flex-wrap items-center justify-start gap-[var(--lms-space-2)] print:hidden sm:justify-end">
        <PersonProfileDialog
          membershipId={membershipId}
          collegeId={collegeId}
          displayName={displayName}
          roles={currentRoles}
          disabled={currentStatus === "ENDED"}
        />
        <Dropdown label="Membership actions" trigger="Actions" align="end" mobileSheet triggerClassName="md:!min-h-9">
          <Menu className="w-full min-w-0">
            <MenuItem
          
          
          
          disabled={currentStatus === "ENDED" || lifecyclePending || Boolean(rolePending) || roleRequestPending.current}
          onClick={() => setRolesOpen(true)}
        >
          Roles
        </MenuItem>

        {currentStatus === "ACTIVE" ? (
          <MenuItem
            
            
            disabled={lifecyclePending || Boolean(rolePending) || lifecycleRequestPending.current}
            onClick={() => setSuspendOpen(true)}
          >
            Suspend
          </MenuItem>
        ) : null}

        {currentStatus === "SUSPENDED" ? (
          <MenuItem
            
            
            disabled={lifecyclePending || Boolean(rolePending) || lifecycleRequestPending.current}
            onClick={() =>
              lifecycle({ action: "REACTIVATE" })
            }
          >
            {lifecyclePending
              ? "Working…"
              : "Reactivate"}
          </MenuItem>
        ) : null}

        {currentStatus !== "ENDED" ? (
          <MenuItem
            
            
            disabled={lifecyclePending || Boolean(rolePending) || lifecycleRequestPending.current}
            onClick={() => setEndOpen(true)}
          >
            End
          </MenuItem>
        ) : null}
          </Menu>
        </Dropdown>
      </div>

      <Dialog
        open={rolesOpen}
        onOpenChange={next => { if (!roleRequestPending.current && !lifecyclePending) setRolesOpen(next); }}
        dismissible={!Boolean(rolePending) && !lifecyclePending}
        title={`Manage roles · ${displayName}`}
        description="Roles are membership-scoped. SUPER_ADMIN is never assigned here."
      >
        <p className="mb-3 text-sm text-body leading-[22px]">
          Only a Super Admin can manage College Admin or TPO access.
          This menu manages college membership roles only; it does not unlock OTP accounts,
          impersonate a user or delete historical identity records.
        </p>
        <div role="group" aria-label="Membership roles" className="min-w-0 divide-y divide-[var(--lms-canvas-border)] border-y border-[var(--lms-canvas-border)]">
          {MEMBERSHIP_ROLES.map((role) => {
            const checked = currentRoles.includes(role);
            const pending = rolePending === role;

            return (
              <label
                key={role}
                className="flex min-h-11 cursor-pointer items-center justify-between gap-[var(--lms-space-4)] px-[var(--lms-space-3)] py-[var(--lms-space-2)] transition-colors duration-[var(--lms-motion-fast)] hover:bg-[var(--lms-primary-subtle)] focus-within:bg-[var(--lms-primary-subtle)] md:min-h-9 flex-wrap"
              >
                <span className="text-sm font-semibold text-body">
                  {roleLabel(role)}
                </span>
                <Checkbox
                  checked={checked}
                  disabled={
                    Boolean(rolePending) ||
                    roleRequestPending.current ||
                    lifecyclePending ||
                    currentStatus === "ENDED"
                  }
                  onChange={() => mutateRole(role)}
                  className="size-4"
                />
                <span className="sr-only" role="status" aria-live="polite">
                  {pending ? "Updating role" : ""}
                </span>
              </label>
            );
          })}
        </div>
      </Dialog>

      <Dialog
        open={suspendOpen}
        onOpenChange={next => { if (!lifecycleRequestPending.current && !lifecyclePending) setSuspendOpen(next); }}
        dismissible={!lifecyclePending&&!lifecycleRequestPending.current}
        title={`Suspend ${displayName}`}
        description="Suspension blocks this college membership and revokes the person's existing device sessions. Other active college memberships remain eligible after a fresh sign-in."
        footer={
          <div className="flex w-full flex-col-reverse gap-[var(--lms-space-2)] md:flex-row md:justify-end [&>button]:w-full md:[&>button]:w-auto">
            <Button
              variant="secondary"
                disabled={lifecyclePending}
              onClick={() => setSuspendOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
                loading={lifecyclePending}
              disabled={
                lifecyclePending ||
                Boolean(rolePending) ||
                !suspensionReason.trim()
              }
              onClick={() =>
                lifecycle({
                  action: "SUSPEND",
                  reason: suspensionReason,
                })
              }
            >
              {lifecyclePending
                ? "Suspending…"
                : "Suspend membership"}
            </Button>
          </div>
        }
      >
        <label
          htmlFor={`suspension-reason-${membershipId}`}
          className="mb-[6px] block text-[13px] font-semibold text-[var(--lms-neutral-400)] leading-4"
        >
          Suspension reason
        </label>
        <Textarea
          className="min-h-24 w-full"
          id={`suspension-reason-${membershipId}`}
          value={suspensionReason}
          onChange={(event) =>
            setSuspensionReason(event.target.value)
          }
          maxLength={1000}
          placeholder="Explain why this membership is being suspended."
        />
      </Dialog>

      <ConfirmDialog
        open={endOpen}
        onOpenChange={next => { if (!lifecycleRequestPending.current && !lifecyclePending) setEndOpen(next); }}
        title={`End ${displayName}'s membership?`}
        description="Ending is terminal for this college membership and signs out existing device sessions. It does not delete the canonical user or other college memberships."
        confirmLabel="End membership" confirmVariant="danger"
        pending={lifecyclePending}
        onConfirm={() => lifecycle({ action: "END" })}
      />
    </>
  );
}
