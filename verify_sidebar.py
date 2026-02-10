import time
from playwright.sync_api import sync_playwright

def verify_sidebar():
    with sync_playwright() as p:
        browser = p.chromium.launch()
        context = browser.new_context(viewport={"width": 1280, "height": 720})
        page = context.new_page()

        try:
            print("Navigating to dashboard...")
            page.goto("http://localhost:5000/dashboard")
            page.wait_for_selector("nav", timeout=10000)

            # 1. Verify aria-current on active link
            dashboard_link = page.get_by_role("link", name="Dashboard")
            active_attr = dashboard_link.get_attribute("aria-current")
            print(f"Dashboard link aria-current: {active_attr}")
            if active_attr != "page":
                print("FAIL: Dashboard link missing aria-current='page'")
            else:
                print("PASS: Dashboard link has aria-current='page'")

            # 2. Verify aria-hidden on icon
            # Need to select the SVG inside the link
            # Since `lucide-react` renders SVGs, and we put aria-hidden on them.
            # We can select by role 'link' then find 'svg' inside.
            icon = dashboard_link.locator("svg")
            hidden_attr = icon.get_attribute("aria-hidden")
            print(f"Icon aria-hidden: {hidden_attr}")
            if hidden_attr != "true":
                print("FAIL: Icon missing aria-hidden='true'")
            else:
                print("PASS: Icon has aria-hidden='true'")

            # 3. Verify focus styles
            # Focus on 'Inbox' link inside navigation
            nav = page.get_by_role("navigation")
            inbox_link = nav.get_by_role("link", name="Inbox")
            inbox_link.focus()

            # Take screenshot
            page.screenshot(path="verification_sidebar.png")
            print("Screenshot saved to verification_sidebar.png")

        except Exception as e:
            print(f"Error: {e}")
        finally:
            browser.close()

if __name__ == "__main__":
    verify_sidebar()
