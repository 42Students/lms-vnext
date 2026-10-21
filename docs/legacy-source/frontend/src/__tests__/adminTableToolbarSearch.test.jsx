import React from "react";
import { act, fireEvent, render, screen } from "@testing-library/react";
import AdminTableToolbar from "@/components/admin/AdminTableToolbar";

describe("AdminTableToolbar search lifecycle", () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  test("keeps typing local and emits one debounced search update", () => {
    const onSearch = jest.fn();
    render(
      <AdminTableToolbar
        searchValue=""
        onSearch={onSearch}
        searchPlaceholder="Search groups"
        exportRows={[]}
      />
    );

    const input = screen.getByLabelText("Search groups");
    fireEvent.change(input, { target: { value: "alp" } });

    expect(input).toHaveValue("alp");
    expect(onSearch).not.toHaveBeenCalled();

    act(() => {
      jest.advanceTimersByTime(219);
    });
    expect(onSearch).not.toHaveBeenCalled();

    act(() => {
      jest.advanceTimersByTime(1);
    });
    expect(onSearch).toHaveBeenCalledTimes(1);
    expect(onSearch).toHaveBeenLastCalledWith("alp");
  });

  test("clear search uses the same debounced lifecycle", () => {
    const onSearch = jest.fn();
    render(
      <AdminTableToolbar
        searchValue=""
        onSearch={onSearch}
        searchPlaceholder="Search students"
        exportRows={[]}
      />
    );

    fireEvent.change(screen.getByLabelText("Search students"), { target: { value: "phani" } });
    act(() => {
      jest.advanceTimersByTime(220);
    });

    fireEvent.click(screen.getByRole("button", { name: "Clear search" }));
    act(() => {
      jest.advanceTimersByTime(220);
    });

    expect(onSearch).toHaveBeenLastCalledWith("");
  });
});
