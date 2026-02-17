from playwright.sync_api import Page, expect, sync_playwright

def test_inbox_search_shortcut(page: Page):
    # 1. Arrange: Go to the Inbox page.
    print("Navigating to Inbox page...")
    page.goto("http://localhost:5000/dashboard/inbox")

    # 2. Act: Check the search input placeholder.
    # The shortcut hint depends on the OS. In headless linux it should be Ctrl+K.
    search_input = page.get_by_label("Search emails")
    expect(search_input).to_be_visible()

    # We can check if the placeholder contains 'Ctrl+K' or just 'K)' to be safe.
    # But usually headless Linux reports as Linux, so Ctrl.
    placeholder = search_input.get_attribute("placeholder")
    print(f"Placeholder: {placeholder}")

    # 3. Simulate Ctrl+K to focus.
    print("Pressing Ctrl+K...")
    page.keyboard.press("Control+k")

    # 4. Assert: Input is focused.
    expect(search_input).to_be_focused()
    print("Input is focused.")

    # 5. Type something to see the clear button.
    print("Typing 'test query'...")
    search_input.fill("test query")

    # Check clear button visibility.
    clear_button = page.get_by_label("Clear search")
    expect(clear_button).to_be_visible()
    print("Clear button is visible.")

    # 6. Screenshot: Capture the state with text and clear button.
    page.screenshot(path="/home/jules/verification/inbox-search.png")
    print("Screenshot saved.")

if __name__ == "__main__":
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        try:
            test_inbox_search_shortcut(page)
        except Exception as e:
            print(f"Test failed: {e}")
            page.screenshot(path="/home/jules/verification/error.png")
        finally:
            browser.close()
