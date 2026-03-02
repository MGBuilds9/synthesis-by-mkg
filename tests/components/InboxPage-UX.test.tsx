import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import InboxPage from "@/app/dashboard/inbox/page";

describe("InboxPage UX", () => {
  it("focuses search input on Cmd+K", () => {
    render(<InboxPage />);
    const input = screen.getByLabelText("Search emails");

    // Simulate Cmd+K
    fireEvent.keyDown(window, { key: "k", metaKey: true });
    expect(input).toHaveFocus();
  });

  it("focuses search input on Ctrl+K", () => {
    render(<InboxPage />);
    const input = screen.getByLabelText("Search emails");

    // Simulate Ctrl+K
    fireEvent.keyDown(window, { key: "k", ctrlKey: true });
    expect(input).toHaveFocus();
  });

  it("shows shortcut hint when empty", () => {
    render(<InboxPage />);
    const input = screen.getByLabelText("Search emails") as HTMLInputElement;
    expect(input.placeholder).toMatch(/\((⌘|Ctrl)\+K\)/);
  });

  it("clears search and focuses input when clear button is clicked", () => {
    render(<InboxPage />);
    const input = screen.getByLabelText("Search emails");

    // Type something
    fireEvent.change(input, { target: { value: "test query" } });
    expect(input).toHaveValue("test query");

    // Clear button should appear
    const clearButton = screen.getByRole("button", { name: "Clear search" });
    expect(clearButton).toBeInTheDocument();

    // Click clear
    fireEvent.click(clearButton);

    // Input should be empty and focused
    expect(input).toHaveValue("");
    expect(input).toHaveFocus();

    // Clear button should disappear
    expect(screen.queryByRole("button", { name: "Clear search" })).not.toBeInTheDocument();
  });
});
