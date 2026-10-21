import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import ResilientAvatar from "@/components/Common/ResilientAvatar";

describe("ResilientAvatar", () => {
  test("reserves explicit geometry and shows initials when no image exists", () => {
    render(<ResilientAvatar name="Phanindra Basavapurapu" size={40} />);

    const fallback = screen.getByRole("img", { name: "Phanindra Basavapurapu avatar" });
    expect(fallback).toHaveTextContent("PB");
    expect(fallback.parentElement).toHaveStyle({ width: "40px", height: "40px", minWidth: "40px", minHeight: "40px" });
  });

  test("falls back to initials when a remote image fails", () => {
    render(<ResilientAvatar src="https://cdn.example.com/broken.jpg" name="Akhila G" size={48} />);

    const image = screen.getByRole("img", { name: "Akhila G avatar" });
    fireEvent.error(image);

    expect(screen.getByRole("img", { name: "Akhila G avatar" })).toHaveTextContent("AG");
  });

  test("treats placeholder string values as missing images", () => {
    render(<ResilientAvatar src="string" name="Recruiter User" />);
    expect(screen.getByRole("img", { name: "Recruiter User avatar" })).toHaveTextContent("RU");
  });
});
