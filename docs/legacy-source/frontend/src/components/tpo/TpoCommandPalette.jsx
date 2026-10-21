import { useEffect, useMemo, useRef, useState } from "react";
import { Empty, Input, Modal, Tag, Typography } from "antd";
import { SearchOutlined } from "@ant-design/icons";
import { fetchWithErrorHandling } from "@/api/Services/AdminService";
import { globalSearch } from "@/api/Services/TpoHubService";
import { readRecents, rememberRecent } from "./ui/recents";

// The finder behind the top bar (Ctrl/Cmd+K). It looks up a person or a record and opens it: students (name or roll number), recruiters,
// companies and drives. It deliberately has no "Go to <page>" or "New ..." items: the sidebar and the + New menu already do that.
// (The file keeps its old name so imports and tests still find it.)

export default function TpoCommandPalette({ open, onClose, onNavigate }) {
  const [query, setQuery] = useState("");
  const [searchResults, setSearchResults] = useState({ recruiterLeads: [], drives: [], students: [], companies: [] });
  const [activeIndex, setActiveIndex] = useState(0);
  const [recents, setRecents] = useState([]);
  const inputRef = useRef(null);
  const timer = useRef(null);
  // BE-0101: each search has a number; only the newest one's answer is shown (and a failure is said, not "no matches").
  const searchSeq = useRef(0);
  const [searchFailed, setSearchFailed] = useState(false);

  useEffect(() => {
    if (!open) return;
    setQuery("");
    setSearchResults({ recruiterLeads: [], drives: [], students: [], companies: [] });
    setActiveIndex(0);
    setRecents(readRecents());
    const t = setTimeout(() => inputRef.current?.focus(), 60);
    return () => clearTimeout(t);
  }, [open]);

  useEffect(() => {
    clearTimeout(timer.current);
    const seq = ++searchSeq.current;
    const q = query.trim();
    setSearchFailed(false);
    if (q.length < 2) { setSearchResults({ recruiterLeads: [], drives: [], students: [], companies: [] }); return undefined; }
    timer.current = setTimeout(async () => {
      const res = await fetchWithErrorHandling(globalSearch(q));
      if (seq !== searchSeq.current) return;
      if (!res.success) {
        setSearchFailed(true);
        setSearchResults({ recruiterLeads: [], drives: [], students: [], companies: [] });
        return;
      }
      const d = res.data || {};
      setSearchResults({ recruiterLeads: d.recruiterLeads || [], drives: d.drives || [], students: d.students || [], companies: d.companies || [] });
    }, 200);
    return () => clearTimeout(timer.current);
  }, [query]);

  const groups = useMemo(() => {
    const q = query.trim();
    const out = [];
    if (!q && recents.length) out.push({ label: "Recently opened", items: recents.map((r) => ({ key: `recent-${r.href}`, label: r.label, href: r.href })) });
    if (searchResults.students.length) out.push({ label: "Students", items: searchResults.students.map((s) => ({ key: `student-${s.learnerId || s.id || s.rollNumber}`, label: `${s.firstName} ${s.lastName || ""}`.trim(), hint: [s.rollNumber, s.branch].filter(Boolean).join(" · "), href: `/tpo/students?q=${encodeURIComponent(s.rollNumber || s.firstName)}${(s.learnerId || s.id) ? `&student=${s.learnerId || s.id}` : ""}` })) });
    if (searchResults.recruiterLeads.length) out.push({ label: "Recruiters", items: searchResults.recruiterLeads.map((l) => ({ key: `lead-${l.id}`, label: l.name, hint: l.company || "", href: `/tpo/recruiters/${l.id}` })) });
    if (searchResults.companies.length) out.push({ label: "Companies", items: searchResults.companies.map((c) => ({ key: `company-${c.name}`, label: c.name, href: `/tpo/companies?name=${encodeURIComponent(c.name)}` })) });
    if (searchResults.drives.length) out.push({ label: "Drives", items: searchResults.drives.map((x) => ({ key: `drive-${x.id}`, label: `${x.company} · ${x.title}`, hint: String(x.status || "").replace(/_/g, " ").toLowerCase(), href: `/tpo/drives/${x.id}` })) });
    return out;
  }, [query, searchResults, recents]);

  const flat = useMemo(() => groups.flatMap((g) => g.items), [groups]);

  useEffect(() => { setActiveIndex(0); }, [groups.length, flat.length]);

  const go = (item) => {
    if (!item) return;
    rememberRecent(item);
    onNavigate(item.href);
    onClose();
  };

  const onKeyDown = (e) => {
    if (e.key === "ArrowDown") { e.preventDefault(); setActiveIndex((i) => Math.min(i + 1, flat.length - 1)); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setActiveIndex((i) => Math.max(i - 1, 0)); }
    else if (e.key === "Enter") { e.preventDefault(); go(flat[activeIndex]); }
    else if (e.key === "Escape") { onClose(); }
  };

  let renderedIndex = -1;

  return (
    <Modal open={open} onCancel={onClose} footer={null} closable={false} width={560} styles={{ body: { padding: 0 } }} destroyOnClose>
      <div data-testid="tpo.command-palette" onKeyDown={onKeyDown}>
        <Input
          ref={inputRef}
          size="large"
          variant="borderless"
          allowClear
          prefix={<SearchOutlined />}
          placeholder="Find a student, recruiter, company or drive"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="tpo-palette__input"
        />
        <div role="listbox" aria-label="Matches" className="tpo-palette__list">
          {flat.length === 0 ? (
            <Empty className="tpo-palette__empty" description={searchFailed ? "Search didn't work just now. Keep typing or try again." : query.trim().length >= 2 ? `No student, recruiter, company or drive matches "${query.trim()}"` : "Type a name or a roll number, for example 21CS001"} />
          ) : (
            groups.map((group) => (
              <div key={group.label}>
                <Typography.Text type="secondary" className="tpo-palette__group">{group.label}</Typography.Text>
                {group.items.map((item) => {
                  renderedIndex += 1;
                  const isActive = renderedIndex === activeIndex;
                  return (
                    <div
                      key={item.key}
                      role="option"
                      aria-selected={isActive}
                      onMouseEnter={() => setActiveIndex(flat.indexOf(item))}
                      onClick={() => go(item)}
                      className={`tpo-palette__item${isActive ? " is-active" : ""}`}
                    >
                      <span className="tpo-palette__label">{item.label}</span>
                      {item.hint ? <span className="tpo-palette__hint">{item.hint}</span> : null}
                    </div>
                  );
                })}
              </div>
            ))
          )}
        </div>
        <div className="tpo-palette__foot">
          <Typography.Text type="secondary" ><Tag style={{ marginRight: 4 }}>↑↓</Tag>navigate</Typography.Text>
          <Typography.Text type="secondary" ><Tag style={{ marginRight: 4 }}>Enter</Tag>open</Typography.Text>
          <Typography.Text type="secondary" ><Tag style={{ marginRight: 4 }}>Esc</Tag>close</Typography.Text>
        </div>
      </div>
    </Modal>
  );
}
