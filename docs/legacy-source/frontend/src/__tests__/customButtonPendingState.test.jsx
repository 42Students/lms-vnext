import React from "react";
import { render, screen } from "@testing-library/react";
import CustomButton from "@/components/Global/Button/button";

test("shared button exposes pending semantics and blocks interaction while loading", () => {
  render(<CustomButton title="Save changes" buttonType="regular" loading onClick={jest.fn()} />);

  const button = screen.getByRole("button", { name: /Save changes$/ });
  expect(button).toBeDisabled();
  expect(button).toHaveAttribute("aria-busy", "true");
  expect(button).toHaveClass("ant-btn-loading");
});

test("shared button remains enabled and not busy when idle", () => {
  render(<CustomButton title="Save changes" buttonType="regular" loading={false} onClick={jest.fn()} />);

  const button = screen.getByRole("button", { name: "Save changes" });
  expect(button).not.toBeDisabled();
  expect(button).not.toHaveAttribute("aria-busy");
});


test("uses one accessible name for a text button with an image icon", () => {
  render(
    <CustomButton
      title="Save changes"
      icon="/assets/images/common/save.svg"
      alt="Save icon"
      buttonType="regular"
    />
  );

  const button = screen.getByRole("button", { name: "Save changes" });
  expect(button).toBeInTheDocument();
  expect(screen.queryByAltText("Save icon")).not.toBeInTheDocument();
});

test("supports an explicit accessible label for icon-only shared buttons", () => {
  render(
    <CustomButton
      icon="/assets/images/common/save.svg"
      ariaLabel="Save changes"
      buttonType="regular"
    />
  );

  expect(screen.getByRole("button", { name: "Save changes" })).toBeInTheDocument();
});
