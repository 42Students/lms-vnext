/**
 * UI/UX brutal-audit follow-up: ListingPageHeader only ever rendered its `rightContent` prop,
 * but 12 TPO/recruiter pages passed `extra` instead (a copy-paste habit from antd's own Card/PageHeader
 * API, which does use `extra`) - a silent no-op that hid real action buttons entirely: Create
 * drive, Add recruiter lead, Mark all as read, Import academic details, Plan a drive, the drive detail
 * page's Approve/Reject/Send back/Extend deadline/Messages buttons, the recruiter lead detail page's
 * Invite/Create drive/More menu, the report page's Export button, the drive form's Review and
 * publish button, and Home's own Mine/Team scope selector.
 */
import React from "react";
import { render, screen } from "@testing-library/react";
import ListingPageHeader from "@/components/Global/ListingPageHeader/ListingPageHeader";

test("renders rightContent", () => {
  render(<ListingPageHeader title="Drives" rightContent={<button type="button">Create drive</button>} />);
  expect(screen.getByRole("button", { name: "Create drive" })).toBeInTheDocument();
});

test("silently drops an 'extra' prop (documents the exact bug class this component is prone to)", () => {
  // ListingPageHeader intentionally does not destructure `extra` - this test exists so that if
  // someone "fixes" this by making extra an alias, it's a deliberate choice, not another silent
  // accident. The real fix is always to use rightContent at the call site.
  render(<ListingPageHeader title="Drives" extra={<button type="button">Create drive</button>} />);
  expect(screen.queryByRole("button", { name: "Create drive" })).not.toBeInTheDocument();
});
