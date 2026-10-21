import { useRef, useState } from "react";
import { Button, Input, Space, Typography } from "antd";
import { ArrowDownOutlined, ArrowUpOutlined, DeleteOutlined, PlusOutlined } from "@ant-design/icons";
import { normalizeCourseTakeaways, parsePastedCourseTakeaways } from "@/utils/adminCourseTakeaways";

/** Controlled ordered string[] editor for course takeaways. Works inside Form.Item. */
export default function CourseTakeawaysEditor({ value, onChange }) {
  const points = Array.isArray(value) ? value : normalizeCourseTakeaways(value);
  const keysRef = useRef([]);
  const counterRef = useRef(0);
  const lastAddedRef = useRef(null);
  const [pasteOpen, setPasteOpen] = useState(false);
  const [pasteText, setPasteText] = useState("");
  const [removed, setRemoved] = useState(null);
  while (keysRef.current.length < points.length) keysRef.current.push(`takeaway-${counterRef.current++}`);
  if (keysRef.current.length > points.length) keysRef.current.length = points.length;

  const emit = (items) => onChange?.(items);
  const add = () => {
    const key = `takeaway-${counterRef.current++}`;
    keysRef.current.push(key);
    emit([...points, ""]);
    setRemoved(null);
    // Focus the new input instead of making the admin hunt for the row they just added.
    requestAnimationFrame(() => lastAddedRef.current?.focus());
  };
  const remove = (index) => {
    setRemoved({ index, value: points[index], key: keysRef.current[index] });
    keysRef.current.splice(index, 1);
    emit(points.filter((_, i) => i !== index));
  };
  const undo = () => {
    if (!removed) return;
    const items = [...points];
    const index = Math.min(removed.index, items.length);
    items.splice(index, 0, removed.value);
    keysRef.current.splice(index, 0, removed.key);
    emit(items);
    setRemoved(null);
  };
  const move = (index, delta) => {
    const next = index + delta;
    if (next < 0 || next >= points.length) return;
    const items = [...points];
    [items[index], items[next]] = [items[next], items[index]];
    [keysRef.current[index], keysRef.current[next]] = [keysRef.current[next], keysRef.current[index]];
    emit(items);
  };
  const paste = () => {
    const parsed = parsePastedCourseTakeaways(pasteText);
    if (!parsed.length) return;
    parsed.forEach(() => keysRef.current.push(`takeaway-${counterRef.current++}`));
    emit([...points, ...parsed]);
    setPasteOpen(false);
    setPasteText("");
    setRemoved(null);
  };

  return (
    <div aria-label="Course takeaways" style={{ display: "grid", gap: 8 }}>
      <Typography.Text type="secondary">Each point becomes a bullet on the course home page. Add, remove or reorder without typing bullet characters.</Typography.Text>
      {points.map((point, index) => <div key={keysRef.current[index]}
        style={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: 6 }}>
        <Typography.Text style={{ minWidth: 22 }}>{index + 1}.</Typography.Text>
        <Input aria-label={`Takeaway ${index + 1}`} placeholder={`Point ${index + 1}`}
          ref={index === points.length - 1 ? lastAddedRef : undefined}
          value={point || ""} onChange={(event) => emit(points.map((p, i) => i === index ? event.target.value : p))}
          style={{ flex: "1 1 200px" }} />
        <Button size="small" icon={<ArrowUpOutlined />} disabled={index === 0}
          aria-label={`Move takeaway ${index + 1} up`} onClick={() => move(index, -1)} />
        <Button size="small" icon={<ArrowDownOutlined />} disabled={index === points.length - 1}
          aria-label={`Move takeaway ${index + 1} down`} onClick={() => move(index, 1)} />
        <Button size="small" danger icon={<DeleteOutlined />}
          aria-label={`Remove takeaway ${index + 1}`} onClick={() => remove(index)} />
      </div>)}
      {removed && <Typography.Text role="status" type="secondary">Point removed from this unsaved form. <Button type="link" size="small" onClick={undo}>Undo remove</Button></Typography.Text>}
      <Space wrap>
        <Button type="dashed" icon={<PlusOutlined />} onClick={add}>Add takeaway</Button>
        <Button size="small" onClick={() => setPasteOpen((open) => !open)}>{pasteOpen ? "Cancel paste" : "Paste multiple points"}</Button>
      </Space>
      {pasteOpen && <div style={{ display: "grid", gap: 8 }}>
        <Input.TextArea aria-label="Paste takeaways" rows={4} value={pasteText}
          onChange={(event) => setPasteText(event.target.value)}
          placeholder={"Paste one point per line; existing points will be retained."} />
        <Button type="primary" size="small" disabled={parsePastedCourseTakeaways(pasteText).length === 0} onClick={paste}>Add pasted points</Button>
      </div>}
      {points.length > 0 && <Typography.Text type="secondary" role="status">{points.filter((p) => String(p || "").trim()).length} point(s) ready to save</Typography.Text>}
    </div>
  );
}
