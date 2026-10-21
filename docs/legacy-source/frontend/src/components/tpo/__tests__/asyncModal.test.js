import React from "react";
import { render, screen, fireEvent, act } from "@testing-library/react";
import AsyncModal from "@/components/tpo/ui/AsyncModal";

describe("AsyncModal", () => {
  it("a double click on OK runs the save once", async () => {
    let finish;
    const onOk = jest.fn(() => new Promise((resolve) => { finish = resolve; }));
    render(<AsyncModal open title="Save this view" okText="Save" onOk={onOk}>body</AsyncModal>);
    const ok = screen.getByText("Save").closest("button");
    fireEvent.click(ok);
    fireEvent.click(ok);
    expect(onOk).toHaveBeenCalledTimes(1);
    await act(async () => { finish(); });
    fireEvent.click(ok);
    expect(onOk).toHaveBeenCalledTimes(2);
  });
});
