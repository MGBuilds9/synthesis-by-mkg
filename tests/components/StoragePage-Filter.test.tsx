import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import StoragePage from "@/app/dashboard/storage/page";

// Mock fetch
global.fetch = vi.fn();

describe("StoragePage Filter UX", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: async () => ({ files: [] }),
    });
  });

  it("renders filter buttons in a group with accessible label", async () => {
    render(<StoragePage />);

    await waitFor(() => {
        expect(screen.getByText("Search")).toBeInTheDocument();
    });

    const filterGroup = screen.getByRole("group", { name: "Filter by provider" });
    expect(filterGroup).toBeInTheDocument();
  });

  it("indicates active filter state using aria-pressed", async () => {
    render(<StoragePage />);

    await waitFor(() => {
        expect(screen.getByText("Search")).toBeInTheDocument();
    });

    const allButton = screen.getByRole("button", { name: "All Files" });
    const gdriveButton = screen.getByRole("button", { name: "Google Drive" });
    const onedriveButton = screen.getByRole("button", { name: "OneDrive" });

    // Initial state: All Files selected
    expect(allButton).toHaveAttribute("aria-pressed", "true");
    expect(gdriveButton).toHaveAttribute("aria-pressed", "false");
    expect(onedriveButton).toHaveAttribute("aria-pressed", "false");

    // Click Google Drive
    fireEvent.click(gdriveButton);

    // Wait for the state update (react should update immediately but let's be safe)
    await waitFor(() => {
        expect(screen.getByRole("button", { name: "Google Drive" })).toHaveAttribute("aria-pressed", "true");
    });

    // Check other buttons
    expect(screen.getByRole("button", { name: "All Files" })).toHaveAttribute("aria-pressed", "false");
    expect(screen.getByRole("button", { name: "OneDrive" })).toHaveAttribute("aria-pressed", "false");
  });
});
