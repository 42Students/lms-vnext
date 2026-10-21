import React from "react";
import { act, render } from "@testing-library/react";
import useRefreshOnFocus from "../ui/useRefreshOnFocus";

function Probe({ fn, gap }) { useRefreshOnFocus(fn, gap); return null; }

describe("useRefreshOnFocus", () => {
  it("refreshes when the window is focused again, but not twice in quick succession", () => {
    const fn = jest.fn();
    const spy = jest.spyOn(Date, "now");
    spy.mockReturnValue(1000);
    render(<Probe fn={fn} gap={20000} />);
    spy.mockReturnValue(5000);
    act(() => { window.dispatchEvent(new Event("focus")); });
    expect(fn).not.toHaveBeenCalled(); // 4s after mount: too soon
    spy.mockReturnValue(30000);
    act(() => { window.dispatchEvent(new Event("focus")); });
    expect(fn).toHaveBeenCalledTimes(1);
    spy.mockReturnValue(31000);
    act(() => { window.dispatchEvent(new Event("focus")); });
    expect(fn).toHaveBeenCalledTimes(1);
    spy.mockRestore();
  });
  it("stops listening when the page goes away", () => {
    const fn = jest.fn();
    const { unmount } = render(<Probe fn={fn} gap={0} />);
    unmount();
    act(() => { window.dispatchEvent(new Event("focus")); });
    expect(fn).not.toHaveBeenCalled();
  });
});
