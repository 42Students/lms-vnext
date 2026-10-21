import { useCallback, useEffect, useState } from "react";
import { Alert, Button, Drawer, Empty, Input, Segmented, Space, Table, Tag, Typography } from "antd";
import SuperAdminLayout from "@/layouts/SuperAdminLayout";
import PageShell from "@/components/Common/PageShell";
import { fetchWithErrorHandling } from "@/api/Services/AdminService";
import { dj } from "@/components/tpo/dj";
import { getInboundMail, listInboundMail, markInboundMailDone } from "@/api/Services/SuperAdminInboundMailService";

// Every email sent to a 42lms.com address lands here (no Gmail): replies that went into a recruiter conversation, and
// everything that needs a person (a recruiter replying to an invite, a student replying to a code email, mail to hello@).
// Platform-wide, so it needs no college selected.
const SHOW = [
  { value: "OPEN", label: "To read" },
  { value: "REPLIES", label: "Posted to conversations" },
  { value: "DONE", label: "Done" },
  { value: "ALL", label: "All" },
];

const STATUS_WORDS = {
  POSTED: ["Posted to the conversation", "green"],
  STORED: ["Received", "blue"],
  NO_THREAD: ["Conversation not found", "orange"],
  WRONG_SENDER: ["Not from that recruiter", "orange"],
  NOT_VERIFIED: ["Sender not verified", "red"],
  EMPTY: ["Empty reply", "default"],
  ACCESS_ENDED: ["Recruiter's access ended", "orange"],
  FAILED: ["Could not post", "red"],
};

const when = (v) => (v ? dj(v).format("D MMM, h:mm A") : "");

function StatusTag({ status }) {
  const [label, color] = STATUS_WORDS[status] || [status, "default"];
  return <Tag color={color}>{label}</Tag>;
}

function Sender({ row }) {
  const who = row.recruiterName || row.studentName;
  return (
    <span>
      {who ? <b>{who}</b> : null}
      {who ? <br /> : null}
      <Typography.Text type="secondary">{row.fromAddress || "Unknown sender"}</Typography.Text>
      {row.recruiterName && <Tag style={{ marginLeft: 6 }}>Recruiter</Tag>}
      {row.studentName && <Tag style={{ marginLeft: 6 }}>Student{row.collegeName ? ` · ${row.collegeName}` : ""}</Tag>}
    </span>
  );
}

export default function SuperAdminInboundMail() {
  const [show, setShow] = useState("OPEN");
  const [q, setQ] = useState("");
  const [page, setPage] = useState(0);
  const [data, setData] = useState(null);
  const [error, setError] = useState(false);
  const [open, setOpen] = useState(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(() => {
    setError(false);
    fetchWithErrorHandling(listInboundMail({ show, q: q || undefined, page })).then((r) => {
      if (r.success) setData(r.data);
      else setError(true);
    });
  }, [show, q, page]);
  useEffect(() => { load(); }, [load]);

  const openMail = (row) => {
    setOpen({ ...row, loading: true });
    fetchWithErrorHandling(getInboundMail(row.id)).then((r) => setOpen(r.success ? r.data : { ...row, loadError: true }));
  };

  const setDone = async (done) => {
    if (!open) return;
    setBusy(true);
    const r = await fetchWithErrorHandling(markInboundMailDone(open.id, done));
    setBusy(false);
    if (r.success) {
      setOpen(null);
      load();
    }
  };

  const columns = [
    { title: "Received", dataIndex: "receivedAt", width: 140, render: (v) => when(v) },
    { title: "From", key: "from", width: 280, render: (_, row) => <Sender row={row} /> },
    {
      title: "Email",
      key: "email",
      render: (_, row) => (
        <span>
          <b>{row.subject || "(no subject)"}</b>
          <br />
          <Typography.Text type="secondary" ellipsis style={{ maxWidth: 520, display: "inline-block" }}>{row.preview}</Typography.Text>
        </span>
      ),
    },
    {
      title: "Status",
      dataIndex: "status",
      width: 210,
      render: (v, row) => <Space size={4} wrap><StatusTag status={v} />{row.handledAt && <Tag>Done</Tag>}</Space>,
    },
  ];

  const segments = SHOW.map((s) => ({ ...s, label: s.value === "OPEN" && data?.open ? `${s.label} (${data.open})` : s.label }));

  return (
    <div className="ln-module admin-list-page">
      <PageShell title="Inbound mail">
        <Typography.Paragraph type="secondary">
          Every email sent to a 42lms.com address. Recruiters&apos; replies to a conversation go straight into it; anything else waits
          here until someone reads it and marks it done.
        </Typography.Paragraph>
        <Space wrap style={{ marginBottom: 12 }}>
          <Segmented options={segments} value={show} onChange={(v) => { setShow(v); setPage(0); }} />
          <Input.Search allowClear placeholder="Search sender, subject or text" style={{ width: 300 }}
            onSearch={(v) => { setQ(v.trim()); setPage(0); }} />
        </Space>
        {error ? (
          <Alert type="warning" showIcon message="Couldn't load inbound mail" action={<Button size="small" onClick={load}>Retry</Button>} />
        ) : (
          <Table rowKey="id" size="middle" loading={!data} dataSource={data?.items || []} columns={columns}
            locale={{ emptyText: <Empty description={show === "OPEN" ? "Nothing waiting to be read" : "No emails"} /> }}
            onRow={(row) => ({ onClick: () => openMail(row), style: { cursor: "pointer" } })}
            pagination={{ current: page + 1, pageSize: data?.pageSize || 50, total: data?.total || 0, onChange: (p) => setPage(p - 1), showSizeChanger: false }} />
        )}
        <Drawer open={!!open} onClose={() => setOpen(null)} width={640} title={open?.subject || "(no subject)"}
          extra={open && !open.loading && open.status !== "POSTED" && (
            open.handledAt
              ? <Button onClick={() => setDone(false)} loading={busy}>Move back to To read</Button>
              : <Button type="primary" onClick={() => setDone(true)} loading={busy}>Mark done</Button>
          )}>
          {open && (
            <Space direction="vertical" style={{ width: "100%" }} size="middle">
              <Sender row={open} />
              <Typography.Text type="secondary">To {open.toAddress} · {when(open.receivedAt)}</Typography.Text>
              {open.status !== "STORED" && <StatusTag status={open.status} />}
              {open.loadError ? <Alert type="warning" showIcon message="Couldn't load this email" /> : (
                <div style={{ whiteSpace: "pre-wrap", wordBreak: "break-word", lineHeight: 1.6 }} data-testid="inbound-mail.body">
                  {open.loading ? "Loading..." : open.body || open.preview || ""}
                </div>
              )}
            </Space>
          )}
        </Drawer>
      </PageShell>
    </div>
  );
}

SuperAdminInboundMail.superAdminLayout = SuperAdminLayout;
