from playwright.sync_api import sync_playwright

def run_cuj(page):
    # Bypass NextAuth
    context.add_cookies([{'name': 'next-auth.session-token', 'value': 'mock-session-token', 'domain': 'localhost', 'path': '/'}])
    page.goto("http://localhost:5000/dashboard/inbox")
    page.wait_for_timeout(2000)

    # Click the search input
    page.get_by_placeholder("Search emails...").click()
    page.wait_for_timeout(500)

    # Type something
    page.get_by_placeholder("Search emails...").fill("test search")
    page.wait_for_timeout(1000)

    # Click clear button
    page.get_by_label("Clear search").click()
    page.wait_for_timeout(1000)

    # Go to Notion
    page.goto("http://localhost:5000/dashboard/notion")
    page.wait_for_timeout(2000)

    # Click the search input
    page.get_by_placeholder("Search Notion pages...").click()
    page.wait_for_timeout(500)

    # Type something
    page.get_by_placeholder("Search Notion pages...").fill("test notion")
    page.wait_for_timeout(1000)

    # Take screenshot at the key moment
    page.screenshot(path="verification/screenshots/verification.png")
    page.wait_for_timeout(1000)  # Hold final state for the video

    # Click clear button
    page.get_by_label("Clear search").click()
    page.wait_for_timeout(1000)

if __name__ == "__main__":
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(
            record_video_dir="verification/videos"
        )
        page = context.new_page()
        try:
            run_cuj(page)
        finally:
            context.close()  # MUST close context to save the video
            browser.close()