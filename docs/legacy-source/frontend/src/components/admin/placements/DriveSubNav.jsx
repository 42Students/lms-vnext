import { useRouter } from "next/router";
import { Tabs, Breadcrumb, Modal } from "antd";
import Link from "next/link";
import { getSafeInternalReturnPath, withReturnTo } from "@/utils/navigationContext";

const SECTIONS = [
  { key: "overview", label: "Overview" },
  { key: "applications", label: "Applications" },
  { key: "interviews", label: "Schedule" },
  { key: "settings", label: "Settings" },
];

/**
 * Level-2 nav for a single drive's workspace. "Schedule" (not "Interviews") deliberately —
 * the Level-1 Placements nav already has a global "Interviews" tab, and reusing the name here
 * would read as the same page when it's actually filtered to one drive.
 */
export default function DriveSubNav({ jobId, jobTitle, companyName, active, onBeforeNavigate, basePath = "/college-admin" }) {
  const router = useRouter();

  const items = SECTIONS.map((s) => ({ key: s.key, label: s.label }));
  const jobsRoot = `${basePath}/jobs`;
  const returnTo = getSafeInternalReturnPath(router.query?.returnTo, {
    fallback: jobsRoot,
    allowedPrefixes: [jobsRoot],
  });

  const handleChange = (key) => {
    const suffix = key === "overview" ? "" : `/${key}`;
    const go = () =>
      router.push(withReturnTo(`${basePath}/jobs/${jobId}${suffix}`, returnTo));
    // onBeforeNavigate is optional — pages that don't pass it (or don't have an unsaved-changes
    // concept) get the previous unguarded behavior. When provided, it should return true if
    // there are unsaved changes that would be silently discarded by navigating away now.
    if (onBeforeNavigate && onBeforeNavigate()) {
      Modal.confirm({
        title: "Discard unsaved changes?",
        content: "You have unsaved changes on this form. Leaving now will discard them.",
        okText: "Discard",
        okType: "danger",
        cancelText: "Keep editing",
        onOk: go,
      });
      return;
    }
    go();
  };

  return (
    <div style={{ marginBottom: 12 }}>
      <Breadcrumb
        style={{ marginBottom: 8 }}
        items={[
          { title: <Link href={returnTo}>Drives</Link> },
          { title: companyName || jobTitle || `Drive #${jobId}` },
        ]}
      />
      <Tabs activeKey={active} onChange={handleChange} items={items} />
    </div>
  );
}
