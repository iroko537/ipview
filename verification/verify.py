from playwright.sync_api import sync_playwright, expect
import time
import re

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

        # Check current state (it might be dark already due to time of day)
        html = page.locator("html")
        is_dark_initially = "dark" in html.get_attribute("class")

        print(f"Initial state is dark: {is_dark_initially}")

        # Take a screenshot of initial state
        page.screenshot(path="verification/initial_state.png")

        # Toggle Dark Mode
        theme_toggle = page.locator("#theme-toggle")
        theme_toggle.click()

        # Wait for transition
        time.sleep(0.5)

        # Verify state flipped
        if is_dark_initially:
            # Should be light now (no 'dark' class)
            expect(html).not_to_have_class(re.compile(r"\bdark\b"))
            print("Verified toggle to light mode.")
        else:
            # Should be dark now
            expect(html).to_have_class(re.compile(r"\bdark\b"))
            print("Verified toggle to dark mode.")

        # Take a screenshot of toggled state
        page.screenshot(path="verification/toggled_state.png")
        print("Dark mode screenshot taken.")

        browser.close()

if __name__ == "__main__":
    verify_ip_view()
