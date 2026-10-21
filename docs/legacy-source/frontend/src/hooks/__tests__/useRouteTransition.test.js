import { act, renderHook } from "@testing-library/react";
import { useRouteTransition } from "../useRouteTransition";

const handlers = {};
const mockEvents = {
  on: jest.fn((name, handler) => {
    handlers[name] = handler;
  }),
  off: jest.fn((name, handler) => {
    if (handlers[name] === handler) delete handlers[name];
  }),
};

jest.mock("next/router", () => ({
  useRouter: () => ({ events: mockEvents }),
}));

describe("useRouteTransition", () => {
  let originalRequestAnimationFrame;

  beforeEach(() => {
    jest.clearAllMocks();
    Object.keys(handlers).forEach((key) => delete handlers[key]);
    originalRequestAnimationFrame = window.requestAnimationFrame;
    window.requestAnimationFrame = (callback) => callback();
  });

  afterEach(() => {
    window.requestAnimationFrame = originalRequestAnimationFrame;
  });

  test("marks the surface busy while a route is changing and ready when it completes", () => {
    const { result } = renderHook(() => useRouteTransition());

    expect(result.current).toBe(false);

    act(() => handlers.routeChangeStart("/learn/courses"));
    expect(result.current).toBe(true);

    act(() => handlers.routeChangeComplete("/learn/courses"));
    expect(result.current).toBe(false);
  });

  test("recovers from cancelled/failed navigation and removes router listeners on unmount", () => {
    const { result, unmount } = renderHook(() => useRouteTransition());

    act(() => handlers.routeChangeStart("/college-admin/dashboard"));
    expect(result.current).toBe(true);

    act(() => handlers.routeChangeError(new Error("cancelled")));
    expect(result.current).toBe(false);

    const registered = {
      start: handlers.routeChangeStart,
      complete: handlers.routeChangeComplete,
      error: handlers.routeChangeError,
    };

    unmount();

    expect(mockEvents.off).toHaveBeenCalledWith("routeChangeStart", registered.start);
    expect(mockEvents.off).toHaveBeenCalledWith("routeChangeComplete", registered.complete);
    expect(mockEvents.off).toHaveBeenCalledWith("routeChangeError", registered.error);
  });
});
