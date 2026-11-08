import { notFound } from "next/navigation";
import { TpoTenRecoveryHarness } from "./tpo-ten-recovery-harness";

export const dynamic = "force-dynamic";

/** Synthetic UI-only preview, unavailable in production and without an explicit opt-in. */
export default async function TpoTenRouteRecovery({
  searchParams,
}: { searchParams: Promise<{group?: string}> }) {
  if (process.env.NODE_ENV !== "development" || process.env["UX_TPO_TEN_FIXTURE"] !== "1") notFound();
  const group = (await searchParams).group;
  if (!group || !/^UX-G(?:098|099|100|101|102|104|105|106|107|108)$/.test(group)) notFound();
  return <main className="mx-auto min-w-0 max-w-3xl space-y-5 px-4 py-8">
    <TpoTenRecoveryHarness group={group} />
  </main>;
}
