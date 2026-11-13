import { notFound } from "next/navigation";
import { UxComponentGroupsHarness } from "./ux-component-groups-harness";

import { featureReady } from "@/config/features";
/** Synthetic UI-only fixtures. Never available in a production build. */
export const dynamic = "force-dynamic";

export default function UxComponentGroupsPage() {
  if (process.env.NODE_ENV !== "development" || !featureReady("e2eAuth")) notFound();
  return <UxComponentGroupsHarness />;
}
