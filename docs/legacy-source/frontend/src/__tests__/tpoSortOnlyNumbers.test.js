/**
 * Only numbers and dates sort in the TPO tables (user, 6 Oct 2026): a sort arrow on a name, a status or a tag looks odd.
 * A column sorts when it has a sorter, says sortable: true, or is right-aligned (every number column is).
 */
import { toGridColumns } from "@/components/tpo/TpoDataTable";
import { tableColumns } from "@/components/tpo/reportViews";

const sortableIds = (cols) => toGridColumns(cols).filter((c) => c.sortable).map((c) => c.colId);

test("text columns never sort; numbers, dates and explicit sorters do", () => {
  const cols = [
    { title: "Name", key: "name", render: () => null, exportValue: (r) => r.name },
    { title: "Branch", dataIndex: "branch" },
    { title: "Status", dataIndex: "status", render: (v) => v },
    { title: "Roll", dataIndex: "rollNumber", sortable: true },
    { title: "CTC (LPA)", dataIndex: "ctcLpa", align: "right" },
    { title: "Applied on", dataIndex: "appliedAt", sorter: (a, b) => String(a.appliedAt).localeCompare(String(b.appliedAt)) },
    { title: "", key: "actions", sortable: true },
  ];
  expect(sortableIds(cols)).toEqual(["rollNumber", "ctcLpa", "appliedAt"]);
});

test("report tables sort only their number columns", () => {
  const view = { columns: [
    { key: "company", title: "Company", text: (r) => r.company },
    { key: "placed", title: "Placed", numeric: true, text: (r) => r.placed },
  ] };
  const cols = tableColumns(view);
  expect(cols[0].sorter).toBeUndefined();
  expect(typeof cols[1].sorter).toBe("function");
});
