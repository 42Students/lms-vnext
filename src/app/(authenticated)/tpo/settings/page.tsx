import { redirect } from "next/navigation";

export default async function TpoSettingsIndex({
  searchParams,
}: {
  searchParams: Promise<{
    tab?: string | string[];
  }>;
}) {
  const params = await searchParams;
  const tab = Array.isArray(params.tab)
    ? params.tab[0]
    : params.tab;

  // Preserve the two legacy ?tab= bookmarks
  // while using explicit vNext sub-routes.
  redirect(
    tab === "rules"
      ? "/tpo/settings/rules"
      : "/tpo/settings/rules",
  );
}
