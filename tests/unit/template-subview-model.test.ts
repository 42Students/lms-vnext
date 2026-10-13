import {
  describe,
  expect,
  it,
} from "vitest";
import {
  TEMPLATE_SUBVIEW_TABS,
  countTemplateBlueprintItems,
  templateSubviewHref,
  templateVersionLabels,
} from "@/modules/projects/template-subview-model";

const templateId =
  "11111111-1111-4111-8111-111111111111";

describe("Super Admin template sub-view navigation", () => {
  it("contains the overview and exactly five named sub-views", () => {
    expect(
      TEMPLATE_SUBVIEW_TABS.map(
        (tab) => tab.id,
      ),
    ).toEqual([
      "overview",
      "sprints",
      "tasks",
      "resources",
      "colleges",
      "versions",
    ]);
  });

  it("uses the existing detail route for overview", () => {
    expect(
      templateSubviewHref(
        templateId,
        "overview",
      ),
    ).toBe(
      `/admin/projects/templates/${templateId}`,
    );
  });

  it("builds each read-only section link under the current template", () => {
    for (const section of [
      "sprints",
      "tasks",
      "resources",
      "colleges",
      "versions",
    ] as const) {
      expect(
        templateSubviewHref(
          templateId,
          section,
        ),
      ).toBe(
        `/admin/projects/templates/${templateId}/${section}`,
      );
    }
  });

  it("encodes the template identifier without changing section names", () => {
    expect(
      templateSubviewHref(
        "a/b",
        "tasks",
      ),
    ).toBe(
      "/admin/projects/templates/a%2Fb/tasks",
    );
  });
});

describe("Super Admin template blueprint counts", () => {
  it("counts the four versioned collections independently", () => {
    const blueprint = {
      releases: [{ key: "r1" }],
      sprints: [{ key: "s1" }, { key: "s2" }],
      tasks: [
        { key: "t1" },
        { key: "t2" },
        { key: "t3" },
      ],
      resources: [],
    };

    expect(
      countTemplateBlueprintItems(
        blueprint,
      ),
    ).toEqual({
      releases: 1,
      sprints: 2,
      tasks: 3,
      resources: 0,
    });
  });

  it("handles absent blueprint and absent collections", () => {
    expect(
      countTemplateBlueprintItems(null),
    ).toEqual({
      releases: 0,
      sprints: 0,
      tasks: 0,
      resources: 0,
    });

    expect(
      countTemplateBlueprintItems({}),
    ).toEqual({
      releases: 0,
      sprints: 0,
      tasks: 0,
      resources: 0,
    });
  });
});

describe("Super Admin template version labels", () => {
  it("labels a version that is both current and published", () => {
    expect(
      templateVersionLabels(3, 3, 3),
    ).toEqual([
      "Current",
      "Published",
    ]);
  });

  it("distinguishes current draft from published version", () => {
    expect(
      templateVersionLabels(4, 4, 2),
    ).toEqual(["Current"]);

    expect(
      templateVersionLabels(2, 4, 2),
    ).toEqual(["Published"]);

    expect(
      templateVersionLabels(1, 4, 2),
    ).toEqual([]);
  });

  it("does not imply that a draft was published", () => {
    expect(
      templateVersionLabels(1, 1, null),
    ).toEqual(["Current"]);
  });
});
