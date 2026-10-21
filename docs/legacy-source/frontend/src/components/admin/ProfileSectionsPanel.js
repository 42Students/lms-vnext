import { useEffect, useState } from "react";
import { Card, Button, Collapse, Space, Tag, Typography, Input, Checkbox, message, Popconfirm, Empty, Spin, Form, Descriptions } from "antd";
import { EditOutlined, PlusOutlined, DeleteOutlined, ReloadOutlined } from "@ant-design/icons";
import * as ProfileService from "@/api/Services/ProfileService";
import { SECTION_FIELD_SCHEMAS } from "./profileSectionSchemas";
import renderStructuredValue from "@/components/admin/projects/renderStructuredValue";

const { Text } = Typography;
const { TextArea } = Input;
const { Panel } = Collapse;

/**
 * Admin's window into the profile system: 20 learner sections / ~14 faculty sections behind
 * ProfileService, previously called from **zero** admin screens (M1 in the audit -- the largest
 * single gap found). Admin could only edit 11 basic demographic fields; a student's resume,
 * skills, education, certifications, experience, job-preferences and identity documents had no
 * admin surface at all, and a malformed profile couldn't be corrected on the student's behalf.
 *
 * Each section with a schema in profileSectionSchemas.js renders as real labeled fields (text,
 * textarea or checkbox per the DTO's actual field types) instead of a JSON blob -- a college
 * admin fixing a student's education record shouldn't need to know JSON syntax to do it.
 * "metadata" has no fixed schema (it's a genuinely free-form Map<String,Object>), so it instead
 * gets a key/value row editor -- add/remove arbitrary named fields without ever needing to type
 * JSON syntax. A per-row value is still parsed leniently (numbers/booleans/nested JSON survive a
 * round trip if typed that way) so existing non-string values aren't silently stringified, but the
 * admin never has to hand-edit a `{...}` blob to change one field.
 */

// [key, label, shape]. shape: "single" (GET+PUT one object) or "list" (GET array,
// POST add, PUT/{index} update, DELETE/{index} remove).
const LEARNER_SECTIONS = [
  ["header", "Header", "single"],
  ["about", "About", "single"],
  ["personalDetails", "Personal Details", "single"],
  ["identity", "Identity Documents", "single"],
  ["languages", "Languages", "list"],
  ["contact", "Contact", "single"],
  ["address", "Address", "single"],
  ["social", "Social Profiles", "single"],
  ["education", "Education", "list"],
  ["jobPreferences", "Job Preferences", "single"],
  ["resume", "Resume", "single"],
  ["certifications", "Certifications", "list"],
  ["achievements", "Achievements", "list"],
  ["skills", "Skills", "list"],
  ["projects", "Projects", "list"],
  ["experiences", "Experience / Internships", "list"],
  ["extracurricular", "Extra-curricular", "list"],
  ["hobbies", "Hobbies & Interests", "single"],
  ["videoIntro", "Video Intro", "single"],
  ["metadata", "Metadata", "single"],
];

const FACULTY_SECTIONS = [
  ["header", "Header", "single"],
  ["about", "About", "single"],
  ["personalDetails", "Personal Details", "single"],
  ["identity", "Identity Documents", "single"],
  ["languages", "Languages", "list"],
  ["contact", "Contact", "single"],
  ["address", "Address", "single"],
  ["social", "Social Profiles", "single"],
  ["education", "Education", "list"],
  ["certifications", "Certifications", "list"],
  ["experiences", "Work Experience", "list"],
  ["skills", "Skills", "list"],
  ["publications", "Publications & Research", "list"],
  ["awards", "Awards & Recognitions", "list"],
  ["metadata", "Metadata", "single"],
];

const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);

