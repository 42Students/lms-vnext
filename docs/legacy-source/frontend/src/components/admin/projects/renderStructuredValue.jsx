import { Descriptions, Space, Tag, Typography } from "antd";

const { Text } = Typography;

// Renders an arbitrary-shaped value (string/number/boolean/array/nested object) as readable
// antd markup instead of falling back to JSON.stringify. Used anywhere an admin views a value
// whose shape isn't fully controlled by a structured editor — audit log payloads (varying by
// actionKey) and legacy/API-created section data that may still carry a nested object where the
// admin console's own editors only ever write scalars. Recurses into nested objects/arrays as
// their own bordered Descriptions blocks so structure stays visible without raw JSON syntax.
// No real audit-log or template shape nests this deep — this exists purely as a backstop.
// `depth` was already threaded through every recursive call for the indent styling, but nothing
// ever compared it against a limit, so a pathologically deep or malformed JSON value (accidental
// paste, a future data shape nobody anticipated) could recurse until the browser's call stack
// overflows and crashes the page an admin is looking at.
const MAX_RENDER_DEPTH = 12;

export default function renderStructuredValue(val, depth = 0) {
  if (val === null || val === undefined || val === "") return <Text type="secondary">—</Text>;
  if (depth >= MAX_RENDER_DEPTH) {
    return <Text type="secondary" italic>(too deeply nested to display)</Text>;
  }

  if (Array.isArray(val)) {
    if (!val.length) return <Text type="secondary">—</Text>;
    const allScalar = val.every((item) => item === null || typeof item !== "object");
    if (allScalar) {
      return (
        <Space wrap size={[4, 4]}>
          {val.map((item, index) => (
            <Tag key={index}>{String(item)}</Tag>
          ))}
        </Space>
      );
    }
    // Same depth-indent treatment as the object branch below — without it, an array-of-objects
    // nested directly under an object (e.g. `{ changes: [...] }`, a realistic audit-log shape)
    // rendered at its parent's indent, and the depth cue only resumed one level further down.
    return (
      <div style={depth > 0 ? { marginLeft: 12, borderLeft: "2px solid var(--border-color-split, #f0f0f0)", paddingLeft: 8 } : undefined}>
        <Space direction="vertical" style={{ width: "100%" }} size={6}>
          {val.map((item, index) => (
            <Descriptions key={index} column={1} size="small" bordered>
              {Object.entries(item && typeof item === "object" ? item : { value: item }).map(([key, entryVal]) => (
                <Descriptions.Item key={key} label={key}>
                  {renderStructuredValue(entryVal, depth + 1)}
                </Descriptions.Item>
              ))}
            </Descriptions>
          ))}
        </Space>
      </div>
    );
  }

  if (typeof val === "object") {
    const entries = Object.entries(val);
    if (!entries.length) return <Text type="secondary">—</Text>;
    // A nested object/array reuses the same bordered-Descriptions look at every recursion depth —
    // without some visual cue, a 2-3 level deep structure is indistinguishable from flat data.
    // Indenting each level a little makes the nesting readable at a glance.
    return (
      <div style={depth > 0 ? { marginLeft: 12, borderLeft: "2px solid var(--border-color-split, #f0f0f0)", paddingLeft: 8 } : undefined}>
        <Descriptions column={1} size="small" bordered>
          {entries.map(([key, entryVal]) => (
            <Descriptions.Item key={key} label={key}>
              {renderStructuredValue(entryVal, depth + 1)}
            </Descriptions.Item>
          ))}
        </Descriptions>
      </div>
    );
  }

  return String(val);
}
