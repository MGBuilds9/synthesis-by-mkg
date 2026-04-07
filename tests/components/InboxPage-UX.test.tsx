import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import InboxPage from "@/app/dashboard/inbox/page";

describe("InboxPage UX", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("focuses input after clearing search", async () => {
    render(<InboxPage />);

    const input = screen.getByLabelText("Search emails");

    fireEvent.change(input, { target: { value: "test" } });

    const clearButton = screen.getByRole("button", { name: "Clear search" });
    fireEvent.click(clearButton);

    expect(input).toHaveValue("");
    expect(input).toHaveFocus();
  });
});
