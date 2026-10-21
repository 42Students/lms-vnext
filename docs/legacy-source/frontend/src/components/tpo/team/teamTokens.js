// Team module V1: a message body is plain text with tokens the screen turns into chips. The server reads mentions from the same
// tokens (backend TpoTeamThreadService.MENTION / CHIP), so the two must stay in step.
//   @[Ravi Kumar](f:12)   a person         @[team](team)   everyone the conversation reaches
//   #[Omega · SDE](d:40)  a drive          #[Infosys](c:infosys)   a company (key = name in lower case)   #[Kiran Rao](s:991)   a student

const TOKEN = /@\[([^\]\n]{1,80})\]\((f:(\d{1,10})|team)\)|#\[([^\]\n]{1,120})\]\(([dcs]):([^)\n]{1,200})\)/g;

/** Where a "#" chip goes. */
export function chipHref(kind, key) {
  if (kind === "d") return `/tpo/drives/${encodeURIComponent(key)}`;
  if (kind === "s") return `/tpo/students?student=${encodeURIComponent(key)}`;
  return `/tpo/messages?tab=team&about=${encodeURIComponent(`COMPANY:${key}`)}`;
}

/** The body as parts: { type: "text" | "mention" | "team" | "chip", text, id?, kind?, key?, href? }. */
export function parseBody(body) {
  const text = body == null ? "" : String(body);
  const parts = [];
  let last = 0;
  text.replace(TOKEN, (match, name, ref, id, label, kind, key, offset) => {
    if (offset > last) parts.push({ type: "text", text: text.slice(last, offset) });
    if (name != null) {
      parts.push(ref === "team" ? { type: "team", text: "@team" } : { type: "mention", text: `@${name}`, id: Number(id) });
    } else {
      parts.push({ type: "chip", text: label, kind, key, href: chipHref(kind, key) });
    }
    last = offset + match.length;
    return match;
  });
  if (last < text.length) parts.push({ type: "text", text: text.slice(last) });
  return parts;
}

/** The body as words: "@[Ravi Kumar](f:12)" reads "@Ravi Kumar", a chip reads its label. */
export function plainText(body) {
  return parseBody(body).map((p) => p.text).join("");
}

export const mentionToken = (person) => `@[${String(person.name || "").replace(/[[\]()\n]/g, " ").trim()}](f:${person.facultyId})`;
export const TEAM_TOKEN = "@[team](team)";
export const chipToken = (kind, key, label) => `#[${String(label || "").replace(/[[\]()\n]/g, " ").trim()}](${kind}:${String(key).replace(/[)\n]/g, " ")})`;

/** People mentioned in a body (ids), for "you'll tell N people". */
export function mentionedIds(body) {
  return parseBody(body).filter((p) => p.type === "mention").map((p) => p.id);
}
