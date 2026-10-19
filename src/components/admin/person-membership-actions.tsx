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
            role==="COLLEGE_ADMIN"&&response.status===403
              ? "Only a Super Admin can change the College Admin role."
              : payload?.error === "LAST_MEMBERSHIP_ROLE"
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
        showToast({
          tone: "success",
          title: "Membership updated",
          description: `${displayName} is now ${nextStatus.toLowerCase()}.`,
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
      <div className="flex flex-wrap justify-end gap-2">
        <PersonProfileDialog
          membershipId={membershipId}
          collegeId={collegeId}
          displayName={displayName}
          roles={currentRoles}
          disabled={currentStatus === "ENDED"}
        />
        <Button
          variant="secondary"
          size="sm"
          disabled={currentStatus === "ENDED" || lifecyclePending || Boolean(rolePending)}
          onClick={() => setRolesOpen(true)}
        >
          Roles
        </Button>

        {currentStatus === "ACTIVE" ? (
          <Button
            variant="secondary"
            size="sm"
            disabled={lifecyclePending || Boolean(rolePending)}
            onClick={() => setSuspendOpen(true)}
          >
            Suspend
          </Button>
        ) : null}

        {currentStatus === "SUSPENDED" ? (
          <Button
            variant="secondary"
            size="sm"
            disabled={lifecyclePending || Boolean(rolePending)}
            onClick={() =>
              lifecycle({ action: "REACTIVATE" })
            }
          >
            {lifecyclePending
              ? "Working…"
              : "Reactivate"}
          </Button>
        ) : null}

        {currentStatus !== "ENDED" ? (
          <Button
            variant="ghost"
            size="sm"
            disabled={lifecyclePending || Boolean(rolePending)}
            onClick={() => setEndOpen(true)}
          >
            End
          </Button>
        ) : null}
      </div>

      <Dialog
        open={rolesOpen}
        onOpenChange={setRolesOpen}
        title={`Manage roles · ${displayName}`}
        description="Roles are membership-scoped. SUPER_ADMIN is never assigned here."
      >
        <p className="mb-3 text-sm text-body">The College Admin role can only be assigned or removed by a Super Admin.</p>
        <div className="divide-y divide-border border-y border-border">
          {MEMBERSHIP_ROLES.map((role) => {
            const checked = currentRoles.includes(role);
            const pending = rolePending === role;

            return (
              <label
                key={role}
                className="flex min-h-11 cursor-pointer items-center justify-between gap-4 px-3 py-2 hover:bg-primary-subtle"
              >
                <span className="text-sm font-semibold text-body">
                  {roleLabel(role)}
                </span>
                <Checkbox
                  checked={checked}
                  disabled={
                    Boolean(rolePending) ||
                    lifecyclePending ||
                    currentStatus === "ENDED"
                  }
                  onChange={() => mutateRole(role)}
                  className="h-4 w-4 accent-[var(--lms-primary)]"
                />
                <span className="sr-only">
                  {pending ? "Updating role" : ""}
                </span>
              </label>
            );
          })}
        </div>
      </Dialog>

      <Dialog
        open={suspendOpen}
        onOpenChange={setSuspendOpen}
        title={`Suspend ${displayName}`}
        description="Suspension blocks this college membership without disabling the canonical user or their other college memberships."
        footer={
          <>
            <Button
              variant="secondary"
              disabled={lifecyclePending}
              onClick={() => setSuspendOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
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
          </>
        }
      >
        <label
          htmlFor={`suspension-reason-${membershipId}`}
          className="mb-1.5 block text-xs font-semibold text-body"
        >
          Suspension reason
        </label>
        <Textarea
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
        onOpenChange={setEndOpen}
        title={`End ${displayName}'s membership?`}
        description="Ending is terminal for this college membership. It does not delete the canonical user or memberships in other colleges."
        confirmLabel="End membership"
        pending={lifecyclePending}
        onConfirm={() => lifecycle({ action: "END" })}
      />
    </>
  );
}
