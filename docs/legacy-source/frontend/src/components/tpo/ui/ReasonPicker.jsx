import { useState } from "react";
import { Input, Tag } from "antd";

/**
 * Quick reasons as chips with an optional note. A routine decision becomes one tap instead of typing a
 * sentence; "Other" reveals the text box. value/onChange carry the final reason string.
 *
 * Props: reasons (array of strings), value, onChange(reason), minOther (min chars for a typed reason, default 3).
 */
export default function ReasonPicker({ reasons, value, onChange, minOther = 3, placeholder = "Add a short reason" }) {
  const isPreset = reasons.includes(value);
  const [other, setOther] = useState(Boolean(value) && !isPreset);
  return (
    <div className="tpo-reason-picker" data-testid="tpo.reason-picker">
      <div className="tpo-reason-picker__chips" role="group" aria-label="Reason">
        {reasons.map((r) => (
          <Tag.CheckableTag key={r} checked={value === r && !other} onChange={() => { setOther(false); onChange(r); }}>{r}</Tag.CheckableTag>
        ))}
        <Tag.CheckableTag checked={other} onChange={() => { setOther(true); if (isPreset) onChange(""); }}>Other</Tag.CheckableTag>
      </div>
      {other && (
        <Input.TextArea autoFocus rows={2} value={isPreset ? "" : value || ""} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} />
      )}
    </div>
  );
}

/** A reason is usable when it is a preset or typed text of at least `minOther` characters. */
export const reasonIsValid = (value, reasons, minOther = 3) => Boolean(value) && (reasons.includes(value) || value.trim().length >= minOther);
