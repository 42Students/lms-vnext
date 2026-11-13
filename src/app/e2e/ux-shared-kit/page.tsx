import { notFound } from "next/navigation";
import { UxSharedKitHarness } from "./ux-shared-kit-harness";

import { featureReady } from "@/config/features";
/** Synthetic UI only, never accessible in production. */
export const dynamic = "force-dynamic";
export default async function SharedKitPage({ searchParams }: {
  searchParams: Promise<{ page?: string | string[] }>;
}) {
  if (process.env.NODE_ENV !== "development" || !featureReady("e2eAuth")) notFound();
  const query = await searchParams;
  const value = typeof query.page === "string" ? Number(query.page) : 2;
  const page = Number.isInteger(value) && value >= 1 && value <= 5 ? value : 2;
  return <UxSharedKitHarness page={page} />;
}
