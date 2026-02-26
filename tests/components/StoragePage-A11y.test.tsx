import { render, screen, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import StoragePage from "@/app/dashboard/storage/page";

// Mock fetch
global.fetch = vi.fn();

describe("StoragePage A11y", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: async () => ({
        files: [
          {
            id: "1",
            name: "Test File.pdf",
            provider: "GDRIVE",
            webViewLink: "https://example.com",
            modifiedTime: "2023-01-01",
          },
        ],
      }),
    });
  });

  const waitForLoad = async () => {
    await waitFor(() => {
      expect(screen.getByText("Search")).toBeInTheDocument();
    });
  };

  it("provider filter buttons should be grouped and have aria-pressed state", async () => {
    render(<StoragePage />);
    await waitForLoad();

    // Check for group role
    // This will fail initially because role="group" is missing
    const group = screen.getByRole("group", { name: /Filter files by provider/i });
    expect(group).toBeInTheDocument();

    // Check for aria-pressed on buttons
    // This might fail if aria-pressed is missing
    const allButton = screen.getByRole("button", { name: /All Files/i });
    const gdriveButton = screen.getByRole("button", { name: /Google Drive/i });
    const onedriveButton = screen.getByRole("button", { name: /OneDrive/i });

    expect(allButton).toHaveAttribute("aria-pressed", "true");
    expect(gdriveButton).toHaveAttribute("aria-pressed", "false");
    expect(onedriveButton).toHaveAttribute("aria-pressed", "false");
  });
});
