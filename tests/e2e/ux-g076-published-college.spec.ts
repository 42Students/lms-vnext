import { expect, test } from "@playwright/test";

/** Reads the explicitly seeded, isolated PG17 college; no real tenant/user/provider data. */
for (const viewport of [
  { name: "desktop", width: 1280, height: 800 },
  { name: "mobile", width: 390, height: 844 },
] as const) {
  test("UX-G076 "+viewport.name+": published college page respects disclosure and responsive UX", async ({page}) => {
    await page.setViewportSize({width:viewport.width,height:viewport.height});
    const errors:string[]=[];
    page.on("pageerror",error=>errors.push(error.message));
    await page.goto("http://public-g076.localhost:3000/placements");
    const main=page.getByTestId("placements.public");
    await expect(main).toBeVisible();
    await expect(main.getByRole("heading",{level:1})).toContainText("College");
    await expect(main.getByRole("heading",{level:2,name:"Placement outcomes"})).toBeVisible();
    await expect(main.getByText("E2E public placements overview")).toBeVisible();
    await expect(main.getByText("Students in placements")).toBeVisible();
    await expect(main.getByText("30",{exact:true})).toBeVisible();
    await expect(main.getByText("Placement results for the last 12 months.")).toBeVisible();
    await expect(main.getByRole("heading",{name:"Recruit from us"})).toBeVisible();
    await expect(main.getByText(/Individual student and employer records are not shown/)).toBeVisible();
    await expect(main.getByText("Students placed",{exact:true})).toHaveCount(0);
    await expect(main.getByText("E2E private pending applicant")).toHaveCount(0);
    expect(await page.evaluate(()=>document.documentElement.scrollWidth>window.innerWidth)).toBe(false);
    expect(errors).toEqual([]);
  });
}
