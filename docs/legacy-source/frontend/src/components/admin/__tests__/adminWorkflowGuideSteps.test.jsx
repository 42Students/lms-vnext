import React from "react";
import { render, screen } from "@testing-library/react";
import AdminWorkflowGuide from "@/components/admin/AdminWorkflowGuide";
import { SHARED_GROUP_DEFINITIONS } from "@/common/navGroupDefinitions";

const group = SHARED_GROUP_DEFINITIONS.academic;
const item = (path) => group.items.find((i) => i.path === path);

describe("academic setup banner counts only real setup steps", () => {
  test("classes is the last of six steps", () => {
    render(<AdminWorkflowGuide group={group} activeItem={item("classes")} basePath="/college-admin" />);
    expect(screen.getByText(/Step 6 of 6: Classes/)).toBeInTheDocument();
    expect(screen.queryByText(/Next:/)).not.toBeInTheDocument();
  });

  test("not shown on pages that are not setup steps", () => {
    for (const path of ["batch-promotion", "lecture-halls", "electives", "attendance"]) {
      const { container, unmount } = render(<AdminWorkflowGuide group={group} activeItem={item(path)} basePath="/college-admin" />);
      expect(container).toBeEmptyDOMElement();
      unmount();
    }
  });
});
