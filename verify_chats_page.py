from playwright.sync_api import sync_playwright

def run():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        # Navigate to the chats page
        print("Navigating to http://localhost:5000/dashboard/chats")
        page.goto("http://localhost:5000/dashboard/chats")

        # Verify the "Connect Account" link is visible
        print("Verifying 'Connect Account' link...")
        connect_link = page.get_by_role("link", name="Connect Account")
        if connect_link.is_visible():
            print("SUCCESS: 'Connect Account' link is visible.")
        else:
            print("FAILURE: 'Connect Account' link is NOT visible.")

        # Verify aria-labels
        print("Verifying aria-labels...")
        search_input = page.get_by_placeholder("Search chats...")
        if search_input.get_attribute("aria-label") == "Search chats":
             print("SUCCESS: Search input has correct aria-label.")
        else:
             print(f"FAILURE: Search input aria-label is {search_input.get_attribute('aria-label')}")

        filter_button = page.get_by_label("Toggle filters")
        if filter_button.is_visible():
            print("SUCCESS: Filter button is accessible by label 'Toggle filters'.")
        else:
             print("FAILURE: Filter button not found by label 'Toggle filters'.")

        discord_button = page.get_by_label("Filter by Discord")
        if discord_button.is_visible():
             print("SUCCESS: Discord filter button is accessible by label.")
        else:
             print("FAILURE: Discord filter button not found by label.")

        # Take a screenshot
        print("Taking screenshot...")
        page.screenshot(path="verification_chats.png")
        print("Screenshot saved to verification_chats.png")

        browser.close()

if __name__ == "__main__":
    run()
