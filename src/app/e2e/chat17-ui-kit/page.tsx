import { notFound } from "next/navigation";
import { Chat17UIKitHarness } from "./ui-harness";

/** Isolated interaction fixture; never shipped as a public production UI. */
export const dynamic = "force-dynamic";

export default function Chat17UIKitHarnessPage() {
  if (process.env.NODE_ENV !== "development") notFound();
  return <Chat17UIKitHarness />;
}
