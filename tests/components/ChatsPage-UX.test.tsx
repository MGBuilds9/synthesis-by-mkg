import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import ChatsPage from "@/app/dashboard/chats/page";

// Mock next/link
vi.mock('next/link', () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}))

describe("ChatsPage UX", () => {

  it("focuses search input on Cmd+K", () => {
    render(<ChatsPage />);

    const input = screen.getByLabelText("Search chats");

    // Simulate Cmd+K
    fireEvent.keyDown(window, { key: "k", metaKey: true });

    expect(input).toHaveFocus();
  });

  it("focuses search input on Ctrl+K", () => {
    render(<ChatsPage />);

    const input = screen.getByLabelText("Search chats");

    // Simulate Ctrl+K
    fireEvent.keyDown(window, { key: "k", ctrlKey: true });

    expect(input).toHaveFocus();
  });

  it("shows shortcut hint when empty", () => {
    render(<ChatsPage />);

    const input = screen.getByLabelText("Search chats") as HTMLInputElement;
    expect(input.placeholder).toMatch(/\((⌘|Ctrl)\+K\)/);
  });

  it("clears search and focuses input when clear button is clicked", () => {
    render(<ChatsPage />);

    const input = screen.getByLabelText("Search chats");

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
