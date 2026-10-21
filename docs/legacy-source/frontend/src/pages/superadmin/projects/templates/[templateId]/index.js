import { useEffect } from "react";
import { useRouter } from "next/router";
import { Alert, Skeleton } from "antd";
import SuperAdminLayout from "@/layouts/SuperAdminLayout";

// The template detail used to be one flat page; it is now seven section pages. Anything still
// linking to /superadmin/projects/templates/<id> (the list page's "Open", a bookmark, a redirect
// after duplicate) lands here and is sent to the first section rather than a 404. The query string
// travels with it, so a deep link that carries one keeps working after the hop.
export default function SuperAdminProjectTemplateIndexPage() {
  const router = useRouter();
  const { templateId, ...rest } = router.query;

  useEffect(() => {
    if (!router.isReady || !templateId) return;
    router.replace({
      pathname: `/superadmin/projects/templates/${encodeURIComponent(templateId)}/overview`,
      query: rest,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router.isReady, templateId]);

  // No id in the URL means there is nothing to redirect to. Without this the page sat on a
  // skeleton forever, looking like a load that never finished.
  if (router.isReady && !templateId) {
    return (
      <div className="ln-module admin-list-page">
        <Alert
          type="warning"
          message="No template in this link"
          description="The URL is missing a template id. Open the template from the Templates list instead."
          showIcon
        />
      </div>
    );
  }

  // Every other redirect stub in this module renders a skeleton rather than nothing; this one
  // returned null, which flashes an empty page for the length of the router round-trip.
  return (
    <div className="ln-module admin-list-page">
      <Skeleton active paragraph={{ rows: 6 }} />
    </div>
  );
}

SuperAdminProjectTemplateIndexPage.superAdminLayout = SuperAdminLayout;