// Resolves the get/add/update/delete functions for one section key off the role prefix
// ("Learner"/"Faculty") ProfileService already uses consistently.
//
// ProfileService.js is NOT consistent about pluralization between operations: `get` uses the
// plural section key (getLearnerSkills, getFacultyCertifications, ...) but add/update/delete use
// the singular (addLearnerSkill, updateFacultyCertification, ...) for every list section whose key
// is a regular plural (languages, certifications, achievements, skills, projects, experiences,
// publications, awards). Looking up all four with the same plural suffix left add/update/delete
// silently undefined for 8 of the 10 list sections -- their Add/Edit/Remove buttons rendered
// (just permanently disabled, no error) with no indication anything was wrong. Try the exact name
// first, then the singularized one.
function resolveOp(prefixedName) {
  if (ProfileService[prefixedName]) return ProfileService[prefixedName];
  if (prefixedName.endsWith("s")) return ProfileService[prefixedName.slice(0, -1)];
  return undefined;
}
function resolveOps(rolePrefix, key) {
  const suffix = cap(key);
  return {
    get: resolveOp(`get${rolePrefix}${suffix}`),
    add: resolveOp(`add${rolePrefix}${suffix}`),
    update: resolveOp(`update${rolePrefix}${suffix}`),
    delete: resolveOp(`delete${rolePrefix}${suffix}`),
  };
}

// --- schema-driven field <-> form-value conversion -------------------------------------------

function valuesFromRecord(schema, record) {
  const out = {};
  for (const field of schema) {
    const raw = record?.[field.name];
    if (field.type === "boolean") out[field.name] = Boolean(raw);
    else if (field.type === "stringList") out[field.name] = Array.isArray(raw) ? raw.join(", ") : (raw ?? "");
    else out[field.name] = raw ?? "";
  }
  return out;
}

function recordFromValues(schema, values, original) {
  // Start from the original record (if any) so fields outside the schema -- a nested/legacy field
  // this UI doesn't show -- survive a save instead of being dropped.
  const out = { ...(original ?? {}) };
  for (const field of schema) {
    const value = values[field.name];
    if (field.type === "boolean") out[field.name] = Boolean(value);
    else if (field.type === "stringList") {
      out[field.name] = String(value ?? "").split(",").map((s) => s.trim()).filter(Boolean);
    } else {
      out[field.name] = value === "" ? null : value;
    }
  }
  return out;
}

function SchemaFormFields({ schema, form }) {
  return (
    <>
      {schema.map((field) => (
        <Form.Item key={field.name} name={field.name} label={field.label} valuePropName={field.type === "boolean" ? "checked" : "value"}>
          {field.type === "boolean" ? (
            <Checkbox />
          ) : field.type === "textarea" ? (
            <TextArea rows={3} />
          ) : (
            <Input />
          )}
        </Form.Item>
      ))}
    </>
  );
}

function SchemaReadView({ schema, record }) {
  const populated = schema.filter((field) => {
    const value = record?.[field.name];
    return field.type === "boolean" ? true : value !== null && value !== undefined && value !== "" && !(Array.isArray(value) && value.length === 0);
  });
  if (populated.length === 0) return <Text type="secondary">Nothing on file yet.</Text>;
  return (
    <Descriptions size="small" column={1} bordered={false}>
      {populated.map((field) => {
        const value = record?.[field.name];
        const display = field.type === "boolean" ? (value ? "Yes" : "No")
          : field.type === "stringList" ? (Array.isArray(value) ? value.join(", ") : "")
          : String(value ?? "—");
        return <Descriptions.Item key={field.name} label={field.label}>{display || "—"}</Descriptions.Item>;
      })}
    </Descriptions>
  );
}

// --- key/value editor for schema-less, genuinely free-form sections (metadata) ---------------

function rowsFromRecord(record) {
  const entries = Object.entries(record ?? {});
  return entries.length
    ? entries.map(([key, value]) => ({ key, value: typeof value === "string" ? value : JSON.stringify(value) }))
    : [{ key: "", value: "" }];
}

