import { chartBars } from "@/components/tpo/reportViews";

describe("TPO report chart states", () => {
  const view = {
    chart: {
      title: "Students placed",
      label: (row) => row.company,
      value: (row) => Number(row.placed) || 0,
    },
  };

  test("keeps one valid bar instead of treating it as no chart", () => {
    expect(chartBars(view, { rows: [{ company: "Acme", placed: 4 }] })).toEqual([
      { label: "Acme", value: 4 },
    ]);
  });

  test("returns a safe empty chart for missing or malformed rows", () => {
    expect(chartBars(view, { rows: null })).toEqual([]);
    expect(chartBars(view, { rows: [null, "bad"] })).toEqual([]);
  });

  test("normalizes non-finite chart values to zero", () => {
    expect(chartBars({
      chart: { label: (row) => row.company, value: () => Number.NaN },
    }, { rows: [{ company: "Acme" }] })).toEqual([{ label: "Acme", value: 0 }]);
  });

  test("fromData chart sources are also filtered and normalized", () => {
    expect(chartBars({
      chart: { fromData: () => [null, { label: "0-5 LPA", value: "3" }, { value: 8 }] },
    }, {})).toEqual([{ label: "0-5 LPA", value: 3 }]);
  });
});
