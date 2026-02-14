from playwright.sync_api import sync_playwright
import time

def run():
    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page()

        print("Navigating to storage page...")
        try:
            page.goto("http://localhost:5000/dashboard/storage", timeout=60000)
        except Exception as e:
            print(f"Navigation failed: {e}")
            return

        print("Typing search query...")
        # Type search
        page.fill('input[placeholder="Search files..."]', "test query")

        print("Waiting for clear button...")
        # Wait for clear button to appear
        page.wait_for_selector('button[aria-label="Clear search"]')

        print("Taking screenshot 1...")
        # Screenshot 1: Button visible
        page.screenshot(path="verification_1_visible.png")

        print("Clicking clear button...")
        # Click clear
        page.click('button[aria-label="Clear search"]')

        print("Waiting for input to clear...")
        # Wait for input to be empty
        page.wait_for_function("document.querySelector('input[placeholder=\"Search files...\"]').value === ''")

        print("Taking screenshot 2...")
        # Screenshot 2: Cleared
        page.screenshot(path="verification_2_cleared.png")

        browser.close()
        print("Done.")

if __name__ == "__main__":
    run()
