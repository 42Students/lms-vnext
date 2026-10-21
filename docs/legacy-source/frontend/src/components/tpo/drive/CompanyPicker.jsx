import { useEffect, useState } from "react";
import { Alert, AutoComplete, Button, Form, Input, Space, Tag, Tooltip, Typography, message } from "antd";
import { InfoCircleOutlined } from "@ant-design/icons";
import AsyncModal from "@/components/tpo/ui/AsyncModal";
import { useDebouncedValue } from "@/components/tpo/ui/useDebouncedValue";
import { fetchWithErrorHandling } from "@/api/Services/AdminService";
import { resolveCompany, searchCompanies } from "@/api/Services/TpoHubService";

export const RECRUITER_EMAIL_NOTE = "This is for inviting the recruiter to the drive. It is hidden from the students.";
const ADD_OTHER = "__add_other__";
const ENGAGE = "engage:";

/**
 * The drive form's company field (recruiter phase 1, N3; strong search, docs/companies/COMPANY-SEARCH-2026-10-13.md): search 42's list
 * however the company is typed (short names, typos, word order, a website or a recruiter's email), see why each one matched, pick a
 * name from this college's Engage contacts, or "Add other". "Add other" with the name of a company already on the list points at it
 * instead of making a second one. Writes companyName (the value) and companyId (on the form). A company verified by 42 keeps 42's
 * name: the field locks.
 */
