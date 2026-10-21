import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { Alert, Button, Card, Empty, Popconfirm, Skeleton, Space, Table, message } from "antd";
import { showProjectError } from "@/utils/projectErrorModal";
import { UndoOutlined } from "@ant-design/icons";
import SuperAdminLayout from "@/layouts/SuperAdminLayout";
import SuperAdminGroupShell from "@/components/admin/SuperAdminGroupShell";
import { useSuperAdminScope } from "@/contexts/SuperAdminScopeContext";
import { fetchWithErrorHandling, getDeletedProjectsByCollege, restoreProject } from "@/api/Services/AdminService";
import {
  asArray,
  normaliseCollegeScopedName,
  projectMentorMember,
  textOrDash,
  unwrapApiItem,
} from "@/components/admin/projects/adminProjectUtils";

// A deleted workspace was previously unrecoverable from the admin UI — the backend restore
// endpoint existed but nothing ever called it, since the regular workspace list excludes
// soft-deleted rows entirely and there was no view listing what's recoverable.
export default function SuperAdminDeletedProjectWorkspacesPage() {
  const router = useRouter();
  const { selectedCollegeId: collegeId, scopeLoaded } = useSuperAdminScope();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [projects, setProjects] = useState([]);
  const [totalRecords, setTotalRecords] = useState(0);
  const [pageNumber, setPageNumber] = useState(0);
  const [pageSize, setPageSize] = useState(20);
  const [restoringId, setRestoringId] = useState(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      if (!collegeId) return;
      setLoading(true);
      setError(null);
      try {
        const result = await fetchWithErrorHandling(getDeletedProjectsByCollege(collegeId, { page: pageNumber, size: pageSize }));
        if (!mounted) return;
        if (result.success) {
          const pageData = unwrapApiItem(result);
          const records = asArray(pageData?.records);
          const total = Number(pageData?.totalRecords) || 0;
          setProjects(records);
          setTotalRecords(total);
          // Restoring the last row on a non-first page leaves pageNumber pointing past the new
          // end — step back a page so pagination doesn't keep claiming a page that no longer
          // has any rows (a real empty college still has total === 0, so that case is untouched).
          if (records.length === 0 && total > 0 && pageNumber > 0) {
            setPageNumber((prev) => Math.max(prev - 1, 0));
          }
        } else {
          setProjects([]);
          setTotalRecords(0);
          setError(result?.message || "Failed to load deleted workspaces.");
        }
      } catch (e) {
        if (!mounted) return;
        setProjects([]);
        setTotalRecords(0);
        setError(e?.message || "Failed to load deleted workspaces.");
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    return () => {
      mounted = false;
    };
  }, [collegeId, pageNumber, pageSize, reloadKey]);

  const handleRestore = async (project) => {
    const projectId = project?.id ?? project?.slug ?? project?.numericId;
    setRestoringId(projectId);
    try {
      const response = await restoreProject(projectId, collegeId);
      const restored = unwrapApiItem(response);
      // deleteProject's cascade soft-deletes every membership, so a restore can land back on
      // BLOCKED when the mentor's own membership didn't survive it (see restoreProject's
      // "Restored without an assigned mentor" blocker in ProjectWorkspaceServiceImpl). A flat
      // success toast here would hide that the workspace still isn't usable.
      const restoredStatus = String(restored?.status ?? "").toUpperCase();
      const mentorlessBlocker = String(restored?.blocker ?? "").toLowerCase().includes("mentor");
      if (restoredStatus === "BLOCKED" && mentorlessBlocker) {
        message.warning("Workspace restored, but its mentor could not be recovered — assign one to reactivate it.");
      } else {
        message.success("Workspace restored");
      }
      setReloadKey((prev) => prev + 1);
    } catch (e) {
      showProjectError(e, { fallback: "Failed to restore workspace" });
    } finally {
      setRestoringId(null);
    }
  };

  const columns = [
    {
      title: "Workspace",
      key: "workspace",
      render: (_, project) => normaliseCollegeScopedName(project, "Workspace"),
    },
    {
      title: "Mentor",
      key: "mentor",
      // See the note in workspaces/index.js: project.mentor is the naive
        // first-FACULTY-member field, not the designated mentor.
        render: (_, project) => textOrDash(projectMentorMember(project)?.name || project?.mentor),
    },
    {
      title: "Action",
      key: "action",
      render: (_, project) => {
        const projectId = project?.id ?? project?.slug ?? project?.numericId;
        return (
          <Popconfirm
            title="Restore this workspace?"
            description="The workspace shell, members, and meetings are restored. Tasks, sprints and resources come back fresh from the template — any workspace-specific edits made to them are not recoverable."
            okText="Restore"
            onConfirm={() => handleRestore(project)}
          >
            <Button icon={<UndoOutlined />} type="primary" loading={restoringId === projectId}>
              Restore
            </Button>
          </Popconfirm>
        );
      },
    },
  ];

  if (!collegeId) {
    return (
      <div className="ln-module admin-list-page">
        {/* Inside the shell: a missing scope is a state to recover from, and dropping the tab
            strip and every other navigation affordance is the one thing that makes it harder. */}
        <SuperAdminGroupShell groupKey="projects">
          {scopeLoaded ? (
            <Alert
              type="warning"
              message="No college selected"
              description="Pick a college in the header to manage its project workspaces."
              showIcon
            />
          ) : (
            <Skeleton active paragraph={{ rows: 4 }} />
          )}
        </SuperAdminGroupShell>
      </div>
    );
  }

  return (
    <div className="ln-module admin-list-page">
      <SuperAdminGroupShell groupKey="projects">
      <div className="admin-list-page__header">
        <div>
          <h1 className="admin-list-page__title">Deleted workspaces</h1>
          <div className="admin-list-page__subtitle">Deleted workspaces you can still restore.</div>
        </div>
        <Space wrap>
          <Button onClick={() => router.push("/superadmin/projects/workspaces")}>Back to workspaces</Button>
        </Space>
      </div>

      {error ? (
        <Alert type="error" message="Deleted workspaces could not be loaded" description={error} showIcon style={{ marginBottom: 16 }} />
      ) : null}

      <Card title="Deleted workspaces">
        <Skeleton loading={loading} active paragraph={{ rows: 6 }}>
          {error ? (
            // A transient fetch failure also clears projects/totalRecords, which would otherwise
            // render the reassuring "no deleted workspaces" Empty card right under the error
            // Alert above — an admin skimming past the alert could read that as authoritative.
            <Empty description="Deleted workspaces could not be loaded">
              <Button onClick={() => setReloadKey((prev) => prev + 1)}>Retry</Button>
            </Empty>
          ) : projects.length || totalRecords ? (
            <Table
              rowKey={(record) => record?.id ?? record?.slug ?? record?.numericId}
              dataSource={projects}
              columns={columns}
              loading={loading}
              pagination={{
                current: pageNumber + 1,
                pageSize,
                total: totalRecords,
                showSizeChanger: true,
                pageSizeOptions: [10, 20, 50, 100],
                showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} deleted workspaces`,
                onChange: (nextPage, nextPageSize) => {
                  setPageNumber(nextPage - 1);
                  setPageSize(nextPageSize);
                },
              }}
            />
          ) : (
            <Empty description="No deleted workspaces for this college" />
          )}
        </Skeleton>
      </Card>
      </SuperAdminGroupShell>
    </div>
  );
}

SuperAdminDeletedProjectWorkspacesPage.superAdminLayout = SuperAdminLayout;
