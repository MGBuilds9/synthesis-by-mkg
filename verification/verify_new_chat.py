from playwright.sync_api import sync_playwright, expect

def run():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(viewport={"width": 1280, "height": 720})
        page = context.new_page()

        print("Navigating to AI Assistant...")
        page.goto("http://localhost:5000/dashboard/ai-assistant")

        # Wait for load
        try:
            page.wait_for_load_state("networkidle", timeout=5000)
        except:
            print("Network idle timeout, proceeding...")

        # Check if we are redirected to login
        if "auth" in page.url or "sign-in" in page.url:
            print("Redirected to auth page. Taking screenshot...")
            page.screenshot(path="/home/jules/verification/redirect_to_auth.png")
            return

        print("Checking for New Chat button...")
        # Check for "New Chat" button
        new_chat_button = page.get_by_label("Start new chat")

        # Assert it is visible
        if new_chat_button.is_visible():
            print("New Chat button is visible!")
        else:
            print("New Chat button is NOT visible.")
            # Print page content for debugging
            # print(page.content())

        # Take a screenshot
        page.screenshot(path="/home/jules/verification/new_chat_verification.png")
        print("Screenshot saved to /home/jules/verification/new_chat_verification.png")

        browser.close()

if __name__ == "__main__":
    run()
