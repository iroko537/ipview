from playwright.sync_api import sync_playwright, expect
import time

def verify_ip_view():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        # Capture console messages
        page.on("console", lambda msg: print(f"CONSOLE: {msg.text}"))

        # Navigate to the local server
        page.goto("http://localhost:8000")

        # Wait for IP address to be populated (not "Loading...")
        try:
            expect(page.locator("#ip-address")).not_to_have_text("Loading...", timeout=20000)
        except Exception as e:
            print(f"Timed out waiting for IP. Current text: {page.locator('#ip-address').inner_text()}")
            page.screenshot(path="verification/debug_timeout.png")
            raise e

        # Verify map is present (Leaflet initializes it)
        expect(page.locator("#map")).to_be_visible()

        # Take a screenshot of light mode
        page.screenshot(path="verification/light_mode_tailwind.png")
        print("Light mode screenshot taken.")

        # Toggle Dark Mode
        theme_toggle = page.locator("#theme-toggle")
        theme_toggle.click()

        # Wait for transition
        time.sleep(0.5)

        # Verify dark mode class on html element
        html = page.locator("html")
        # to_have_class expects exact match or regex, but "dark" is one of many classes (e.g. "h-full dark")
        # So we use regex to check if 'dark' is present in the class list
        import re
        expect(html).to_have_class(re.compile(r"\bdark\b"))

        # Take a screenshot of dark mode
        page.screenshot(path="verification/dark_mode_tailwind.png")
        print("Dark mode screenshot taken.")

        browser.close()

if __name__ == "__main__":
    verify_ip_view()
