import { act, renderHook } from "@testing-library/react";
import { useSingleFlightAction } from "../useSingleFlightAction";

const deferred = () => {
  let resolve;
  let reject;
  const promise = new Promise((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
};

describe("useSingleFlightAction", () => {
  test("owns a request synchronously and rejects same-tick duplicates", async () => {
    const request = deferred();
    const action = jest.fn(() => request.promise);
    const { result } = renderHook(() => useSingleFlightAction());

    let first;
    let duplicate;
    await act(async () => {
      first = result.current.run(action);
      duplicate = await result.current.run(action);
    });

    expect(action).toHaveBeenCalledTimes(1);
    expect(duplicate).toEqual({ accepted: false, ok: false, reason: "pending" });
    expect(result.current.status).toBe("pending");

    await act(async () => {
      request.resolve("saved");
      await first;
    });

    expect(result.current.status).toBe("success");
    expect(result.current.value).toBe("saved");
  });

  test("preserves failure and retries only the last accepted action", async () => {
    const action = jest
      .fn()
      .mockRejectedValueOnce(new Error("temporary failure"))
      .mockResolvedValueOnce("saved");
    const { result } = renderHook(() => useSingleFlightAction());

    await act(async () => {
      await result.current.run(action);
    });

    expect(result.current.status).toBe("error");
    expect(result.current.error).toEqual(expect.objectContaining({ message: "temporary failure" }));
    expect(result.current.canRetry).toBe(true);

    await act(async () => {
      await result.current.retry();
    });

    expect(action).toHaveBeenCalledTimes(2);
    expect(result.current.status).toBe("success");
    expect(result.current.value).toBe("saved");
  });

  test("reset is blocked while pending and returns to idle after completion", async () => {
    const request = deferred();
    const { result } = renderHook(() => useSingleFlightAction());

    let pending;
    await act(async () => {
      pending = result.current.run(() => request.promise);
    });

    expect(result.current.reset()).toBe(false);

    await act(async () => {
      request.resolve(true);
      await pending;
    });

    act(() => {
      expect(result.current.reset()).toBe(true);
    });

    expect(result.current.status).toBe("idle");
    expect(result.current.canRetry).toBe(false);
  });
});