function recordFromRows(rows) {
  const out = {};
  for (const { key, value } of rows) {
    if (!key.trim()) continue;
    try {
      out[key.trim()] = JSON.parse(value);
    } catch {
      out[key.trim()] = value;
    }
  }
  return out;
}

function KeyValueFields({ rows, setRows }) {
  const updateRow = (idx, patch) => setRows(rows.map((row, i) => (i === idx ? { ...row, ...patch } : row)));
  const removeRow = (idx) => setRows(rows.filter((_, i) => i !== idx));
  return (
    <Space direction="vertical" style={{ width: "100%" }}>
      {rows.map((row, idx) => (
        <Space key={idx} align="start">
          <Input placeholder="Field name" value={row.key} onChange={(e) => updateRow(idx, { key: e.target.value })} style={{ width: 180 }} />
          <Input placeholder="Value" value={row.value} onChange={(e) => updateRow(idx, { value: e.target.value })} style={{ width: 280 }} />
          <Button size="small" danger icon={<DeleteOutlined />} onClick={() => removeRow(idx)} />
        </Space>
      ))}
      <Button size="small" icon={<PlusOutlined />} onClick={() => setRows([...rows, { key: "", value: "" }])}>Add field</Button>
    </Space>
  );
}

function SingleSection({ ops, id, label, schema, keyValue }) {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [data, setData] = useState(null);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");
  const [rows, setRows] = useState([]);
  const [error, setError] = useState(null);
  const [form] = Form.useForm();

  const load = async () => {
    if (!ops.get) return;
    setLoading(true);
    setError(null);
    try {
      const res = await ops.get(id);
      const val = res?.data?.data ?? res?.data ?? null;
      setData(val);
    } catch (e) {
      setError(e?.response?.data?.message || `Couldn't load ${label}`);
    }
    setLoading(false);
  };

  useEffect(() => { load(); // eslint-disable-next-line
  }, [id]);

  const startEdit = () => {
    if (schema) {
      form.setFieldsValue(valuesFromRecord(schema, data));
    } else if (keyValue) {
      setRows(rowsFromRecord(data));
    } else {
      setDraft(JSON.stringify(data ?? {}, null, 2));
    }
    setEditing(true);
  };

  const save = async () => {
    if (!ops.update) return;
    let parsed;
    if (schema) {
      try {
        const values = await form.validateFields();
        parsed = recordFromValues(schema, values, data);
      } catch (e) {
        return; // validation error already shown inline by the form
      }
    } else if (keyValue) {
      parsed = recordFromRows(rows);
    } else {
      try {
        parsed = JSON.parse(draft);
      } catch (e) {
        message.error("Invalid JSON");
        return;
      }
    }
    setSaving(true);
    try {
      await ops.update(id, parsed);
      message.success(`${label} updated`);
      setEditing(false);
      load();
    } catch (e) {
      message.error(e?.response?.data?.message || `Failed to save ${label}`);
    }
    setSaving(false);
  };

  if (!ops.get) {
    return <Text type="secondary">No API wired for this section.</Text>;
  }
  if (loading) return <Spin size="small" />;
  if (error) return <Text type="danger">{error}</Text>;

  return (
    <div>
      {editing ? (
        <>
          {schema ? (
            <Form form={form} layout="vertical" size="small"><SchemaFormFields schema={schema} form={form} /></Form>
          ) : keyValue ? (
            <KeyValueFields rows={rows} setRows={setRows} />
          ) : (
            <TextArea rows={8} value={draft} onChange={(e) => setDraft(e.target.value)} style={{ fontFamily: "monospace", fontSize: 12 }} />
          )}
          <Space style={{ marginTop: 8 }}>
            <Button size="small" type="primary" onClick={save} loading={saving}>Save</Button>
            <Button size="small" onClick={() => setEditing(false)} disabled={saving}>Cancel</Button>
          </Space>
        </>
      ) : (
        <>
          {schema ? (
            <SchemaReadView schema={schema} record={data} />
          ) : keyValue ? (
            data && Object.keys(data).length ? renderStructuredValue(data) : <Text type="secondary">Nothing on file yet.</Text>
          ) : (
            <pre style={{ background: "#fafafa", padding: 8, borderRadius: 4, fontSize: 12, maxHeight: 260, overflow: "auto" }}>
              {data ? JSON.stringify(data, null, 2) : "(empty)"}
            </pre>
          )}
          <Space style={{ marginTop: schema || keyValue ? 8 : 0 }}>
            <Button size="small" icon={<EditOutlined />} onClick={startEdit} disabled={!ops.update}>Edit</Button>
            <Button size="small" icon={<ReloadOutlined />} onClick={load} />
          </Space>
        </>
      )}
    </div>
  );
}

