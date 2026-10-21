import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import PrivateDocLink, { isPrivateDoc } from "../PrivateDocLink";
import { getDocumentUrl } from "@/api/Services/VerificationService";

jest.mock("@/api/Services/VerificationService", () => ({ getDocumentUrl: jest.fn() }));

beforeEach(() => jest.clearAllMocks());

test("a private document opens through a signed link fetched on click, in a tab opened at the click", async () => {
  const tab = { location: { href: "" }, close: jest.fn() };
  const open = jest.spyOn(window, "open").mockReturnValue(tab);
  getDocumentUrl.mockResolvedValue({ data: { status: "OK", data: "https://r2.example/doc?sig=abc" } });
  render(<PrivateDocLink value="private-doc:org-1/college-6/identity-docs/user-42/a.pdf" userId={42}>View</PrivateDocLink>);
  fireEvent.click(screen.getByTestId("private-doc-link"));
  expect(open).toHaveBeenCalledWith("", "_blank");
  await waitFor(() => expect(tab.location.href).toBe("https://r2.example/doc?sig=abc"));
  expect(getDocumentUrl).toHaveBeenCalledWith("private-doc:org-1/college-6/identity-docs/user-42/a.pdf", 42);
  open.mockRestore();
});

test("a refused document closes the empty tab and says so", async () => {
  const tab = { location: { href: "" }, close: jest.fn() };
  const open = jest.spyOn(window, "open").mockReturnValue(tab);
  getDocumentUrl.mockRejectedValue({ response: { status: 403, data: { message: "Identity documents are restricted" } } });
  render(<PrivateDocLink value="private-doc:k" userId={1}>View</PrivateDocLink>);
  fireEvent.click(screen.getByTestId("private-doc-link"));
  await waitFor(() => expect(tab.close).toHaveBeenCalled());
  expect(await screen.findByText("Identity documents are restricted")).toBeInTheDocument();
  open.mockRestore();
});

test("an older public link opens as a plain link; anything that is not a web address is not a link", () => {
  const { rerender } = render(<PrivateDocLink value="https://cdn.example/a.pdf">Doc</PrivateDocLink>);
  expect(screen.getByRole("link", { name: "Doc" })).toHaveAttribute("href", "https://cdn.example/a.pdf");
  rerender(<PrivateDocLink value="javascript:alert(1)">Doc</PrivateDocLink>);
  expect(screen.queryByRole("link")).not.toBeInTheDocument();
  expect(isPrivateDoc(" private-doc:x")).toBe(true);
  expect(isPrivateDoc("https://x")).toBe(false);
});
