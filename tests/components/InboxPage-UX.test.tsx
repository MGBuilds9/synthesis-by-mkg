import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import InboxPage from "@/app/dashboard/inbox/page";

describe("InboxPage UX", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("focuses search input on Cmd+K", async () => {
    render(<InboxPage />);

    const input = screen.getByLabelText("Search emails");

    // Simulate Cmd+K
    fireEvent.keyDown(window, { key: "k", metaKey: true });

    expect(input).toHaveFocus();
  });

  it("focuses search input on Ctrl+K", async () => {
    render(<InboxPage />);

    const input = screen.getByLabelText("Search emails");

    // Simulate Ctrl+K
    fireEvent.keyDown(window, { key: "k", ctrlKey: true });

    expect(input).toHaveFocus();
  });

  it("shows shortcut hint in placeholder", async () => {
    render(<InboxPage />);

    const input = screen.getByLabelText("Search emails");
    // The placeholder should include the shortcut hint like "Search emails... (Cmd+K)" or "Search emails... (Ctrl+K)"
    // We check for "K)" to be generic enough for both platforms in test environment
    expect(input.getAttribute("placeholder")).toMatch(/Search emails... \((⌘|Ctrl)\+K\)/);
  });

  it("shows clear button when searching", async () => {
    render(<InboxPage />);

    const input = screen.getByLabelText("Search emails");

    // Type something
    fireEvent.change(input, { target: { value: "meeting" } });

    // Clear button should appear
    const clearButton = screen.getByLabelText("Clear search");
    expect(clearButton).toBeInTheDocument();

    // Click clear
    fireEvent.click(clearButton);

    // Input should be empty and focused
    expect(input).toHaveValue("");
    expect(input).toHaveFocus();
  });
});
