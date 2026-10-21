import { renderHook, waitFor } from "@testing-library/react";
import { useDispatch, useSelector } from "react-redux";
import { getStudentDetails } from "@/api/Services/UserServices";
import useLearnerClassScope from "../useLearnerClassScope";

jest.mock("react-redux", () => ({ useSelector: jest.fn(), useDispatch: jest.fn() }));
jest.mock("@/api/Services/UserServices", () => ({ getStudentDetails: jest.fn() }));
jest.mock("@/redux/store", () => ({ loginUserAction: { handleUserData: (p) => ({ type: "user", payload: p }) } }));

// LRN-X-01 / LRN-T-09: a learner whose login state lacks classId is recovered the same way everywhere.
describe("useLearnerClassScope", () => {
  let dispatch;
  const asLearner = (id, classId) => useSelector.mockImplementation((sel) => sel({ loginUser: { id, classId, isUserLoggedIn: true } }));
  beforeEach(() => { dispatch = jest.fn(); useDispatch.mockReturnValue(dispatch); getStudentDetails.mockReset(); });

  it("is ready at once when classId is known", () => {
    asLearner(101, 9);
    const { result } = renderHook(() => useLearnerClassScope());
    expect(result.current.status).toBe("ready");
    expect(getStudentDetails).not.toHaveBeenCalled();
  });

  it("fills a missing classId from the learner record", async () => {
    asLearner(102, null);
    getStudentDetails.mockResolvedValue({ data: { data: { classId: 9 } } });
    const { result } = renderHook(() => useLearnerClassScope());
    await waitFor(() => expect(result.current.status).toBe("ready"));
    expect(dispatch).toHaveBeenCalledWith({ type: "user", payload: { classId: 9 } });
  });

  it("says 'none' only when the learner really has no class, and 'error' when the lookup fails", async () => {
    asLearner(103, null);
    getStudentDetails.mockResolvedValue({ data: { data: { classId: null } } });
    const none = renderHook(() => useLearnerClassScope());
    await waitFor(() => expect(none.result.current.status).toBe("none"));

    asLearner(104, null);
    getStudentDetails.mockRejectedValue(new Error("down"));
    const failed = renderHook(() => useLearnerClassScope());
    await waitFor(() => expect(failed.result.current.status).toBe("error"));
  });

  it("never looks anything up when disabled (staff)", () => {
    asLearner(105, null);
    const { result } = renderHook(() => useLearnerClassScope({ enabled: false }));
    expect(result.current.status).toBe("ready");
    expect(getStudentDetails).not.toHaveBeenCalled();
  });
});
