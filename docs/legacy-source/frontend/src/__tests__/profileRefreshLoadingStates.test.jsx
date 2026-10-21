import React from "react";
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import LearnerProfile from "@/pages/learn/profile";
import TeacherProfile from "@/pages/teacher/profile";
import { getStudentDetails, getProgramDetailsByLearnerId, getFacultyDetails } from "@/api/Services/UserServices";

let mockSession;
const mockDispatch = jest.fn();
const mockPush = jest.fn();
const mockRouter = { push: mockPush, query: {} };

jest.mock("react-redux", () => ({
  useSelector: (selector) => selector({ loginUser: mockSession }),
  useDispatch: () => mockDispatch,
}));
jest.mock("next/router", () => ({ useRouter: () => mockRouter }));
jest.mock("@/api/Services/UserServices", () => ({
  getStudentDetails: jest.fn(),
  getProgramDetailsByLearnerId: jest.fn(),
  getFacultyDetails: jest.fn(),
}));
jest.mock("@/components/profile/ProfileVerificationCard", () => function MockVerification() {
  return <div>Verification card</div>;
});
jest.mock("@/components/profile/about", () => function MockAbout({ userDetails, setRefresh, programName }) {
  return (
    <div>
      <span>{userDetails?.firstName || userDetails?.name || userDetails?.id}</span>
      {programName ? <span>{programName}</span> : null}
      <button type="button" onClick={() => setRefresh((value) => !value)}>Trigger profile refresh</button>
    </div>
  );
});

const deferred = () => {
  let resolve;
  let reject;
  const promise = new Promise((res, rej) => { resolve = res; reject = rej; });
  return { promise, resolve, reject };
};

beforeEach(() => {
  jest.clearAllMocks();
  mockRouter.query = {};
  getStudentDetails.mockReset();
  getProgramDetailsByLearnerId.mockReset();
  getFacultyDetails.mockReset();
});

test("learner profile stays visible during a same-user refresh and a failed refresh becomes inline", async () => {
  mockSession = { id: 7, userType: "LEARNER" };
  const refreshRequest = deferred();
  getStudentDetails
    .mockResolvedValueOnce({ data: { data: { id: 7, firstName: "Asha" } } })
    .mockReturnValueOnce(refreshRequest.promise);
  getProgramDetailsByLearnerId.mockResolvedValue({ data: { data: { name: "CSE" } } });

  render(<LearnerProfile />);
  expect(await screen.findByText("Asha")).toBeInTheDocument();

  fireEvent.click(screen.getByRole("button", { name: "Trigger profile refresh" }));
  await waitFor(() => expect(getStudentDetails).toHaveBeenCalledTimes(2));

  expect(screen.getByTestId("learner.profile.page.ready")).toBeInTheDocument();
  expect(screen.queryByTestId("learner.profile.page.loading")).not.toBeInTheDocument();
  expect(screen.getByRole("status")).toHaveTextContent("Refreshing profile");
  expect(screen.getByText("Asha")).toBeInTheDocument();

  await act(async () => {
    refreshRequest.reject(new Error("temporary profile failure"));
    await Promise.resolve();
  });

  expect(await screen.findByText("Couldn't refresh profile")).toBeInTheDocument();
  expect(screen.getByText("Asha")).toBeInTheDocument();
  expect(screen.queryByTestId("learner.profile.page.error")).not.toBeInTheDocument();
});

test("teacher profile stays visible during a same-user refresh failure", async () => {
  mockSession = { id: 8, userType: "FACULTY", facultyType: "FACULTY" };
  const refreshRequest = deferred();
  getFacultyDetails
    .mockResolvedValueOnce({ data: { data: { id: 8, firstName: "Ravi" } } })
    .mockReturnValueOnce(refreshRequest.promise);

  render(<TeacherProfile />);
  expect(await screen.findByText("Ravi")).toBeInTheDocument();

  fireEvent.click(screen.getByRole("button", { name: "Trigger profile refresh" }));
  await waitFor(() => expect(getFacultyDetails).toHaveBeenCalledTimes(2));

  expect(screen.getByTestId("teacher.profile.page.ready")).toBeInTheDocument();
  expect(screen.getByRole("status")).toHaveTextContent("Refreshing profile");

  await act(async () => {
    refreshRequest.reject(new Error("temporary profile failure"));
    await Promise.resolve();
  });

  expect(await screen.findByText("Couldn't refresh profile")).toBeInTheDocument();
  expect(screen.getByText("Ravi")).toBeInTheDocument();
  expect(screen.queryByTestId("teacher.profile.page.error")).not.toBeInTheDocument();
});

test("learner identity change never exposes the previous learner while the new profile is pending", async () => {
  mockSession = { id: 7, userType: "LEARNER" };
  const nextUser = deferred();
  getStudentDetails
    .mockResolvedValueOnce({ data: { data: { id: 7, firstName: "Asha" } } })
    .mockReturnValueOnce(nextUser.promise);
  getProgramDetailsByLearnerId.mockResolvedValue({ data: { data: { name: "CSE" } } });

  const view = render(<LearnerProfile />);
  expect(await screen.findByText("Asha")).toBeInTheDocument();

  mockSession = { id: 9, userType: "LEARNER" };
  view.rerender(<LearnerProfile />);
  await waitFor(() => expect(getStudentDetails).toHaveBeenCalledTimes(2));

  expect(screen.queryByText("Asha")).not.toBeInTheDocument();
  expect(screen.getByTestId("learner.profile.page.loading")).toBeInTheDocument();

  await act(async () => {
    nextUser.resolve({ data: { data: { id: 9, firstName: "Meera" } } });
    await nextUser.promise;
  });

  expect(await screen.findByText("Meera")).toBeInTheDocument();
  expect(screen.queryByText("Asha")).not.toBeInTheDocument();
});


test("late learner response from the previous account cannot replace the newly loaded profile", async () => {
  mockSession = { id: 7, userType: "LEARNER" };
  const oldUser = deferred();
  getStudentDetails
    .mockReturnValueOnce(oldUser.promise)
    .mockResolvedValueOnce({ data: { data: { id: 9, firstName: "Meera" } } });
  getProgramDetailsByLearnerId.mockResolvedValue({ data: { data: { name: "CSE" } } });

  const view = render(<LearnerProfile />);
  await waitFor(() => expect(getStudentDetails).toHaveBeenCalledTimes(1));

  mockSession = { id: 9, userType: "LEARNER" };
  view.rerender(<LearnerProfile />);
  expect(await screen.findByText("Meera")).toBeInTheDocument();

  await act(async () => {
    oldUser.resolve({ data: { data: { id: 7, firstName: "Asha" } } });
    await oldUser.promise;
  });

  expect(screen.getByText("Meera")).toBeInTheDocument();
  expect(screen.queryByText("Asha")).not.toBeInTheDocument();
  expect(screen.getByTestId("learner.profile.page.ready")).toBeInTheDocument();
});
