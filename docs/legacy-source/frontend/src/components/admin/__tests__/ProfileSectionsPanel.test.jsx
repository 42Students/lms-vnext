import React from "react";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import ProfileSectionsPanel from "../ProfileSectionsPanel";
import * as ProfileService from "@/api/Services/ProfileService";

jest.mock("@/api/Services/ProfileService");

function openPanel(name) {
  fireEvent.click(screen.getByText(name));
}

// The whole point of this rewrite: a schema-backed section (address) must show real labeled
// fields, not a JSON textarea a non-technical admin can't safely edit.
test("a schema-backed single section renders labeled fields, not a JSON textarea", async () => {
  ProfileService.getLearnerAddress = jest.fn().mockResolvedValue({
    data: { data: { currentAddress: "12 Elm St", currentCity: "Pune", city: null, state: null, pincode: null } },
  });
  ProfileService.updateLearnerAddress = jest.fn().mockResolvedValue({ data: {} });

  render(<ProfileSectionsPanel role="learner" id={7} only={["address"]} />);
  openPanel("Address");

  expect(await screen.findByText("12 Elm St")).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: /edit/i }));

  // Real labeled inputs, not a <textarea> full of JSON.
  const cityInput = await screen.findByLabelText("Current City");
  expect(screen.getByLabelText("Current Address")).toBeInTheDocument();
  expect(screen.queryByText(/"currentAddress"/)).not.toBeInTheDocument();

  fireEvent.change(cityInput, { target: { value: "Mumbai" } });
  fireEvent.click(screen.getByRole("button", { name: /save/i }));

  await waitFor(() => expect(ProfileService.updateLearnerAddress).toHaveBeenCalled());
  const [, payload] = ProfileService.updateLearnerAddress.mock.calls[0];
  expect(payload.currentCity).toBe("Mumbai");
  expect(payload.currentAddress).toBe("12 Elm St"); // untouched fields survive the save
});

// A list section (skills) must also get real fields for both existing items and the "Add" form.
test("a schema-backed list section renders fields for existing items and for Add", async () => {
  ProfileService.getLearnerSkills = jest.fn().mockResolvedValue({ data: { data: [{ skill: "React", proficiency: "Expert" }] } });
  ProfileService.addLearnerSkill = jest.fn().mockResolvedValue({ data: {} });

  render(<ProfileSectionsPanel role="learner" id={7} only={["skills"]} />);
  openPanel("Skills");

  expect(await screen.findByText("React")).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: /add skills/i }));
  expect((await screen.findAllByLabelText("Skill")).length).toBeGreaterThan(0);
});

// metadata has no fixed schema (a real Map<String,Object>) -- it must get a key/value row editor,
// never a raw JSON textarea, proving the fallback path itself doesn't reintroduce the JSON bug.
test("a section with no schema (metadata) uses a key/value editor, not raw JSON", async () => {
  ProfileService.getLearnerMetadata = jest.fn().mockResolvedValue({ data: { data: { flaggedForReview: true } } });
  ProfileService.updateLearnerMetadata = jest.fn().mockResolvedValue({ data: {} });

  render(<ProfileSectionsPanel role="learner" id={7} only={["metadata"]} />);
  openPanel("Metadata");

  expect(await screen.findByText("flaggedForReview")).toBeInTheDocument();
  expect(screen.queryByText(/"flaggedForReview":\s*true/)).not.toBeInTheDocument();

  fireEvent.click(screen.getByRole("button", { name: /edit/i }));
  expect(document.querySelector("textarea")).not.toBeInTheDocument();
  expect(screen.getByPlaceholderText("Field name")).toHaveValue("flaggedForReview");
  expect(screen.getByPlaceholderText("Value")).toHaveValue("true");

  fireEvent.click(screen.getByRole("button", { name: /add field/i }));
  const [, newKeyInput] = screen.getAllByPlaceholderText("Field name");
  const [, newValueInput] = screen.getAllByPlaceholderText("Value");
  fireEvent.change(newKeyInput, { target: { value: "notes" } });
  fireEvent.change(newValueInput, { target: { value: "vip" } });
  fireEvent.click(screen.getByRole("button", { name: /save/i }));

  await waitFor(() => expect(ProfileService.updateLearnerMetadata).toHaveBeenCalled());
  const [, payload] = ProfileService.updateLearnerMetadata.mock.calls[0];
  expect(payload).toEqual({ flaggedForReview: true, notes: "vip" });
});