export default function CompanyPicker({ id, value, onChange, form, disabled }) {
  const companyId = Form.useWatch("companyId", form);
  const [locked, setLocked] = useState(false);
  const [typed, setTyped] = useState(value || "");
  const q = useDebouncedValue(typed, 250);
  const [results, setResults] = useState([]);
  const [searchError, setSearchError] = useState(null);
  const [adding, setAdding] = useState(false);
  const [same, setSame] = useState(null);
  const [addError, setAddError] = useState(null);
  const [addForm] = Form.useForm();

  useEffect(() => { setTyped(value || ""); }, [value]);

  useEffect(() => {
    let live = true;
    if (!q || q.trim().length < 2 || locked) { setResults([]); return undefined; }
    fetchWithErrorHandling(searchCompanies(q.trim())).then((r) => {
      if (!live) return;
      if (r.success && Array.isArray(r.data)) { setResults(r.data); setSearchError(null); } else setSearchError("Company search is unavailable. You can still add the company.");
    });
    return () => { live = false; };
  }, [q, locked]);

  const pick = (c) => {
    form.setFieldsValue({ companyId: c.id, companyName: c.name });
    if (!form.getFieldValue("companyLogo") && c.logoUrl) form.setFieldsValue({ companyLogo: c.logoUrl });
    setLocked(Boolean(c.verifiedBy42));
    onChange?.(c.name);
  };

  const clear = () => {
    form.setFieldsValue({ companyId: null });
    setLocked(false);
    onChange?.("");
    setTyped("");
  };

  const startAdding = (name) => {
    addForm.setFieldsValue({ name, website: "", recruiterEmail: "" });
    setSame(null);
    setAddError(null);
    setAdding(true);
  };

  const add = async (notTheSame) => {
    const v = await addForm.validateFields();
    setAddError(null);
    const body = { name: v.name, website: v.website || null, recruiterEmail: v.recruiterEmail || null };
    const r = await fetchWithErrorHandling(resolveCompany(notTheSame ? { ...body, notTheSame: true } : body));
    if (!r.success) {
      if (r.status === 409 && r.data?.code === "SAME_COMPANY") { setSame({ id: r.data.companyId, name: r.data.companyName }); return; }
      setAddError(r.data?.message || r.message || "Could not add the company");
      return;
    }
    pick(r.data);
    // The website or email belongs to a company already on the list: the drive uses it. Say so, instead of the name just changing.
    const typedName = String(v.name || "").trim().toLowerCase();
    if (r.data?.existed && String(r.data.name || "").trim().toLowerCase() !== typedName) {
      message.info(r.data.verifiedBy42
        ? `That website or email belongs to ${r.data.name}, verified by 42. The drive uses ${r.data.name}.`
        : `That website or email belongs to ${r.data.name}, already on the list. The drive uses ${r.data.name}; choose Change company if that's wrong.`, 8);
    }
    if (v.recruiterEmail) form.setFieldsValue({ inviteRecruiterEmail: v.recruiterEmail });
    setAdding(false);
  };

  // "Use Infosys": the company on the list, with its verified lock and logo when the search already has it.
  const useExisting = async () => {
    let c = results.find((x) => x.id === same.id);
    if (!c) {
      const r = await fetchWithErrorHandling(searchCompanies(same.name));
      c = (r.success && Array.isArray(r.data) && r.data.find((x) => x.id === same.id)) || { id: same.id, name: same.name };
    }
    const email = addForm.getFieldValue("recruiterEmail");
    pick(c);
    if (email) form.setFieldsValue({ inviteRecruiterEmail: email });
    setAdding(false);
  };

  const companies = results.filter((c) => c.source !== "ENGAGE" && c.id != null);
  const engage = results.filter((c) => c.source === "ENGAGE");
  const companyOption = (c) => ({
    value: String(c.id),
    label: (
      <div className={`tpo-company-picker__option${c.fuzzy ? " tpo-company-picker__option--fuzzy" : ""}`}>
        <Space size={6} wrap>
          <Typography.Text strong>{c.name}</Typography.Text>
          {c.verifiedBy42 && <Tag color="blue">Verified by 42</Tag>}
          {c.inMyList && <Tag>In your companies</Tag>}
        </Space>
        {c.reason && <span className="tpo-company-picker__reason">{c.reason}</span>}
        {c.domains?.length > 0 && <Typography.Text type="secondary" className="tpo-company-picker__domains">{c.domains.join(", ")}</Typography.Text>}
      </div>
    ),
    company: c,
  });
  const options = [
    ...companies.map(companyOption),
    ...(engage.length > 0 ? [{
      label: <span className="tpo-company-picker__group">From your Engage contacts, not added yet</span>,
      options: engage.map((c) => ({
        value: ENGAGE + c.name,
        label: <div className="tpo-company-picker__option"><Typography.Text>{c.name}</Typography.Text><span className="tpo-company-picker__reason">Add it as a company</span></div>,
      })),
    }] : []),
    ...(typed.trim().length >= 2 ? [{ value: ADD_OTHER, label: <Typography.Text>Add other: <strong>{typed.trim()}</strong></Typography.Text> }] : []),
  ];

  return (
    <>
      {locked ? (
        <div className="tpo-company-picker__locked">
          <Input id={id} value={value} readOnly aria-label="Company (verified by 42)"
            suffix={<Tag color="blue" style={{ marginInlineEnd: 0 }}>Verified by 42</Tag>} />
          {!disabled && <Typography.Link onClick={clear}>Change company</Typography.Link>}
        </div>
      ) : (
        <AutoComplete
          id={id}
          style={{ width: "100%" }}
          value={typed}
          options={options}
          disabled={disabled}
          popupClassName="tpo-company-picker__popup"
          onSearch={(v) => { setTyped(v); if (companyId) form.setFieldsValue({ companyId: null }); onChange?.(v); }}
          onSelect={(v, opt) => {
            if (v === ADD_OTHER) { startAdding(typed.trim()); return; }
            if (v.startsWith(ENGAGE)) { startAdding(v.slice(ENGAGE.length)); return; }
            pick(opt.company);
          }}
          placeholder="Search a company, a short name like TCS, a website or a recruiter's email"
          data-testid="drive-form.company"
        />
      )}
      {searchError && <Typography.Text type="secondary">{searchError}</Typography.Text>}
      <AsyncModal open={adding} title="Add a company" okText="Use this company" onCancel={() => setAdding(false)} destroyOnClose
        okButtonProps={{ disabled: Boolean(same) }}
        onOk={() => add(false)}>
        <Form form={addForm} layout="vertical" onValuesChange={(ch) => { if ("name" in ch) setSame(null); }}>
          <Form.Item name="name" label="Company name" rules={[{ required: true, message: "Add the company name" }]}><Input /></Form.Item>
          {same && (
            <Alert type="warning" showIcon className="tpo-company-picker__same" data-testid="company-picker.same"
              message={`${same.name} is already on 42's company list`}
              description={(
                <Space direction="vertical" size={8}>
                  <span>Pick it, so the company is kept once and its recruiters and past drives stay together.</span>
                  <Space wrap>
                    <Button type="primary" onClick={useExisting}>Use {same.name}</Button>
                    <Button onClick={() => add(true)}>It's a different company</Button>
                  </Space>
                </Space>
              )} />
          )}
          <Form.Item name="website" label="Company website" extra="Optional. Helps keep each company once."><Input placeholder="https://www.company.com" /></Form.Item>
          <Form.Item name="recruiterEmail" label={<Space size={4}>Recruiter email <Tooltip title={RECRUITER_EMAIL_NOTE}><InfoCircleOutlined aria-label={RECRUITER_EMAIL_NOTE} /></Tooltip></Space>}
            extra="Optional." rules={[{ type: "email", message: "Enter a valid email" }]}><Input placeholder="name@company.com" /></Form.Item>
          {addError && <Alert type="error" showIcon message={addError} style={{ marginBottom: 12 }} />}
          <Alert type="info" showIcon message="Add the website or the recruiter's company email: that is how a company is kept once across colleges." />
        </Form>
      </AsyncModal>
    </>
  );
}
