from playwright.sync_api import sync_playwright, expect

def run(playwright):
    browser = playwright.chromium.launch(headless=True)
    context = browser.new_context()
    page = context.new_page()

    try:
        # Navigate to Inbox
        print("Navigating to http://localhost:5000/dashboard/inbox")
        page.goto("http://localhost:5000/dashboard/inbox")

        # Wait for the page to load
        expect(page.get_by_role("heading", name="Inbox")).to_be_visible()
        print("Inbox loaded")

        # Check placeholder
        search_input = page.get_by_role("textbox", name="Search emails")
        expect(search_input).to_be_visible()

        # The placeholder should contain the shortcut hint.
        placeholder = search_input.get_attribute("placeholder")
        print(f"Placeholder: {placeholder}")
        assert "Search emails..." in placeholder, f"Expected 'Search emails...' in '{placeholder}'"
        assert "(Ctrl+K)" in placeholder or "(⌘+K)" in placeholder, f"Expected shortcut hint in '{placeholder}'"

        # Test Shortcut
        print("Testing shortcut Ctrl+K")
        page.keyboard.press("Control+k")
        expect(search_input).to_be_focused()
        print("Shortcut focused the input")

        # Type text
        print("Typing text")
        search_input.fill("test query")

        # Check clear button
        print("Checking clear button")
        # Assuming the clear button has aria-label="Clear search"
        clear_button = page.get_by_label("Clear search")
        expect(clear_button).to_be_visible()
        print("Clear button appeared")

        # Take screenshot
        page.screenshot(path="/app/verification/inbox_verification.png")
        print("Screenshot saved to /app/verification/inbox_verification.png")

        # Click clear button and verify input is cleared
        clear_button.click()
        expect(search_input).to_have_value("")
        expect(search_input).to_be_focused()
        print("Clear button cleared input and focused it")

    except Exception as e:
        print(f"Error: {e}")
        # Take error screenshot
        page.screenshot(path="/app/verification/error.png")
    finally:
        browser.close()

with sync_playwright() as p:
    run(p)
