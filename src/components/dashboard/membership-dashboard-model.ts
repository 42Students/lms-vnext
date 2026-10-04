import type {
  MembershipRole,
} from "@/modules/identity/constants";
import type {
  RequestContext,
} from "@/modules/identity/context";

export type MembershipDashboardWorkspace =
  Extract<
    MembershipRole,
    | "COLLEGE_ADMIN"
    | "FACULTY"
    | "MENTOR"
    | "TPO"
    | "LEARNER"
  >;

const dashboardWorkspaceOrder:
  readonly MembershipDashboardWorkspace[] = [
    "COLLEGE_ADMIN",
    "FACULTY",
    "MENTOR",
    "TPO",
    "LEARNER",
  ];

export function getMembershipDashboardWorkspaces(
  context: RequestContext,
): MembershipDashboardWorkspace[] {
  const membership = context.membership;
  if (
    !membership ||
    membership.status !== "ACTIVE"
  ) {
    return [];
  }

  return dashboardWorkspaceOrder.filter(
    (workspace) =>
      membership.roles.includes(
        workspace,
      ),
  );
}
