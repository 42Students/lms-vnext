import { notFound } from "next/navigation";
import { UxComponentGroupsHarness } from "./ux-component-groups-harness";

/** Synthetic UI-only fixtures. Never available in a production build. */
export const dynamic = "force-dynamic";

export default function UxComponentGroupsPage() {
  if (process.env.NODE_ENV !== "development" || process.env.E2E_AUTH_ENABLED !== "true") notFound();
  return <UxComponentGroupsHarness />;
}
