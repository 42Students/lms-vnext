import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import SuperAdminInboundMail from "@/pages/superadmin/inbound-mail";
import { getInboundMail, listInboundMail, markInboundMailDone } from "@/api/Services/SuperAdminInboundMailService";

jest.mock("@/api/Services/SuperAdminInboundMailService", () => ({
  listInboundMail: jest.fn(),
  getInboundMail: jest.fn(),
  markInboundMailDone: jest.fn(),
}));
jest.mock("@/layouts/SuperAdminLayout", () => ({ children }) => children);

const ok = (data) => Promise.resolve({ data });
const row = {
  id: 7, receivedAt: [2026, 10, 13, 5, 0, 0], fromAddress: "ravi@student.test", toAddress: "hello@42lms.com",
  subject: "Did not get my code", kind: "OTHER", status: "STORED", preview: "I did not get my sign-in code", studentName: "Ravi Teja", collegeName: "NSRIT",
};

beforeEach(() => {
  jest.clearAllMocks();
  listInboundMail.mockReturnValue(ok({ items: [row], total: 1, open: 1, pageSize: 50 }));
  getInboundMail.mockReturnValue(ok({ ...row, body: "I did not get my sign-in code.\n\nRavi" }));
  markInboundMailDone.mockReturnValue(ok({ id: 7, done: true }));
});

test("lists what is waiting, opens one in full and marks it done", async () => {
  render(<SuperAdminInboundMail />);
  expect(await screen.findByText("Did not get my code")).toBeInTheDocument();
  expect(screen.getByText(/To read \(1\)/)).toBeInTheDocument();
  expect(screen.getByText(/Student · NSRIT/)).toBeInTheDocument();
  expect(listInboundMail).toHaveBeenCalledWith(expect.objectContaining({ show: "OPEN", page: 0 }));

  fireEvent.click(screen.getByText("Did not get my code"));
  await waitFor(() => expect(screen.getByTestId("inbound-mail.body")).toHaveTextContent("I did not get my sign-in code."));
  await act(async () => { fireEvent.click(screen.getByRole("button", { name: "Mark done" })); });
  await waitFor(() => expect(markInboundMailDone).toHaveBeenCalledWith(7, true));
  await waitFor(() => expect(listInboundMail).toHaveBeenCalledTimes(2));
});

test("says so when it can't load", async () => {
  listInboundMail.mockReturnValue(Promise.reject({ response: { status: 500, data: {} } }));
  render(<SuperAdminInboundMail />);
  expect(await screen.findByText("Couldn't load inbound mail")).toBeInTheDocument();
});
