/** TPO-campaigns-public-29 exact legacy recruiter-joined bell copy. */
export function publicRecruiterJoinedNotification(input: {
  name: string; companyName: string; scope: "COLLEGE" | "COMPANY";
}) {
  const first = input.name.trim().split(/\s+/)[0] || "Recruiter";
  return {
    title: first + " joined from " + input.companyName,
    body: input.scope === "COMPANY"
      ? "Through your company link. They can now request a drive."
      : "Through your public link. They can now request a drive.",
    actionHref: "/tpo/recruiters",
  };
}
