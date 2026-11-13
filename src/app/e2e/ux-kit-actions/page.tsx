import { notFound } from "next/navigation";
import { UxKitActionsHarness } from "./ux-kit-actions-harness";
import { featureReady } from "@/config/features";
export const dynamic = "force-dynamic";
/** Purely synthetic controls; not a production route. */
export default function UxKitActionsFixture() {
  if (process.env.NODE_ENV !== "development" || !featureReady("e2eAuth")) notFound();
  return <UxKitActionsHarness />;
}
