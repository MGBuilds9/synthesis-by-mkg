from playwright.sync_api import sync_playwright

def verify(page):
    print("Navigating to storage page...")
    page.goto("http://localhost:5000/dashboard/storage")
    print("Waiting for page load...")
    page.wait_for_selector("h1:text('Storage')")

    print("Verifying Search Input...")
    # Verify input has single aria-label
    # Use explicit selector to check attributes if needed, but get_by_role is good
    try:
        search_input = page.get_by_role("textbox", name="Search files")
        count = search_input.count()
        if count == 1:
             print("Success: Single search input found")
        else:
             print(f"Error: {count} search inputs found")
    except Exception as e:
        print(f"Error finding search input: {e}")

    print("Verifying Filter Group...")
    # Verify filter group
    try:
        filter_group = page.get_by_role("group", name="Filter by provider")
        if filter_group.is_visible():
            print("Success: Filter group found with correct aria-label")

            # Verify filter buttons within group
            all_btn = filter_group.get_by_role("button", name="All Files")
            is_pressed = all_btn.get_attribute("aria-pressed")
            if is_pressed == "true":
                 print("Success: All Files button has aria-pressed=true")
            else:
                 print(f"Error: All Files button aria-pressed is {is_pressed}")

            drive_btn = filter_group.get_by_role("button", name="Google Drive")
            is_pressed_drive = drive_btn.get_attribute("aria-pressed")
            if is_pressed_drive == "false":
                 print("Success: Google Drive button has aria-pressed=false")
            else:
                 print(f"Error: Google Drive button aria-pressed is {is_pressed_drive}")
        else:
            print("Error: Filter group not visible")
    except Exception as e:
        print(f"Error verifying filter group: {e}")

    print("Taking screenshot...")
    page.screenshot(path="verification_screenshot.png")
    print("Screenshot saved to verification_screenshot.png")

with sync_playwright() as p:
    browser = p.chromium.launch()
    page = browser.new_page()
    try:
        verify(page)
    except Exception as e:
        print(f"An error occurred: {e}")
    finally:
        browser.close()
