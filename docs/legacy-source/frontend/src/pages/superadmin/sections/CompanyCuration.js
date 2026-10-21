import { useCallback, useEffect, useState } from "react";
import { Alert, Button, Checkbox, Form, Input, Modal, Select, Space, Table, Tag, Typography, message } from "antd";
import AsyncModal from "@/components/tpo/ui/AsyncModal";
import { useDebouncedValue } from "@/components/tpo/ui/useDebouncedValue";
import {
  addCompanyAlias, addCompanyDomain, fetchWithErrorHandling, listCuratedCompanies, mergeCompany, removeCompanyAlias, removeCompanyDomain, setCompanyVerified, updateCuratedCompany,
} from "@/api/Services/AdminService";

const errorText = (r, fallback) => r?.data?.message || r?.message || fallback;

/**
 * 42's company list (recruiter phase 1, N3). One company per real company, known by its domains. Verifying a company puts it
 * on 42's list: its name then wins on every college's drive form. Merge folds a duplicate into the right company. Other names
 * ("TCS", "Cognizant Technology Solutions") make the TPO's company search find it however it is typed
 * (docs/companies/COMPANY-SEARCH-2026-10-13.md).
 */
export default function CompanyCuration() {
  const [q, setQ] = useState("");
  const query = useDebouncedValue(q, 300);
  const [onlyUnverified, setOnlyUnverified] = useState(false);
  const [page, setPage] = useState(0);
  const [data, setData] = useState({ items: [], total: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editing, setEditing] = useState(null);
  const [domainsFor, setDomainsFor] = useState(null);
  const [newDomain, setNewDomain] = useState("");
  const [aliasesFor, setAliasesFor] = useState(null);
  const [newAlias, setNewAlias] = useState("");
  const [merging, setMerging] = useState(null);
  const [mergeInto, setMergeInto] = useState(null);
  const [editForm] = Form.useForm();

  const load = useCallback(async () => {
    setLoading(true);
    const r = await fetchWithErrorHandling(listCuratedCompanies({ q: query || undefined, unverified: onlyUnverified, page, size: 50 }));
    setLoading(false);
    if (!r.success) { setError(errorText(r, "Couldn't load companies")); return; }
    setError(null);
    setData({ items: r.data?.items || [], total: r.data?.total || 0 });
  }, [query, onlyUnverified, page]);
  useEffect(() => { load(); }, [load]);
  useEffect(() => { setPage(0); }, [query, onlyUnverified]);

  const act = async (call, ok) => {
    const r = await fetchWithErrorHandling(call);
    if (!r.success) { message.error(errorText(r, "That didn't work")); return false; }
    if (ok) message.success(ok);
    await load();
    return r;
  };

  const addAlias = async () => {
    if (newAlias.trim().length < 2) return;
    const r = await act(addCompanyAlias(aliasesFor.id, newAlias.trim()), "Name added. The company search finds it now.");
    if (r) { setAliasesFor({ ...aliasesFor, aliases: r.data }); setNewAlias(""); }
  };

  const columns = [
    { title: "Company", key: "name", render: (_, c) => (
      <Space direction="vertical" size={0}>
        <Space size={6}><Typography.Text strong>{c.name}</Typography.Text>{c.verifiedBy42 ? <Tag color="blue">Verified by 42</Tag> : <Tag>Not verified</Tag>}</Space>
        {c.website && <Typography.Text type="secondary">{c.website}</Typography.Text>}
        {c.aliases?.length > 0 && <Typography.Text type="secondary">Also known as {c.aliases.join(", ")}</Typography.Text>}
      </Space>) },
    { title: "Domains", key: "domains", render: (_, c) => (c.domains?.length ? c.domains.join(", ") : <Typography.Text type="secondary">None</Typography.Text>) },
    { title: "Added by", key: "added", render: (_, c) => c.addedByCollege || (c.addedByUserType ? c.addedByUserType.toLowerCase().replace("_", " ") : "-") },
    { title: "Colleges", dataIndex: "colleges", width: 90 },
    { title: "Drives", dataIndex: "drives", width: 80 },
    { title: "", key: "actions", width: 420, render: (_, c) => (
      <Space wrap>
        <Button size="small" type={c.verifiedBy42 ? "default" : "primary"}
          onClick={() => act(setCompanyVerified(c.id, !c.verifiedBy42), c.verifiedBy42 ? "Removed from 42's list" : "Verified by 42")}>
          {c.verifiedBy42 ? "Unverify" : "Verify"}
        </Button>
        <Button size="small" onClick={() => { editForm.setFieldsValue({ name: c.name, website: c.website, industry: c.industry, logoUrl: c.logoUrl, description: c.description }); setEditing(c); }}>Edit</Button>
        <Button size="small" onClick={() => { setNewDomain(""); setDomainsFor(c); }}>Domains</Button>
        <Button size="small" onClick={() => { setNewAlias(""); setAliasesFor(c); }}>Other names</Button>
        <Button size="small" onClick={() => { setMergeInto(null); setMerging(c); }}>Merge</Button>
      </Space>) },
  ];

  return (
    <Space direction="vertical" style={{ width: "100%" }} size="middle">
      <Typography.Paragraph type="secondary" style={{ marginBottom: 0 }}>
        Every company on 42LMS, one per real company, known by its email and web domains. A company verified by 42 keeps its
        name on every college&apos;s drive form.
      </Typography.Paragraph>
      <Space wrap>
        <Input.Search allowClear placeholder="Search a name, other name or domain" value={q} onChange={(e) => setQ(e.target.value)} style={{ width: 300 }} />
        <Checkbox checked={onlyUnverified} onChange={(e) => setOnlyUnverified(e.target.checked)}>Only not verified</Checkbox>
      </Space>
      {error && <Alert type="error" showIcon message={error} action={<Button size="small" onClick={load}>Retry</Button>} />}
      <Table rowKey="id" loading={loading} dataSource={data.items} columns={columns} scroll={{ x: 1060 }}
        pagination={{ current: page + 1, pageSize: 50, total: data.total, showSizeChanger: false, onChange: (p) => setPage(p - 1) }} />

      <AsyncModal open={Boolean(editing)} title={editing ? `Edit ${editing.name}` : ""} okText="Save" destroyOnClose onCancel={() => setEditing(null)}
        onOk={async () => {
          const v = await editForm.validateFields();
          if (await act(updateCuratedCompany(editing.id, v), "Saved. Every drive of this company shows the new name and logo.")) setEditing(null);
        }}>
        <Form form={editForm} layout="vertical">
          <Form.Item name="name" label="Name" rules={[{ required: true, min: 2, max: 150 }]}><Input /></Form.Item>
          <Form.Item name="website" label="Website"><Input placeholder="https://" /></Form.Item>
          <Form.Item name="logoUrl" label="Logo link"><Input placeholder="https://" /></Form.Item>
          <Form.Item name="industry" label="Industry"><Input /></Form.Item>
          <Form.Item name="description" label="About"><Input.TextArea rows={3} /></Form.Item>
        </Form>
      </AsyncModal>

      <Modal open={Boolean(domainsFor)} title={domainsFor ? `Domains of ${domainsFor.name}` : ""} footer={null} onCancel={() => setDomainsFor(null)} destroyOnClose>
        {domainsFor && (
          <Space direction="vertical" style={{ width: "100%" }}>
            <Space wrap>
              {(domainsFor.domains || []).map((d) => (
                <Tag key={d} closable={(domainsFor.domains || []).length > 1} onClose={async (e) => {
                  e.preventDefault();
                  const r = await act(removeCompanyDomain(domainsFor.id, d), "Domain removed");
                  if (r) setDomainsFor({ ...domainsFor, domains: r.data });
                }}>{d}</Tag>
              ))}
            </Space>
            <Space.Compact style={{ width: "100%" }}>
              <Input placeholder="company.com or name@company.com" value={newDomain} onChange={(e) => setNewDomain(e.target.value)} aria-label="New domain" />
              <Button type="primary" disabled={!newDomain.trim()} onClick={async () => {
                const r = await act(addCompanyDomain(domainsFor.id, newDomain.trim()), "Domain added");
                if (r) { setDomainsFor({ ...domainsFor, domains: r.data }); setNewDomain(""); }
              }}>Add</Button>
            </Space.Compact>
            <Typography.Text type="secondary">A domain belongs to one company. Personal and college email domains are refused.</Typography.Text>
          </Space>
        )}
      </Modal>

      <Modal open={Boolean(aliasesFor)} title={aliasesFor ? `Other names of ${aliasesFor.name}` : ""} footer={null} onCancel={() => setAliasesFor(null)} destroyOnClose>
        {aliasesFor && (
          <Space direction="vertical" style={{ width: "100%" }}>
            <Space wrap data-testid="company-aliases">
              {(aliasesFor.aliases || []).length === 0 && <Typography.Text type="secondary">None yet</Typography.Text>}
              {(aliasesFor.aliases || []).map((a) => (
                <Tag key={a} closable onClose={async (e) => {
                  e.preventDefault();
                  const r = await act(removeCompanyAlias(aliasesFor.id, a), "Name removed");
                  if (r) setAliasesFor({ ...aliasesFor, aliases: r.data });
                }}>{a}</Tag>
              ))}
            </Space>
            <Space.Compact style={{ width: "100%" }}>
              <Input placeholder="TCS, L&T, an old or longer name" value={newAlias} maxLength={150} onChange={(e) => setNewAlias(e.target.value)} aria-label="Other name"
                onPressEnter={addAlias} />
              <Button type="primary" disabled={newAlias.trim().length < 2} onClick={addAlias}>Add</Button>
            </Space.Compact>
            <Typography.Text type="secondary">
              A short name, an old name or the full legal name. Each name points at one company: a name another company uses is refused
              (merge the two instead). Common short names like TCS and L&amp;T already work without adding them.
            </Typography.Text>
          </Space>
        )}
      </Modal>

      <AsyncModal open={Boolean(merging)} title={merging ? `Merge ${merging.name} into…` : ""} okText="Merge" okButtonProps={{ danger: true, disabled: !mergeInto }}
        destroyOnClose onCancel={() => setMerging(null)}
        onOk={async () => { if (await act(mergeCompany(merging.id, mergeInto), "Merged")) setMerging(null); }}>
        {merging && (
          <Space direction="vertical" style={{ width: "100%" }}>
            <Typography.Paragraph>
              {merging.name}&apos;s domains, drives, recruiters and every college&apos;s notes move to the company you pick. {merging.name} then disappears.
            </Typography.Paragraph>
            <Select showSearch style={{ width: "100%" }} placeholder="The company to keep" value={mergeInto} onChange={setMergeInto} optionFilterProp="label"
              options={data.items.filter((c) => c.id !== merging.id).map((c) => ({ value: c.id, label: `${c.name}${c.domains?.length ? ` (${c.domains.join(", ")})` : ""}` }))} />
          </Space>
        )}
      </AsyncModal>
    </Space>
  );
}
