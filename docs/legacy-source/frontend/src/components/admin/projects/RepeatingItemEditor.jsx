import { useId, useRef, useState } from "react";
import { Button, Checkbox, Col, DatePicker, Empty, Input, Row, Select, Space, TimePicker, Typography } from "antd";
import dayjs from "dayjs";
import { ArrowDownOutlined, ArrowUpOutlined, DeleteOutlined, PlusOutlined } from "@ant-design/icons";

const { TextArea } = Input;
const { Text } = Typography;

const slugifyPreview = (value) =>
  String(value || "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

// Generic repeating-row editor for a JSON array of objects (sprints/tasks/resources) —
// replaces a raw JSON textarea with real inputs per field. Follows antd's controlled-field
// contract (value/onChange) so it drops straight into a Form.Item like any other input; the
// value it produces is already the array the backend expects, no JSON.parse needed downstream.
//
// fields: [{ name, label, type: "text" | "textarea" | "select" | "checkbox", options, placeholder, required,
//   half (render at half width instead of full row), previewFrom (name of a sibling field to
//   derive a live "this is what gets auto-generated" preview from when this field is blank) }]
// titleOf: (row, index) => string — used as each card's header (e.g. row.title || `Item ${index+1}`)
// dynamicOptions: { [fieldName]: Option[] } — options for a "select" field computed from data
//   OUTSIDE this component (e.g. a Tasks editor's "Sprint key" options come from the sibling
//   Sprints field's current rows) instead of the field's own static `options`.
export default function RepeatingItemEditor({
  value,
  onChange,
  fields,
  addLabel = "Add item",
  titleOf,
  // Optional one-line summary shown beside each collapsed row (state, dates, owner), so a long list
  // can be read without expanding every row.
  metaOf,
  emptyText = "No items yet.",
  dynamicOptions,
}) {
  const rows = Array.isArray(value) ? value : [];
  const editorId = useId().replace(/:/g, "-");
  const rowKeysRef = useRef([]);
  const nextRowKeyRef = useRef(0);
  while (rowKeysRef.current.length < rows.length) rowKeysRef.current.push(`row-${nextRowKeyRef.current++}`);
  if (rowKeysRef.current.length > rows.length) rowKeysRef.current.length = rows.length;
  const [expanded, setExpanded] = useState([]);
  const [search, setSearch] = useState("");
  const [lastRemoved, setLastRemoved] = useState(null);
  const visibleRows = rows.map((row, index) => ({ row, index })).filter(({ row, index }) =>
    !search.trim() || String(titleOf?.(row, index) || JSON.stringify(row)).toLowerCase().includes(search.trim().toLowerCase())
  );

  const emit = (nextRows) => {
    onChange?.(nextRows);
  };

  const updateRow = (index, fieldName, fieldValue) => {
    const next = rows.map((row, i) => (i === index ? { ...row, [fieldName]: fieldValue } : row));
    emit(next);
  };

  const addRow = () => {
    const blank = fields.reduce((acc, field) => ({ ...acc, [field.name]: field.type === "checkbox" ? false : "" }), {});
    const newKey = `row-${nextRowKeyRef.current++}`;
    rowKeysRef.current.push(newKey);
    setExpanded((current) => [...current, newKey]);
    emit([...rows, blank]);
  };

  const removeRow = (index) => {
    const row = rows[index];
    const key = rowKeysRef.current.splice(index, 1)[0];
    setLastRemoved({ row, index, key });
    emit(rows.filter((_, i) => i !== index));
  };

  const undoRemove = () => {
    if (!lastRemoved) return;
    const next = rows.slice();
    const at = Math.min(lastRemoved.index, next.length);
    next.splice(at, 0, lastRemoved.row);
    rowKeysRef.current.splice(at, 0, lastRemoved.key);
    setLastRemoved(null);
    emit(next);
  };

  const moveRow = (index, delta) => {
    const target = index + delta;
    if (target < 0 || target >= rows.length) return;
    const next = [...rows];
    [next[index], next[target]] = [next[target], next[index]];
    [rowKeysRef.current[index], rowKeysRef.current[target]] = [rowKeysRef.current[target], rowKeysRef.current[index]];
    emit(next);
  };

  return (
    <div className="repeating-item-editor">
      {rows.length > 12 ? (
        <div style={{ marginBottom: 12 }}>
          <Input.Search aria-label="Find an item in this section" allowClear placeholder="Find an item by title or content" value={search} onChange={(event) => setSearch(event.target.value)} />
          <span role="status">Showing {visibleRows.length} of {rows.length} items. Expand only the items you need to edit.</span>
        </div>
      ) : null}
      {lastRemoved ? (
        <div role="status" style={{ marginBottom: 12 }}>
          Item removed from this unsaved form. <Button type="link" size="small" onClick={undoRemove}>Undo remove</Button>
        </div>
      ) : null}
      {rows.length === 0 ? (
        <Empty description={emptyText} image={Empty.PRESENTED_IMAGE_SIMPLE} imageStyle={{ height: 40 }} style={{ margin: "8px 0" }} />
      ) : (
        <Space direction="vertical" style={{ width: "100%" }} size={10}>
          {visibleRows.map(({ row, index }) => (
            <div className="repeating-item-editor__row" key={rowKeysRef.current[index]}>
              <div className="repeating-item-editor__row-header">
                <Button type="link" style={{ padding: 0, textAlign: "left" }} aria-expanded={rows.length <= 12 || expanded.includes(rowKeysRef.current[index])} onClick={() => { const key = rowKeysRef.current[index]; setExpanded((current) => current.includes(key) ? current.filter((item) => item !== key) : [...current, key]); }}>
                  {titleOf ? titleOf(row, index) || `Item ${index + 1}` : `Item ${index + 1}`} · {rows.length <= 12 || expanded.includes(rowKeysRef.current[index]) ? "Collapse" : "Expand"}
                </Button>
                {metaOf ? <span className="repeating-item-editor__row-meta">{metaOf(row, index)}</span> : null}
                <Space size={4}>
                  <Button
                    size="small"
                    type="text"
                    icon={<ArrowUpOutlined />}
                    disabled={index === 0}
                    onClick={() => moveRow(index, -1)}
                    aria-label={`Move ${titleOf?.(row, index) || `item ${index + 1}`} up`}
                  />
                  <Button
                    size="small"
                    type="text"
                    icon={<ArrowDownOutlined />}
                    disabled={index === rows.length - 1}
                    onClick={() => moveRow(index, 1)}
                    aria-label={`Move ${titleOf?.(row, index) || `item ${index + 1}`} down`}
                  />
                  <Button size="small" type="text" danger icon={<DeleteOutlined />} onClick={() => removeRow(index)} aria-label={`Remove ${titleOf?.(row, index) || `item ${index + 1}`}`} />
                </Space>
              </div>
              {(rows.length <= 12 || expanded.includes(rowKeysRef.current[index])) ? <Row gutter={[12, 8]} className="repeating-item-editor__row-body">
                {fields.map((field) => {
                  const isBlank = !row[field.name];
                  const showRequiredError = field.required && isBlank;
                  const previewText =
                    field.previewFrom && isBlank && row[field.previewFrom] ? slugifyPreview(row[field.previewFrom]) : null;
                  const options = field.type === "select" ? dynamicOptions?.[field.name] ?? field.options : undefined;
                  // Stored data can carry a different casing than the option values (e.g. backend
                  // "MEDIUM" vs this field's "Medium" option) — match case-insensitively so the
                  // Select shows the real option/label instead of falling through to raw text.
                  const rawSelectValue = row[field.name];
                  const matchedOption =
                    field.type === "select" && rawSelectValue
                      ? options?.find((option) => String(option.value).toLowerCase() === String(rawSelectValue).toLowerCase())
                      : null;
                  const selectValue = matchedOption ? matchedOption.value : rawSelectValue || undefined;
                  if (field.type === "checkbox") {
                    return (
                      <Col key={field.name} xs={24} md={field.half ? 12 : 24}>
                        <Checkbox
                          checked={Boolean(row[field.name])}
                          onChange={(e) => updateRow(index, field.name, e.target.checked)}
                        >
                          {field.label}
                        </Checkbox>
                      </Col>
                    );
                  }
                  return (
                    <Col key={field.name} xs={24} md={field.half ? 12 : 24}>
                      <label htmlFor={`${editorId}-${rowKeysRef.current[index]}-${field.name}`} className="repeating-item-editor__field-label">
                        {field.label}
                        {field.required ? <Text type="danger"> *</Text> : null}
                      </label>
                      {field.type === "select" ? (
                        <Select
                          id={`${editorId}-${rowKeysRef.current[index]}-${field.name}`}
                          style={{ width: "100%" }}
                          value={selectValue}
                          options={options}
                          placeholder={field.placeholder}
                          onChange={(v) => updateRow(index, field.name, v)}
                          allowClear
                          showSearch
                          optionFilterProp="label"
                          status={showRequiredError ? "error" : undefined}
                        />
                      ) : field.type === "date" ? (
                        <DatePicker
                          id={`${editorId}-${rowKeysRef.current[index]}-${field.name}`}
                          style={{ width: "100%" }}
                          value={row[field.name] && dayjs(row[field.name]).isValid() ? dayjs(row[field.name]) : null}
                          placeholder={field.placeholder || "Select date"}
                          onChange={(_, dateString) => updateRow(index, field.name, dateString || "")}
                          status={showRequiredError ? "error" : undefined}
                        />
                      ) : field.type === "time" ? (
                        <TimePicker
                          id={`${editorId}-${rowKeysRef.current[index]}-${field.name}`}
                          style={{ width: "100%" }}
                          format="HH:mm"
                          minuteStep={5}
                          value={
                            row[field.name] && dayjs(`2000-01-01T${String(row[field.name]).slice(0, 5)}:00`).isValid()
                              ? dayjs(`2000-01-01T${String(row[field.name]).slice(0, 5)}:00`)
                              : null
                          }
                          placeholder={field.placeholder || "Select time"}
                          onChange={(_, timeString) => updateRow(index, field.name, timeString || "")}
                          status={showRequiredError ? "error" : undefined}
                        />
                      ) : field.type === "textarea" ? (
                        <TextArea
                          id={`${editorId}-${rowKeysRef.current[index]}-${field.name}`}
                          rows={2}
                          value={row[field.name] || ""}
                          placeholder={field.placeholder}
                          onChange={(e) => updateRow(index, field.name, e.target.value)}
                          status={showRequiredError ? "error" : undefined}
                        />
                      ) : (
                        <Input
                          id={`${editorId}-${rowKeysRef.current[index]}-${field.name}`}
                          value={row[field.name] || ""}
                          placeholder={field.placeholder}
                          onChange={(e) => updateRow(index, field.name, e.target.value)}
                          status={showRequiredError ? "error" : undefined}
                        />
                      )}
                      {showRequiredError ? (
                        <Text type="danger" className="repeating-item-editor__hint">
                          {field.label} is required
                        </Text>
                      ) : previewText ? (
                        <Text type="secondary" className="repeating-item-editor__hint">
                          Will be saved as: {previewText}
                        </Text>
                      ) : null}
                    </Col>
                  );
                })}
              </Row> : null}
            </div>
          ))}
        </Space>
      )}
      <Button type="dashed" icon={<PlusOutlined />} onClick={addRow} block style={{ marginTop: 10 }}>
        {addLabel}
      </Button>
    </div>
  );
}

// Validates a RepeatingItemEditor's array value against its field config's `required` flags —
// used as an antd Form.Item rule/validator so a blank required field blocks submit instead of
// only showing a red border (which nothing enforces on its own).
// ProjectWorkspaceServiceImpl.requireBoundedSyncSize rejects any section with more than 500 rows.
// The read side is uncapped, so an admin could open a workspace that already holds more, add one
// more row, and only discover the limit as a rejected save with everything else in the form lost.
// Checking it here surfaces it as an ordinary validation message on the section it applies to.
export const MAX_SECTION_ROWS = 500;

export const validateRepeatingItems = (fields) => (_, value) => {
  const rows = Array.isArray(value) ? value : [];
  if (rows.length > MAX_SECTION_ROWS) {
    return Promise.reject(
      new Error(`This section holds ${rows.length} rows; the server accepts at most ${MAX_SECTION_ROWS}. Remove ${rows.length - MAX_SECTION_ROWS} before saving.`)
    );
  }
  const requiredFields = fields.filter((field) => field.required);
  if (!requiredFields.length) return Promise.resolve();
  const missingAt = rows.findIndex((row) => requiredFields.some((field) => !row?.[field.name]));
  if (missingAt === -1) return Promise.resolve();
  const missingLabels = requiredFields.filter((field) => !rows[missingAt]?.[field.name]).map((field) => field.label);
  return Promise.reject(new Error(`Item ${missingAt + 1}: ${missingLabels.join(", ")} required`));
};
