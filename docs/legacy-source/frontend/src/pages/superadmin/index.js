// The superadmin panel used to be a single-page app living entirely in this file (~1500 lines:
// auth check, college/org scope state, a hand-rolled sidebar, and a big renderContent() switch
// over ~30 sections). It's been migrated to real per-page routes under src/pages/superadmin/*,
// matching how /college-admin, /learn, and /teacher already work — see:
//   - src/layouts/SuperAdminLayout.js       (auth check + sidebar + scope-selector header)
//   - src/contexts/SuperAdminScopeContext.js (the org/college scope state, now shared across pages)
//   - src/common/superAdminNavGroups.js      (sidebar taxonomy + grouped tab strips)
//   - src/components/Sidebar/SuperAdminSidebar.js
// This file's only remaining job is to send the bare /superadmin URL to its new default landing
// page, for anyone with an old bookmark or a hardcoded router.push("/superadmin").
export async function getServerSideProps(context) {
  context.res.writeHead(302, { Location: "/superadmin/dashboard" });
  context.res.end();
  return { props: {} };
}

export default function SuperAdminIndexRedirect() {
  return null;
}
