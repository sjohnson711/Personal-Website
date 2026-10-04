import { fireEvent, render, screen } from "@testing-library/react";
import AboutPage from "../src/pages/AboutPage";

jest.mock("../src/lib/api", () => ({ api: { post: jest.fn() } }));

test("presents the portrait, biography, and professional background", () => {
  render(<AboutPage />);
  expect(screen.getByRole("heading", { name: "Seth Johnson", level: 1 })).toBeInTheDocument();
  expect(screen.getByRole("img", { name: "Portrait of Seth Johnson" })).toHaveAttribute("src", "/Proifleofficepic.png");
  expect(screen.getByRole("region", { name: "Software Engineer & Mental Health Therapist" })).toBeInTheDocument();
  expect(screen.getByRole("region", { name: "Background & contributions" })).toBeInTheDocument();
  expect(screen.getByText("M.A. Clinical Mental Health Counseling, Webster University")).toBeInTheDocument();
  expect(screen.getByText("Beyond the Armor Podcast")).toBeInTheDocument();
  const linkedin = screen.getByRole("link", { name: "LinkedIn" });
  expect(linkedin).toHaveAttribute("target", "_blank");
  expect(linkedin).toHaveAttribute("rel", "noopener noreferrer");
});

test("keeps the contact dialog accessible from the biography", () => {
  render(<AboutPage />);
  fireEvent.click(screen.getByRole("button", { name: "Email" }));
  expect(screen.getByRole("dialog")).toBeInTheDocument();
  expect(screen.getByLabelText("Name")).toHaveFocus();
  fireEvent.keyDown(window, { key: "Escape" });
  expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
});
