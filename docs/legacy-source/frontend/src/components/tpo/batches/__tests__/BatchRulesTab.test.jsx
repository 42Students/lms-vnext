import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import BatchRulesTab from "../BatchRulesTab";
import { getBatchRules, saveBatchRules } from "@/api/Services/BatchesService";

jest.mock("@/api/Services/BatchesService", () => ({ getBatchRules: jest.fn(), saveBatchRules: jest.fn() }));

const college = { countsAsPlacedAt: "OFFER_RELEASED", maxHeldOffers: 1, upliftPct: 40, minResponseHours: 48 };

beforeEach(() => {
  jest.clearAllMocks();
  getBatchRules.mockResolvedValue({ data: { college, batch: {}, effective: college } });
  saveBatchRules.mockImplementation(async (_id, body) => ({ data: { college, batch: body, effective: { ...college, ...body } } }));
});

test("a batch follows the college until it changes a rule; only what it changes is saved", async () => {
  render(<BatchRulesTab batchId="21" batchName="CSE 2023-27" />);
  const tab = await screen.findByTestId("batch-rules");
  expect(tab).toHaveTextContent("CSE 2023-27 follows the college rules");
  expect(tab).toHaveTextContent("College: 40% more CTC");
  expect(screen.getByTestId("batch-rules.save")).toBeDisabled();

  const uplift = screen.getByLabelText("Once placed, can apply again for at least");
  fireEvent.change(uplift, { target: { value: "25" } });
  fireEvent.blur(uplift);
  fireEvent.click(screen.getByTestId("batch-rules.save"));
  await waitFor(() => expect(saveBatchRules).toHaveBeenCalledWith("21", { upliftPct: 25 }));
  expect(await screen.findByText("CSE 2023-27 has its own rules")).toBeInTheDocument();

  fireEvent.click(screen.getByRole("button", { name: "Follow the college rules" }));
  await waitFor(() => expect(saveBatchRules).toHaveBeenLastCalledWith("21", {}));
});