function ListSection({ ops, id, label, schema }) {
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState([]);
  const [error, setError] = useState(null);
  const [editingIndex, setEditingIndex] = useState(null);
  const [draft, setDraft] = useState("");
  const [adding, setAdding] = useState(false);
  const [addDraft, setAddDraft] = useState("{}");
  const [saving, setSaving] = useState(false);
  const [editForm] = Form.useForm();
  const [addForm] = Form.useForm();

  const load = async () => {
    if (!ops.get) return;
    setLoading(true);
    setError(null);
    try {
      const res = await ops.get(id);
      const val = res?.data?.data ?? res?.data ?? [];
      setItems(Array.isArray(val) ? val : []);
    } catch (e) {
      setError(e?.response?.data?.message || `Couldn't load ${label}`);
    }
    setLoading(false);
  };

  useEffect(() => { load(); // eslint-disable-next-line
  }, [id]);

  const startEdit = (idx) => {
    if (schema) editForm.setFieldsValue(valuesFromRecord(schema, items[idx]));
    else setDraft(JSON.stringify(items[idx], null, 2));
    setEditingIndex(idx);
  };

  const saveEdit = async (idx) => {
    if (!ops.update) return;
    let parsed;
    if (schema) {
      try { parsed = recordFromValues(schema, await editForm.validateFields(), items[idx]); }
      catch (e) { return; }
    } else {
      try { parsed = JSON.parse(draft); } catch { message.error("Invalid JSON"); return; }
    }
    setSaving(true);
    try {
      await ops.update(id, idx, parsed);
      message.success("Saved");
      setEditingIndex(null);
      load();
    } catch (e) {
      message.error(e?.response?.data?.message || "Failed to save");
    }
    setSaving(false);
  };

  const removeItem = async (idx) => {
    if (!ops.delete) return;
    try {
      await ops.delete(id, idx);
      message.success("Removed");
      load();
    } catch (e) {
      message.error(e?.response?.data?.message || "Failed to remove");
    }
  };

  const startAdd = () => {
    if (schema) addForm.setFieldsValue(valuesFromRecord(schema, {}));
    else setAddDraft("{}");
    setAdding(true);
  };

  const saveAdd = async () => {
    if (!ops.add) return;
    let parsed;
    if (schema) {
      try { parsed = recordFromValues(schema, await addForm.validateFields(), {}); }
      catch (e) { return; }
    } else {
      try { parsed = JSON.parse(addDraft); } catch { message.error("Invalid JSON"); return; }
    }
    setSaving(true);
    try {
      await ops.add(id, parsed);
      message.success("Added");
      setAdding(false);
      setAddDraft("{}");
      load();
    } catch (e) {
      message.error(e?.response?.data?.message || "Failed to add");
    }
    setSaving(false);
  };

  if (!ops.get) {
    return <Text type="secondary">No API wired for this section.</Text>;
  }
  if (loading) return <Spin size="small" />;
  if (error) return <Text type="danger">{error}</Text>;

  return (
    <div>
      {items.length === 0 && !adding && <Empty description={`No ${label.toLowerCase()} on file`} image={Empty.PRESENTED_IMAGE_SIMPLE} />}
      {items.map((item, idx) => (
        <Card key={idx} size="small" style={{ marginBottom: 8 }}>
          {editingIndex === idx ? (
            <>
              {schema ? (
                <Form form={editForm} layout="vertical" size="small"><SchemaFormFields schema={schema} form={editForm} /></Form>
              ) : (
                <TextArea rows={6} value={draft} onChange={(e) => setDraft(e.target.value)} style={{ fontFamily: "monospace", fontSize: 12 }} />
              )}
              <Space style={{ marginTop: 8 }}>
                <Button size="small" type="primary" onClick={() => saveEdit(idx)} loading={saving}>Save</Button>
                <Button size="small" onClick={() => setEditingIndex(null)} disabled={saving}>Cancel</Button>
              </Space>
            </>
          ) : (
            <>
              {schema ? (
                <SchemaReadView schema={schema} record={item} />
              ) : (
                <pre style={{ margin: 0, fontSize: 12, whiteSpace: "pre-wrap" }}>{JSON.stringify(item, null, 2)}</pre>
              )}
              <Space style={{ marginTop: 8 }}>
                <Button size="small" icon={<EditOutlined />} onClick={() => startEdit(idx)} disabled={!ops.update}>Edit</Button>
                <Popconfirm title="Remove this entry?" onConfirm={() => removeItem(idx)} disabled={!ops.delete}>
                  <Button size="small" danger icon={<DeleteOutlined />} disabled={!ops.delete}>Remove</Button>
                </Popconfirm>
              </Space>
            </>
          )}
        </Card>
      ))}
      {adding ? (
        <Card size="small">
          {schema ? (
            <Form form={addForm} layout="vertical" size="small"><SchemaFormFields schema={schema} form={addForm} /></Form>
          ) : (
            <TextArea rows={6} value={addDraft} onChange={(e) => setAddDraft(e.target.value)} style={{ fontFamily: "monospace", fontSize: 12 }} />
          )}
          <Space style={{ marginTop: 8 }}>
            <Button size="small" type="primary" onClick={saveAdd} loading={saving}>Add</Button>
            <Button size="small" onClick={() => setAdding(false)} disabled={saving}>Cancel</Button>
          </Space>
        </Card>
      ) : (
        <Space>
          <Button size="small" icon={<PlusOutlined />} onClick={startAdd} disabled={!ops.add}>Add {label}</Button>
          <Button size="small" icon={<ReloadOutlined />} onClick={load} />
        </Space>
      )}
    </div>
  );
}

