/**
 * TPO UX batch 3: offer letters are uploaded (not pasted as links), many at once, matched to students by the roll number in the
 * file name. Nothing is guessed: unmatched, ambiguous and wrong-type files are listed and never sent.
 */
import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import OfferLettersModal from "@/components/tpo/drive/OfferLettersModal";
import { fetchWithErrorHandling } from "@/api/Services/AdminService";
import { attachOfferLetter } from "@/api/Services/TpoService";
import { uploadFileViaPresign } from "@/utils/uploadToR2";

jest.mock("@/api/Services/AdminService", () => ({ fetchWithErrorHandling: jest.fn() }));
jest.mock("@/api/Services/TpoService", () => ({ attachOfferLetter: jest.fn((id, url) => ({ id, url })) }));
jest.mock("@/utils/uploadToR2", () => ({ uploadFileViaPresign: jest.fn() }));

const offers = [
  { offerId: 11, firstName: "Asha", lastName: "Rao", rollNumber: "21CS001" },
  { offerId: 12, firstName: "Bala", lastName: "K", rollNumber: "21CS002" },
];
const file = (name, type = "application/pdf", size = 1000) => new File([new Uint8Array(size)], name, { type });

beforeEach(() => {
  jest.clearAllMocks();
  uploadFileViaPresign.mockImplementation(async (f) => ({ publicUrl: `https://r2.example/${f.name}` }));
  fetchWithErrorHandling.mockResolvedValue({ success: true, data: {} });
});

const drop = (files) => fireEvent.change(document.querySelector('input[type="file"]'), { target: { files } });

test("files named by roll number are matched and shown before anything is uploaded", async () => {
  render(<OfferLettersModal open offers={offers} onClose={jest.fn()} onDone={jest.fn()} />);
  drop([file("21CS001.pdf"), file("21CS002_offer.pdf"), file("mystery.pdf")]);
  expect(await screen.findByText("2 of 3 files matched to a student and ready")).toBeInTheDocument();
  expect(screen.getByText(/1 match nobody: mystery\.pdf/)).toBeInTheDocument();
  expect(screen.getByText("Asha Rao · 21CS001")).toBeInTheDocument();
  expect(uploadFileViaPresign).not.toHaveBeenCalled();
});

test("upload sends each matched file to the offer-letters folder and attaches its link to the right offer", async () => {
  const onDone = jest.fn();
  render(<OfferLettersModal open offers={offers} onClose={jest.fn()} onDone={onDone} />);
  drop([file("21CS001.pdf"), file("21CS002.png", "image/png")]);
  await screen.findByText("2 of 2 files matched to a student and ready");
  fireEvent.click(screen.getByRole("button", { name: /Upload 2 letters/ }));
  await waitFor(() => expect(onDone).toHaveBeenCalledWith(2));
  expect(uploadFileViaPresign).toHaveBeenCalledWith(expect.objectContaining({ name: "21CS001.pdf" }), { folder: "offer-letters", type: "generic" });
  expect(attachOfferLetter).toHaveBeenCalledWith(11, "https://r2.example/21CS001.pdf");
  expect(attachOfferLetter).toHaveBeenCalledWith(12, "https://r2.example/21CS002.png");
});

test("a wrong-type or oversized file is never sent", async () => {
  render(<OfferLettersModal open offers={offers} onClose={jest.fn()} onDone={jest.fn()} />);
  drop([file("21CS001.docx", "application/msword"), file("21CS002.pdf", "application/pdf", 11 * 1024 * 1024)]);
  expect(await screen.findByText("0 of 2 files matched to a student and ready")).toBeInTheDocument();
  expect(screen.getByText(/1 are not PDF, PNG or JPG\./)).toBeInTheDocument();
  expect(screen.getByText(/1 are over 10 MB\./)).toBeInTheDocument();
  expect(screen.getByRole("button", { name: /^Upload\s*letters?$/ })).toBeDisabled();
});

test("a failure on one file is reported and the others still go through", async () => {
  uploadFileViaPresign.mockImplementation(async (f) => { if (f.name === "21CS001.pdf") throw new Error("Network down"); return { publicUrl: `https://r2.example/${f.name}` }; });
  const onDone = jest.fn();
  render(<OfferLettersModal open offers={offers} onClose={jest.fn()} onDone={onDone} />);
  drop([file("21CS001.pdf"), file("21CS002.pdf")]);
  await screen.findByText("2 of 2 files matched to a student and ready");
  fireEvent.click(screen.getByRole("button", { name: /Upload 2 letters/ }));
  expect(await screen.findByText("1 could not be attached")).toBeInTheDocument();
  expect(screen.getByText(/21CS001\.pdf: Network down/)).toBeInTheDocument();
  expect(attachOfferLetter).toHaveBeenCalledWith(12, "https://r2.example/21CS002.pdf");
  expect(onDone).toHaveBeenCalledWith(1, true);
});
