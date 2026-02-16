import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import StoragePage from "@/app/dashboard/storage/page";

// Mock fetch
global.fetch = vi.fn();

describe("StoragePage UX", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: async () => ({ files: [] }),
    });
  });

  // Helper to wait for initial load
  const waitForLoad = async () => {
    await waitFor(() => {
      expect(screen.getByText("Search")).toBeInTheDocument();
    });
  };

  it("focuses search input on Cmd+K", async () => {
    render(<StoragePage />);
    await waitForLoad();

    const input = screen.getByLabelText("Search files");

    // Simulate Cmd+K
    fireEvent.keyDown(window, { key: "k", metaKey: true });

    expect(input).toHaveFocus();
  });

  it("focuses search input on Ctrl+K", async () => {
    render(<StoragePage />);
    await waitForLoad();

    const input = screen.getByLabelText("Search files");

    // Simulate Ctrl+K
    fireEvent.keyDown(window, { key: "k", ctrlKey: true });

    expect(input).toHaveFocus();
  });

  it("shows shortcut hint when empty", async () => {
    render(<StoragePage />);
    await waitForLoad();

    const hint = screen.getByPlaceholderText(/K\)$/);
    expect(hint).toBeInTheDocument();
  });

  it("focuses input after clearing search", async () => {
    render(<StoragePage />);
    await waitForLoad();

    const input = screen.getByLabelText("Search files");

    fireEvent.change(input, { target: { value: "test" } });

    const clearButton = screen.getByRole("button", { name: "Clear search" });
    fireEvent.click(clearButton);

    // Wait for search to complete
    await waitFor(() => {
      expect(screen.queryByText("Searching...")).not.toBeInTheDocument();
    });

    expect(input).toHaveValue("");
    expect(input).toHaveFocus();
  });
});