/**
 * role: "learner" | "faculty". id: the learnerId/facultyId.
 * only: optional array of section keys to restrict to (e.g. placement staff only needing
 * resume/skills/jobPreferences, not the full profile) -- filters LEARNER_SECTIONS/FACULTY_SECTIONS
 * rather than being a separate list, so it can't drift from the full section set.
 */
export default function ProfileSectionsPanel({ role, id, only = null }) {
  const rolePrefix = role === "faculty" ? "Faculty" : "Learner";
  const allSections = role === "faculty" ? FACULTY_SECTIONS : LEARNER_SECTIONS;
  const sections = only ? allSections.filter(([key]) => only.includes(key)) : allSections;

  if (!id) return <Empty description="No record selected" />;

  return (
    <Collapse accordion={false} defaultActiveKey={[]}>
      {sections.map(([key, label, shape]) => {
        const ops = resolveOps(rolePrefix, key);
        const schema = SECTION_FIELD_SCHEMAS[key] || null;
        const keyValue = !schema && key === "metadata";
        return (
          <Panel header={<Space><span>{label}</span>{keyValue && <Tag>Custom fields</Tag>}</Space>} key={key}>
            {shape === "list" ? (
              <ListSection ops={ops} id={id} label={label} schema={schema} />
            ) : (
              <SingleSection ops={ops} id={id} label={label} schema={schema} keyValue={keyValue} />
            )}
          </Panel>
        );
      })}
    </Collapse>
  );
}
