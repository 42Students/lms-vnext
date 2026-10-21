import Link from "next/link";
import { useRouter } from "next/router";
import { Alert, Button, Space, Tabs } from "antd";
import { ContactsGrid, allContactsColumn, facultyContactsColumn, learnerContactsColumn } from "@/components/contacts";
import PeoplePageOverview from "@/components/admin/people/PeoplePageOverview";

/** Read-only contact lookup; account registration and editing live on the management pages. */
export default function PeopleDirectory({ collegeId = null }) {
  const router = useRouter();
  const isCollegeScoped = collegeId != null && Number.isSafeInteger(Number(collegeId)) && Number(collegeId) > 0;
  const basePath = router.pathname.startsWith("/superadmin") ? "/superadmin" : "/college-admin";

  const requestedView = Array.isArray(router.query.view) ? router.query.view[0] : router.query.view;
  const activeView = ["all", "faculty", "students"].includes(requestedView) ? requestedView : "all";

  const changeView = (view) => {
    router.replace(
      { pathname: router.pathname, query: { ...router.query, view } },
      undefined,
      { shallow: true }
    );
  };

  return (
    <div className="ln-module admin-list-page">
      <PeoplePageOverview
        title="People Directory"
        description="A read-only contact lookup for the selected college. Use the management pages for registration, profile changes, access, suspension or teaching allocation."
        actions={
          <Space wrap>
            <Link href={`${basePath}/students`}><Button>Student accounts</Button></Link>
            <Link href={`${basePath}/teachers`}><Button>Faculty accounts</Button></Link>
            <Link href={`${basePath}/faculty-assignment`}><Button>Teaching assignments</Button></Link>
          </Space>
        }
      />
      {!isCollegeScoped ? (
        <Alert type="warning" showIcon message="Select a college to browse contacts" />
      ) : (
        <Tabs
          activeKey={activeView}
          onChange={changeView}
          items={[
            { key: "all", label: "All contacts", children: <ContactsGrid columns={allContactsColumn} userType="All" collegeId={collegeId} /> },
            { key: "faculty", label: "Faculty", children: <ContactsGrid columns={facultyContactsColumn} userType="FACULTY" collegeId={collegeId} /> },
            { key: "students", label: "Students", children: <ContactsGrid columns={learnerContactsColumn} userType="LEARNER" collegeId={collegeId} /> },
          ]}
        />
      )}
    </div>
  );
}
