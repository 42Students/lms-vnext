import { notFound } from "next/navigation";
import { UxKitActionsHarness } from "./ux-kit-actions-harness";
export const dynamic = "force-dynamic";
/** Purely synthetic controls; not a production route. */
export default function UxKitActionsFixture() {
  if (process.env.NODE_ENV !== "development" || process.env.E2E_AUTH_ENABLED !== "true") notFound();
  return <UxKitActionsHarness />;
}
