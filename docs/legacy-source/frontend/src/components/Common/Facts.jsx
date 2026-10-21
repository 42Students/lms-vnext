import { Tooltip } from "antd";

/**
 * Labelled status chips. A bare chip ("Eligible", "Active", "Not decided yet") makes the reader guess what it is about, more so
 * when two or three sit side by side: each one here says what it is, then its value.
 *
 *   <Facts>
 *     <Fact label="Stage" hint="Their step in placements">{<Tag>Registered</Tag>}</Fact>
 *     <Fact label="Placements">{<Tag color="green">Eligible (from batch)</Tag>}</Fact>
 *   </Facts>
 *
 * Use it wherever a record's state is shown outside a table (a table's column heading already names its chips). A chip that
 * names itself ("CGPA 7.2", "Sprint: 3", "Offer released", "Version 2") does not need it.
 */
export function Facts({ children, className = "", testid, size }) {
  return <dl className={`lms-facts${size === "small" ? " lms-facts--small" : ""} ${className}`.trim()} data-testid={testid}>{children}</dl>;
}

export function Fact({ label, hint, children, testid }) {
  if (children === null || children === undefined || children === false) return null;
  const item = <div className="lms-facts__item" data-testid={testid}><dt>{label}</dt><dd>{children}</dd></div>;
  return hint ? <Tooltip title={hint}>{item}</Tooltip> : item;
}

export default Facts;
