import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import NotionPage from "@/app/dashboard/notion/page";

describe("NotionPage UX", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const waitForLoad = async () => {
    await waitFor(() => {
      expect(screen.getByText("Notion")).toBeInTheDocument();
    });
  };

  it("focuses search input on Cmd+K", async () => {
    render(<NotionPage />);
    await waitForLoad();

    const input = screen.getByLabelText("Search Notion pages");

    fireEvent.keyDown(window, { key: "k", metaKey: true });

    expect(input).toHaveFocus();
  });

  it("focuses search input on Ctrl+K", async () => {
    render(<NotionPage />);
    await waitForLoad();

    const input = screen.getByLabelText("Search Notion pages");

    fireEvent.keyDown(window, { key: "k", ctrlKey: true });

    expect(input).toHaveFocus();
  });

  it("shows shortcut hint when empty", async () => {
    render(<NotionPage />);
    await waitForLoad();

    const input = screen.getByLabelText("Search Notion pages");
    expect(input).toHaveAttribute("placeholder", expect.stringContaining("+K)"));
  });

  it("focuses input after clearing search", async () => {
    render(<NotionPage />);
    await waitForLoad();

    const input = screen.getByLabelText("Search Notion pages");

    fireEvent.change(input, { target: { value: "test" } });

    const clearButton = screen.getByRole("button", { name: "Clear search" });
    fireEvent.click(clearButton);

    expect(input).toHaveValue("");
    expect(input).toHaveFocus();
  });
});
