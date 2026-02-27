import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import InboxPage from "@/app/dashboard/inbox/page";

describe("InboxPage UX", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // Helper to wait for initial load if necessary, though InboxPage seems synchronous for now.
  const waitForLoad = async () => {
    // Just in case, wait for the search input to be present
    await waitFor(() => {
      expect(screen.getByPlaceholderText(/Search emails/i)).toBeInTheDocument();
    });
  };

  it("focuses search input on Cmd+K", async () => {
    render(<InboxPage />);
    await waitForLoad();

    const input = screen.getByPlaceholderText(/Search emails/i);

    // Simulate Cmd+K
    fireEvent.keyDown(window, { key: "k", metaKey: true });

    expect(input).toHaveFocus();
  });

  it("focuses search input on Ctrl+K", async () => {
    render(<InboxPage />);
    await waitForLoad();

    const input = screen.getByPlaceholderText(/Search emails/i);

    // Simulate Ctrl+K
    fireEvent.keyDown(window, { key: "k", ctrlKey: true });

    expect(input).toHaveFocus();
  });

  it("shows shortcut hint in placeholder", async () => {
    render(<InboxPage />);
    await waitForLoad();

    // The placeholder should include the shortcut hint like "Search emails... (Ctrl+K)"
    // or "Search emails... (⌘+K)" depending on environment
    // We adjust the regex to match either "Ctrl" or "⌘" followed by "+K"
    const input = screen.getByPlaceholderText(/Search emails/i);
    expect(input.getAttribute("placeholder")).toMatch(/\((Ctrl|⌘)\+K\)/);
  });

  it("shows clear button when typing and clears input on click", async () => {
    render(<InboxPage />);
    await waitForLoad();

    const input = screen.getByPlaceholderText(/Search emails/i);

    // Initially, clear button should not be visible (or not exist)
    expect(screen.queryByLabelText("Clear search")).not.toBeInTheDocument();

    // Type into the input
    fireEvent.change(input, { target: { value: "test query" } });

    // Clear button should now be visible
    const clearButton = screen.getByLabelText("Clear search");
    expect(clearButton).toBeInTheDocument();

    // Click clear button
    fireEvent.click(clearButton);

    // Input should be empty and focused
    expect(input).toHaveValue("");
    expect(input).toHaveFocus();
  });
});
