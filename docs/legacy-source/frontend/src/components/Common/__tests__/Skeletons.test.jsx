import React from "react";
import { render, screen } from "@testing-library/react";
import {
  CardGridSkeleton,
  DashboardSkeleton,
  DetailSkeleton,
  ListSkeleton,
  PageSkeleton,
  RefreshStatus,
  SkeletonBlock,
  SkeletonText,
  TableSkeleton,
} from "../Skeletons";

describe("shared skeleton system", () => {
  test("region-level compositions expose one useful loading status", () => {
    render(<CardGridSkeleton cards={3} label="Loading courses" />);

    const status = screen.getByRole("status");
    expect(status).toHaveAttribute("aria-busy", "true");
    expect(status).toHaveTextContent("Loading courses");
    expect(document.querySelectorAll(".lms-skeleton-card")).toHaveLength(3);
  });

  test("table skeleton clamps row and column counts instead of producing unbounded markup", () => {
    const { container } = render(
      <TableSkeleton rows={99} columns={99} />
    );

    expect(
      container.querySelectorAll(".lms-skeleton-table__row")
    ).toHaveLength(13);
    expect(
      container.querySelector(".lms-skeleton-table__row").children
    ).toHaveLength(8);
  });

  test("table skeleton can reserve explicit column geometry", () => {
    const { container } = render(
      <TableSkeleton columns={3} columnWidths={[220, "minmax(120px, 2fr)", 96]} />
    );

    expect(
      container.querySelector(".lms-skeleton-table__row").style.gridTemplateColumns
    ).toBe("220px minmax(120px, 2fr) 96px");
  });

  test("list skeleton can reserve rows without avatar geometry", () => {
    const { container } = render(
      <ListSkeleton rows={4} avatar={false} />
    );

    expect(
      container.querySelectorAll(".lms-skeleton-list__row")
    ).toHaveLength(4);
    expect(
      container.querySelector(".lms-skeleton-avatar")
    ).not.toBeInTheDocument();
  });

  test("page and dashboard compositions reserve stable structural regions", () => {
    const { container, rerender } = render(<PageSkeleton />);

    expect(
      container.querySelector(".lms-skeleton-page__header")
    ).toBeInTheDocument();
    expect(
      container.querySelectorAll(".lms-skeleton-card")
    ).toHaveLength(3);

    rerender(<DashboardSkeleton metrics={5} />);
    expect(
      container.querySelectorAll(".lms-skeleton-metric")
    ).toHaveLength(5);
    expect(
      container.querySelectorAll(".lms-skeleton-dashboard__panel")
    ).toHaveLength(2);
  });

  test("detail skeleton can omit media when the loaded page has no media column", () => {
    const { container } = render(
      <DetailSkeleton withMedia={false} />
    );

    expect(
      container.querySelector(".lms-skeleton-detail__media")
    ).not.toBeInTheDocument();
    expect(
      container.querySelector(".lms-skeleton-detail__content")
    ).toBeInTheDocument();
  });

  test("refresh status announces background work without replacing loaded content", () => {
    render(<RefreshStatus label="Refreshing assignments…" />);

    const status = screen.getByRole("status");
    expect(status).toHaveTextContent("Refreshing assignments…");
    expect(status.querySelector(".lms-refresh-status__dot")).toHaveAttribute(
      "aria-hidden",
      "true"
    );
  });

  test("primitive blocks are decorative and text line count is bounded", () => {
    const { container } = render(
      <div>
        <SkeletonBlock width={120} height={16} />
        <SkeletonText lines={20} />
      </div>
    );

    expect(
      container.querySelector(".lms-skeleton-block")
    ).toHaveAttribute("aria-hidden", "true");
    expect(
      container.querySelectorAll(
        ".lms-skeleton-text > .lms-skeleton-block"
      )
    ).toHaveLength(8);
  });
});
